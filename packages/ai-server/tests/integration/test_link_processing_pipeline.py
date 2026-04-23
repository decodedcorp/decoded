import pytest
from unittest.mock import Mock, patch, AsyncMock
import asyncio
from bs4 import BeautifulSoup
from pydantic import HttpUrl
from src.services.metadata.processors.link_processor import LinkProcessor
from src.services.metadata.web_scraper import WebScraperService
from src.services.metadata.og_extractor import OGTagExtractor
from src.managers.llm.adapters.perplexity import PerplexityClient
from src.services.metadata.searxng_client import SearXNGClient
from src.config.external_apis import PerplexityConfig, SearXNGConfig
from src.database.models.batch import ProcessingStatus
from src.database.models.metadata import GetOGTagsResponse


class TestLinkProcessingPipeline:
    """Integration tests for the complete link processing pipeline"""

    @pytest.fixture
    def web_scraper(self):
        return WebScraperService(max_retries=1, timeout=5)

    @pytest.fixture
    def og_extractor(self):
        return OGTagExtractor()

    @pytest.fixture
    def perplexity_client(self):
        config = PerplexityConfig(api_key="test_key")
        return PerplexityClient(config)

    @pytest.fixture
    def searxng_client(self):
        config = SearXNGConfig(api_url="http://localhost:8080")
        return SearXNGClient(config)

    @pytest.fixture
    def link_processor(self, web_scraper, og_extractor, perplexity_client, searxng_client):
        return LinkProcessor(
            web_scraper=web_scraper,
            og_extractor=og_extractor,
            perplexity_client=perplexity_client,
            searxng_client=searxng_client,
        )

    @pytest.mark.asyncio
    async def test_complete_pipeline_with_good_og_tags(self, link_processor):
        """Test complete pipeline when OG tags are complete"""
        html_content = """
        <html>
        <head>
            <meta property="og:title" content="Complete Article Title" />
            <meta property="og:description" content="This article has complete metadata with a good description." />
            <meta property="og:image" content="https://example.com/article-image.jpg" />
            <meta property="og:site_name" content="Example News" />
            <meta property="og:type" content="article" />
        </head>
        <body>
            <h1>Complete Article Title</h1>
            <p>Article content here...</p>
        </body>
        </html>
        """

        # Mock web scraper to return our HTML
        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.return_value = BeautifulSoup(html_content, "html.parser")

            result = await link_processor.process_link("https://example.com/article", "test-1")

            # Should be successful without enhancement needed
            assert result.processing_status == ProcessingStatus.SUCCESS
            assert result.og_title == "Complete Article Title"
            assert (
                result.og_description
                == "This article has complete metadata with a good description."
            )
            assert result.og_image == "https://example.com/article-image.jpg"
            assert result.enhanced_title is None  # No enhancement needed
            assert result.enhanced_description is None

    @pytest.mark.asyncio
    async def test_pipeline_with_missing_og_tags_and_enhancement(self, link_processor):
        """Test pipeline when OG tags are missing and enhancement is needed"""
        html_content = """
        <html>
        <head>
            <title>Basic Title</title>
        </head>
        <body>
            <h1>Basic Title</h1>
            <p>Some content without proper metadata...</p>
        </body>
        </html>
        """

        # Mock web scraper
        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.return_value = BeautifulSoup(html_content, "html.parser")

            # Mock Perplexity enhancement
            with patch.object(link_processor.perplexity_client, "analyze_link") as mock_perplexity:
                mock_perplexity.return_value = {
                    "enhanced_title": "Enhanced Title from Perplexity",
                    "enhanced_description": "Enhanced description from Perplexity analysis",
                    "topics": ["topic1", "topic2"],
                    "category": "article",
                }

                # Mock SearXNG image search
                with patch.object(
                    link_processor.searxng_client, "find_related_image"
                ) as mock_searxng:
                    mock_searxng.return_value = "https://example.com/enhanced-image.jpg"

                    result = await link_processor.process_link(
                        "https://example.com/basic", "test-2"
                    )

                    # Should be partial success with enhancements
                    assert result.processing_status == ProcessingStatus.PARTIAL
                    assert result.og_title == "Basic Title"  # Original from title tag
                    assert result.enhanced_title == "Enhanced Title from Perplexity"
                    assert (
                        result.enhanced_description
                        == "Enhanced description from Perplexity analysis"
                    )
                    assert result.enhanced_image == "https://example.com/enhanced-image.jpg"

    @pytest.mark.asyncio
    async def test_pipeline_with_web_scraping_failure(self, link_processor):
        """Test pipeline when web scraping fails"""
        # Mock web scraper to return None (failure)
        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.return_value = None

            result = await link_processor.process_link("https://example.com/inaccessible", "test-3")

            assert result.processing_status == ProcessingStatus.FAILED
            assert "Failed to fetch web page" in result.error_message
            assert result.og_title is None
            assert result.enhanced_title is None

    @pytest.mark.asyncio
    async def test_pipeline_data_completeness_assessment(self, link_processor):
        """Test the data completeness assessment logic"""
        html_with_partial_data = """
        <html>
        <head>
            <meta property="og:title" content="Title Only" />
            <!-- Missing description and image -->
        </head>
        </html>
        """

        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.return_value = BeautifulSoup(html_with_partial_data, "html.parser")

            # Test the assessment directly
            og_tags = GetOGTagsResponse(
                og_title="Title Only",
                og_description=None,
                og_image=None,
                og_site_name=None,
                og_url="https://example.com",
                og_type=None,
            )

            assessment = link_processor._assess_data_completeness(og_tags)

            assert assessment["has_title"] == True
            assert assessment["has_description"] == False
            assert assessment["has_image"] == False
            assert assessment["needs_enhancement"] == True
            assert "description" in assessment["enhancement_needed"]
            assert "image" in assessment["enhancement_needed"]
            assert assessment["completeness_score"] < 0.5

    @pytest.mark.asyncio
    async def test_pipeline_enhancement_with_perplexity_failure(self, link_processor):
        """Test pipeline when Perplexity enhancement fails"""
        html_content = "<html><head><title>Title Only</title></head></html>"

        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.return_value = BeautifulSoup(html_content, "html.parser")

            # Mock Perplexity to raise exception
            with patch.object(link_processor.perplexity_client, "analyze_link") as mock_perplexity:
                mock_perplexity.side_effect = Exception("API error")

                # Mock SearXNG to work normally
                with patch.object(
                    link_processor.searxng_client, "find_related_image"
                ) as mock_searxng:
                    mock_searxng.return_value = "https://example.com/found-image.jpg"

                    result = await link_processor.process_link(
                        "https://example.com/partial-fail", "test-4"
                    )

                    # Should still be partial success with what worked
                    assert result.processing_status == ProcessingStatus.PARTIAL
                    assert result.og_title == "Title Only"
                    assert result.enhanced_title is None  # Perplexity failed
                    assert (
                        result.enhanced_image == "https://example.com/found-image.jpg"
                    )  # SearXNG worked

    @pytest.mark.asyncio
    async def test_pipeline_parallel_enhancement_tasks(self, link_processor):
        """Test that enhancement tasks run in parallel"""
        html_content = "<html><head><title>Needs Enhancement</title></head></html>"

        # Track timing to verify parallel execution
        perplexity_delay = 0.2
        searxng_delay = 0.3

        async def delayed_perplexity_response(url, title, desc):
            await asyncio.sleep(perplexity_delay)
            return {"enhanced_title": "Enhanced by Perplexity"}

        async def delayed_searxng_response(og_tags):
            await asyncio.sleep(searxng_delay)
            return {"enhanced_image": "https://example.com/searxng-image.jpg"}

        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.return_value = BeautifulSoup(html_content, "html.parser")

            with patch.object(link_processor.perplexity_client, "analyze_link") as mock_perplexity:
                mock_perplexity.side_effect = delayed_perplexity_response

                with patch.object(
                    link_processor.searxng_client, "find_related_image"
                ) as mock_searxng:
                    mock_searxng.side_effect = delayed_searxng_response

                    import time

                    start_time = time.time()

                    result = await link_processor.process_link(
                        "https://example.com/parallel", "test-5"
                    )

                    end_time = time.time()
                    total_time = end_time - start_time

                    # Should take less time than sequential execution
                    assert total_time < (perplexity_delay + searxng_delay)
                    assert result.enhanced_title == "Enhanced by Perplexity"
                    assert result.enhanced_image == "https://example.com/searxng-image.jpg"

    @pytest.mark.asyncio
    async def test_pipeline_error_handling_and_logging(self, link_processor):
        """Test error handling and logging throughout the pipeline"""
        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.side_effect = Exception("Network error")

            with patch("logging.Logger.error") as mock_log_error:
                result = await link_processor.process_link("https://example.com/error", "test-6")

                assert result.processing_status == ProcessingStatus.FAILED
                assert result.error_message is not None
                mock_log_error.assert_called()

    @pytest.mark.asyncio
    async def test_pipeline_url_resolution_in_og_extractor(self, link_processor):
        """Test that relative URLs are properly resolved"""
        html_content = """
        <html>
        <head>
            <meta property="og:image" content="/images/relative-image.jpg" />
            <meta property="og:title" content="Relative URL Test" />
        </head>
        </html>
        """

        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.return_value = BeautifulSoup(html_content, "html.parser")

            result = await link_processor.process_link("https://example.com/page", "test-7")

            # Relative URL should be resolved to absolute
            assert result.og_image == "https://example.com/images/relative-image.jpg"
            assert result.og_title == "Relative URL Test"

    @pytest.mark.asyncio
    async def test_pipeline_with_complex_html_structure(self, link_processor):
        """Test pipeline with complex HTML structure and fallbacks"""
        complex_html = """
        <html>
        <head>
            <!-- No OG tags, should use fallbacks -->
            <title>Fallback Title from Title Tag</title>
            <meta name="description" content="Fallback description from meta tag" />
        </head>
        <body>
            <nav>Navigation</nav>
            <header>
                <h1>Main Heading</h1>
            </header>
            <main>
                <article>
                    <img src="hero-image.jpg" alt="Hero image" class="hero" />
                    <p>First paragraph of content.</p>
                    <img src="inline-image.jpg" alt="Inline image" />
                    <p>More content here.</p>
                </article>
            </main>
            <footer>Footer content</footer>
        </body>
        </html>
        """

        with patch.object(link_processor.web_scraper, "fetch_page") as mock_fetch:
            mock_fetch.return_value = BeautifulSoup(complex_html, "html.parser")

            result = await link_processor.process_link("https://example.com/complex", "test-8")

            # Should use fallback mechanisms
            assert result.og_title == "Fallback Title from Title Tag"
            assert result.og_description == "Fallback description from meta tag"
            # Should find the hero image due to class priority
            assert "hero-image.jpg" in result.og_image

    def test_completeness_scoring_algorithm(self, link_processor):
        """Test the completeness scoring algorithm with various scenarios"""
        test_cases = [
            # (title, description, image, site_name, expected_score_range)
            (
                "Good Title",
                "Good description with enough content",
                "https://example.com/image.jpg",
                "Site Name",
                (0.75, 1.0),
            ),
            ("Title", None, "https://example.com/image.jpg", None, (0.25, 0.75)),
            ("Title", None, None, None, (0.0, 0.5)),
            (None, None, None, None, (0.0, 0.25)),
        ]

        for title, description, image, site_name, expected_range in test_cases:
            og_tags = GetOGTagsResponse(
                og_title=title,
                og_description=description,
                og_image=image,
                og_site_name=site_name,
                og_url="https://example.com",
                og_type=None,
            )

            assessment = link_processor._assess_data_completeness(og_tags)
            score = assessment["completeness_score"]

            assert expected_range[0] <= score <= expected_range[1], (
                f"Score {score} not in expected range {expected_range} for case: {title}, {description}, {image}, {site_name}"
            )
