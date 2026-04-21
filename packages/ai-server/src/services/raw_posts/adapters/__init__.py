"""Adapter registry.

- MockAdapter (platform='mock'): used for pipeline smoke tests (#258).
- PinterestAdapter (platform='pinterest'): real Pinterest scraper (#214).
- InstagramAdapter: #259, future.
"""

from typing import Dict

from .mock import MockAdapter
from .pinterest import PinterestAdapter
from ..models import SourceAdapter


def build_default_adapters(environment=None) -> Dict[str, SourceAdapter]:
    """Return the adapter registry. Each adapter is keyed by `.platform`."""
    registry: Dict[str, SourceAdapter] = {}
    adapters = [MockAdapter()]
    if environment is not None:
        adapters.append(PinterestAdapter(environment))
    for adapter in adapters:
        registry[adapter.platform] = adapter
    return registry


__all__ = ["MockAdapter", "PinterestAdapter", "build_default_adapters"]
