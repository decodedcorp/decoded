"""RawPostsPipeline — runs an adapter, pre-filters against the DB, downloads
each image, uploads to R2. Returns `list[RawPostResult]` ready for upsert.

This module is pure compute w.r.t. external observation (no `print`, no gRPC).
DB access is limited to the pre-filter read; writing the rows is the
scheduler/trigger caller's job via `RawPostsRepository.upsert_raw_posts`.
"""

from __future__ import annotations

import asyncio
import logging
import mimetypes
import re
from typing import Dict, List, Optional

import httpx

from src.managers.storage.r2_client import R2Client

from .models import FetchRequest, RawMedia, RawPostResult, SourceAdapter
from .repository import RawPostsRepository


logger = logging.getLogger(__name__)

_SAFE_ID = re.compile(r"[^a-zA-Z0-9._-]+")


def _sanitize_external_id(value: str) -> str:
    # Drop the dot too — keeping it lets `..` slip into the shard segment
    # and produce a path-traversal-looking R2 key.
    safe = _SAFE_ID.sub("-", value).replace(".", "-").strip("-")
    return safe[:180] or "item"


def _extension_for(content_type: Optional[str], fallback_url: str) -> str:
    if content_type:
        guess = mimetypes.guess_extension(content_type.split(";")[0].strip())
        if guess:
            return guess.lstrip(".")
    lower = fallback_url.lower().split("?", 1)[0]
    for ext in ("jpg", "jpeg", "png", "webp", "gif"):
        if lower.endswith("." + ext):
            return ext
    return "jpg"


def _build_r2_key(platform: str, external_id: str, ext: str) -> str:
    """Deterministic, date-free key so the same pin always lands at the same
    R2 object (avoids storage duplication when we re-scrape months later)."""
    safe_id = _sanitize_external_id(external_id)
    shard = safe_id[:2] or "_"
    return f"{platform}/{shard}/{safe_id}.{ext}"


class RawPostsPipeline:
    """Adapter fetch → DB pre-filter → download → R2 upload. No DB writes."""

    def __init__(
        self,
        r2_client: R2Client,
        adapters: Dict[str, SourceAdapter],
        repository: RawPostsRepository,
        download_timeout: int = 30,
    ) -> None:
        self._r2 = r2_client
        self._adapters = dict(adapters)
        self._repo = repository
        self._download_timeout = download_timeout

    def supports(self, platform: str) -> bool:
        return platform in self._adapters

    async def fetch(self, req: FetchRequest) -> List[RawPostResult]:
        adapter = self._adapters.get(req.platform)
        if adapter is None:
            raise LookupError(
                f"No SourceAdapter registered for platform '{req.platform}'. "
                f"Registered: {sorted(self._adapters)}"
            )

        medias = await adapter.fetch(req)
        if not medias:
            logger.info(
                "raw_posts.fetch: adapter returned 0 items (platform=%s source=%s)",
                req.platform,
                req.source_identifier,
            )
            return []

        # Pre-filter — skip items already ingested. Saves Pinterest CDN
        # bandwidth + R2 PUTs on repeat polling of the same board.
        existing = await self._repo.fetch_existing_external_ids(
            platform=req.platform,
            external_ids=[m.external_id for m in medias],
        )
        new_medias = [m for m in medias if m.external_id not in existing]
        if not new_medias:
            logger.info(
                "raw_posts.fetch: all %d items already ingested "
                "(platform=%s source=%s)",
                len(medias),
                req.platform,
                req.source_identifier,
            )
            return []

        results: List[RawPostResult] = []
        async with httpx.AsyncClient(
            timeout=self._download_timeout, follow_redirects=True
        ) as http:
            for media in new_medias:
                try:
                    result = await self._process_single(http, req, media)
                    results.append(result)
                except Exception as exc:  # isolate per-item failures
                    logger.warning(
                        "raw_posts.fetch: skipping item external_id=%s (%s)",
                        media.external_id,
                        exc,
                    )
        logger.info(
            "raw_posts.fetch: produced %d/%d results (new=%d, platform=%s dispatch_id=%s)",
            len(results),
            len(medias),
            len(new_medias),
            req.platform,
            req.dispatch_id,
        )
        return results

    async def _process_single(
        self,
        http: httpx.AsyncClient,
        req: FetchRequest,
        media: RawMedia,
    ) -> RawPostResult:
        resp = await http.get(media.image_url)
        resp.raise_for_status()
        body = resp.content
        content_type = resp.headers.get("content-type") or "application/octet-stream"

        ext = _extension_for(content_type, media.image_url)
        key = _build_r2_key(req.platform, media.external_id, ext)

        put_result = await asyncio.to_thread(self._r2.put, key, body, content_type)

        # #347: image_url 은 R2 업로드 결과(put_result.url). 외부 CDN URL(media.image_url)은
        # external_url 로 핀 페이지 추적이 가능하므로 별도 보관 안 함.
        return RawPostResult(
            external_id=media.external_id,
            external_url=media.external_url,
            image_url=put_result.url or "",
            caption=media.caption,
            author_name=media.author_name,
            platform_metadata=media.platform_metadata,
        )
