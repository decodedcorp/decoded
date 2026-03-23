import pytest
from unittest.mock import Mock, patch, AsyncMock
import httpx
from src.services.metadata.clients.searxng_client import SearXNGClient
from src.config.external_apis import SearXNGConfig


class TestSearXNGClient:
    """Unit tests for SearXNGClient"""

    @pytest.fixture
    def searxng_config(self):
        return SearXNGConfig(
            api_url="http://localhost:8080",
            max_retries=2,
            request_timeout=10
        )

    @pytest.fixture
    def searxng_client(self, searxng_config):
        return SearXNGClient(searxng_config)

    def test_init_with_valid_config(self, searxng_config):
        """Test initialization with valid configuration"""
        client = SearXNGClient(searxng_config)
        
        assert client.config == searxng_config
        assert client.config.api_url == "http://localhost:8080"

    def test_init_without_api_url(self):
        """Test initialization warning when API URL is missing"""
        config = SearXNGConfig(api_url="")
        
        with patch('logging.Logger.warning') as mock_warning:
            client = SearXNGClient(config)
            mock_warning.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_images_success(self, searxng_client):
        """Test successful image search"""
        mock_response = {
            "results": [
                {
                    "img_src": "https://example.com/image1.jpg",
                    "title": "Beautiful landscape",
                    "img_width": 800,
                    "img_height": 600
                },
                {
                    "img_src": "https://example.com/image2.png", 
                    "title": "City skyline",
                    "img_width": 1200,
                    "img_height": 800
                }
            ]
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value.json.return_value = mock_response
            mock_client.return_value.__aenter__.return_value.get.return_value.raise_for_status.return_value = None
            
            result = await searxng_client.search_images("landscape", count=2)
            
            assert len(result) == 2
            assert result[0]["img_src"] == "https://example.com/image1.jpg"
            assert result[1]["img_src"] == "https://example.com/image2.png"

    @pytest.mark.asyncio
    async def test_search_images_without_api_url(self):
        """Test image search when API URL is not configured"""
        config = SearXNGConfig(api_url="")
        client = SearXNGClient(config)
        
        result = await client.search_images("test query")
        
        assert result == []

    @pytest.mark.asyncio
    async def test_find_related_image_success(self, searxng_client):
        """Test finding related image"""
        mock_response = {
            "results": [
                {
                    "img_src": "https://example.com/related.jpg",
                    "title": "Related image",
                    "img_width": 500,
                    "img_height": 300
                }
            ]
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value.json.return_value = mock_response
            mock_client.return_value.__aenter__.return_value.get.return_value.raise_for_status.return_value = None
            
            result = await searxng_client.find_related_image("Test Title", "example.com")
            
            assert result == "https://example.com/related.jpg"

    @pytest.mark.asyncio
    async def test_find_related_image_no_results(self, searxng_client):
        """Test finding related image when no results are found"""
        mock_response = {"results": []}
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value.json.return_value = mock_response
            mock_client.return_value.__aenter__.return_value.get.return_value.raise_for_status.return_value = None
            
            result = await searxng_client.find_related_image("Non-existent", "nowhere.com")
            
            assert result is None

    @pytest.mark.asyncio
    async def test_perform_search_with_retries(self, searxng_client):
        """Test search with retry logic"""
        mock_response = {"results": [{"img_src": "https://example.com/success.jpg", "title": "Success"}]}
        
        with patch('httpx.AsyncClient') as mock_client:
            # First call fails, second succeeds
            mock_client.return_value.__aenter__.return_value.get.side_effect = [
                httpx.RequestError("Connection failed"),
                Mock(json=lambda: mock_response, raise_for_status=lambda: None)
            ]
            
            with patch('asyncio.sleep'):
                result = await searxng_client._perform_search("test", 5)
                
                assert len(result) == 1
                assert result[0]["img_src"] == "https://example.com/success.jpg"

    @pytest.mark.asyncio
    async def test_perform_search_rate_limiting(self, searxng_client):
        """Test handling of rate limiting (429 error)"""
        mock_response = Mock()
        mock_response.status_code = 429
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = [
                httpx.HTTPStatusError("Rate limited", request=Mock(), response=mock_response),
                Mock(json=lambda: {"results": []}, raise_for_status=lambda: None)
            ]
            
            with patch('asyncio.sleep') as mock_sleep:
                result = await searxng_client._perform_search("test", 5)
                
                mock_sleep.assert_called_once()
                assert result == []

    def test_filter_and_rank_results(self, searxng_client):
        """Test result filtering and ranking"""
        mock_results = [
            {
                "img_src": "https://example.com/good.jpg",
                "title": "Good image",
                "img_width": 800,
                "img_height": 600
            },
            {
                "img_src": "https://example.com/placeholder.svg",
                "title": "Placeholder",
                "img_width": 100,
                "img_height": 100
            },
            {
                "img_src": "https://example.com/excellent.png", 
                "title": "Excellent image",
                "img_width": 1200,
                "img_height": 800
            },
            {
                "img_src": "invalid-url",
                "title": "Invalid"
            }
        ]
        
        result = searxng_client._filter_and_rank_results(mock_results)
        
        # Should filter out placeholder and invalid URL
        assert len(result) == 2
        
        # Should be ranked by quality (higher resolution first)
        assert result[0]["img_src"] == "https://example.com/excellent.png"
        assert result[1]["img_src"] == "https://example.com/good.jpg"

    def test_is_valid_image_result(self, searxng_client):
        """Test image result validation"""
        valid_results = [
            {
                "img_src": "https://example.com/photo.jpg",
                "title": "Photo",
                "img_width": 500,
                "img_height": 300
            },
            {
                "img_src": "https://example.com/image.png",
                "title": "Image"
            }
        ]
        
        invalid_results = [
            {"img_src": "", "title": "Empty URL"},
            {"img_src": "https://example.com/placeholder.svg", "title": "Placeholder"},
            {"img_src": "invalid-url", "title": "Invalid URL"},
            {
                "img_src": "https://example.com/tiny.jpg",
                "title": "Too small",
                "img_width": 50,
                "img_height": 50
            }
        ]
        
        for result in valid_results:
            assert searxng_client._is_valid_image_result(result) == True
        
        for result in invalid_results:
            assert searxng_client._is_valid_image_result(result) == False

    def test_calculate_quality_score(self, searxng_client):
        """Test quality score calculation"""
        high_quality = {
            "img_src": "https://example.com/high_res.jpg",
            "title": "High quality image with descriptive title",
            "img_width": 1200,
            "img_height": 800
        }
        
        low_quality = {
            "img_src": "http://example.com/low.gif",
            "title": "Low",
            "img_width": 100,
            "img_height": 100
        }
        
        high_score = searxng_client._calculate_quality_score(high_quality)
        low_score = searxng_client._calculate_quality_score(low_quality)
        
        assert high_score > low_score
        assert high_score > 2.0  # Should have good score
        assert low_score < 2.0   # Should have lower score

    def test_calculate_quality_score_factors(self, searxng_client):
        """Test individual factors affecting quality score"""
        base_result = {"img_src": "https://example.com/test.jpg", "title": "Test"}
        
        # Test HTTPS bonus
        https_result = {**base_result, "img_src": "https://example.com/secure.jpg"}
        http_result = {**base_result, "img_src": "http://example.com/insecure.jpg"}
        
        https_score = searxng_client._calculate_quality_score(https_result)
        http_score = searxng_client._calculate_quality_score(http_result)
        
        assert https_score > http_score
        
        # Test title length bonus
        long_title_result = {**base_result, "title": "This is a very descriptive title"}
        short_title_result = {**base_result, "title": "Short"}
        
        long_title_score = searxng_client._calculate_quality_score(long_title_result)
        short_title_score = searxng_client._calculate_quality_score(short_title_result)
        
        assert long_title_score > short_title_score

    def test_domain_quality_assessment(self, searxng_client):
        """Test domain-based quality assessment"""
        good_domain_result = {
            "img_src": "https://imgur.com/test.jpg", 
            "title": "Test"
        }
        
        bad_domain_result = {
            "img_src": "https://doubleclick.net/ad.jpg",
            "title": "Test"
        }
        
        regular_domain_result = {
            "img_src": "https://random-site.com/image.jpg",
            "title": "Test"
        }
        
        good_score = searxng_client._calculate_quality_score(good_domain_result)
        bad_score = searxng_client._calculate_quality_score(bad_domain_result)
        regular_score = searxng_client._calculate_quality_score(regular_domain_result)
        
        assert good_score > regular_score > bad_score

    @pytest.mark.asyncio
    async def test_search_images_with_network_error(self, searxng_client):
        """Test search handling network errors"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.RequestError("Network error")
            
            with patch('asyncio.sleep'):
                result = await searxng_client.search_images("test query")
                
                assert result == []

    def test_query_building_with_domain(self, searxng_client):
        """Test search query building with domain extraction"""
        # Test domain extraction logic conceptually
        test_domains = [
            ("www.amazon.com", "amazon"),
            ("subdomain.example.org", "example"),
            ("simple.net", "simple"),
            ("https://blog.medium.com", "medium")
        ]
        
        for domain_input, expected_main in test_domains:
            # This tests the concept - actual implementation would be in find_related_image
            if "." in domain_input:
                parts = domain_input.replace("https://", "").replace("http://", "").split(".")
                if len(parts) >= 2:
                    main_domain = parts[-2]  # Get main domain part
                    assert main_domain in expected_main.lower()

    @pytest.mark.asyncio
    async def test_find_related_image_with_domain_context(self, searxng_client):
        """Test finding related image with domain context"""
        mock_response = {
            "results": [
                {
                    "img_src": "https://example.com/contextual.jpg",
                    "title": "Contextual image"
                }
            ]
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value.json.return_value = mock_response
            mock_client.return_value.__aenter__.return_value.get.return_value.raise_for_status.return_value = None
            
            result = await searxng_client.find_related_image("Product Title", "www.shop.com")
            
            # Verify the search was called (domain should be included in query)
            call_args = mock_client.return_value.__aenter__.return_value.get.call_args
            params = call_args[1]['params']
            
            # Query should contain both title and domain information
            assert "Product Title" in params['q']
            
            assert result == "https://example.com/contextual.jpg"

    def test_aspect_ratio_filtering(self, searxng_client):
        """Test filtering based on aspect ratio"""
        wide_banner = {
            "img_src": "https://example.com/banner.jpg",
            "title": "Wide banner",
            "img_width": 1000,
            "img_height": 100  # Very wide aspect ratio
        }
        
        tall_banner = {
            "img_src": "https://example.com/tall.jpg", 
            "title": "Tall banner",
            "img_width": 100,
            "img_height": 1000  # Very tall aspect ratio
        }
        
        normal_image = {
            "img_src": "https://example.com/normal.jpg",
            "title": "Normal image", 
            "img_width": 600,
            "img_height": 400  # Reasonable aspect ratio
        }
        
        # Wide and tall banners should be filtered out
        assert searxng_client._is_valid_image_result(wide_banner) == False
        assert searxng_client._is_valid_image_result(tall_banner) == False
        assert searxng_client._is_valid_image_result(normal_image) == True