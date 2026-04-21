"""Vision parsing scheduler (#260).

Mirrors `RawPostsScheduler`: an `AsyncIOScheduler` polls every
`MEDIA_PARSE_INTERVAL_SECONDS`, claims a batch of `parse_status='pending'`
rows, parses each through `MediaVisionParser`, writes seed rows, and
stamps the outcome on `warehouse.raw_posts`.

Also exposes `reparse_by_id` for the manual
`POST /media/items/{raw_post_id}/reparse` admin trigger.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from src.managers.storage.r2_client import R2Client
from src.services.media.models import ParseCandidate, ParsedDecodeResult
from src.services.media.repository import MediaRepository
from src.services.media.seed_writer import SeedWriter
from src.services.media.vision_parser import MediaVisionParser


logger = logging.getLogger(__name__)


_MIME_BY_EXT = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
}


def _mime_from_key(key: Optional[str]) -> str:
    if not key:
        return "image/jpeg"
    _, _, ext = key.rpartition(".")
    return _MIME_BY_EXT.get(ext.lower(), "image/jpeg")


class MediaParseScheduler:
    def __init__(
        self,
        *,
        repository: MediaRepository,
        parser: MediaVisionParser,
        writer: SeedWriter,
        r2_client: R2Client,
        interval_seconds: int = 600,
        batch_size: int = 10,
        max_attempts: int = 3,
    ) -> None:
        self._repo = repository
        self._parser = parser
        self._writer = writer
        self._r2 = r2_client
        self._interval_seconds = int(interval_seconds)
        self._batch_size = int(batch_size)
        self._max_attempts = int(max_attempts)
        self._scheduler: Optional[AsyncIOScheduler] = None

    # ---- Lifecycle --------------------------------------------------------

    def start(self) -> None:
        if self._scheduler is not None:
            logger.warning("MediaParseScheduler.start() called twice — ignoring")
            return
        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            self._dispatch_cycle,
            IntervalTrigger(seconds=self._interval_seconds),
            id="media_parse_dispatch_cycle",
            max_instances=1,
            coalesce=True,
            next_run_time=_now_plus(seconds=10),
        )
        scheduler.start()
        self._scheduler = scheduler
        logger.info(
            "MediaParseScheduler started (interval=%ds, batch=%d, max_attempts=%d)",
            self._interval_seconds,
            self._batch_size,
            self._max_attempts,
        )

    async def shutdown(self) -> None:
        if self._scheduler is None:
            return
        self._scheduler.shutdown(wait=False)
        self._scheduler = None
        logger.info("MediaParseScheduler shutdown")

    # ---- Cycle ------------------------------------------------------------

    async def _dispatch_cycle(self) -> None:
        try:
            candidates = await self._repo.claim_pending(
                limit=self._batch_size, max_attempts=self._max_attempts
            )
        except Exception:
            logger.exception("media.scheduler: claim_pending failed")
            return
        if not candidates:
            logger.debug("media.scheduler: no pending rows")
            return
        logger.info(
            "media.scheduler: claimed %d pending row(s)", len(candidates)
        )
        await asyncio.gather(
            *(self._process_one(c) for c in candidates), return_exceptions=True
        )

    async def run_once(self) -> int:
        """Run a single dispatch cycle synchronously; returns rows processed.

        Handy for tests and ad-hoc CLI triggers.
        """
        candidates = await self._repo.claim_pending(
            limit=self._batch_size, max_attempts=self._max_attempts
        )
        if not candidates:
            return 0
        await asyncio.gather(
            *(self._process_one(c) for c in candidates), return_exceptions=True
        )
        return len(candidates)

    async def reparse_by_id(self, raw_post_id: UUID) -> str:
        """Admin trigger — resets the row then runs one parse attempt.

        Returns the final `parse_status` ("parsed" | "skipped" | "failed" |
        "pending" on retryable failure). Raises KeyError if the row doesn't
        exist or has no r2_url to work with.
        """
        candidate = await self._repo.claim_for_reparse(raw_post_id)
        if candidate is None:
            raise KeyError(f"raw_post {raw_post_id} not found or has no r2_url")
        return await self._process_one(candidate)

    # ---- Per-row ----------------------------------------------------------

    async def _process_one(self, candidate: ParseCandidate) -> str:
        try:
            image_bytes = await asyncio.to_thread(self._r2.get, candidate.r2_key)
        except Exception as exc:
            logger.exception(
                "media.parse: R2 fetch failed id=%s key=%s",
                candidate.id,
                candidate.r2_key,
            )
            await self._repo.mark_failed(
                candidate.id,
                error=f"r2_fetch: {exc}",
                max_attempts=self._max_attempts,
            )
            return "failed"

        mime = _mime_from_key(candidate.r2_key)
        sha256 = hashlib.sha256(image_bytes).hexdigest()

        try:
            parsed = await self._parser.parse(
                image_bytes=image_bytes,
                mime_type=mime,
                caption=candidate.caption,
            )
        except Exception as exc:
            logger.exception(
                "media.parse: vision call failed id=%s", candidate.id
            )
            await self._repo.mark_failed(
                candidate.id,
                error=f"vision: {exc}",
                max_attempts=self._max_attempts,
            )
            return "failed"

        if not parsed.items:
            logger.info("media.parse: no items detected, skipping id=%s", candidate.id)
            await self._repo.mark_skipped(candidate.id)
            return "skipped"

        try:
            seed_post_id = await self._writer.write_for_parse_result(
                candidate, parsed, image_sha256=sha256
            )
        except Exception as exc:
            logger.exception("media.parse: seed write failed id=%s", candidate.id)
            await self._repo.mark_failed(
                candidate.id,
                error=f"seed_write: {exc}",
                max_attempts=self._max_attempts,
            )
            return "failed"

        await self._repo.mark_parsed(
            candidate.id,
            seed_post_id=seed_post_id,
            parse_result=_parsed_to_dict(parsed),
        )
        logger.info(
            "media.parse: parsed id=%s → seed_post_id=%s (items=%d)",
            candidate.id,
            seed_post_id,
            len(parsed.items),
        )
        return "parsed"


def _parsed_to_dict(parsed: ParsedDecodeResult) -> dict:
    return parsed.model_dump(mode="json")


def _now_plus(*, seconds: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=seconds)
