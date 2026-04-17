import asyncio
import httpx
from typing import List, Optional, Dict, Any
import logging
import re
from urllib.parse import urlparse
from src.config._environment import Environment
from src.database.models.content import LinkPreviewMetadata


class SearXNGClient:
    """Client for SearXNG API image search"""

    def __init__(self, environment: Environment):
        self.environment = environment
        self.logger = logging.getLogger(__name__)

        if not environment.SEARXNG_API_URL:
            self.logger.warning("SearXNG API URL not configured")

    async def search(self, url: str, count: int = 5) -> List[Dict[str, Any]]:
        """
        Search for web links

        Args:
            url: Original URL

        Returns:
            List of web search results with URL, title, and content
        """
        if not self.environment.SEARXNG_API_URL:
            self.logger.error("SearXNG API URL not configured")
            return []

        # Determine best query based on available metadata
        query = self._build_optimal_query(url)
        try:
            results = await self._perform_link_search(query, count)
            return self._filter_and_rank_link_results(results, count)
        except Exception as e:
            self.logger.error(f"Error searching links with metadata for '{query}': {str(e)}")
            return []

    def _build_optimal_query(self, url: str) -> str:
        """
        Build optimal search query using URL parsing only

        Args:
            url: Original URL

        Returns:
            Search query string parsed from URL
        """
        # Always use parsed URL query
        parsed_query = self._parse_url_for_query(url)
        return parsed_query

    def _parse_url_for_query(self, url: str) -> str:
        """
        Parse URL to extract meaningful keywords for search query

        Args:
            url: URL to parse

        Returns:
            Space-separated keywords extracted from URL
        """
        try:
            parsed = urlparse(url)
            keywords = []

            # Extract domain name (remove common subdomains)
            if parsed.hostname:
                hostname_parts = parsed.hostname.split(".")
                # Remove common subdomains and TLD
                domain_keywords = []
                for part in hostname_parts[:-1]:  # Skip TLD
                    if part not in [
                        "www",
                        "blog",
                        "news",
                        "api",
                        "cdn",
                        "static",
                        "images",
                        "assets",
                    ]:
                        domain_keywords.append(part)
                keywords.extend(domain_keywords)

            # Extract and clean path segments
            if parsed.path and parsed.path != "/":
                # Split path by / and clean each segment
                path_segments = [seg for seg in parsed.path.split("/") if seg]
                for segment in path_segments:
                    # Clean segment: replace separators with spaces, remove extensions
                    cleaned = re.sub(r"[_\-.]", " ", segment)
                    # Remove file extensions
                    cleaned = re.sub(r"\.(html|htm|php|asp|jsp|cfm|do)$", "", cleaned)
                    # Split by spaces and filter meaningful words
                    words = cleaned.split()
                    for word in words:
                        # Filter out common patterns
                        if self._is_meaningful_keyword(word):
                            keywords.append(word)

            # Join keywords and limit length
            query = " ".join(keywords[:8])  # Limit to first 8 keywords
            return query if query else url  # Fallback to original URL if no keywords

        except Exception as e:
            self.logger.warning(f"Failed to parse URL for query: {str(e)}")
            return url  # Fallback to original URL

    def _is_meaningful_keyword(self, word: str) -> bool:
        """
        Check if a word is meaningful for search query

        Args:
            word: Word to check

        Returns:
            True if word is meaningful for search
        """
        # Must be at least 2 characters
        if len(word) < 2:
            return False

        # Skip pure numbers, dates, and IDs
        if re.match(r"^\d+$", word):
            return False

        # Skip common patterns
        skip_patterns = [
            r"^\d{4}$",  # Years
            r"^\d{1,2}$",  # Small numbers
            r"^id\d+$",  # IDs
            r"^v\d+$",  # Versions
            r"^p\d+$",  # Pages
        ]

        if any(re.match(pattern, word.lower()) for pattern in skip_patterns):
            return False

        # Skip very common words
        common_words = {
            "post",
            "posts",
            "page",
            "pages",
            "article",
            "articles",
            "index",
            "home",
            "main",
            "default",
            "content",
            "detail",
            "view",
            "show",
            "list",
            "item",
            "items",
            "category",
            "tag",
            "tags",
            "search",
            "results",
            "archive",
        }

        if word.lower() in common_words:
            return False

        return True

    async def search_parallel(
        self, url: str, link_count: int = 3, image_count: int = 1
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Perform parallel link and image search for better efficiency and consistency

        Args:
            url: Original URL to search for
            link_count: Number of link results to return
            image_count: Number of image results to return

        Returns:
            Dictionary with 'links' and 'images' keys containing respective results
        """
        if not self.environment.SEARXNG_API_URL:
            self.logger.error("SearXNG API URL not configured")
            return {"links": [], "images": []}

        # Use same parsed query for both searches
        parsed_query = self._parse_url_for_query(url)

        try:
            # Perform parallel searches
            link_results, image_results = await asyncio.gather(
                self._perform_link_search(parsed_query, link_count),
                self._perform_search(parsed_query, image_count),
                return_exceptions=True,
            )

            # Handle exceptions
            if isinstance(link_results, Exception):
                self.logger.error(f"Link search failed: {str(link_results)}")
                link_results = []

            if isinstance(image_results, Exception):
                self.logger.error(f"Image search failed: {str(image_results)}")
                image_results = []

            # Filter and rank results
            filtered_links = self._filter_and_rank_link_results(link_results, link_count)
            filtered_images = self._filter_and_rank_results_with_domain_matching(image_results, url)

            return {"links": filtered_links, "images": filtered_images[:image_count]}

        except Exception as e:
            self.logger.error(f"Parallel search failed for URL '{url}': {str(e)}")
            return {"links": [], "images": []}

    async def search_images(self, query: str, count: int = 5) -> List[Dict[str, Any]]:
        """
        Search for images using SearXNG

        Args:
            query: Search query
            count: Number of results to return

        Returns:
            List of image results with URL, title, and other metadata
        """
        if not self.environment.SEARXNG_API_URL:
            self.logger.error("SearXNG API URL not configured")
            return []

        try:
            results = await self._perform_search(query, count)
            return self._filter_and_rank_results(results)
        except Exception as e:
            self.logger.error(f"Error searching images for query '{query}': {str(e)}")
            return []

    async def find_related_image(self, url: str, count: int = 1) -> Optional[str]:
        """
        Find a related image based on title and domain

        Args:
            title: Title to search for
            domain: Domain to help contextualize search
            count: Number of results to consider

        Returns:
            URL of the best matching image or None
        """
        results = await self.search_images(url, count * 3)  # Get more results to filter

        if results:
            # Return the first valid result
            for result in results:
                image_url = result.get("img_src")
                if image_url and self._is_valid_image_result(result):
                    return image_url

        return None

    async def _perform_search(self, query: str, count: int) -> List[Dict[str, Any]]:
        """Perform the actual search request to SearXNG"""
        params = {
            "q": query,
            "format": "json",
            "categories": "images",
            "engines": "bing images,google images,duckduckgo images",
            "safesearch": "1",
            "image_proxy": "1",
        }

        url = f"{self.environment.SEARXNG_API_URL}/search"

        for attempt in range(self.environment.SEARXNG_MAX_RETRIES):
            try:
                async with httpx.AsyncClient(
                    timeout=self.environment.SEARXNG_REQUEST_TIMEOUT
                ) as client:
                    response = await client.get(url, params=params)
                    response.raise_for_status()

                    data = response.json()
                    results = data.get("results", [])

                    # Limit to requested count
                    return results[: count * 2]  # Get more for filtering

            except httpx.HTTPStatusError as e:
                self.logger.warning(f"HTTP error {e.response.status_code} on attempt {attempt + 1}")
                if e.response.status_code == 429:  # Rate limit
                    wait_time = (2**attempt) * 2
                    await asyncio.sleep(wait_time)
                    continue
                elif e.response.status_code in [404, 503]:
                    break  # Don't retry for these
            except Exception as e:
                self.logger.warning(f"Search request failed on attempt {attempt + 1}: {str(e)}")
                if attempt < self.environment.SEARXNG_MAX_RETRIES - 1:
                    wait_time = (2**attempt) + 1
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    raise

        return []

    def _filter_and_rank_results(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter and rank search results by quality"""
        if not results:
            return []

        filtered_results = []

        for result in results:
            if self._is_valid_image_result(result):
                # Add quality score
                result["quality_score"] = self._calculate_quality_score(result)
                filtered_results.append(result)

        # Sort by quality score (descending)
        filtered_results.sort(key=lambda x: x.get("quality_score", 0), reverse=True)

        return filtered_results

    def _is_valid_image_result(self, result: Dict[str, Any]) -> bool:
        """Check if an image result is valid and usable"""
        img_src = result.get("img_src", "")
        if not img_src:
            return False

        # Check URL format
        if not img_src.startswith(("http://", "https://")):
            return False

        # Skip low-quality or placeholder images
        img_src_lower = img_src.lower()
        skip_patterns = [
            "placeholder",
            "blank",
            "spacer",
            "pixel.gif",
            "dot.gif",
            "loading",
            "spinner",
            "default",
            "no-image",
            "missing",
        ]

        if any(pattern in img_src_lower for pattern in skip_patterns):
            return False

        # Check file extension
        valid_extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]
        if not any(img_src_lower.endswith(ext) for ext in valid_extensions):
            # If no extension, check if it looks like an image URL
            if not any(param in img_src_lower for param in ["format=", "width=", "height="]):
                return False

        # Check image dimensions if available
        try:
            width = result.get("img_width", 0)
            height = result.get("img_height", 0)

            if width and height:
                # Skip very small images (likely icons or thumbnails)
                if width < 100 or height < 100:
                    return False

                # Skip extremely wide or tall images (likely banners or buttons)
                aspect_ratio = max(width, height) / min(width, height)
                if aspect_ratio > 5:
                    return False
        except (ValueError, ZeroDivisionError):
            pass

        # Check title/content for relevance
        title = result.get("title", "").lower()
        content = result.get("content", "").lower()

        # Skip if title suggests it's not a main content image
        skip_title_patterns = ["icon", "logo", "button", "banner", "avatar", "thumbnail"]
        if any(pattern in title for pattern in skip_title_patterns):
            return False

        return True

    def _calculate_quality_score(self, result: Dict[str, Any]) -> float:
        """Calculate a quality score for ranking results"""
        score = 0.0

        # Base score for having an image
        score += 1.0

        # Bonus for larger images
        try:
            width = result.get("img_width", 0)
            height = result.get("img_height", 0)

            if width and height:
                # Score based on resolution
                pixels = width * height
                if pixels > 500000:  # > ~700x700
                    score += 2.0
                elif pixels > 200000:  # > ~450x450
                    score += 1.5
                elif pixels > 50000:  # > ~225x225
                    score += 1.0

                # Prefer reasonable aspect ratios
                aspect_ratio = max(width, height) / min(width, height)
                if 0.5 <= aspect_ratio <= 2.0:
                    score += 0.5
        except (ValueError, ZeroDivisionError):
            pass

        # Bonus for HTTPS
        img_src = result.get("img_src", "")
        if img_src.startswith("https://"):
            score += 0.3

        # Bonus for common image formats
        img_src_lower = img_src.lower()
        if any(img_src_lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
            score += 0.5

        # Bonus for having descriptive title
        title = result.get("title", "")
        if title and len(title) > 10:
            score += 0.3

        # Penalty for suspicious domains
        try:
            parsed_url = urlparse(img_src)
            domain = parsed_url.hostname or ""

            # Bonus for reputable image hosting services
            good_domains = [
                "imgur.com",
                "cloudinary.com",
                "amazonaws.com",
                "googleusercontent.com",
                "wikimedia.org",
                "unsplash.com",
                "pixabay.com",
                "pexels.com",
            ]

            if any(good_domain in domain for good_domain in good_domains):
                score += 0.5

            # Penalty for ad or tracking domains
            bad_domains = ["doubleclick", "googleadservices", "facebook.com/tr"]
            if any(bad_domain in domain for bad_domain in bad_domains):
                score -= 1.0

        except Exception:
            pass

        return max(0.0, score)  # Ensure score is not negative

    def _filter_and_rank_results_with_domain_matching(
        self, results: List[Dict[str, Any]], original_url: str
    ) -> List[Dict[str, Any]]:
        """Filter and rank image results with domain matching for consistency"""
        if not results:
            return []

        try:
            original_domain = urlparse(original_url).hostname or ""
        except Exception:
            original_domain = ""

        filtered_results = []

        for result in results:
            if self._is_valid_image_result(result):
                # Calculate base quality score
                quality_score = self._calculate_quality_score(result)

                # Add domain matching bonus
                img_src = result.get("img_src", "")
                try:
                    img_domain = urlparse(img_src).hostname or ""
                    if img_domain and original_domain:
                        # Exact domain match
                        if img_domain == original_domain:
                            quality_score += 2.0
                        # Subdomain match (e.g., cdn.example.com vs example.com)
                        elif original_domain in img_domain or img_domain in original_domain:
                            quality_score += 1.0
                        # Same root domain
                        elif self._same_root_domain(img_domain, original_domain):
                            quality_score += 0.5
                except Exception:
                    pass

                result["quality_score"] = quality_score
                filtered_results.append(result)

        # Sort by quality score (descending)
        filtered_results.sort(key=lambda x: x.get("quality_score", 0), reverse=True)

        return filtered_results

    def _same_root_domain(self, domain1: str, domain2: str) -> bool:
        """Check if two domains share the same root domain"""
        try:
            # Extract root domain (e.g., example.com from www.example.com)
            def get_root_domain(domain):
                parts = domain.split(".")
                if len(parts) >= 2:
                    return ".".join(parts[-2:])
                return domain

            root1 = get_root_domain(domain1)
            root2 = get_root_domain(domain2)
            return root1 == root2
        except Exception:
            return False

    async def _perform_link_search(self, query: str, count: int) -> List[Dict[str, Any]]:
        """Perform web link search request to SearXNG"""
        params = {
            "q": query,
            "format": "json",
            "categories": "general",
            "engines": "duckduckgo",
            "safesearch": "0",
        }
        search_url = f"{self.environment.SEARXNG_API_URL}/search"
        for attempt in range(self.environment.SEARXNG_MAX_RETRIES):
            try:
                async with httpx.AsyncClient(
                    timeout=self.environment.SEARXNG_REQUEST_TIMEOUT
                ) as client:
                    response = await client.get(search_url, params=params)
                    response.raise_for_status()
                    data = response.json()
                    results = data.get("results", [])
                    # Return more results for filtering
                    return results[: count * 2]

            except httpx.HTTPStatusError as e:
                self.logger.warning(f"HTTP error {e.response.status_code} on attempt {attempt + 1}")
                if e.response.status_code == 429:  # Rate limit
                    wait_time = (2**attempt) * 2
                    await asyncio.sleep(wait_time)
                    continue
                elif e.response.status_code in [404, 503]:
                    break  # Don't retry for these
            except Exception as e:
                self.logger.warning(
                    f"Link search request failed on attempt {attempt + 1}: {str(e)}"
                )
                if attempt < self.environment.SEARXNG_MAX_RETRIES - 1:
                    wait_time = (2**attempt) + 1
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    raise

        return []

    def _filter_and_rank_link_results(
        self, results: List[Dict[str, Any]], count: int
    ) -> List[Dict[str, Any]]:
        """Filter and rank link search results by relevance (80%) + quality (20%)"""
        if not results:
            return []

        filtered_results = []

        for i, result in enumerate(results):
            if self._is_valid_link_result(result):
                # Calculate relevance score based on SearXNG order (higher for earlier results)
                relevance_score = max(0, 5.0 - (i * 0.5))  # First result=5.0, second=4.5, etc.

                # Calculate quality score
                quality_score = self._calculate_link_quality_score(result)

                # Combined score: 80% relevance + 20% quality
                combined_score = (relevance_score * 0.8) + (quality_score * 0.2)

                result["relevance_score"] = relevance_score
                result["quality_score"] = quality_score
                result["combined_score"] = combined_score

                filtered_results.append(result)

        # Sort by combined score (descending)
        filtered_results.sort(key=lambda x: x.get("combined_score", 0), reverse=True)

        # Return top results
        return filtered_results[:count]

    def _is_valid_link_result(self, result: Dict[str, Any]) -> bool:
        """Check if a link result is valid and usable"""
        # Must have URL
        url = result.get("url", "")
        if not url or not url.startswith(("http://", "https://")):
            return False

        # Must have title or content
        title = result.get("title", "").strip()
        content = result.get("content", "").strip()

        if not title and not content:
            return False

        # Skip very short titles/content
        if title and len(title) < 10:
            return False

        # Skip spam/low-quality domains
        parsed_url = urlparse(url)
        domain = parsed_url.hostname or ""

        spam_domains = [
            "spam",
            "ads",
            "advertisement",
            "popup",
            "redirect",
            "click",
            "affiliate",
            "tracking",
        ]

        if any(spam_word in domain.lower() for spam_word in spam_domains):
            return False

        return True

    def _calculate_link_quality_score(self, result: Dict[str, Any]) -> float:
        """Calculate a quality score for ranking link results"""
        score = 0.0

        # Base score for having a link
        score += 1.0

        # Bonus for HTTPS
        url = result.get("url", "")
        if url.startswith("https://"):
            score += 0.5

        # Bonus for having descriptive title
        title = result.get("title", "")
        if title:
            title_len = len(title.strip())
            if title_len > 20:
                score += 1.0
            elif title_len > 10:
                score += 0.5

        # Bonus for having content/description
        content = result.get("content", "")
        if content:
            content_len = len(content.strip())
            if content_len > 100:
                score += 1.0
            elif content_len > 50:
                score += 0.5

        # Bonus for reputable domains
        parsed_url = urlparse(url)
        domain = parsed_url.hostname or ""

        reputable_domains = [
            "wikipedia.org",
            "github.com",
            "stackoverflow.com",
            "medium.com",
            "reddit.com",
            "news.ycombinator.com",
            "arxiv.org",
            "scholar.google.com",
        ]

        if any(good_domain in domain for good_domain in reputable_domains):
            score += 1.0

        # Penalty for suspicious patterns
        if any(pattern in url.lower() for pattern in ["?utm_", "&utm_", "affiliate"]):
            score -= 0.5

        return max(0.0, score)

    async def extract_metadata(self, url: str) -> Optional[LinkPreviewMetadata]:
        """
        Extract LinkPreviewMetadata from SearXNG search results

        Performs web search and image search to gather metadata,
        then formats results into LinkPreviewMetadata model.

        Args:
            url: URL to search and extract metadata for

        Returns:
            LinkPreviewMetadata if extraction succeeds, None otherwise
        """
        try:
            # 1. Search for links
            search_results = await self.search(url, count=3)

            if not search_results:
                self.logger.warning(f"No SearXNG results found for {url}")
                return None

            # 2. Use first (most relevant) result
            first_result = search_results[0]

            # 3. Extract basic metadata
            title = first_result.get("title", "").strip()
            description = first_result.get("content", "").strip()
            image_url = first_result.get("thumbnail") or first_result.get("thumbnail_src")

            # 4. Search for images if not found
            if not image_url:
                try:
                    image_results = await self.search_images(url, count=2)
                    for img_result in image_results:
                        img_src = img_result.get("img_src")
                        if img_src:
                            image_url = img_src
                            break
                except Exception as img_error:
                    self.logger.debug(f"Image search failed for {url}: {str(img_error)}")

            # 5. Extract site name from URL
            site_name = self._extract_site_name(url)

            # 6. Create and return LinkPreviewMetadata
            link_preview = LinkPreviewMetadata(
                title=title if title else None,
                description=description[:1000] if description else None,
                img_url=image_url,
                site_name=site_name,
            )

            self.logger.debug(f"Successfully extracted metadata from SearXNG for {url}")
            return link_preview

        except Exception as e:
            self.logger.error(f"Error extracting metadata from SearXNG for {url}: {str(e)}")
            return None

    def _extract_site_name(self, url: str) -> Optional[str]:
        """
        Extract site name from URL

        Args:
            url: URL to parse

        Returns:
            Capitalized site name or None
        """
        try:
            parsed = urlparse(url)
            if parsed.hostname:
                # Remove www. and common subdomains
                hostname = parsed.hostname.replace("www.", "")
                site_name = hostname.split(".")[0].capitalize()
                return site_name
        except Exception:
            pass
        return None
