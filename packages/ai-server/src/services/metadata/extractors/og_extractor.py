from bs4 import BeautifulSoup
from typing import Dict, Optional, Any
import logging
from urllib.parse import urljoin
from src.utils.text_utils import clean_text
from src.database.models.metadata import GetOGTagsResponse
from src.database.models.content import LinkPreviewMetadata


class OGTagExtractor:
    """Enhanced Open Graph tag extractor with fallback mechanisms"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def extract(self, soup: BeautifulSoup, base_url: str) -> LinkPreviewMetadata:
        """
        Extract link preview metadata from BeautifulSoup object
        
        Args:
            soup: BeautifulSoup object of the page
            base_url: Base URL for resolving relative URLs
            
        Returns:
            LinkPreviewMetadata with extracted metadata
        """
        try:
            og_data = {}
            
            # Extract primary OG tags
            og_data = self._extract_primary_og_tags(soup)
            
            # Apply fallbacks for missing data
            og_data = self._apply_fallbacks(soup, og_data)
            
            # Resolve relative URLs to absolute
            og_data = self._resolve_urls(og_data, base_url)
            
            # Clean and validate data
            og_data = self._clean_and_validate(og_data)
            
            return LinkPreviewMetadata(
                title=og_data.get("title"),
                description=og_data.get("description"),
                img_url=og_data.get("image"),
                site_name=og_data.get("site_name")
            )
            
        except Exception as e:
            self.logger.error(f"Error extracting link preview metadata: {str(e)}")
            return LinkPreviewMetadata()
    
    def _extract_primary_og_tags(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract primary Open Graph tags"""
        og_data = {}
        
        # Find all meta tags with og: property
        meta_tags = soup.find_all("meta", property=lambda x: x and x.startswith("og:"))
        for tag in meta_tags:
            property_name = tag.get("property")
            if property_name:
                key = property_name[3:]  # Remove 'og:' prefix
                content = tag.get("content", "")
                if content:
                    og_data[key] = clean_text(content)

        all_meta_tags = soup.find_all("meta")
        for tag in all_meta_tags:
            name_attr = tag.get("name")
            if name_attr and name_attr.startswith("og:"):
                key = name_attr[3:]  # Remove 'og:' prefix
                content = tag.get("content", "")
                # For image, check if it's missing in og_data; for others, only use if not already set
                if content:
                    if key == "image" and "image" not in og_data:
                        og_data[key] = clean_text(content)
                    elif key not in og_data:
                        og_data[key] = clean_text(content)
        
        return og_data
    
    def _apply_fallbacks(self, soup: BeautifulSoup, og_data: Dict[str, str]) -> Dict[str, str]:
        """Apply fallback mechanisms for missing OG data"""
        
        # Title fallbacks
        if not og_data.get("title"):
            # Try standard title tag
            title_tag = soup.find("title")
            if title_tag and title_tag.text:
                og_data["title"] = clean_text(title_tag.text)
            else:
                # Try h1 tag
                h1_tag = soup.find("h1")
                if h1_tag and h1_tag.text:
                    og_data["title"] = clean_text(h1_tag.text)
        
        # Description fallbacks
        if not og_data.get("description"):
            # Try meta description
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc:
                description = clean_text(meta_desc.get("content", ""))
                if description:
                    og_data["description"] = self._truncate_description(description)
            else:
                # Try first paragraph
                first_p = soup.find("p")
                if first_p and first_p.text:
                    description = clean_text(first_p.text)
                    if len(description) > 50:  # Only use if substantial
                        og_data["description"] = self._truncate_description(description)
        
        # Image fallbacks
        if not og_data.get("image"):
            og_data["image"] = self._find_best_image(soup)
        
        # Site name fallbacks
        if not og_data.get("site_name"):
            # Try application-name meta tag
            app_name = soup.find("meta", attrs={"name": "application-name"})
            if app_name:
                og_data["site_name"] = clean_text(app_name.get("content", ""))
        
        return og_data
    
    def _find_best_image(self, soup: BeautifulSoup) -> Optional[str]:
        """Find the best image to use as og:image fallback"""
        
        # Priority order for image selection
        image_selectors = [
            # High priority - likely to be main images
            'img[class*="hero"]',
            'img[class*="main"]',
            'img[class*="featured"]',
            'img[class*="banner"]',
            'img[class*="product"]',
            # Medium priority - structural images
            'article img:first-of-type',
            'main img:first-of-type',
            '.content img:first-of-type',
            # Lower priority - any image with good attributes
            'img[alt]',
            'img[src]'
        ]
        
        for selector in image_selectors:
            try:
                img = soup.select_one(selector)
                if img:
                    src = self._get_best_image_src(img)
                    if src and self._is_valid_image_url(src):
                        return clean_text(src)
            except Exception:
                continue
        
        return None
    
    def _get_best_image_src(self, img_tag) -> Optional[str]:
        """Get the best source URL from an img tag"""
        
        # Try srcset first (usually higher quality)
        srcset = img_tag.get("srcset", "")
        if srcset:
            # Parse srcset and get the highest resolution image
            sources = []
            for src_desc in srcset.split(","):
                parts = src_desc.strip().split()
                if parts:
                    url = parts[0]
                    if not url.endswith("placeholder.svg") and self._is_valid_image_url(url):
                        # Extract width if available
                        width = 0
                        if len(parts) > 1 and parts[1].endswith('w'):
                            try:
                                width = int(parts[1][:-1])
                            except ValueError:
                                pass
                        sources.append((url, width))
            
            # Return highest resolution source
            if sources:
                return max(sources, key=lambda x: x[1])[0]
        
        # Fallback to src attribute
        src = img_tag.get("src", "")
        if src and not src.endswith("placeholder.svg") and self._is_valid_image_url(src):
            return src
        
        return None
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL appears to be a valid image"""
        if not url:
            return False
        
        url_lower = url.lower()
        
        # Skip common non-image patterns
        skip_patterns = [
            "placeholder", "blank", "spacer", "dot.gif", "pixel.gif",
            "icon", "logo", "avatar", "thumbnail"
        ]
        
        if any(pattern in url_lower for pattern in skip_patterns):
            return False
        
        # Check for image extensions
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
        if any(url_lower.endswith(ext) for ext in image_extensions):
            return True
        
        # Check for image-related query parameters
        if 'format=' in url_lower or 'width=' in url_lower or 'height=' in url_lower:
            return True
        
        return False
    
    def _resolve_urls(self, og_data: Dict[str, str], base_url: str) -> Dict[str, str]:
        """Resolve relative URLs to absolute URLs"""
        url_fields = ["image", "url"]
        
        for field in url_fields:
            if field in og_data and og_data[field]:
                try:
                    og_data[field] = urljoin(base_url, og_data[field])
                except Exception:
                    pass
        
        return og_data
    
    def _clean_and_validate(self, og_data: Dict[str, str]) -> Dict[str, str]:
        """Clean and validate extracted data"""
        cleaned_data = {}
        
        for key, value in og_data.items():
            if value:
                cleaned_value = clean_text(value)
                if cleaned_value:
                    # Apply field-specific validation
                    if key == "description":
                        cleaned_value = self._truncate_description(cleaned_value)
                    elif key == "title" and len(cleaned_value) > 200:
                        cleaned_value = cleaned_value[:197] + "..."
                    
                    cleaned_data[key] = cleaned_value
        
        return cleaned_data
    
    def _truncate_description(self, description: str) -> str:
        """Truncate description to reasonable length"""
        max_length = 1000
        if len(description) > max_length:
            # Try to truncate at sentence boundary
            truncated = description[:max_length]
            last_period = truncated.rfind('.')
            if last_period > max_length * 0.8:  # If period is reasonably close to end
                return truncated[:last_period + 1]
            else:
                return truncated[:max_length - 3] + "..."
        return description