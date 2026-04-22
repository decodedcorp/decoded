"""DTOs for the reverse image search pipeline (#261)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Literal, Optional


CandidateSource = Literal["full_match", "partial_match", "visually_similar"]


@dataclass(frozen=True)
class OriginalCandidate:
    """One candidate URL returned by the reverse image search provider."""

    url: str
    source: CandidateSource


@dataclass(frozen=True)
class SearchResult:
    """Raw output of a reverse image search.

    `entities` carries Vision API's high-level guesses (e.g. celebrity/brand
    names). We don't use them for selection yet — downstream Gemini parse
    is authoritative for brand/celeb — but they're kept for logging and
    admin surface.
    """

    entities: List[tuple[str, float]] = field(default_factory=list)
    candidates: List[OriginalCandidate] = field(default_factory=list)


@dataclass(frozen=True)
class DownloadedCandidate:
    """A candidate that passed URL-level checks and was actually fetched."""

    candidate: OriginalCandidate
    final_url: str         # URL actually fetched (may differ from candidate.url after resize-param strip)
    image_bytes: bytes
    width: int
    height: int
    content_type: str
    image_hash: str        # sha256 hex


@dataclass(frozen=True)
class ArchivedOriginal:
    """An original that has been archived to R2."""

    origin_url: str
    origin_domain: str
    r2_key: str
    r2_url: str
    width: int
    height: int
    byte_size: int
    image_hash: str
    search_provider: str
    source: CandidateSource
    metadata: Optional[dict] = None
