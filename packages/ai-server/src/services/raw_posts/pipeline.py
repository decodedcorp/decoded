"""RawPostsPipeline — runs an adapter, downloads each image, uploads to R2.

This is pure compute: no DB access. The caller (ARQ job) is responsible for
reporting results to api-server via gRPC callback.
"""

from __future__ import annotations

import asyncio
import logging
import mimetypes
import re
from datetime import date
from typing import Dict, List, Optional

import httpx

from src.managers.storage.r2_client import R2Client

from .models import FetchRequest, RawMedia, RawPostResult, SourceAdapter


logger = logging.getLogger(__name__)

_SAFE_ID = re.compile(r"[^a-zA-Z0-9._-]+")


def _sanitize_external_id(value: str) -> str:
    safe = _SAFE_ID.sub("-", value).strip("-")
    return safe[:180] or "item"


def _extension_for(content_type: Optional[str], fallback_url: str) -> str:
    if content_type:
        guess = mimetypes.guess_extension(content_type.split(";")[0].strip())
        if guess:
            return guess.lstrip(".")
    # Derive from URL path if the content-type is unknown.
    lower = fallback_url.lower().split("?", 1)[0]
    for ext in ("jpg", "jpeg", "png", "webp", "gif"):
        if lower.endswith("." + ext):
            return ext
    return "jpg"


class RawPostsPipeline:
    """Fetch → download → upload. Returns a list of RawPostResult; no DB writes."""

    def __init__(
        self,
        r2_client: R2Client,
        adapters: Dict[str, SourceAdapter],
        download_timeout: int = 30,
    ) -> None:
        self._r2 = r2_client
        self._adapters = dict(adapters)
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

        results: List[RawPostResult] = []
        async with httpx.AsyncClient(
            timeout=self._download_timeout, follow_redirects=True
        ) as http:
            for media in medias:
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
            "raw_posts.fetch: produced %d/%d results (platform=%s dispatch_id=%s)",
            len(results),
            len(medias),
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

        today = date.today()
        ext = _extension_for(content_type, media.image_url)
        safe_id = _sanitize_external_id(media.external_id)
        key = f"{req.platform}/{today:%Y/%m}/{safe_id}.{ext}"

        put_result = await asyncio.to_thread(self._r2.put, key, body, content_type)

        return RawPostResult(
            external_id=media.external_id,
            external_url=media.external_url,
            image_url=media.image_url,
            r2_key=put_result.key,
            r2_url=put_result.url or "",
            caption=media.caption,
            author_name=media.author_name,
            platform_metadata=media.platform_metadata,
        )
