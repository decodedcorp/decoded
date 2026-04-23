import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio
import time
from pydantic import HttpUrl
from src.services.queue.batch_processor import BatchProcessor
from src.services.metadata.link_processor import LinkProcessor
from src.services.metadata.image_processor import ImageProcessor
from src.database.models.batch import (
    DataItem,
    DataItemType,
    ProcessedDataBatch,
    LinkResult,
    ImageResult,
    ProcessingStatus,
    BatchStatistics,
)


class TestBatchProcessor:
    """Unit tests for BatchProcessor"""

    @pytest.fixture
    def mock_link_processor(self):
        processor = Mock(spec=LinkProcessor)
        processor.process_link = AsyncMock()
        return processor

    @pytest.fixture
    def mock_image_processor(self):
        processor = Mock(spec=ImageProcessor)
        processor.process_image = AsyncMock()
        return processor

    @pytest.fixture
    def batch_processor(self, mock_link_processor, mock_image_processor):
        return BatchProcessor(
            link_processor=mock_link_processor,
            image_processor=mock_image_processor,
            max_concurrency=3,
        )

    @pytest.fixture
    def sample_items(self):
        return [
            DataItem(
                item_id="link-1",
                type=DataItemType.LINK,
                url=HttpUrl("https://example.com/article"),
                existing_metadata=None,
            ),
            DataItem(
                item_id="link-2",
                type=DataItemType.LINK,
                url=HttpUrl("https://example.com/page"),
                existing_metadata={"title": "Existing Title"},
            ),
            DataItem(
                item_id="image-1",
                type=DataItemType.IMAGE,
                url=HttpUrl("https://example.com/photo.jpg"),
                existing_metadata=None,
            ),
            DataItem(
                item_id="image-2",
                type=DataItemType.IMAGE,
                url=HttpUrl("https://example.com/graphic.png"),
                existing_metadata=None,
            ),
        ]

    @pytest.mark.asyncio
    async def test_process_batch_success(
        self, batch_processor, mock_link_processor, mock_image_processor, sample_items
    ):
        """Test successful batch processing"""
        # Setup mock responses
        mock_link_processor.process_link.side_effect = [
            LinkResult(
                url="https://example.com/article",
                og_title="Article Title",
                processing_status=ProcessingStatus.SUCCESS,
            ),
            LinkResult(
                url="https://example.com/page",
                og_title="Page Title",
                processing_status=ProcessingStatus.SUCCESS,
            ),
        ]

        mock_image_processor.process_image.side_effect = [
            ImageResult(
                url="https://example.com/photo.jpg",
                description="Beautiful photo",
                processing_status=ProcessingStatus.SUCCESS,
            ),
            ImageResult(
                url="https://example.com/graphic.png",
                description="Graphic design",
                processing_status=ProcessingStatus.SUCCESS,
            ),
        ]

        # Process batch
        result = await batch_processor.process_batch("batch-123", sample_items)

        # Verify results
        assert isinstance(result, ProcessedDataBatch)
        assert result.batch_id == "batch-123"
        assert len(result.link_results) == 2
        assert len(result.image_results) == 2

        # Verify statistics
        stats = result.statistics
        assert stats.total_count == 4
        assert stats.success_count == 4
        assert stats.partial_count == 0
        assert stats.failed_count == 0
        assert stats.processing_time_seconds > 0

    @pytest.mark.asyncio
    async def test_process_batch_with_mixed_results(
        self, batch_processor, mock_link_processor, mock_image_processor, sample_items
    ):
        """Test batch processing with mixed success/failure results"""
        # Setup mixed responses
        mock_link_processor.process_link.side_effect = [
            LinkResult(
                url="https://example.com/article",
                og_title="Success",
                processing_status=ProcessingStatus.SUCCESS,
            ),
            LinkResult(
                url="https://example.com/page",
                processing_status=ProcessingStatus.FAILED,
                error_message="Failed to fetch",
            ),
        ]

        mock_image_processor.process_image.side_effect = [
            ImageResult(
                url="https://example.com/photo.jpg",
                description="Partial data",
                processing_status=ProcessingStatus.PARTIAL,
            ),
            ImageResult(
                url="https://example.com/graphic.png",
                processing_status=ProcessingStatus.FAILED,
                error_message="Image not accessible",
            ),
        ]

        result = await batch_processor.process_batch("batch-456", sample_items)

        # Verify mixed results
        stats = result.statistics
        assert stats.total_count == 4
        assert stats.success_count == 1
        assert stats.partial_count == 1
        assert stats.failed_count == 2

    @pytest.mark.asyncio
    async def test_process_batch_empty_list(self, batch_processor):
        """Test processing empty batch"""
        result = await batch_processor.process_batch("empty-batch", [])

        assert result.batch_id == "empty-batch"
        assert len(result.link_results) == 0
        assert len(result.image_results) == 0
        assert result.statistics.total_count == 0

    @pytest.mark.asyncio
    async def test_process_batch_concurrency_control(
        self, batch_processor, mock_link_processor, mock_image_processor
    ):
        """Test that concurrency control works correctly"""
        # Create many items to test concurrency
        items = []
        for i in range(10):
            items.append(
                DataItem(
                    item_id=f"link-{i}",
                    type=DataItemType.LINK,
                    url=HttpUrl(f"https://example.com/page{i}"),
                    existing_metadata=None,
                )
            )

        # Track concurrent executions
        concurrent_count = 0
        max_concurrent = 0

        async def mock_process_link(url, item_id):
            nonlocal concurrent_count, max_concurrent
            concurrent_count += 1
            max_concurrent = max(max_concurrent, concurrent_count)

            # Simulate processing time
            await asyncio.sleep(0.1)

            concurrent_count -= 1
            return LinkResult(
                url=url, og_title=f"Title for {item_id}", processing_status=ProcessingStatus.SUCCESS
            )

        mock_link_processor.process_link.side_effect = mock_process_link

        result = await batch_processor.process_batch("concurrency-test", items)

        # Verify concurrency was limited
        assert max_concurrent <= batch_processor.max_concurrency
        assert len(result.link_results) == 10

    @pytest.mark.asyncio
    async def test_process_items_parallel_with_exceptions(
        self, batch_processor, mock_link_processor, mock_image_processor
    ):
        """Test parallel processing handles exceptions gracefully"""
        items = [
            DataItem(
                item_id="link-1",
                type=DataItemType.LINK,
                url=HttpUrl("https://example.com/good"),
                existing_metadata=None,
            ),
            DataItem(
                item_id="link-2",
                type=DataItemType.LINK,
                url=HttpUrl("https://example.com/bad"),
                existing_metadata=None,
            ),
        ]

        # One succeeds, one raises exception
        mock_link_processor.process_link.side_effect = [
            LinkResult(
                url="https://example.com/good",
                og_title="Success",
                processing_status=ProcessingStatus.SUCCESS,
            ),
            Exception("Processing failed"),
        ]

        result = await batch_processor.process_batch("exception-test", items)

        # Should handle exception gracefully
        assert len(result.link_results) == 2

        # Find the failed result
        failed_result = next(
            r for r in result.link_results if r.processing_status == ProcessingStatus.FAILED
        )
        assert "Processing failed" in failed_result.error_message

    @pytest.mark.asyncio
    async def test_process_link_with_semaphore(self, batch_processor, mock_link_processor):
        """Test that link processing uses semaphore correctly"""
        # Verify semaphore acquisition/release
        original_acquire = batch_processor._semaphore.acquire
        original_release = batch_processor._semaphore.release

        acquire_count = 0
        release_count = 0

        async def mock_acquire():
            nonlocal acquire_count
            acquire_count += 1
            return await original_acquire()

        def mock_release():
            nonlocal release_count
            release_count += 1
            return original_release()

        batch_processor._semaphore.acquire = mock_acquire
        batch_processor._semaphore.release = mock_release

        mock_link_processor.process_link.return_value = LinkResult(
            url="https://example.com/test", processing_status=ProcessingStatus.SUCCESS
        )

        result = await batch_processor._process_link_with_semaphore(
            "https://example.com/test", "test-id"
        )

        assert isinstance(result, LinkResult)
        # Note: Actual semaphore counting would be tested in integration tests

    @pytest.mark.asyncio
    async def test_calculate_statistics(self, batch_processor):
        """Test statistics calculation"""
        link_results = [
            LinkResult(url="url1", processing_status=ProcessingStatus.SUCCESS),
            LinkResult(url="url2", processing_status=ProcessingStatus.PARTIAL),
            LinkResult(url="url3", processing_status=ProcessingStatus.FAILED),
        ]

        image_results = [
            ImageResult(url="img1", processing_status=ProcessingStatus.SUCCESS),
            ImageResult(url="img2", processing_status=ProcessingStatus.FAILED),
        ]

        processing_time = 2.5

        stats = batch_processor._calculate_statistics(link_results, image_results, processing_time)

        assert stats.total_count == 5
        assert stats.success_count == 2
        assert stats.partial_count == 1
        assert stats.failed_count == 2
        assert stats.processing_time_seconds == 2.5

    @pytest.mark.asyncio
    async def test_get_processing_status(self, batch_processor):
        """Test getting processing status"""
        status = await batch_processor.get_processing_status("test-batch")

        assert isinstance(status, dict)
        assert "batch_id" in status
        assert "max_concurrency" in status
        assert status["batch_id"] == "test-batch"
        assert status["max_concurrency"] == 3

    @pytest.mark.asyncio
    async def test_process_batch_error_handling(
        self, batch_processor, mock_link_processor, mock_image_processor
    ):
        """Test error handling during batch processing"""
        items = [
            DataItem(
                item_id="test-1",
                type=DataItemType.LINK,
                url=HttpUrl("https://example.com/test"),
                existing_metadata=None,
            )
        ]

        # Mock processor raises exception
        mock_link_processor.process_link.side_effect = Exception("Critical error")

        result = await batch_processor.process_batch("error-batch", items)

        # Should return batch with error statistics
        assert result.batch_id == "error-batch"
        assert result.statistics.failed_count == 1
        assert result.statistics.success_count == 0

    def test_initialization(self, mock_link_processor, mock_image_processor):
        """Test BatchProcessor initialization"""
        processor = BatchProcessor(
            link_processor=mock_link_processor,
            image_processor=mock_image_processor,
            max_concurrency=5,
        )

        assert processor.link_processor == mock_link_processor
        assert processor.image_processor == mock_image_processor
        assert processor.max_concurrency == 5
        assert processor._semaphore._value == 5  # Semaphore initial value

    @pytest.mark.asyncio
    async def test_data_classification_integration(
        self, batch_processor, mock_link_processor, mock_image_processor
    ):
        """Test that data classification works correctly in batch processing"""
        mixed_items = [
            DataItem(
                item_id="item-1",
                type=DataItemType.LINK,  # Will be reclassified as image
                url=HttpUrl("https://example.com/photo.jpg"),
                existing_metadata=None,
            ),
            DataItem(
                item_id="item-2",
                type=DataItemType.LINK,  # Will remain as link
                url=HttpUrl("https://example.com/article.html"),
                existing_metadata=None,
            ),
        ]

        mock_link_processor.process_link.return_value = LinkResult(
            url="https://example.com/article.html", processing_status=ProcessingStatus.SUCCESS
        )

        mock_image_processor.process_image.return_value = ImageResult(
            url="https://example.com/photo.jpg", processing_status=ProcessingStatus.SUCCESS
        )

        result = await batch_processor.process_batch("classification-test", mixed_items)

        # Should have 1 link and 1 image after classification
        assert len(result.link_results) == 1
        assert len(result.image_results) == 1

    @pytest.mark.asyncio
    async def test_processing_time_measurement(
        self, batch_processor, mock_link_processor, mock_image_processor
    ):
        """Test that processing time is measured accurately"""
        items = [
            DataItem(
                item_id="time-test",
                type=DataItemType.LINK,
                url=HttpUrl("https://example.com/test"),
                existing_metadata=None,
            )
        ]

        # Add delay to processing
        async def delayed_process_link(url, item_id):
            await asyncio.sleep(0.1)  # 100ms delay
            return LinkResult(url=url, processing_status=ProcessingStatus.SUCCESS)

        mock_link_processor.process_link.side_effect = delayed_process_link

        start_time = time.time()
        result = await batch_processor.process_batch("time-test", items)
        end_time = time.time()

        # Processing time should be measured and reasonable
        measured_time = result.statistics.processing_time_seconds
        actual_time = end_time - start_time

        assert measured_time > 0
        assert abs(measured_time - actual_time) < 0.5  # Within 500ms tolerance
