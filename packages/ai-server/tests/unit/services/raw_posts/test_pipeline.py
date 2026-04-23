"""Unit tests for RawPostsPipeline pre-filter + R2 key (#214)."""

from __future__ import annotations

from typing import List
from dataclasses import dataclass

import pytest

from src.services.raw_posts.models import FetchRequest, RawMedia
from src.services.raw_posts.pipeline import RawPostsPipeline, _build_r2_key


class _FakeAdapter:
    platform = "pinterest"

    def __init__(self, medias: List[RawMedia]):
        self._medias = medias

    async def fetch(self, req: FetchRequest) -> List[RawMedia]:
        return list(self._medias)


class _FakeRepository:
    def __init__(self, existing=None):
        self.calls = []
        self._existing = set(existing or [])

    async def fetch_existing_external_ids(self, *, platform, external_ids):
        self.calls.append((platform, list(external_ids)))
        return {eid for eid in external_ids if eid in self._existing}


@dataclass
class _PutResult:
    key: str
    url: str


class _FakeR2:
    def __init__(self):
        self.uploaded = []

    def put(self, key, body, content_type):
        self.uploaded.append((key, len(body), content_type))
        return _PutResult(key=key, url=f"https://cdn.test/{key}")


class TestR2KeyFormat:
    def test_shard_comes_from_external_id_prefix(self):
        assert _build_r2_key("pinterest", "1234567890", "jpg") == (
            "pinterest/12/1234567890.jpg"
        )

    def test_date_prefix_never_appears(self):
        key = _build_r2_key("pinterest", "abcdef", "jpg")
        # Sanity — none of the year/month fragments in the key.
        import re
        assert not re.search(r"/\d{4}/\d{2}/", key)

    def test_short_id_shards_on_underscore(self):
        assert _build_r2_key("pinterest", "a", "png").startswith("pinterest/a/")

    def test_sanitizes_weird_ids(self):
        # `/` and `?` must not leak into the key.
        k = _build_r2_key("pinterest", "../evil?q=1", "jpg")
        assert "/../" not in k and "?" not in k


class TestPipelinePrefilter:
    @pytest.mark.asyncio
    async def test_all_items_already_ingested_short_circuits(self, monkeypatch):
        medias = [
            RawMedia(
                external_id=f"p{i}",
                external_url=f"https://www.pinterest.com/pin/p{i}/",
                image_url=f"https://i.pinimg.com/originals/a/b/p{i}.jpg",
            )
            for i in range(3)
        ]
        repo = _FakeRepository(existing={"p0", "p1", "p2"})
        r2 = _FakeR2()
        pipeline = RawPostsPipeline(
            r2_client=r2,
            adapters={"pinterest": _FakeAdapter(medias)},
            repository=repo,
        )
        # httpx AsyncClient should never be touched if pre-filter drops all.
        import httpx
        monkeypatch.setattr(
            httpx, "AsyncClient",
            lambda *a, **kw: (_ for _ in ()).throw(AssertionError("unexpected http call")),
        )
        req = FetchRequest(
            source_id="s", platform="pinterest", source_type="board",
            source_identifier="u/b", dispatch_id="d1",
        )
        results = await pipeline.fetch(req)
        assert results == []
        assert r2.uploaded == []
        assert len(repo.calls) == 1 and len(repo.calls[0][1]) == 3

    @pytest.mark.asyncio
    async def test_only_new_items_hit_r2(self, monkeypatch):
        medias = [
            RawMedia(
                external_id="p1",
                external_url="https://www.pinterest.com/pin/p1/",
                image_url="https://img.test/1.jpg",
            ),
            RawMedia(
                external_id="p2",
                external_url="https://www.pinterest.com/pin/p2/",
                image_url="https://img.test/2.jpg",
            ),
        ]
        repo = _FakeRepository(existing={"p1"})  # p2 is new
        r2 = _FakeR2()
        pipeline = RawPostsPipeline(
            r2_client=r2,
            adapters={"pinterest": _FakeAdapter(medias)},
            repository=repo,
        )

        # Replace httpx.AsyncClient with a stub that returns canned bytes.
        class _FakeResp:
            status_code = 200
            content = b"fakebytes"
            headers = {"content-type": "image/jpeg"}
            def raise_for_status(self):
                pass

        class _FakeHttp:
            def __init__(self, *a, **kw): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *a): return False
            async def get(self, url): return _FakeResp()

        import httpx
        monkeypatch.setattr(httpx, "AsyncClient", _FakeHttp)

        req = FetchRequest(
            source_id="s", platform="pinterest", source_type="board",
            source_identifier="u/b", dispatch_id="d2",
        )
        results = await pipeline.fetch(req)
        assert [r.external_id for r in results] == ["p2"]
        # R2 uploaded exactly the new one.
        assert len(r2.uploaded) == 1
        assert r2.uploaded[0][0].startswith("pinterest/p2/")

    @pytest.mark.asyncio
    async def test_adapter_empty_skips_everything(self):
        repo = _FakeRepository()
        r2 = _FakeR2()
        pipeline = RawPostsPipeline(
            r2_client=r2,
            adapters={"pinterest": _FakeAdapter([])},
            repository=repo,
        )
        req = FetchRequest(
            source_id="s", platform="pinterest", source_type="board",
            source_identifier="u/b", dispatch_id="d",
        )
        assert await pipeline.fetch(req) == []
        assert repo.calls == []  # no point querying DB when adapter gave 0
        assert r2.uploaded == []

    @pytest.mark.asyncio
    async def test_unknown_platform_raises(self):
        repo = _FakeRepository()
        r2 = _FakeR2()
        pipeline = RawPostsPipeline(
            r2_client=r2,
            adapters={},
            repository=repo,
        )
        req = FetchRequest(
            source_id="s", platform="nowhere", source_type="board",
            source_identifier="u/b", dispatch_id="d",
        )
        with pytest.raises(LookupError):
            await pipeline.fetch(req)
