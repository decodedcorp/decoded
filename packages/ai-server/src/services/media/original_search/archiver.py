"""Downloader + R2 archiver for reverse-search originals (#261).

For each ranked candidate: try `strip_resize_params` variant first, then
the raw URL. Accept the first fetch that:
  1. Returns HTTP 200
  2. Has `Content-Type: image/*`
  3. Exceeds minimum byte and resolution thresholds (filters thumbnails)

On success, upload to R2 under `originals/{raw_post_id}.{ext}` and return
the archive metadata.

Download failures never raise — the pipeline treats "original not found"
as a normal outcome and falls back to the composite.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from dataclasses import dataclass
from io import BytesIO
from typing import Iterable, Optional
from urllib.parse import urlparse
from uuid import UUID

import httpx
from PIL import Image

from src.managers.storage.r2_client import R2Client

from .models import ArchivedOriginal, OriginalCandidate
from .selector import url_variants


logger = logging.getLogger(__name__)


_CT_TO_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)


@dataclass(frozen=True)
class _FetchedImage:
    final_url: str
    content: bytes
    content_type: str
    width: int
    height: int


class OriginalArchiver:
    def __init__(
        self,
        *,
        r2_client: R2Client,
        min_width: int = 500,
        min_height: int = 500,
        min_bytes: int = 40_000,
        download_timeout: int = 15,
        search_provider: str = "gcp_vision_web_detection",
    ) -> None:
        self._r2 = r2_client
        self._min_width = int(min_width)
        self._min_height = int(min_height)
        self._min_bytes = int(min_bytes)
        self._timeout = int(download_timeout)
        self._search_provider = search_provider

    async def archive_first_viable(
        self,
        raw_post_id: UUID,
        candidates: Iterable[OriginalCandidate],
    ) -> Optional[ArchivedOriginal]:
        """Try each candidate until one downloads + archives successfully.

        Returns None when no candidate passes the download/size filters.
        """
        async with httpx.AsyncClient(
            headers={"User-Agent": _USER_AGENT},
            follow_redirects=True,
            timeout=self._timeout,
        ) as http:
            for candidate in candidates:
                fetched = await self._try_fetch(http, candidate.url)
                if fetched is None:
                    continue
                try:
                    archived = await asyncio.to_thread(
                        self._archive, raw_post_id, candidate, fetched
                    )
                except Exception:
                    logger.exception(
                        "original_search.archive: R2 upload failed url=%s",
                        fetched.final_url,
                    )
                    continue
                return archived
        return None

    # ---- Internal ----------------------------------------------------------

    async def _try_fetch(
        self, http: httpx.AsyncClient, url: str
    ) -> Optional[_FetchedImage]:
        for variant in url_variants(url):
            try:
                resp = await http.get(variant)
            except Exception as exc:
                logger.debug(
                    "original_search.fetch failed variant=%s err=%s",
                    variant,
                    exc,
                )
                continue
            if resp.status_code != 200:
                continue
            ct = (resp.headers.get("content-type") or "").split(";")[0].strip().lower()
            if not ct.startswith("image/"):
                continue
            if len(resp.content) < self._min_bytes:
                continue
            try:
                img = Image.open(BytesIO(resp.content))
                size = img.size
            except Exception:
                continue
            if size[0] < self._min_width or size[1] < self._min_height:
                continue
            return _FetchedImage(
                final_url=str(resp.url),
                content=resp.content,
                content_type=ct,
                width=size[0],
                height=size[1],
            )
        return None

    def _archive(
        self,
        raw_post_id: UUID,
        candidate: OriginalCandidate,
        fetched: _FetchedImage,
    ) -> ArchivedOriginal:
        """Upload to R2 and return the archive record. Sync (boto3)."""
        ext = _CT_TO_EXT.get(fetched.content_type, "jpg")
        r2_key = f"originals/{raw_post_id}.{ext}"
        result = self._r2.put(r2_key, fetched.content, fetched.content_type)
        sha = hashlib.sha256(fetched.content).hexdigest()
        origin_domain = urlparse(candidate.url).netloc or "unknown"
        return ArchivedOriginal(
            origin_url=candidate.url,
            origin_domain=origin_domain,
            r2_key=result.key,
            r2_url=result.url,
            width=fetched.width,
            height=fetched.height,
            byte_size=len(fetched.content),
            image_hash=sha,
            search_provider=self._search_provider,
            source=candidate.source,
            metadata={
                "fetched_url": fetched.final_url,
                "content_type": fetched.content_type,
            },
        )
