"""
Platform-specific metadata extractors

This module provides extractors for different platforms (YouTube, GitHub, etc.)
to extract metadata and content that can be processed by LLM clients.
"""

from .base_extractor import BaseExtractor
from .youtube_extractor import YouTubeExtractor
from .og_extractor import OGTagExtractor
from .link_og_extractor import LinkOGExtractor

__all__ = ["BaseExtractor", "YouTubeExtractor", "OGTagExtractor", "LinkOGExtractor"]