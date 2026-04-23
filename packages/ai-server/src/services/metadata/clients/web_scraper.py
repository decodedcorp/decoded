import asyncio
import httpx
from bs4 import BeautifulSoup
from typing import Optional
import logging
from urllib.parse import urljoin
import random


class WebScraperService:
    """Enhanced web scraping service with retry logic and multiple user agents"""

    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Twitterbot/1.0",
        "WhatsApp/2.19.81 A",
        "facebookexternalhit/1.1",
    ]

    def __init__(self, max_retries: int = 2, timeout: int = 30):
        self.max_retries = max_retries
        self.timeout = timeout
        self.logger = logging.getLogger(__name__)

    def get_user_agent_by_priority(self, attempt: int) -> str:
        """시도 횟수에 따라 우선순위 기반으로 User-Agent 선택"""
        priority_agents = [
            "Twitterbot/1.0",  # 1순위
            "WhatsApp/2.19.81 A",  # 2순위
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",  # 3순위
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",  # 4순위
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",  # 5순위
            "facebookexternalhit/1.1",  # 6순위
        ]
        return priority_agents[min(attempt, len(priority_agents) - 1)]

    async def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """
        Fetch a web page and return BeautifulSoup object

        Args:
            url: URL to fetch

        Returns:
            BeautifulSoup object or None if failed
        """
        for attempt in range(self.max_retries):
            try:
                user_agent = self.get_user_agent_by_priority(attempt)
                headers = {
                    "User-Agent": user_agent,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Accept-Encoding": "gzip, deflate",
                    "Connection": "keep-alive",
                }

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, headers=headers, follow_redirects=True)
                    response.raise_for_status()

                    # Check if content is HTML
                    content_type = response.headers.get("content-type", "").lower()
                    if "text/html" not in content_type:
                        self.logger.warning(f"Non-HTML content for {url}: {content_type}")
                        return None

                    soup = BeautifulSoup(response.content, "html.parser")
                    self.logger.info(f"Successfully fetched {url} on attempt {attempt + 1}")
                    return soup

            except httpx.HTTPStatusError as e:
                self.logger.warning(
                    f"HTTP error {e.response.status_code} for {url} on attempt {attempt + 1}"
                )
                if e.response.status_code in [404, 403, 401]:
                    # Don't retry for these status codes
                    break
            except (httpx.RequestError, httpx.TimeoutException) as e:
                self.logger.warning(f"Request error for {url} on attempt {attempt + 1}: {str(e)}")
            except Exception as e:
                self.logger.error(f"Unexpected error for {url} on attempt {attempt + 1}: {str(e)}")

            if attempt < self.max_retries - 1:
                # Exponential backoff
                wait_time = (2**attempt) + random.uniform(0, 1)
                await asyncio.sleep(wait_time)

        self.logger.error(f"Failed to fetch {url} after {self.max_retries} attempts")
        return None

    async def validate_url_accessibility(self, url: str) -> bool:
        """
        Check if a URL is accessible using HEAD request

        Args:
            url: URL to validate

        Returns:
            True if accessible, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.head(url, follow_redirects=True)
                return response.status_code == 200
        except Exception as e:
            self.logger.debug(f"URL validation failed for {url}: {str(e)}")
            return False

    def extract_text_content(self, soup: BeautifulSoup, max_chars: int = 5000) -> str:
        """
        Extract clean text content from BeautifulSoup object

        Args:
            soup: BeautifulSoup object
            max_chars: Maximum characters to extract

        Returns:
            Cleaned text content
        """
        try:
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer"]):
                script.decompose()

            # Get text
            text = soup.get_text()

            # Clean up text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = " ".join(chunk for chunk in chunks if chunk)

            # Limit length
            if len(text) > max_chars:
                text = text[: max_chars - 3] + "..."

            return text

        except Exception as e:
            self.logger.error(f"Error extracting text content: {str(e)}")
            return ""

    async def download_image(self, image_url: str) -> Optional[bytes]:
        """
        Download image from URL and return binary data

        Args:
            image_url: URL of the image to download

        Returns:
            Binary image data or None if failed
        """
        for attempt in range(self.max_retries):
            try:
                user_agent = self.get_user_agent_by_priority(attempt)
                headers = {
                    "User-Agent": user_agent,
                    "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Accept-Encoding": "gzip, deflate",
                    "Connection": "keep-alive",
                }

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(image_url, headers=headers, follow_redirects=True)
                    response.raise_for_status()

                    # Check if content is actually an image
                    content_type = response.headers.get("content-type", "").lower()
                    if not content_type.startswith("image/"):
                        self.logger.warning(f"Non-image content for {image_url}: {content_type}")
                        return None

                    # Check file size (100MB limit for download)
                    content_length = response.headers.get("content-length")
                    if content_length and int(content_length) > 100 * 1024 * 1024:
                        self.logger.warning(
                            f"Image too large for {image_url}: {content_length} bytes"
                        )
                        return None

                    image_data = response.content
                    self.logger.info(
                        f"Successfully downloaded image {image_url} ({len(image_data)} bytes) on attempt {attempt + 1}"
                    )
                    return image_data

            except httpx.HTTPStatusError as e:
                self.logger.warning(
                    f"HTTP error {e.response.status_code} for {image_url} on attempt {attempt + 1}"
                )
                if e.response.status_code in [404, 403, 401]:
                    # Don't retry for these status codes
                    break
            except (httpx.RequestError, httpx.TimeoutException) as e:
                self.logger.warning(
                    f"Request error for {image_url} on attempt {attempt + 1}: {str(e)}"
                )
            except Exception as e:
                self.logger.error(
                    f"Unexpected error for {image_url} on attempt {attempt + 1}: {str(e)}"
                )

            if attempt < self.max_retries - 1:
                # Exponential backoff
                wait_time = (2**attempt) + random.uniform(0, 1)
                await asyncio.sleep(wait_time)

        self.logger.error(f"Failed to download image {image_url} after {self.max_retries} attempts")
        return None

    def resolve_relative_url(self, base_url: str, url: str) -> str:
        """
        Convert relative URL to absolute URL

        Args:
            base_url: Base URL for resolution
            url: URL that might be relative

        Returns:
            Absolute URL
        """
        try:
            if not url:
                return url
            return urljoin(base_url, url)
        except Exception:
            return url
