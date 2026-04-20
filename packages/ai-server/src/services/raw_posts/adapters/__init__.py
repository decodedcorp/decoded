"""Adapter registry. Real platform adapters are added in follow-up PRs.

- MockAdapter: built-in, used in v1 to prove pipeline end-to-end (#258).
- PinterestAdapter: #214.
- InstagramAdapter: #259.
"""

from typing import Dict

from .mock import MockAdapter
from ..models import SourceAdapter


def build_default_adapters() -> Dict[str, SourceAdapter]:
    """Return the adapter registry. Each adapter is keyed by `.platform`."""
    registry: Dict[str, SourceAdapter] = {}
    for adapter in (MockAdapter(),):
        registry[adapter.platform] = adapter
    return registry


__all__ = ["MockAdapter", "build_default_adapters"]
