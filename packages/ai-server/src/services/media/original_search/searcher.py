"""Reverse image search — GCP Cloud Vision Web Detection (#261).

Minimal thin wrapper around `google-cloud-vision`. Returns structured
candidate URLs without any domain-specific judgment; ranking happens in
`selector.py`.

Credentials are resolved via the `GOOGLE_APPLICATION_CREDENTIALS` env var
that the Google SDK auto-detects. We don't read the JSON path ourselves.
"""

from __future__ import annotations

import logging
from typing import List

from google.cloud import vision

from .models import OriginalCandidate, SearchResult


logger = logging.getLogger(__name__)


class OriginalImageSearcher:
    """GCP Cloud Vision Web Detection provider."""

    provider_id: str = "gcp_vision_web_detection"

    def __init__(self, *, client: vision.ImageAnnotatorClient | None = None) -> None:
        # Client defers authentication until the first RPC — we don't force
        # credential resolution at container init time.
        self._client = client

    def _ensure_client(self) -> vision.ImageAnnotatorClient:
        if self._client is None:
            self._client = vision.ImageAnnotatorClient()
        return self._client

    def search(self, image_bytes: bytes) -> SearchResult:
        """Run Web Detection and return all candidate URLs found.

        `visually_similar_images` is intentionally dropped — empirically it
        returns loose 'same vibe' results (different people in similar
        outfits) that dilute precision.
        """
        client = self._ensure_client()
        resp = client.web_detection(image=vision.Image(content=image_bytes))
        if resp.error.message:
            raise RuntimeError(
                f"Cloud Vision Web Detection error: {resp.error.message}"
            )
        wd = resp.web_detection

        entities = [
            (e.description, float(e.score))
            for e in wd.web_entities
            if e.description
        ]
        candidates: List[OriginalCandidate] = []
        for img in wd.full_matching_images:
            if img.url:
                candidates.append(OriginalCandidate(url=img.url, source="full_match"))
        for img in wd.partial_matching_images:
            if img.url:
                candidates.append(OriginalCandidate(url=img.url, source="partial_match"))
        # visually_similar intentionally excluded — see module docstring.
        logger.info(
            "vision.web_detection: entities=%d full=%d partial=%d",
            len(entities),
            len(wd.full_matching_images),
            len(wd.partial_matching_images),
        )
        return SearchResult(entities=entities, candidates=candidates)
