"""
Metadata service clients package

This package contains client classes for external services and web scraping.
"""

from .searxng_client import SearXNGClient
from .web_scraper import WebScraperService

__all__ = ["SearXNGClient", "WebScraperService"]
