"""MediaRepository tests (#260).

Uses a fake asyncpg connection to assert SQL shape and parameter binding for
claim_pending (SKIP LOCKED + attempts bump), mark_failed (retry gate),
mark_parsed, mark_skipped, and claim_for_reparse.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict, List, Optional, Tuple

import pytest

from src.services.media.models import ParseCandidate
from src.services.media.repository import MediaRepository


class _FakeTx:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _FakeConn:
    def __init__(
        self,
        *,
        fetch_rows: Optional[List[Dict[str, Any]]] = None,
        fetchrow_row: Optional[Dict[str, Any]] = None,
    ):
        self._fetch_rows = fetch_rows or []
        self._fetchrow_row = fetchrow_row
        self.calls: List[Tuple[str, str, Tuple[Any, ...]]] = []

    def transaction(self):
        return _FakeTx()

    async def fetch(self, sql: str, *args):
        self.calls.append(("fetch", sql, args))
        return list(self._fetch_rows)

    async def fetchrow(self, sql: str, *args):
        self.calls.append(("fetchrow", sql, args))
        return self._fetchrow_row

    async def execute(self, sql: str, *args):
        self.calls.append(("execute", sql, args))
        return "UPDATE 1"


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


def _row(
    row_id: Optional[uuid.UUID] = None,
    attempts: int = 0,
    r2_url: str = "https://r2/x.jpg",
) -> Dict[str, Any]:
    return {
        "id": row_id or uuid.uuid4(),
        "platform": "pinterest",
        "external_id": "pin1",
        "external_url": "https://pinterest.com/pin/1/",
        "r2_key": "pinterest/pi/pin1.jpg",
        "r2_url": r2_url,
        "caption": "c",
        "image_hash": None,
        "parse_attempts": attempts,
    }


@pytest.mark.asyncio
async def test_claim_pending_uses_skip_locked_and_bumps_attempts():
    rid = uuid.uuid4()
    conn = _FakeConn(fetch_rows=[_row(row_id=rid, attempts=0)])
    repo = MediaRepository(_FakeDB(conn))

    candidates = await repo.claim_pending(limit=5, max_attempts=3)

    assert len(candidates) == 1
    assert candidates[0].id == rid
    assert candidates[0].parse_attempts == 1  # pre-bump 0 + 1

    # First call: SELECT ... FOR UPDATE SKIP LOCKED
    kind1, sql1, args1 = conn.calls[0]
    assert kind1 == "fetch"
    assert "parse_status = 'pending'" in sql1
    assert "parse_attempts < $2" in sql1
    assert "FOR UPDATE SKIP LOCKED" in sql1
    assert args1 == (5, 3)

    # Second call: UPDATE ... SET parse_status = 'parsing', parse_attempts = parse_attempts + 1
    kind2, sql2, args2 = conn.calls[1]
    assert kind2 == "execute"
    assert "SET parse_status = 'parsing'" in sql2
    assert "parse_attempts = parse_attempts + 1" in sql2
    assert args2 == ([rid],)


@pytest.mark.asyncio
async def test_claim_pending_empty_when_no_rows():
    conn = _FakeConn(fetch_rows=[])
    repo = MediaRepository(_FakeDB(conn))

    candidates = await repo.claim_pending(limit=5, max_attempts=3)
    assert candidates == []
    # Only the SELECT happened; no UPDATE.
    assert len(conn.calls) == 1


@pytest.mark.asyncio
async def test_claim_pending_returns_empty_for_zero_limit():
    conn = _FakeConn(fetch_rows=[])
    repo = MediaRepository(_FakeDB(conn))
    assert await repo.claim_pending(limit=0, max_attempts=3) == []
    assert conn.calls == []


@pytest.mark.asyncio
async def test_mark_failed_uses_attempts_gate_for_terminal_status():
    conn = _FakeConn()
    repo = MediaRepository(_FakeDB(conn))
    rid = uuid.uuid4()

    await repo.mark_failed(rid, error="vision timeout", max_attempts=3)

    assert len(conn.calls) == 1
    kind, sql, args = conn.calls[0]
    assert kind == "execute"
    assert "parse_attempts >= $3" in sql
    assert "THEN 'failed'" in sql
    assert "ELSE 'pending'" in sql
    # args: id, trimmed_error, max_attempts
    assert args[0] == rid
    assert args[1] == "vision timeout"
    assert args[2] == 3


@pytest.mark.asyncio
async def test_mark_failed_truncates_error_at_500_chars():
    conn = _FakeConn()
    repo = MediaRepository(_FakeDB(conn))
    long_err = "x" * 1000

    await repo.mark_failed(uuid.uuid4(), error=long_err, max_attempts=3)
    _, _, args = conn.calls[0]
    assert len(args[1]) == 500


@pytest.mark.asyncio
async def test_mark_parsed_sets_seed_post_id_and_json_result():
    conn = _FakeConn()
    repo = MediaRepository(_FakeDB(conn))
    rid = uuid.uuid4()
    sid = uuid.uuid4()
    payload = {"items": [{"brand": "Gucci"}]}

    await repo.mark_parsed(rid, seed_post_id=sid, parse_result=payload)

    _, sql, args = conn.calls[0]
    assert "parse_status = 'parsed'" in sql
    assert args[0] == rid
    assert args[1] == sid
    assert json.loads(args[2]) == payload


@pytest.mark.asyncio
async def test_mark_skipped_clears_error():
    conn = _FakeConn()
    repo = MediaRepository(_FakeDB(conn))
    rid = uuid.uuid4()
    await repo.mark_skipped(rid)

    _, sql, args = conn.calls[0]
    assert "parse_status = 'skipped'" in sql
    assert "parse_error = NULL" in sql
    assert args == (rid,)


@pytest.mark.asyncio
async def test_claim_for_reparse_returns_candidate_and_updates():
    rid = uuid.uuid4()
    row = _row(row_id=rid, attempts=3)
    conn = _FakeConn(fetchrow_row=row)
    repo = MediaRepository(_FakeDB(conn))

    candidate = await repo.claim_for_reparse(rid)

    assert isinstance(candidate, ParseCandidate)
    assert candidate.id == rid
    assert candidate.parse_attempts == 1

    # Calls: fetchrow (SELECT FOR UPDATE), execute (UPDATE reset)
    assert len(conn.calls) == 2
    kind1, sql1, args1 = conn.calls[0]
    assert "FOR UPDATE" in sql1
    assert args1 == (rid,)
    kind2, sql2, args2 = conn.calls[1]
    assert "parse_status = 'parsing'" in sql2
    assert "parse_attempts = 1" in sql2
    assert "parse_error = NULL" in sql2
    assert args2 == (rid,)


@pytest.mark.asyncio
async def test_claim_for_reparse_returns_none_when_missing():
    conn = _FakeConn(fetchrow_row=None)
    repo = MediaRepository(_FakeDB(conn))
    assert await repo.claim_for_reparse(uuid.uuid4()) is None


@pytest.mark.asyncio
async def test_claim_for_reparse_returns_none_when_r2_url_missing():
    rid = uuid.uuid4()
    conn = _FakeConn(fetchrow_row=_row(row_id=rid, r2_url=""))
    repo = MediaRepository(_FakeDB(conn))
    assert await repo.claim_for_reparse(rid) is None
