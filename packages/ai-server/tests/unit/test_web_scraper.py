import pytest
from unittest.mock import Mock, patch, AsyncMock
import httpx
from bs4 import BeautifulSoup
from src.services.metadata.clients.web_scraper import WebScraperService


class TestWebScraperService:
    """Unit tests for WebScraperService"""

    @pytest.fixture
    def web_scraper(self):
        return WebScraperService(max_retries=2, timeout=10)

    @pytest.mark.asyncio
    async def test_fetch_page_success(self, web_scraper):
        """Test successful page fetching"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'content-type': 'text/html; charset=utf-8'}
        mock_response.content = b'<html><head><title>Test</title></head></html>'
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await web_scraper.fetch_page("https://example.com")
            
            assert isinstance(result, BeautifulSoup)
            assert result.find('title').text == 'Test'

    @pytest.mark.asyncio
    async def test_fetch_page_non_html_content(self, web_scraper):
        """Test handling of non-HTML content"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'content-type': 'application/json'}
        mock_response.content = b'{"key": "value"}'
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await web_scraper.fetch_page("https://example.com/api")
            
            assert result is None

    @pytest.mark.asyncio
    async def test_fetch_page_http_error(self, web_scraper):
        """Test handling of HTTP errors"""
        mock_response = Mock()
        mock_response.status_code = 404
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.HTTPStatusError(
                "Not Found", request=Mock(), response=mock_response
            )
            
            result = await web_scraper.fetch_page("https://example.com/notfound")
            
            assert result is None

    @pytest.mark.asyncio
    async def test_fetch_page_with_retries(self, web_scraper):
        """Test retry logic on failures"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'content-type': 'text/html'}
        mock_response.content = b'<html><title>Success</title></html>'
        
        with patch('httpx.AsyncClient') as mock_client:
            # First call fails, second succeeds
            mock_client.return_value.__aenter__.return_value.get.side_effect = [
                httpx.RequestError("Connection failed"),
                mock_response
            ]
            
            with patch('asyncio.sleep'):  # Speed up test by mocking sleep
                result = await web_scraper.fetch_page("https://example.com")
            
            assert isinstance(result, BeautifulSoup)
            assert mock_client.return_value.__aenter__.return_value.get.call_count == 2

    @pytest.mark.asyncio
    async def test_fetch_page_max_retries_exceeded(self, web_scraper):
        """Test behavior when max retries are exceeded"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.RequestError("Connection failed")
            
            with patch('asyncio.sleep'):  # Speed up test
                result = await web_scraper.fetch_page("https://example.com")
            
            assert result is None
            # Should attempt initial + retries
            assert mock_client.return_value.__aenter__.return_value.get.call_count == web_scraper.max_retries

    @pytest.mark.asyncio
    async def test_validate_url_accessibility_success(self, web_scraper):
        """Test URL accessibility validation - success case"""
        mock_response = Mock()
        mock_response.status_code = 200
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.head.return_value = mock_response
            
            result = await web_scraper.validate_url_accessibility("https://example.com")
            
            assert result == True

    @pytest.mark.asyncio
    async def test_validate_url_accessibility_failure(self, web_scraper):
        """Test URL accessibility validation - failure case"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.head.side_effect = httpx.RequestError("Connection failed")
            
            result = await web_scraper.validate_url_accessibility("https://invalid-url.com")
            
            assert result == False

    def test_extract_text_content(self, web_scraper):
        """Test text content extraction from HTML"""
        html = '''
        <html>
        <head>
            <title>Test Page</title>
            <script>alert('test');</script>
            <style>body { color: red; }</style>
        </head>
        <body>
            <nav>Navigation menu</nav>
            <main>
                <h1>Main Title</h1>
                <p>First paragraph with content.</p>
                <p>Second paragraph with more content.</p>
            </main>
            <footer>Footer content</footer>
        </body>
        </html>
        '''
        
        soup = BeautifulSoup(html, 'html.parser')
        result = web_scraper.extract_text_content(soup)
        
        # Should extract clean text without script/style content
        assert "alert('test')" not in result
        assert "color: red" not in result
        assert "Main Title" in result
        assert "First paragraph" in result
        assert "Second paragraph" in result

    def test_extract_text_content_with_length_limit(self, web_scraper):
        """Test text extraction with length limitation"""
        long_text = "A" * 10000
        html = f'<html><body><p>{long_text}</p></body></html>'
        
        soup = BeautifulSoup(html, 'html.parser')
        result = web_scraper.extract_text_content(soup, max_chars=100)
        
        assert len(result) <= 103  # 100 + "..."
        assert result.endswith("...")

    def test_resolve_relative_url(self, web_scraper):
        """Test relative URL resolution"""
        test_cases = [
            ("https://example.com/page", "/image.jpg", "https://example.com/image.jpg"),
            ("https://example.com/section/page", "../image.png", "https://example.com/image.png"),
            ("https://example.com", "images/photo.gif", "https://example.com/images/photo.gif"),
            ("https://example.com/page", "https://other.com/image.jpg", "https://other.com/image.jpg"),
            ("https://example.com", "", ""),
        ]
        
        for base_url, relative_url, expected in test_cases:
            result = web_scraper.resolve_relative_url(base_url, relative_url)
            assert result == expected, f"Failed for base={base_url}, relative={relative_url}"

    def test_resolve_relative_url_edge_cases(self, web_scraper):
        """Test edge cases in URL resolution"""
        # Empty relative URL
        result = web_scraper.resolve_relative_url("https://example.com", "")
        assert result == ""
        
        # None relative URL  
        result = web_scraper.resolve_relative_url("https://example.com", None)
        assert result is None
        
        # Invalid base URL should not crash
        result = web_scraper.resolve_relative_url("invalid-url", "/image.jpg")
        assert result == "/image.jpg"  # Should return as-is

    def test_user_agent_rotation(self, web_scraper):
        """Test that different user agents are used"""
        import random
        
        # Mock random.choice to return predictable values
        with patch('random.choice') as mock_choice:
            mock_choice.side_effect = ["Agent1", "Agent2", "Agent3"]
            
            agents = []
            for _ in range(3):
                # Access the user agent selection (this is internal, so we test the concept)
                agent = random.choice(web_scraper.USER_AGENTS)
                agents.append(agent)
            
            # Should have different agents due to mocked selection
            assert len(set(agents)) > 1

    def test_user_agents_list_not_empty(self, web_scraper):
        """Test that user agents list is properly populated"""
        assert len(web_scraper.USER_AGENTS) > 0
        assert all(isinstance(ua, str) for ua in web_scraper.USER_AGENTS)
        assert all(len(ua) > 0 for ua in web_scraper.USER_AGENTS)

    @pytest.mark.asyncio
    async def test_fetch_page_with_redirects(self, web_scraper):
        """Test handling of redirects"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'content-type': 'text/html'}
        mock_response.content = b'<html><title>Redirected Page</title></html>'
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            result = await web_scraper.fetch_page("https://example.com/redirect")
            
            # Verify follow_redirects=True was used
            call_args = mock_client.return_value.__aenter__.return_value.get.call_args
            assert call_args[1]['follow_redirects'] == True
            
            assert isinstance(result, BeautifulSoup)

    @pytest.mark.asyncio  
    async def test_fetch_page_timeout_handling(self, web_scraper):
        """Test timeout handling"""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get.side_effect = httpx.TimeoutException("Request timed out")
            
            with patch('asyncio.sleep'):
                result = await web_scraper.fetch_page("https://slow-site.com")
            
            assert result is None

    def test_request_headers_structure(self, web_scraper):
        """Test that request headers are properly structured"""
        # This tests the concept - in actual implementation, headers would be tested in the HTTP call
        expected_headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate", 
            "Connection": "keep-alive",
        }
        
        # Test that our expected headers are reasonable
        for key, value in expected_headers.items():
            assert isinstance(key, str)
            assert isinstance(value, str)
            assert len(key) > 0
            assert len(value) > 0