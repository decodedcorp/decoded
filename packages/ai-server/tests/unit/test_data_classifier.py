import pytest
from unittest.mock import Mock
from pydantic import HttpUrl
from src.services.queue.data_classifier import DataClassifier
from src.database.models.batch import DataItem, DataItemType


class TestDataClassifier:
    """Unit tests for DataClassifier"""

    def test_classify_items_with_mixed_content(self):
        """Test classification of mixed links and images"""
        items = [
            DataItem(
                item_id="1", type=DataItemType.LINK, url=HttpUrl("https://example.com/page.html")
            ),
            DataItem(
                item_id="2", type=DataItemType.LINK, url=HttpUrl("https://example.com/image.jpg")
            ),
            DataItem(
                item_id="3", type=DataItemType.LINK, url=HttpUrl("https://i.imgur.com/photo.png")
            ),
            DataItem(
                item_id="4", type=DataItemType.LINK, url=HttpUrl("https://example.com/article")
            ),
            DataItem(
                item_id="5",
                type=DataItemType.LINK,
                url=HttpUrl("https://cdn.example.com/banner.webp"),
            ),
        ]

        link_items, image_items = DataClassifier.classify_items(items)

        # Should classify 3 images and 2 links
        assert len(image_items) == 3
        assert len(link_items) == 2

        # Check specific classifications
        image_urls = [str(item.url) for item in image_items]
        link_urls = [str(item.url) for item in link_items]

        assert "https://example.com/image.jpg" in image_urls
        assert "https://i.imgur.com/photo.png" in image_urls
        assert "https://cdn.example.com/banner.webp" in image_urls
        assert "https://example.com/page.html" in link_urls
        assert "https://example.com/article" in link_urls

    def test_is_image_url_by_extension(self):
        """Test image URL detection by file extension"""
        test_cases = [
            ("https://example.com/photo.jpg", True),
            ("https://example.com/photo.jpeg", True),
            ("https://example.com/photo.png", True),
            ("https://example.com/photo.gif", True),
            ("https://example.com/photo.webp", True),
            ("https://example.com/photo.svg", True),
            ("https://example.com/page.html", False),
            ("https://example.com/document.pdf", False),
            ("https://example.com/video.mp4", False),
            ("https://example.com/file.txt", False),
        ]

        for url, expected in test_cases:
            result = DataClassifier._is_image_url(url)
            assert result == expected, f"Failed for URL: {url}"

    def test_is_image_url_by_domain(self):
        """Test image URL detection by domain patterns"""
        test_cases = [
            ("https://i.imgur.com/abc123", True),
            ("https://imgur.com/gallery/abc123", True),
            ("https://cdn.example.com/image", True),
            ("https://images.unsplash.com/photo-123", True),
            ("https://assets.example.com/banner", True),
            ("https://media.example.com/content", True),
            ("https://static.example.com/resource", True),
            ("https://www.example.com/page", False),
            ("https://api.example.com/data", False),
            ("https://blog.example.com/post", False),
        ]

        for url, expected in test_cases:
            result = DataClassifier._is_image_url(url)
            assert result == expected, f"Failed for URL: {url}"

    def test_is_image_url_by_query_params(self):
        """Test image URL detection by query parameters"""
        test_cases = [
            ("https://example.com/image?format=jpg", True),
            ("https://example.com/image?format=png", True),
            ("https://example.com/image?format=webp", True),
            (
                "https://example.com/resource?width=500&height=300",
                False,
            ),  # Not explicit image format
            ("https://example.com/page?format=html", False),
        ]

        for url, expected in test_cases:
            result = DataClassifier._is_image_url(url)
            assert result == expected, f"Failed for URL: {url}"

    def test_is_image_url_edge_cases(self):
        """Test edge cases for image URL detection"""
        # Empty or invalid URLs
        assert DataClassifier._is_image_url("") == False
        assert DataClassifier._is_image_url("invalid-url") == False

        # URLs without protocol
        assert DataClassifier._is_image_url("example.com/image.jpg") == True

        # URLs with uppercase extensions
        assert DataClassifier._is_image_url("https://example.com/IMAGE.JPG") == True

    def test_classify_items_preserves_item_data(self):
        """Test that classification preserves all item data"""
        original_items = [
            DataItem(
                item_id="test-1",
                type=DataItemType.LINK,
                url=HttpUrl("https://example.com/image.jpg"),
                existing_metadata={"key": "value"},
            ),
            DataItem(
                item_id="test-2",
                type=DataItemType.LINK,
                url=HttpUrl("https://example.com/page.html"),
                existing_metadata=None,
            ),
        ]

        link_items, image_items = DataClassifier.classify_items(original_items)

        # Check that all data is preserved
        all_classified = link_items + image_items
        assert len(all_classified) == 2

        # Find the image item
        image_item = next(item for item in all_classified if str(item.url).endswith(".jpg"))
        assert image_item.item_id == "test-1"
        assert image_item.type == DataItemType.IMAGE  # Should be updated
        assert image_item.existing_metadata == {"key": "value"}

        # Find the link item
        link_item = next(item for item in all_classified if str(item.url).endswith(".html"))
        assert link_item.item_id == "test-2"
        assert link_item.type == DataItemType.LINK  # Should remain as link
        assert link_item.existing_metadata is None

    def test_classify_empty_list(self):
        """Test classification of empty item list"""
        link_items, image_items = DataClassifier.classify_items([])

        assert len(link_items) == 0
        assert len(image_items) == 0
        assert isinstance(link_items, list)
        assert isinstance(image_items, list)

    def test_classify_all_links(self):
        """Test classification when all items are links"""
        items = [
            DataItem(
                item_id="1", type=DataItemType.LINK, url=HttpUrl("https://example.com/page1.html")
            ),
            DataItem(item_id="2", type=DataItemType.LINK, url=HttpUrl("https://example.com/page2")),
            DataItem(
                item_id="3", type=DataItemType.LINK, url=HttpUrl("https://blog.example.com/post")
            ),
        ]

        link_items, image_items = DataClassifier.classify_items(items)

        assert len(link_items) == 3
        assert len(image_items) == 0

    def test_classify_all_images(self):
        """Test classification when all items are images"""
        items = [
            DataItem(
                item_id="1", type=DataItemType.LINK, url=HttpUrl("https://example.com/photo1.jpg")
            ),
            DataItem(
                item_id="2", type=DataItemType.LINK, url=HttpUrl("https://i.imgur.com/photo2.png")
            ),
            DataItem(
                item_id="3",
                type=DataItemType.LINK,
                url=HttpUrl("https://cdn.example.com/banner.webp"),
            ),
        ]

        link_items, image_items = DataClassifier.classify_items(items)

        assert len(link_items) == 0
        assert len(image_items) == 3
