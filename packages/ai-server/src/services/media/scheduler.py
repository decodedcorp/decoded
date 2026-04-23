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
from src.services.media.original_search import (
    OriginalArchiver,
    OriginalImageSearcher,
    OriginalSearchRepository,
    crop_left_panel,
    select_best_candidate,
)
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
        original_searcher: Optional[OriginalImageSearcher] = None,
        original_archiver: Optional[OriginalArchiver] = None,
        original_repository: Optional[OriginalSearchRepository] = None,
        interval_seconds: int = 600,
        batch_size: int = 10,
        max_attempts: int = 3,
        original_search_enabled: bool = True,
    ) -> None:
        self._repo = repository
        self._parser = parser
        self._writer = writer
        self._r2 = r2_client
        self._original_searcher = original_searcher
        self._original_archiver = original_archiver
        self._original_repo = original_repository
        self._interval_seconds = int(interval_seconds)
        self._batch_size = int(batch_size)
        self._max_attempts = int(max_attempts)
        self._original_search_enabled = bool(original_search_enabled)
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

        # Best-effort original image reverse search. Never fails the pipeline.
        image_url, original_status = await self._resolve_original(
            candidate, image_bytes
        )

        try:
            seed_post_id = await self._writer.write_for_parse_result(
                candidate,
                parsed,
                image_sha256=sha256,
                image_url=image_url,
                original_status=original_status,
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
            "media.parse: parsed id=%s → seed_post_id=%s "
            "(items=%d, original=%s)",
            candidate.id,
            seed_post_id,
            len(parsed.items),
            original_status,
        )
        return "parsed"

    # ---- Original search --------------------------------------------------

    async def _resolve_original(
        self,
        candidate: ParseCandidate,
        composite_bytes: bytes,
    ) -> tuple[str, str]:
        """Try to find and archive a higher-quality original for this pin.

        Always returns `(image_url, original_status)`:
          - On success: (r2_url of archived original, "found")
          - Otherwise: (candidate.r2_url, "not_found" | "skipped")

        Never raises — any failure falls back to the composite URL.
        """
        composite_fallback = (candidate.r2_url, "not_found")
        if (
            not self._original_search_enabled
            or self._original_searcher is None
            or self._original_archiver is None
            or self._original_repo is None
        ):
            return (candidate.r2_url, "skipped")

        try:
            await self._original_repo.mark_searching(candidate.id)
        except Exception:
            logger.exception(
                "media.parse: mark_searching failed id=%s — continuing",
                candidate.id,
            )

        try:
            crop_bytes = await asyncio.to_thread(crop_left_panel, composite_bytes)
        except Exception:
            logger.exception(
                "media.parse: crop_left_panel failed id=%s", candidate.id
            )
            await self._safe_set_status(candidate.id, "not_found")
            return composite_fallback

        try:
            result = await asyncio.to_thread(
                self._original_searcher.search, crop_bytes
            )
        except Exception:
            logger.exception(
                "media.parse: original searcher failed id=%s", candidate.id
            )
            await self._safe_set_status(candidate.id, "not_found")
            return composite_fallback

        ranked = select_best_candidate(result.candidates)
        if not ranked:
            logger.info(
                "media.parse: no viable original candidates id=%s", candidate.id
            )
            await self._safe_set_status(candidate.id, "not_found")
            return composite_fallback

        archived = await self._original_archiver.archive_first_viable(
            candidate.id, ranked
        )
        if archived is None:
            logger.info(
                "media.parse: all %d candidates failed download id=%s",
                len(ranked),
                candidate.id,
            )
            await self._safe_set_status(candidate.id, "not_found")
            return composite_fallback

        try:
            await self._original_repo.insert_archived(
                candidate.id, archived, is_primary=True
            )
            await self._original_repo.set_status(candidate.id, "found")
        except Exception:
            logger.exception(
                "media.parse: original DB write failed id=%s — using archive URL anyway",
                candidate.id,
            )

        logger.info(
            "media.parse: original found id=%s %dx%d %dB (%s)",
            candidate.id,
            archived.width,
            archived.height,
            archived.byte_size,
            archived.origin_domain,
        )
        return (archived.r2_url, "found")

    async def _safe_set_status(self, raw_post_id: UUID, status: str) -> None:
        if self._original_repo is None:
            return
        try:
            await self._original_repo.set_status(raw_post_id, status)
        except Exception:
            logger.exception(
                "media.parse: set original_status=%s failed id=%s",
                status,
                raw_post_id,
            )


def _parsed_to_dict(parsed: ParsedDecodeResult) -> dict:
    return parsed.model_dump(mode="json")


def _now_plus(*, seconds: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=seconds)
