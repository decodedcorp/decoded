"""Reverse image search pipeline for seed post originals (#261).

Given a parsed raw_post (composite Fashion-Decode image), crop the left
celebrity panel → reverse image search → pick the best downloadable match
→ archive to R2. The result becomes `seed_posts.image_url` (best-effort;
admin curates the rest via the seed review UI).
"""

from .archiver import ArchivedOriginal, OriginalArchiver
from .cropper import crop_left_panel
from .models import OriginalCandidate, SearchResult
from .repository import OriginalSearchRepository
from .searcher import OriginalImageSearcher
from .selector import select_best_candidate


__all__ = [
    "ArchivedOriginal",
    "OriginalArchiver",
    "OriginalCandidate",
    "OriginalImageSearcher",
    "OriginalSearchRepository",
    "SearchResult",
    "crop_left_panel",
    "select_best_candidate",
]
