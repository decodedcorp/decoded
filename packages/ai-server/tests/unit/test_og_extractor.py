import pytest
from unittest.mock import Mock, patch
from bs4 import BeautifulSoup
from src.services.metadata.extractors.og_extractor import OGTagExtractor
from src.database.models.metadata import GetOGTagsResponse


class TestOGTagExtractor:
    """Unit tests for OGTagExtractor"""

    @pytest.fixture
    def og_extractor(self):
        return OGTagExtractor()

    def test_extract_complete_og_tags(self, og_extractor):
        """Test extraction of complete OG tags"""
        html = '''
        <html>
        <head>
            <meta property="og:title" content="Test Page Title" />
            <meta property="og:description" content="This is a test page description." />
            <meta property="og:image" content="/images/test.jpg" />
            <meta property="og:site_name" content="Example Site" />
            <meta property="og:url" content="https://example.com/page" />
            <meta property="og:type" content="article" />
        </head>
        </html>
        '''
        
        soup = BeautifulSoup(html, 'html.parser')
        result = og_extractor.extract_og_tags(soup, "https://example.com")
        
        assert result.og_title == "Test Page Title"
        assert result.og_description == "This is a test page description."
        assert result.og_image == "https://example.com/images/test.jpg"  # Should be resolved to absolute
        assert result.og_site_name == "Example Site"
        assert result.og_url == "https://example.com/page"
        assert result.og_type == "article"

    def test_extract_og_tags_with_fallbacks(self, og_extractor):
        """Test OG tag extraction with fallback to standard meta tags"""
        html = '''
        <html>
        <head>
            <title>Fallback Title</title>
            <meta name="description" content="Fallback description from meta tag." />
            <meta property="og:image" content="https://example.com/image.jpg" />
        </head>
        <body>
            <img src="/photo.jpg" alt="First image" />
        </body>
        </html>
        '''
        
        soup = BeautifulSoup(html, 'html.parser')
        result = og_extractor.extract_og_tags(soup, "https://example.com")
        
        assert result.og_title == "Fallback Title"  # From title tag
        assert result.og_description == "Fallback description from meta tag."  # From meta description
        assert result.og_image == "https://example.com/image.jpg"  # From og:image
        assert result.og_url == "https://example.com"  # Default to base URL

    def test_extract_og_tags_with_image_fallback(self, og_extractor):
        """Test image fallback when og:image is missing"""
        html = '''
        <html>
        <head>
            <meta property="og:title" content="Test Title" />
        </head>
        <body>
            <img src="photo1.jpg" alt="First photo" />
            <img src="photo2.png" alt="Second photo" />
        </body>
        </html>
        '''
        
        soup = BeautifulSoup(html, 'html.parser')
        result = og_extractor.extract_og_tags(soup, "https://example.com")
        
        assert result.og_title == "Test Title"
        assert result.og_image in ["https://example.com/photo1.jpg", "https://example.com/photo2.png"]

    def test_extract_og_tags_with_srcset_fallback(self, og_extractor):
        """Test image fallback using srcset attribute"""
        html = '''
        <html>
        <head>
            <meta property="og:title" content="Test Title" />
        </head>
        <body>
            <img srcset="small.jpg 300w, medium.jpg 600w, large.jpg 1200w" alt="Response image" />
        </body>
        </html>
        '''
        
        soup = BeautifulSoup(html, 'html.parser')
        result = og_extractor.extract_og_tags(soup, "https://example.com")
        
        assert result.og_title == "Test Title"
        # Should pick the highest resolution image
        assert "large.jpg" in result.og_image

    def test_is_valid_image_url(self, og_extractor):
        """Test image URL validation"""
        valid_urls = [
            "https://example.com/photo.jpg",
            "https://example.com/image.png",
            "http://example.com/pic.webp",
            "https://example.com/image?format=jpg",
            "https://example.com/image?width=500&height=300",
        ]
        
        invalid_urls = [
            "",
            None,
            "https://example.com/placeholder.svg",
            "https://example.com/blank.gif",
            "https://example.com/spacer.png",
            "https://example.com/icon.ico",
            "https://example.com/logo.png",
        ]
        
        for url in valid_urls:
            assert og_extractor._is_valid_image_url(url) == True, f"Should be valid: {url}"
        
        for url in invalid_urls:
            assert og_extractor._is_valid_image_url(url) == False, f"Should be invalid: {url}"

    def test_get_best_image_src_with_srcset(self, og_extractor):
        """Test getting best image source from srcset"""
        html = '<img srcset="small.jpg 300w, medium.jpg 600w, large.jpg 1200w" />'
        soup = BeautifulSoup(html, 'html.parser')
        img_tag = soup.find('img')
        
        result = og_extractor._get_best_image_src(img_tag)
        
        # Should return the highest resolution image
        assert result == "large.jpg"

    def test_get_best_image_src_fallback_to_src(self, og_extractor):
        """Test fallback to src attribute when srcset is not available"""
        html = '<img src="photo.jpg" alt="Photo" />'
        soup = BeautifulSoup(html, 'html.parser')
        img_tag = soup.find('img')
        
        result = og_extractor._get_best_image_src(img_tag)
        
        assert result == "photo.jpg"

    def test_resolve_relative_urls(self, og_extractor):
        """Test resolution of relative URLs to absolute URLs"""
        test_cases = [
            ("https://example.com", "/image.jpg", "https://example.com/image.jpg"),
            ("https://example.com/page", "../image.png", "https://example.com/image.png"),
            ("https://example.com", "https://other.com/image.gif", "https://other.com/image.gif"),
            ("https://example.com", "", ""),
        ]
        
        for base_url, relative_url, expected in test_cases:
            og_data = {"image": relative_url} if relative_url else {}
            result = og_extractor._resolve_urls(og_data, base_url)
            
            if relative_url:
                assert result.get("image") == expected
            else:
                assert "image" not in result

    def test_truncate_description(self, og_extractor):
        """Test description truncation"""
        # Short description should remain unchanged
        short_desc = "This is a short description."
        result = og_extractor._truncate_description(short_desc)
        assert result == short_desc
        
        # Long description should be truncated
        long_desc = "A" * 1500
        result = og_extractor._truncate_description(long_desc)
        assert len(result) <= 1000
        assert result.endswith("...")
        
        # Description with sentence boundary should truncate at sentence
        sentence_desc = "First sentence. " + "A" * 900 + ". Last sentence." + "B" * 200
        result = og_extractor._truncate_description(sentence_desc)
        assert len(result) <= 1000
        assert result.endswith(".")

    def test_clean_and_validate_data(self, og_extractor):
        """Test data cleaning and validation"""
        dirty_data = {
            "title": "  Title with extra spaces  ",
            "description": "Description\nwith\nnewlines\t\tand\ttabs",
            "image": " https://example.com/image.jpg ",
            "empty_field": "",
            "none_field": None,
        }
        
        cleaned = og_extractor._clean_and_validate(dirty_data)
        
        assert cleaned["title"] == "Title with extra spaces"
        assert "Description with newlines and tabs" in cleaned["description"]
        assert cleaned["image"] == "https://example.com/image.jpg"
        assert "empty_field" not in cleaned
        assert "none_field" not in cleaned

    def test_extract_og_tags_minimal_html(self, og_extractor):
        """Test extraction from minimal HTML"""
        html = '<html><head><title>Minimal</title></head></html>'
        soup = BeautifulSoup(html, 'html.parser')
        result = og_extractor.extract_og_tags(soup, "https://example.com")
        
        assert result.og_title == "Minimal"
        assert result.og_url == "https://example.com"
        assert result.og_image is None
        assert result.og_description is None

    def test_extract_og_tags_no_html(self, og_extractor):
        """Test extraction from empty or invalid HTML"""
        empty_html = ""
        soup = BeautifulSoup(empty_html, 'html.parser')
        result = og_extractor.extract_og_tags(soup, "https://example.com")
        
        assert result.og_url == "https://example.com"
        assert result.og_title is None
        assert result.og_description is None
        assert result.og_image is None

    def test_find_best_image_priority_order(self, og_extractor):
        """Test image selection priority order"""
        html = '''
        <html>
        <body>
            <img src="generic.jpg" alt="Generic" />
            <img class="hero" src="hero.jpg" alt="Hero image" />
            <img src="another.jpg" alt="Another" />
        </body>
        </html>
        '''
        
        soup = BeautifulSoup(html, 'html.parser')
        result = og_extractor._find_best_image(soup)
        
        # Should prefer the hero image due to class name
        assert "hero.jpg" in result

    @patch('src.services.metadata.og_extractor.clean_text')
    def test_extract_og_tags_with_text_cleaning(self, mock_clean_text, og_extractor):
        """Test that text cleaning is applied to extracted content"""
        mock_clean_text.side_effect = lambda x: x.strip().upper()  # Mock cleaning function
        
        html = '''
        <html>
        <head>
            <meta property="og:title" content="  test title  " />
            <meta property="og:description" content="  test description  " />
        </head>
        </html>
        '''
        
        soup = BeautifulSoup(html, 'html.parser')
        result = og_extractor.extract_og_tags(soup, "https://example.com")
        
        # Verify clean_text was called
        assert mock_clean_text.call_count >= 2
        assert result.og_title == "TEST TITLE"
        assert result.og_description == "TEST DESCRIPTION"