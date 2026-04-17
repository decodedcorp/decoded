import logging
from typing import Optional
from urllib.parse import urlparse

from src.database.models.content import LinkPreviewMetadata
from src.services.metadata.clients.web_scraper import WebScraperService
from src.services.metadata.extractors.og_extractor import OGTagExtractor
from src.services.metadata.clients.searxng_client import SearXNGClient


def parse_hostname(url: str) -> str:
    """
    Parse hostname from URL

    Args:
        url: URL to parse

    Returns:
        Hostname
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname.lower() if parsed.hostname else ""
        return hostname.replace("www.", "")
    except Exception:
        return ""


class LinkOGExtractor:
    """Extractor for Link OG Metadata (Scraping & SearXNG only)"""

    def __init__(
        self,
        web_scraper: WebScraperService,
        og_extractor: OGTagExtractor,
        searxng_client: SearXNGClient,
        environment=None,
    ):
        self.web_scraper = web_scraper
        self.og_extractor = og_extractor
        self.searxng_client = searxng_client
        self.environment = environment
        self.logger = logging.getLogger(__name__)

        self.included_domains = set()
        if environment:
            included_domains_str = getattr(environment, "SEARXNG_INCLUDED_DOMAINS", "")
            if included_domains_str:
                self.included_domains = {
                    domain.strip().lower()
                    for domain in included_domains_str.split(",")
                    if domain.strip()
                }
                self.logger.info(f"SearXNG included domains: {self.included_domains}")

    def is_searxng_included_domain(self, url: str) -> bool:
        """
        Check if URL belongs to included domains (should use SearXNG extraction)
        """
        try:
            hostname = parse_hostname(url)
            # Check if hostname matches any included domain
            for included_domain in self.included_domains:
                if hostname == included_domain or hostname.endswith(f".{included_domain}"):
                    return True
            return False
        except Exception as e:
            self.logger.warning(f"Error checking included domain for {url}: {str(e)}")
            return False

    async def extract(self, url: str) -> Optional[LinkPreviewMetadata]:
        """
        Extract only OG data for a link (synchronous extraction only)
        Performs extraction via SearXNG or web scraping.

        Args:
            url: URL to process

        Returns:
            Optional[LinkPreviewMetadata]
        """
        try:
            # Perform extraction (SearXNG or web scraping)
            link_preview = None
            if self.is_searxng_included_domain(url):
                # Use Searxng extraction
                self.logger.debug(f"SearXNG extraction for {url}")
                link_preview = await self.searxng_client.extract_metadata(url=url)
            else:
                # Use web scraping
                self.logger.debug(f"Soup extraction for {url}")
                soup = await self.web_scraper.fetch_page(url)
                if soup:
                    link_preview = self.og_extractor.extract(soup, url)
                    self.logger.info(f"Successfully extracted OG metadata for {url}")
                else:
                    # Web scraping failed, try SearXNG fallback
                    self.logger.warning(f"Web scraping failed for {url}, trying SearXNG fallback")
                    link_preview = await self.searxng_client.extract_metadata(url=url)
            return link_preview

        except Exception as e:
            # Try SearXNG as last resort
            try:
                self.logger.error(f"{str(e)}. Try searxng extraction")
                link_preview = await self.searxng_client.extract_metadata(url=url)
                return link_preview
            except Exception as searxng_error:
                self.logger.error(f"{str(searxng_error)}")
                return None
