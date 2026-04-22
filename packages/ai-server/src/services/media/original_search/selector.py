"""Candidate selection for the reverse image search pipeline (#261).

Philosophy: we do **not** hardcode preferred domains (news sites, magazines,
etc.). Those judgments belong in admin curation, not in automated logic,
and change per locale/platform.

Instead we use three objective signals:

1. **Hard exclusion** of sources we already know can't serve the image we
   want:
   - Pinterest CDN (`pinimg.com`) — same composite we're searching from
   - Reddit thumbnails / comments — loss-compressed, not the origin
   - Meta's crawler proxy (`lookaside.fbsbx.com`,
     `lookaside.instagram.com`) — returns HTML redirect pages, not bytes
   - Twitter/X thumbnails, TikTok, YouTube stills — not downloadable or
     tiny thumbnails
2. **Source priority**: Vision API's own grouping — `full_match` >
   `partial_match`. (`visually_similar` is dropped earlier in `searcher`.)
3. **Downloadability + size**: a candidate only "wins" if it actually
   fetches as an image over some size threshold. That check lives in
   `pipeline.py` / the scheduler — this module just orders the candidates.

URL normalization (e.g. stripping CDN resize query params like `?w=540`)
is also done here because it's a generic, domain-agnostic pattern.
"""

from __future__ import annotations

import logging
import re
from typing import Iterable, List
from urllib.parse import urlparse, urlunparse

from .models import OriginalCandidate


logger = logging.getLogger(__name__)


# Domains we actively exclude because they're structurally bad sources
# (either non-downloadable, thumbnailed, or the same composite we started
# with). Intentionally conservative — we don't include "bad news" or
# marketplaces. Admin curation handles those qualitative cases.
_EXCLUDED_NETLOC_PATTERNS = (
    r"(?:^|\.)pinimg\.com$",
    r"(?:^|\.)redditmedia\.com$",
    r"(?:^|\.)reddit\.com$",
    r"^lookaside\.(?:fbsbx|instagram)\.com$",
    r"(?:^|\.)fbcdn\.net$",
    r"^(?:pbs|video)\.twimg\.com$",
    r"(?:^|\.)tiktok\.com$",
    r"(?:^|\.)ytimg\.com$",
)


# Query parameter names that typically ask the CDN for a downscaled render.
# Stripping them often yields a larger/uncompressed variant — tried first,
# original URL kept as fallback.
_RESIZE_PARAM_PATTERNS = (
    r"(?:^|&)(?:w|width|h|height|size|resize|type|thumb|thumbnail)=[^&]*",
)


def _is_excluded(url: str) -> bool:
    try:
        netloc = urlparse(url).netloc.lower()
    except Exception:
        return True
    if not netloc:
        return True
    return any(re.search(p, netloc) for p in _EXCLUDED_NETLOC_PATTERNS)


def strip_resize_params(url: str) -> str:
    """Return `url` with common CDN resize query params removed.

    Pure URL manipulation — the actual size must be verified by downloading.
    If nothing matched, returns `url` unchanged.
    """
    try:
        parts = urlparse(url)
    except Exception:
        return url
    if not parts.query:
        return url
    new_query = parts.query
    for pat in _RESIZE_PARAM_PATTERNS:
        new_query = re.sub(pat, "", new_query)
    new_query = new_query.lstrip("&")
    if new_query == parts.query:
        return url
    return urlunparse(parts._replace(query=new_query))


def url_variants(url: str) -> List[str]:
    """Download variants to try in order: stripped first, then original.

    Preserves original order when the stripped variant is identical, so
    callers never double-attempt the same URL.
    """
    stripped = strip_resize_params(url)
    if stripped == url:
        return [url]
    return [stripped, url]


def _source_priority(source: str) -> int:
    """Higher = tried first."""
    return {"full_match": 2, "partial_match": 1}.get(source, 0)


def select_best_candidate(
    candidates: Iterable[OriginalCandidate],
) -> List[OriginalCandidate]:
    """Filter out excluded domains and sort by source priority.

    Returns a ranked list; callers should try in order and accept the first
    one that downloads successfully (with resolution/bytes checks).
    """
    filtered: List[OriginalCandidate] = []
    seen: set[str] = set()
    for c in candidates:
        if c.url in seen:
            continue
        seen.add(c.url)
        if _is_excluded(c.url):
            continue
        filtered.append(c)
    filtered.sort(key=lambda c: -_source_priority(c.source))
    logger.debug(
        "selector: %d → %d candidates after exclusion",
        len(seen),
        len(filtered),
    )
    return filtered
