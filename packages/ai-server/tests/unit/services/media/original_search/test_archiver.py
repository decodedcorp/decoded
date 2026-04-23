"""OriginalArchiver: R2 upload + size/MIME filtering + variant fallback."""

from __future__ import annotations

import uuid
from io import BytesIO
from unittest.mock import MagicMock

import httpx
import pytest
from PIL import Image

from src.services.media.original_search.archiver import OriginalArchiver
from src.services.media.original_search.models import OriginalCandidate


def _png_bytes(w: int, h: int) -> bytes:
    img = Image.new("RGB", (w, h), "blue")
    buf = BytesIO()
    img.save(buf, "JPEG", quality=90)
    return buf.getvalue()


class _FakeR2:
    def __init__(self):
        self.calls = []

    def put(self, key, data, content_type):
        self.calls.append((key, len(data), content_type))
        return MagicMock(key=key, url=f"https://r2.test/{key}")


def _handler_factory(handlers: dict[str, httpx.Response]):
    def handle(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if url in handlers:
            return handlers[url]
        return httpx.Response(404)

    return httpx.MockTransport(handle)


@pytest.mark.asyncio
async def test_archive_first_viable_uploads_to_r2(monkeypatch):
    raw_id = uuid.uuid4()
    good = _png_bytes(900, 1200)
    # Candidate has a resize param — try stripped URL first; the fake
    # transport only serves the stripped version.
    candidate = OriginalCandidate(
        "https://news.example.com/big.jpg?w=540", "partial_match"
    )

    handlers = {
        "https://news.example.com/big.jpg": httpx.Response(
            200, content=good, headers={"content-type": "image/jpeg"}
        ),
    }
    transport = _handler_factory(handlers)

    r2 = _FakeR2()
    archiver = OriginalArchiver(
        r2_client=r2, min_width=500, min_height=500, min_bytes=5000
    )

    # Patch httpx.AsyncClient to route through our transport
    orig = httpx.AsyncClient

    def client_factory(*args, **kwargs):
        kwargs["transport"] = transport
        return orig(*args, **kwargs)

    monkeypatch.setattr(
        "src.services.media.original_search.archiver.httpx.AsyncClient",
        client_factory,
    )

    result = await archiver.archive_first_viable(raw_id, [candidate])

    assert result is not None
    assert result.width == 900
    assert result.height == 1200
    assert result.origin_url == candidate.url
    assert result.r2_key == f"originals/{raw_id}.jpg"
    assert r2.calls[0][0] == f"originals/{raw_id}.jpg"


@pytest.mark.asyncio
async def test_archive_skips_too_small(monkeypatch):
    raw_id = uuid.uuid4()
    tiny = _png_bytes(200, 200)
    candidate = OriginalCandidate(
        "https://x.example.com/tiny.jpg", "partial_match"
    )

    handlers = {
        "https://x.example.com/tiny.jpg": httpx.Response(
            200, content=tiny, headers={"content-type": "image/jpeg"}
        ),
    }
    transport = _handler_factory(handlers)
    r2 = _FakeR2()
    archiver = OriginalArchiver(
        r2_client=r2, min_width=500, min_height=500, min_bytes=5000
    )
    orig = httpx.AsyncClient
    monkeypatch.setattr(
        "src.services.media.original_search.archiver.httpx.AsyncClient",
        lambda *a, **kw: orig(*a, **{**kw, "transport": transport}),
    )

    result = await archiver.archive_first_viable(raw_id, [candidate])

    assert result is None
    assert r2.calls == []


@pytest.mark.asyncio
async def test_archive_skips_non_image_content_type(monkeypatch):
    raw_id = uuid.uuid4()
    candidate = OriginalCandidate("https://x.example.com/a.jpg", "partial_match")
    handlers = {
        "https://x.example.com/a.jpg": httpx.Response(
            200, content=b"<html>", headers={"content-type": "text/html"}
        ),
    }
    transport = _handler_factory(handlers)
    r2 = _FakeR2()
    archiver = OriginalArchiver(r2_client=r2, min_bytes=1)
    orig = httpx.AsyncClient
    monkeypatch.setattr(
        "src.services.media.original_search.archiver.httpx.AsyncClient",
        lambda *a, **kw: orig(*a, **{**kw, "transport": transport}),
    )
    assert await archiver.archive_first_viable(raw_id, [candidate]) is None


@pytest.mark.asyncio
async def test_archive_returns_first_success_among_multiple(monkeypatch):
    raw_id = uuid.uuid4()
    bad = OriginalCandidate("https://404.example.com/a.jpg", "partial_match")
    good = OriginalCandidate("https://news.example.com/good.jpg", "partial_match")
    good_bytes = _png_bytes(800, 1000)
    handlers = {
        "https://404.example.com/a.jpg": httpx.Response(404),
        "https://news.example.com/good.jpg": httpx.Response(
            200, content=good_bytes, headers={"content-type": "image/jpeg"}
        ),
    }
    transport = _handler_factory(handlers)
    r2 = _FakeR2()
    archiver = OriginalArchiver(
        r2_client=r2, min_width=500, min_height=500, min_bytes=5000
    )
    orig = httpx.AsyncClient
    monkeypatch.setattr(
        "src.services.media.original_search.archiver.httpx.AsyncClient",
        lambda *a, **kw: orig(*a, **{**kw, "transport": transport}),
    )

    result = await archiver.archive_first_viable(raw_id, [bad, good])

    assert result is not None
    assert result.origin_url == good.url


@pytest.mark.asyncio
async def test_archive_returns_none_when_all_fail(monkeypatch):
    raw_id = uuid.uuid4()
    candidates = [
        OriginalCandidate("https://a.example.com/x.jpg", "partial_match"),
        OriginalCandidate("https://b.example.com/y.jpg", "partial_match"),
    ]
    transport = _handler_factory({})   # everything returns 404
    r2 = _FakeR2()
    archiver = OriginalArchiver(r2_client=r2)
    orig = httpx.AsyncClient
    monkeypatch.setattr(
        "src.services.media.original_search.archiver.httpx.AsyncClient",
        lambda *a, **kw: orig(*a, **{**kw, "transport": transport}),
    )
    assert await archiver.archive_first_viable(raw_id, candidates) is None
    assert r2.calls == []
