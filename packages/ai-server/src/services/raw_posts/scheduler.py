"""RawPostsScheduler — in-process scheduler for the raw_posts pipeline (#214).

Replaces the api-server batch/raw_posts_dispatch cron + gRPC RPCs that used
to shuttle work to ai-server (#258). Everything now runs here:

    APScheduler (every N seconds)
      └ fetch_due_sources()
          └ per source, in parallel:
              mark_enqueued → pipeline.fetch → upsert_raw_posts
                 → mark_scraped (+ set_initial_scraped on first cycle)

The scheduler is a singleton owned by `RawPostsContainer`; `main.py` starts it
on boot. It also exposes `run_source_by_id` so the manual `/trigger` API can
reuse the exact same per-source flow.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Optional
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .models import FetchRequest
from .pipeline import RawPostsPipeline
from .repository import DueSource, RawPostsRepository


logger = logging.getLogger(__name__)


class RawPostsScheduler:
    def __init__(
        self,
        repository: RawPostsRepository,
        pipeline: RawPostsPipeline,
        interval_seconds: int = 300,
    ) -> None:
        self._repo = repository
        self._pipeline = pipeline
        self._interval_seconds = int(interval_seconds)
        self._scheduler: Optional[AsyncIOScheduler] = None

    # ---- Lifecycle --------------------------------------------------------

    def start(self) -> None:
        """Wire the APScheduler job and start polling. Idempotent."""
        if self._scheduler is not None:
            logger.warning("RawPostsScheduler.start() called twice — ignoring")
            return
        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            self._dispatch_cycle,
            IntervalTrigger(seconds=self._interval_seconds),
            id="raw_posts_dispatch_cycle",
            max_instances=1,
            coalesce=True,
            next_run_time=_now_plus(seconds=5),
        )
        scheduler.start()
        self._scheduler = scheduler
        logger.info(
            "RawPostsScheduler started (interval=%ds)", self._interval_seconds
        )

    async def shutdown(self) -> None:
        if self._scheduler is None:
            return
        self._scheduler.shutdown(wait=False)
        self._scheduler = None
        logger.info("RawPostsScheduler shutdown")

    # ---- Cycle ------------------------------------------------------------

    async def _dispatch_cycle(self) -> None:
        try:
            sources = await self._repo.fetch_due_sources()
        except Exception:
            logger.exception("raw_posts.scheduler: fetch_due_sources failed")
            return
        if not sources:
            logger.debug("raw_posts.scheduler: no due sources")
            return
        logger.info(
            "raw_posts.scheduler: dispatching %d due source(s)", len(sources)
        )
        await asyncio.gather(
            *(self._run_source(src) for src in sources), return_exceptions=True
        )

    async def run_source_by_id(self, source_id: UUID) -> bool:
        """Entry point for the manual /trigger API.

        Returns True if the source exists and was executed (success or failure),
        False if the source wasn't found.
        """
        source = await self._repo.fetch_source(source_id)
        if source is None:
            return False
        await self._run_source(source)
        return True

    async def _run_source(self, source: DueSource) -> None:
        dispatch_id = uuid.uuid4().hex
        mode = "initial" if source.initial_scraped_at is None else "incremental"
        req = FetchRequest(
            source_id=str(source.id),
            platform=source.platform,
            source_type=source.source_type,
            source_identifier=source.source_identifier,
            dispatch_id=dispatch_id,
            mode=mode,
        )
        logger.info(
            "raw_posts.scheduler: source=%s platform=%s mode=%s dispatch=%s",
            source.id,
            source.platform,
            mode,
            dispatch_id,
        )
        try:
            await self._repo.mark_enqueued(source.id)
        except Exception:
            logger.exception(
                "raw_posts.scheduler: mark_enqueued failed for source=%s", source.id
            )
            return

        try:
            results = await self._pipeline.fetch(req)
            if results:
                written = await self._repo.upsert_raw_posts(
                    source_id=source.id,
                    platform=source.platform,
                    dispatch_id=dispatch_id,
                    results=results,
                )
                logger.info(
                    "raw_posts.scheduler: upserted %d rows for source=%s",
                    written,
                    source.id,
                )
            await self._repo.mark_scraped(source.id)
            if mode == "initial":
                await self._repo.set_initial_scraped(source.id)
        except Exception:
            # Leave last_scraped_at / initial_scraped_at untouched so the next
            # cycle retries naturally.
            logger.exception(
                "raw_posts.scheduler: pipeline failed for source=%s — "
                "will retry next cycle",
                source.id,
            )


def _now_plus(*, seconds: int):
    """Small helper kept isolated so tests can monkeypatch it."""
    from datetime import datetime, timedelta, timezone

    return datetime.now(timezone.utc) + timedelta(seconds=seconds)
