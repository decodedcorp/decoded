import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio
import time
import statistics
from pydantic import HttpUrl
from src.services.queue.batch_processor import BatchProcessor
from src.services.metadata.link_processor import LinkProcessor
from src.services.metadata.image_processor import ImageProcessor
from src.database.models.batch import DataItem, DataItemType, LinkResult, ImageResult, ProcessingStatus


class TestConcurrentProcessing:
    """Performance tests for concurrent processing capabilities"""

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
    def batch_processor_low_concurrency(self, mock_link_processor, mock_image_processor):
        return BatchProcessor(
            link_processor=mock_link_processor,
            image_processor=mock_image_processor,
            max_concurrency=2
        )

    @pytest.fixture
    def batch_processor_high_concurrency(self, mock_link_processor, mock_image_processor):
        return BatchProcessor(
            link_processor=mock_link_processor,
            image_processor=mock_image_processor,
            max_concurrency=10
        )

    def create_test_items(self, count: int):
        """Create test items for performance testing"""
        items = []
        for i in range(count):
            if i % 2 == 0:
                items.append(DataItem(
                    item_id=f"link-{i}",
                    type=DataItemType.LINK,
                    url=HttpUrl(f"https://example.com/page-{i}"),
                    existing_metadata=None
                ))
            else:
                items.append(DataItem(
                    item_id=f"image-{i}",
                    type=DataItemType.IMAGE,
                    url=HttpUrl(f"https://example.com/image-{i}.jpg"),
                    existing_metadata=None
                ))
        return items

    @pytest.mark.asyncio
    async def test_concurrency_limits_respected(self, batch_processor_low_concurrency, mock_link_processor, mock_image_processor):
        """Test that concurrency limits are respected"""
        processing_count = 0
        max_concurrent = 0
        
        async def track_concurrent_processing(url, item_id):
            nonlocal processing_count, max_concurrent
            processing_count += 1
            max_concurrent = max(max_concurrent, processing_count)
            
            # Simulate processing time
            await asyncio.sleep(0.1)
            
            processing_count -= 1
            return LinkResult(
                url=url,
                processing_status=ProcessingStatus.SUCCESS
            )
        
        mock_link_processor.process_link.side_effect = track_concurrent_processing
        mock_image_processor.process_image.side_effect = track_concurrent_processing
        
        items = self.create_test_items(20)  # 20 items
        
        result = await batch_processor_low_concurrency.process_batch("concurrency-test", items)
        
        # Should not exceed max concurrency
        assert max_concurrent <= batch_processor_low_concurrency.max_concurrency
        assert len(result.link_results) + len(result.image_results) == 20

    @pytest.mark.asyncio
    async def test_performance_scaling_with_concurrency(self, mock_link_processor, mock_image_processor):
        """Test that higher concurrency improves performance"""
        processing_delay = 0.2  # 200ms per item
        
        async def delayed_processing(url, item_id):
            await asyncio.sleep(processing_delay)
            return LinkResult(url=url, processing_status=ProcessingStatus.SUCCESS)
        
        mock_link_processor.process_link.side_effect = delayed_processing
        mock_image_processor.process_image.side_effect = delayed_processing
        
        items = self.create_test_items(10)  # 10 items
        
        # Test with low concurrency
        low_concurrency_processor = BatchProcessor(
            link_processor=mock_link_processor,
            image_processor=mock_image_processor,
            max_concurrency=2
        )
        
        start_time = time.time()
        result_low = await low_concurrency_processor.process_batch("low-concurrency", items)
        low_time = time.time() - start_time
        
        # Reset mocks
        mock_link_processor.process_link.side_effect = delayed_processing
        mock_image_processor.process_image.side_effect = delayed_processing
        
        # Test with high concurrency
        high_concurrency_processor = BatchProcessor(
            link_processor=mock_link_processor,
            image_processor=mock_image_processor,
            max_concurrency=10
        )
        
        start_time = time.time()
        result_high = await high_concurrency_processor.process_batch("high-concurrency", items)
        high_time = time.time() - start_time
        
        # High concurrency should be significantly faster
        assert high_time < low_time * 0.8  # At least 20% faster
        assert len(result_low.link_results) + len(result_low.image_results) == 10
        assert len(result_high.link_results) + len(result_high.image_results) == 10

    @pytest.mark.asyncio
    async def test_memory_usage_with_large_batches(self, batch_processor_high_concurrency, mock_link_processor, mock_image_processor):
        """Test memory usage with large batches"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Mock processors to return minimal data
        mock_link_processor.process_link.return_value = LinkResult(
            url="https://example.com/test",
            processing_status=ProcessingStatus.SUCCESS
        )
        
        mock_image_processor.process_image.return_value = ImageResult(
            url="https://example.com/test.jpg",
            processing_status=ProcessingStatus.SUCCESS
        )
        
        # Process increasingly large batches
        for batch_size in [100, 500, 1000]:
            items = self.create_test_items(batch_size)
            
            result = await batch_processor_high_concurrency.process_batch(f"memory-test-{batch_size}", items)
            
            current_memory = process.memory_info().rss
            memory_increase = current_memory - initial_memory
            
            # Memory increase should be reasonable (less than 100MB for 1000 items)
            assert memory_increase < 100 * 1024 * 1024, f"Memory usage too high: {memory_increase / 1024 / 1024:.2f}MB"
            
            # Verify processing completed
            assert len(result.link_results) + len(result.image_results) == batch_size

    @pytest.mark.asyncio
    async def test_throughput_measurement(self, batch_processor_high_concurrency, mock_link_processor, mock_image_processor):
        """Test throughput measurement and optimization"""
        processing_times = []
        
        async def variable_processing_time(url, item_id):
            # Simulate variable processing times
            delay = 0.05 + (hash(item_id) % 100) / 1000  # 50-150ms
            await asyncio.sleep(delay)
            processing_times.append(delay)
            return LinkResult(url=url, processing_status=ProcessingStatus.SUCCESS)
        
        mock_link_processor.process_link.side_effect = variable_processing_time
        mock_image_processor.process_image.side_effect = variable_processing_time
        
        items = self.create_test_items(50)
        
        start_time = time.time()
        result = await batch_processor_high_concurrency.process_batch("throughput-test", items)
        total_time = time.time() - start_time
        
        # Calculate throughput
        items_per_second = len(items) / total_time
        
        # With 10 max concurrency, should process multiple items per second
        assert items_per_second > 5, f"Throughput too low: {items_per_second:.2f} items/second"
        
        # Verify statistics
        stats = result.statistics
        assert stats.processing_time_seconds == pytest.approx(total_time, rel=0.1)

    @pytest.mark.asyncio
    async def test_error_handling_performance_impact(self, batch_processor_high_concurrency, mock_link_processor, mock_image_processor):
        """Test performance impact of error handling"""
        success_time = 0.1
        error_items = set([f"link-{i}" for i in range(0, 50, 5)])  # Every 5th item fails
        
        async def mixed_processing(url, item_id):
            await asyncio.sleep(success_time)
            if item_id in error_items:
                raise Exception("Simulated processing error")
            return LinkResult(url=url, processing_status=ProcessingStatus.SUCCESS)
        
        mock_link_processor.process_link.side_effect = mixed_processing
        mock_image_processor.process_image.side_effect = mixed_processing
        
        items = self.create_test_items(50)
        
        start_time = time.time()
        result = await batch_processor_high_concurrency.process_batch("error-handling-test", items)
        total_time = time.time() - start_time
        
        # Errors shouldn't significantly impact overall processing time
        expected_time = success_time * (50 / batch_processor_high_concurrency.max_concurrency)
        assert total_time < expected_time * 1.5, f"Error handling caused significant slowdown: {total_time:.2f}s vs expected ~{expected_time:.2f}s"
        
        # Verify mixed results
        total_results = len(result.link_results) + len(result.image_results)
        assert total_results == 50
        assert result.statistics.failed_count == len([item for item in items if item.item_id in error_items])

    @pytest.mark.asyncio
    async def test_semaphore_contention_performance(self, mock_link_processor, mock_image_processor):
        """Test performance under high semaphore contention"""
        # Create processor with very low concurrency to create contention
        low_concurrency_processor = BatchProcessor(
            link_processor=mock_link_processor,
            image_processor=mock_image_processor,
            max_concurrency=1  # Maximum contention
        )
        
        contention_times = []
        
        async def track_contention_time(url, item_id):
            start = time.time()
            await asyncio.sleep(0.05)  # Short processing time
            end = time.time()
            contention_times.append(end - start)
            return LinkResult(url=url, processing_status=ProcessingStatus.SUCCESS)
        
        mock_link_processor.process_link.side_effect = track_contention_time
        mock_image_processor.process_image.side_effect = track_contention_time
        
        items = self.create_test_items(20)
        
        start_time = time.time()
        result = await low_concurrency_processor.process_batch("contention-test", items)
        total_time = time.time() - start_time
        
        # Processing should be sequential due to concurrency=1
        expected_sequential_time = 0.05 * 20  # 20 items * 50ms each
        assert total_time >= expected_sequential_time * 0.9, "Processing not properly serialized"
        
        # All items should be processed
        assert len(result.link_results) + len(result.image_results) == 20

    @pytest.mark.asyncio
    async def test_batch_size_performance_characteristics(self, batch_processor_high_concurrency, mock_link_processor, mock_image_processor):
        """Test performance characteristics with different batch sizes"""
        processing_time = 0.1
        
        async def fixed_processing_time(url, item_id):
            await asyncio.sleep(processing_time)
            return LinkResult(url=url, processing_status=ProcessingStatus.SUCCESS)
        
        mock_link_processor.process_link.side_effect = fixed_processing_time
        mock_image_processor.process_image.side_effect = fixed_processing_time
        
        batch_sizes = [10, 50, 100, 200]
        performance_results = []
        
        for batch_size in batch_sizes:
            items = self.create_test_items(batch_size)
            
            start_time = time.time()
            result = await batch_processor_high_concurrency.process_batch(f"batch-size-{batch_size}", items)
            total_time = time.time() - start_time
            
            throughput = batch_size / total_time
            performance_results.append((batch_size, throughput, total_time))
            
            # Verify all items processed
            assert len(result.link_results) + len(result.image_results) == batch_size
        
        # Throughput should generally increase with batch size (up to concurrency limit)
        throughputs = [result[1] for result in performance_results]
        
        # First few batch sizes should show increasing throughput
        assert throughputs[1] > throughputs[0] * 0.8, "Throughput not scaling with batch size"

    @pytest.mark.asyncio
    async def test_resource_cleanup_performance(self, batch_processor_high_concurrency, mock_link_processor, mock_image_processor):
        """Test that resources are properly cleaned up after processing"""
        initial_task_count = len(asyncio.all_tasks())
        
        mock_link_processor.process_link.return_value = LinkResult(
            url="https://example.com/test",
            processing_status=ProcessingStatus.SUCCESS
        )
        
        mock_image_processor.process_image.return_value = ImageResult(
            url="https://example.com/test.jpg",
            processing_status=ProcessingStatus.SUCCESS
        )
        
        # Process multiple batches
        for i in range(5):
            items = self.create_test_items(20)
            result = await batch_processor_high_concurrency.process_batch(f"cleanup-test-{i}", items)
            
            # Verify processing completed
            assert len(result.link_results) + len(result.image_results) == 20
        
        # Allow some time for cleanup
        await asyncio.sleep(0.1)
        
        final_task_count = len(asyncio.all_tasks())
        
        # Task count shouldn't grow significantly
        assert final_task_count <= initial_task_count + 2, f"Tasks not cleaned up: {initial_task_count} -> {final_task_count}"

    @pytest.mark.asyncio
    async def test_performance_under_mixed_workload(self, batch_processor_high_concurrency, mock_link_processor, mock_image_processor):
        """Test performance with mixed processing times simulating real workload"""
        # Simulate realistic processing times
        async def realistic_link_processing(url, item_id):
            # Links: 200-800ms (web scraping + OG extraction + enhancement)
            delay = 0.2 + (hash(item_id) % 600) / 1000
            await asyncio.sleep(delay)
            return LinkResult(url=url, processing_status=ProcessingStatus.SUCCESS)
        
        async def realistic_image_processing(url, item_id):
            # Images: 100-400ms (URL validation + API analysis)
            delay = 0.1 + (hash(item_id) % 300) / 1000
            await asyncio.sleep(delay)
            return ImageResult(url=url, processing_status=ProcessingStatus.SUCCESS)
        
        mock_link_processor.process_link.side_effect = realistic_link_processing
        mock_image_processor.process_image.side_effect = realistic_image_processing
        
        # Mixed batch: 30 links, 20 images
        items = []
        for i in range(30):
            items.append(DataItem(
                item_id=f"link-{i}",
                type=DataItemType.LINK,
                url=HttpUrl(f"https://example.com/article-{i}"),
                existing_metadata=None
            ))
        
        for i in range(20):
            items.append(DataItem(
                item_id=f"image-{i}",
                type=DataItemType.IMAGE,
                url=HttpUrl(f"https://example.com/photo-{i}.jpg"),
                existing_metadata=None
            ))
        
        start_time = time.time()
        result = await batch_processor_high_concurrency.process_batch("mixed-workload", items)
        total_time = time.time() - start_time
        
        # Should complete in reasonable time with concurrency
        max_expected_time = 0.8 * (50 / batch_processor_high_concurrency.max_concurrency)  # Worst case scenario
        assert total_time < max_expected_time, f"Mixed workload too slow: {total_time:.2f}s"
        
        # Verify all items processed
        assert len(result.link_results) == 30
        assert len(result.image_results) == 20
        assert result.statistics.total_count == 50