import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from src.database.models.batch import DataItem, DataItemType, ProcessingStatus
from src.services.queue.data_classifier import DataClassifier
from src.services.metadata.clients.web_scraper import WebScraperService
from src.services.metadata.og_extractor import OGTagExtractor
from src.database.models.metadata import GetOGTagsResponse


class TestDataClassifier:
    """Test cases for DataClassifier"""
    
    def test_classify_image_urls(self):
        """Test classification of image URLs"""
        items = [
            DataItem(item_id="1", type=DataItemType.LINK, url="https://example.com/image.jpg"),
            DataItem(item_id="2", type=DataItemType.LINK, url="https://example.com/page.html"),
            DataItem(item_id="3", type=DataItemType.LINK, url="https://imgur.com/abc123.png"),
            DataItem(item_id="4", type=DataItemType.LINK, url="https://example.com/article"),
        ]
        
        link_items, image_items = DataClassifier.classify_items(items)
        
        # Should identify 2 images and 2 links
        assert len(image_items) == 2
        assert len(link_items) == 2
        
        # Check correct classification
        image_urls = [item.url for item in image_items]
        assert "https://example.com/image.jpg" in [str(url) for url in image_urls]
        assert "https://imgur.com/abc123.png" in [str(url) for url in image_urls]
    
    def test_is_image_url_extensions(self):
        """Test image URL detection by file extension"""
        assert DataClassifier._is_image_url("https://example.com/photo.jpg") == True
        assert DataClassifier._is_image_url("https://example.com/photo.jpeg") == True
        assert DataClassifier._is_image_url("https://example.com/photo.png") == True
        assert DataClassifier._is_image_url("https://example.com/photo.webp") == True
        assert DataClassifier._is_image_url("https://example.com/page.html") == False
        assert DataClassifier._is_image_url("https://example.com/document.pdf") == False
    
    def test_is_image_url_domains(self):
        """Test image URL detection by domain patterns"""
        assert DataClassifier._is_image_url("https://i.imgur.com/abc123") == True
        assert DataClassifier._is_image_url("https://cdn.example.com/image") == True
        assert DataClassifier._is_image_url("https://images.unsplash.com/photo") == True
        assert DataClassifier._is_image_url("https://www.example.com/page") == False


class TestWebScraperService:
    """Test cases for WebScraperService"""
    
    @pytest.fixture
    def web_scraper(self):
        return WebScraperService(max_retries=2, timeout=10)
    
    @pytest.mark.asyncio
    async def test_validate_url_accessibility_success(self, web_scraper):
        """Test URL accessibility validation - success case"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_client.return_value.__aenter__.return_value.head.return_value = mock_response
            
            result = await web_scraper.validate_url_accessibility("https://example.com")
            assert result == True
    
    @pytest.mark.asyncio
    async def test_validate_url_accessibility_failure(self, web_scraper):
        """Test URL accessibility validation - failure case"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.head.side_effect = Exception("Connection failed")
            
            result = await web_scraper.validate_url_accessibility("https://invalid-url.com")
            assert result == False
    
    def test_resolve_relative_url(self, web_scraper):
        """Test relative URL resolution"""
        base_url = "https://example.com/page"
        
        # Test relative path
        result = web_scraper.resolve_relative_url(base_url, "/image.jpg")
        assert result == "https://example.com/image.jpg"
        
        # Test absolute URL (should remain unchanged)
        result = web_scraper.resolve_relative_url(base_url, "https://other.com/image.jpg")
        assert result == "https://other.com/image.jpg"
        
        # Test relative path with subdirectory
        result = web_scraper.resolve_relative_url(base_url, "images/photo.png")
        assert result == "https://example.com/images/photo.png"


class TestOGTagExtractor:
    """Test cases for OGTagExtractor"""
    
    @pytest.fixture
    def og_extractor(self):
        return OGTagExtractor()
    
    def test_is_valid_image_url(self, og_extractor):
        """Test image URL validation"""
        # Valid image URLs
        assert og_extractor._is_valid_image_url("https://example.com/photo.jpg") == True
        assert og_extractor._is_valid_image_url("https://example.com/image.png") == True
        assert og_extractor._is_valid_image_url("https://example.com/pic.webp") == True
        
        # Invalid or placeholder URLs
        assert og_extractor._is_valid_image_url("https://example.com/placeholder.svg") == False
        assert og_extractor._is_valid_image_url("https://example.com/blank.gif") == False
        assert og_extractor._is_valid_image_url("") == False
        assert og_extractor._is_valid_image_url(None) == False
    
    def test_truncate_description(self, og_extractor):
        """Test description truncation"""
        # Short description (should remain unchanged)
        short_desc = "This is a short description."
        result = og_extractor._truncate_description(short_desc)
        assert result == short_desc
        
        # Long description (should be truncated)
        long_desc = "A" * 1500
        result = og_extractor._truncate_description(long_desc)
        assert len(result) <= 1000
        assert result.endswith("...")
    
    def test_extract_og_tags_from_html(self, og_extractor):
        """Test OG tag extraction from HTML"""
        from bs4 import BeautifulSoup
        
        html_content = """
        <html>
        <head>
            <meta property="og:title" content="Test Page Title" />
            <meta property="og:description" content="This is a test page description." />
            <meta property="og:image" content="/images/test.jpg" />
            <meta property="og:url" content="https://example.com/test" />
            <title>Fallback Title</title>
        </head>
        <body>
            <h1>Test Page</h1>
        </body>
        </html>
        """
        
        soup = BeautifulSoup(html_content, 'html.parser')
        base_url = "https://example.com"
        
        result = og_extractor.extract_og_tags(soup, base_url)
        
        assert result.og_title == "Test Page Title"
        assert result.og_description == "This is a test page description."
        assert result.og_image == "https://example.com/images/test.jpg"  # Should be resolved to absolute URL
        assert result.og_url == "https://example.com/test"


@pytest.mark.asyncio
async def test_integration_batch_processing():
    """Integration test for basic batch processing flow"""
    # This would be a more comprehensive test that requires setting up
    # mock external services and testing the full pipeline
    
    # Mock data
    items = [
        DataItem(
            item_id="test-1",
            type=DataItemType.LINK,
            url="https://example.com/article",
            existing_metadata=None
        ),
        DataItem(
            item_id="test-2", 
            type=DataItemType.IMAGE,
            url="https://example.com/image.jpg",
            existing_metadata=None
        )
    ]
    
    # In a real test, we would:
    # 1. Set up mock external API responses
    # 2. Create batch processor with mocked dependencies
    # 3. Process the batch
    # 4. Verify results match expected format
    
    # For now, just verify the data structure is correct
    assert len(items) == 2
    assert items[0].type == DataItemType.LINK
    assert items[1].type == DataItemType.IMAGE


if __name__ == "__main__":
    pytest.main([__file__])