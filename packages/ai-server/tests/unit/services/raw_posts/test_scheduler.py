"""Unit tests for RawPostsScheduler's per-source flow (#214).

The APScheduler loop itself is not exercised (that's APScheduler territory);
we test the core `_run_source` path because it encodes:
  - mode selection (initial vs incremental)
  - mark_enqueued on entry
  - upsert + mark_scraped + set_initial_scraped on success
  - no mark_scraped on failure (so next cycle retries)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

import pytest

from src.services.raw_posts.models import FetchRequest, RawPostResult
from src.services.raw_posts.repository import DueSource
from src.services.raw_posts.scheduler import RawPostsScheduler


class _RecordingRepo:
    def __init__(self, source: DueSource):
        self._source = source
        self.events: List[str] = []

    async def fetch_source(self, source_id):
        if source_id == self._source.id:
            return self._source
        return None

    async def mark_enqueued(self, source_id):
        self.events.append(f"enqueued:{source_id}")

    async def mark_scraped(self, source_id):
        self.events.append(f"scraped:{source_id}")

    async def set_initial_scraped(self, source_id):
        self.events.append(f"initial:{source_id}")

    async def upsert_raw_posts(self, *, source_id, platform, dispatch_id, results):
        self.events.append(
            f"upsert:{source_id}:{platform}:{len(results)}"
        )
        return len(results)


class _RecordingPipeline:
    def __init__(self, results: Optional[List[RawPostResult]] = None, raise_exc=None):
        self._results = results or []
        self._raise_exc = raise_exc
        self.last_req: Optional[FetchRequest] = None

    async def fetch(self, req: FetchRequest):
        self.last_req = req
        if self._raise_exc is not None:
            raise self._raise_exc
        return list(self._results)


def _source(initial_scraped_at=None) -> DueSource:
    return DueSource(
        id=uuid.uuid4(),
        platform="pinterest",
        source_type="board",
        source_identifier="foo/bar",
        fetch_interval_seconds=3600,
        initial_scraped_at=initial_scraped_at,
    )


class TestInitialVsIncremental:
    @pytest.mark.asyncio
    async def test_first_run_is_initial_mode(self):
        src = _source(initial_scraped_at=None)
        repo = _RecordingRepo(src)
        result = RawPostResult(
            external_id="p1", external_url="u", image_url="i",
            r2_key="k", r2_url="r",
        )
        pipeline = _RecordingPipeline(results=[result])
        scheduler = RawPostsScheduler(repo, pipeline, interval_seconds=60)

        ran = await scheduler.run_source_by_id(src.id)

        assert ran is True
        assert pipeline.last_req is not None
        assert pipeline.last_req.mode == "initial"
        assert f"enqueued:{src.id}" in repo.events
        assert any(e.startswith(f"upsert:{src.id}:pinterest:1") for e in repo.events)
        assert f"scraped:{src.id}" in repo.events
        assert f"initial:{src.id}" in repo.events

    @pytest.mark.asyncio
    async def test_subsequent_run_is_incremental(self):
        src = _source(initial_scraped_at=datetime.now(timezone.utc))
        repo = _RecordingRepo(src)
        pipeline = _RecordingPipeline(results=[])
        scheduler = RawPostsScheduler(repo, pipeline, interval_seconds=60)

        ran = await scheduler.run_source_by_id(src.id)

        assert ran is True
        assert pipeline.last_req.mode == "incremental"
        # Still marks scraped so last_scraped_at moves.
        assert f"scraped:{src.id}" in repo.events
        # But does NOT set initial again.
        assert f"initial:{src.id}" not in repo.events


class TestFailurePath:
    @pytest.mark.asyncio
    async def test_pipeline_exception_preserves_initial_flag(self):
        src = _source(initial_scraped_at=None)
        repo = _RecordingRepo(src)
        pipeline = _RecordingPipeline(raise_exc=RuntimeError("pinterest said no"))
        scheduler = RawPostsScheduler(repo, pipeline, interval_seconds=60)

        # Should not raise — scheduler catches and logs so the cycle continues.
        await scheduler.run_source_by_id(src.id)

        # mark_enqueued always runs up front.
        assert f"enqueued:{src.id}" in repo.events
        # mark_scraped + set_initial_scraped must NOT run on failure so the
        # next cycle retries as "initial" again.
        assert f"scraped:{src.id}" not in repo.events
        assert f"initial:{src.id}" not in repo.events


class TestTriggerUnknownSource:
    @pytest.mark.asyncio
    async def test_missing_source_returns_false(self):
        src = _source()
        repo = _RecordingRepo(src)
        pipeline = _RecordingPipeline()
        scheduler = RawPostsScheduler(repo, pipeline, interval_seconds=60)

        ran = await scheduler.run_source_by_id(uuid.uuid4())
        assert ran is False
        # Pipeline must never have been called.
        assert pipeline.last_req is None
        assert repo.events == []
