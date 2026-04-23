"""SeedWriter transaction structure tests (#260).

Uses a fake asyncpg connection + DatabaseManager to capture every statement
and parameter the writer issues, so we can assert exact column ordering,
position_* cast-to-text, embedded solutions JSON, and image_hash backfill.

The dev/prod schema stores solutions as a JSONB array on `seed_spots`
(no separate `seed_solutions` table). See `seed_writer.py` docstring.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, List, Optional, Tuple

import pytest

from src.services.media.models import (
    ParseCandidate,
    ParsedDecodeResult,
    ParsedItem,
)
from src.services.media.seed_writer import SeedWriter, SeedWriterError


class _FakeTx:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _FakeConn:
    def __init__(self, fetchvals: List[Any]):
        self._fetchvals = list(fetchvals)
        self.calls: List[Tuple[str, str, Tuple[Any, ...]]] = []

    def transaction(self):
        return _FakeTx()

    async def fetchval(self, sql: str, *args):
        self.calls.append(("fetchval", sql, args))
        if not self._fetchvals:
            raise AssertionError("fetchval called more than expected")
        return self._fetchvals.pop(0)

    async def execute(self, sql: str, *args):
        self.calls.append(("execute", sql, args))
        return "EXECUTE"


class _FakePool:
    def __init__(self, conn: _FakeConn):
        self._conn = conn

    async def __aenter__(self):
        return self._conn

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _FakeDB:
    def __init__(self, conn: _FakeConn):
        self._conn = conn

    def acquire(self):
        return _FakePool(self._conn)


def _candidate(image_hash: Optional[str] = None) -> ParseCandidate:
    return ParseCandidate(
        id=uuid.uuid4(),
        platform="pinterest",
        external_id="pin123",
        external_url="https://pinterest.com/pin/123/",
        r2_key="pinterest/pi/pin123.jpg",
        r2_url="https://r2.decoded.style/pinterest/pi/pin123.jpg",
        caption="a caption",
        image_hash=image_hash,
        parse_attempts=1,
    )


def _parsed(n_items: int = 2) -> ParsedDecodeResult:
    items = [
        ParsedItem(
            brand=f"Brand{i}",
            product_name=f"Product{i}",
            price_amount=100.0 + i,
            price_currency="USD",
            subcategory="top" if i == 0 else "bottom",
            position_x_pct=30 + i * 10,
            position_y_pct=40 + i * 10,
        )
        for i in range(n_items)
    ]
    return ParsedDecodeResult(
        celebrity_name="Alice",
        group_name=None,
        occasion="Airport",
        items=items,
    )


@pytest.mark.asyncio
async def test_writes_post_asset_and_embedded_solutions():
    seed_post_id = uuid.uuid4()
    conn = _FakeConn(fetchvals=[seed_post_id])
    writer = SeedWriter(_FakeDB(conn))

    cand = _candidate(image_hash="already-hashed")
    parsed = _parsed(n_items=2)

    returned = await writer.write_for_parse_result(
        cand, parsed, image_sha256="sha-xyz"
    )

    assert returned == seed_post_id

    # Expected statements in order:
    # 1. seed_posts INSERT (fetchval)
    # 2. seed_asset INSERT (execute)
    # 3. seed_spots INSERT #1 (execute)
    # 4. seed_spots INSERT #2 (execute)
    assert len(conn.calls) == 4

    kind, sql1, args1 = conn.calls[0]
    assert kind == "fetchval"
    assert "seed_posts" in sql1
    # Columns: image_url, media_source, metadata, status — no `context`
    assert "context" not in sql1
    assert args1[0] == cand.r2_url                       # image_url
    ms = json.loads(args1[1])
    assert ms["platform"] == "pinterest"
    assert ms["external_id"] == "pin123"
    md = json.loads(args1[2])
    assert md["source_raw_post_id"] == str(cand.id)
    assert md["celebrity_name"] == "Alice"
    assert md["occasion"] == "Airport"
    assert "parsed_at" in md

    kind, sql2, args2 = conn.calls[1]
    assert kind == "execute"
    assert "seed_asset" in sql2
    assert "ON CONFLICT (image_hash) DO NOTHING" in sql2
    assert args2[0] == seed_post_id
    assert args2[1] == cand.external_url
    assert args2[2] == "pinterest.com"
    assert args2[3] == cand.r2_url
    assert args2[4] == "sha-xyz"
    asset_md = json.loads(args2[5])
    assert asset_md == {"r2_key": cand.r2_key}

    # seed_spots inserts — each has `solutions` as JSONB array of one object
    for i in range(2):
        kind_s, sql_s, args_s = conn.calls[2 + i]
        assert kind_s == "execute"
        assert "seed_spots" in sql_s
        assert "solutions" in sql_s
        assert args_s[0] == seed_post_id          # seed_post_id
        assert args_s[1] == i                     # request_order 0-based
        assert isinstance(args_s[2], str)         # position_left text
        assert isinstance(args_s[3], str)
        assert args_s[2] == str(parsed.items[i].position_x_pct)
        assert args_s[3] == str(parsed.items[i].position_y_pct)

        sol_payload = json.loads(args_s[4])
        assert isinstance(sol_payload, list)
        assert len(sol_payload) == 1
        sol = sol_payload[0]
        assert sol["brand"] == parsed.items[i].brand
        assert sol["product_name"] == parsed.items[i].product_name
        assert sol["price_amount"] == parsed.items[i].price_amount
        assert sol["price_currency"] == parsed.items[i].price_currency
        assert sol["subcategory"] == parsed.items[i].subcategory
        assert sol["status"] == "draft"


@pytest.mark.asyncio
async def test_backfills_raw_posts_image_hash_when_missing():
    seed_post_id = uuid.uuid4()
    conn = _FakeConn(fetchvals=[seed_post_id])
    writer = SeedWriter(_FakeDB(conn))

    cand = _candidate(image_hash=None)
    parsed = _parsed(n_items=1)

    await writer.write_for_parse_result(cand, parsed, image_sha256="sha-new")

    # Statement order with backfill:
    #   seed_posts, seed_asset, UPDATE raw_posts, seed_spots
    assert len(conn.calls) == 4
    kind, sql3, args3 = conn.calls[2]
    assert kind == "execute"
    assert "UPDATE warehouse.raw_posts" in sql3
    assert "image_hash" in sql3
    assert args3 == (cand.id, "sha-new")


@pytest.mark.asyncio
async def test_skips_backfill_when_image_hash_present():
    seed_post_id = uuid.uuid4()
    conn = _FakeConn(fetchvals=[seed_post_id])
    writer = SeedWriter(_FakeDB(conn))

    cand = _candidate(image_hash="existing")
    parsed = _parsed(n_items=1)

    await writer.write_for_parse_result(cand, parsed, image_sha256="sha-new")

    assert not any(
        "UPDATE warehouse.raw_posts" in sql for (_, sql, _) in conn.calls
    )


@pytest.mark.asyncio
async def test_clamps_positions_to_0_100():
    seed_post_id = uuid.uuid4()
    conn = _FakeConn(fetchvals=[seed_post_id])
    writer = SeedWriter(_FakeDB(conn))

    cand = _candidate(image_hash="h")
    parsed = ParsedDecodeResult(
        items=[
            ParsedItem(
                brand="B", subcategory="top",
                position_x_pct=-5, position_y_pct=150,
            )
        ]
    )
    await writer.write_for_parse_result(cand, parsed, image_sha256="sha")

    # seed_posts, seed_asset, seed_spots — clamp is on the spot row.
    spot_call = conn.calls[2]
    _, _, args = spot_call
    assert args[2] == "0"
    assert args[3] == "100"


@pytest.mark.asyncio
async def test_refuses_empty_items():
    conn = _FakeConn(fetchvals=[])
    writer = SeedWriter(_FakeDB(conn))

    cand = _candidate()
    with pytest.raises(SeedWriterError):
        await writer.write_for_parse_result(
            cand, ParsedDecodeResult(items=[]), image_sha256="sha"
        )
    assert conn.calls == []


@pytest.mark.asyncio
async def test_refuses_empty_r2_url():
    conn = _FakeConn(fetchvals=[])
    writer = SeedWriter(_FakeDB(conn))

    cand = ParseCandidate(
        id=uuid.uuid4(), platform="pinterest", external_id="x",
        external_url="u", r2_key="k", r2_url="",
        caption=None, image_hash=None, parse_attempts=1,
    )
    with pytest.raises(SeedWriterError):
        await writer.write_for_parse_result(
            cand, _parsed(1), image_sha256="sha"
        )
