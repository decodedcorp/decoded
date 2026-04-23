"""
Metadata processing related scheduled tasks
"""

import asyncio
import time
from typing import Dict, Any, TYPE_CHECKING
import logging
from src.services.metadata.management.failed_items_manager import FailedItemsManager
from src.database.models.batch import DataItem, DataItemType

# Use TYPE_CHECKING to avoid circular import
if TYPE_CHECKING:
    from src.services.metadata.core import MetadataExtractService, ResultBatchService


logger = logging.getLogger(__name__)


async def retry_failed_items(
    unified_retry_manager: FailedItemsManager,  # Using alias for backward compatibility
    metadata_extract_service: "MetadataExtractService",
    batch_size: int = 5,
    max_concurrent_retries: int = 3,
) -> Dict[str, Any]:
    """
    Retry failed items task

    Args:
        unified_retry_manager: Unified manager for failed items
        metadata_extract_service: Manager for metadata extraction
        batch_size: Maximum number of items to process in one batch
        max_concurrent_retries: Maximum concurrent retry operations

    Returns:
        Dictionary with task results
    """
    try:
        # Get failed items ready for retry
        failed_items = await unified_retry_manager.get_failed_items_for_retry(batch_size)

        if not failed_items:
            return {
                "processed_count": 0,
                "success_count": 0,
                "failed_count": 0,
                "message": "No items ready for retry",
            }

        logger.info(f"Processing {len(failed_items)} items for retry")

        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(max_concurrent_retries)

        # Process items concurrently
        tasks = []
        for failed_item in failed_items:
            task = asyncio.create_task(
                _process_single_retry(
                    failed_item, unified_retry_manager, metadata_extract_service, semaphore
                )
            )
            tasks.append(task)

        # Wait for all retries to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Count results
        success_count = sum(1 for r in results if r is True)
        failed_count = sum(1 for r in results if r is False)
        error_count = sum(1 for r in results if isinstance(r, Exception))

        result = {
            "processed_count": len(failed_items),
            "success_count": success_count,
            "failed_count": failed_count,
            "error_count": error_count,
            "message": f"Processed {len(failed_items)} retry items",
        }

        logger.info(
            f"Retry task completed: {success_count} succeeded, {failed_count + error_count} failed"
        )

        return result

    except Exception as e:
        error_msg = f"Error in retry task: {str(e)}"
        logger.error(error_msg)
        return {
            "processed_count": 0,
            "success_count": 0,
            "failed_count": 0,
            "error_count": 1,
            "message": error_msg,
        }


async def cleanup_old_failed_items(
    unified_retry_manager: FailedItemsManager,  # Using alias for backward compatibility
    max_age_days: int = 7,
) -> Dict[str, Any]:
    """
    Cleanup old failed items task

    Args:
        unified_retry_manager: Unified manager for retry items
        max_age_days: Maximum age in days for items to keep

    Returns:
        Dictionary with cleanup results
    """
    try:
        logger.info(f"Starting cleanup of retry items older than {max_age_days} days")

        cleaned_count = await unified_retry_manager.cleanup_old_items(max_age_days)

        result = {
            "cleaned_count": cleaned_count,
            "max_age_days": max_age_days,
            "message": f"Cleaned up {cleaned_count} old failed items",
        }

        logger.info(f"Cleanup task completed: removed {cleaned_count} items")
        return result

    except Exception as e:
        error_msg = f"Error in cleanup task: {str(e)}"
        logger.error(error_msg)
        return {"cleaned_count": 0, "max_age_days": max_age_days, "message": error_msg}


async def get_failed_items_stats(
    unified_retry_manager: FailedItemsManager,  # Using alias for backward compatibility
) -> Dict[str, Any]:
    """
    Get failed items statistics task

    Args:
        unified_retry_manager: Unified manager for retry items

    Returns:
        Dictionary with statistics
    """
    try:
        stats = await unified_retry_manager.get_retry_stats()

        result = {"statistics": stats, "message": "Successfully retrieved failed items statistics"}

        logger.debug(f"Stats task completed: {stats}")
        return result

    except Exception as e:
        error_msg = f"Error getting stats: {str(e)}"
        logger.error(error_msg)
        return {"statistics": {}, "message": error_msg}


async def _process_single_retry(
    retry_item,
    unified_retry_manager: FailedItemsManager,  # Using alias for backward compatibility
    metadata_extract_service: "MetadataExtractService",
    semaphore: asyncio.Semaphore,
) -> bool:
    """
    Process a single retry item with semaphore control

    Args:
        retry_item: RetryItem to retry
        unified_retry_manager: Unified manager for retry items
        metadata_extract_service: Manager for metadata extraction
        semaphore: Semaphore for concurrency control

    Returns:
        True if retry succeeded, False otherwise
    """
    async with semaphore:
        try:
            logger.debug(f"Retrying item {retry_item.item_id} ({retry_item.item_type})")

            # Create DataItem for processing
            data_item = DataItem(
                item_id=retry_item.item_id,
                url=retry_item.url,
                type=DataItemType.LINK if retry_item.item_type == "link" else DataItemType.IMAGE,
            )

            # Process the single item using metadata extract manager
            processed_batch = await metadata_extract_service.process_batch(
                batch_id=f"retry_{retry_item.item_id}_{int(time.time())}", items=[data_item]
            )

            # Check if processing succeeded
            if retry_item.item_type == "link":
                results = processed_batch.link_results
            else:
                results = processed_batch.image_results

            if results and len(results) > 0:
                result = results[0]
                if result.status.value == "success":
                    # Mark as successful
                    await unified_retry_manager.mark_retry_success(retry_item.item_id)
                    logger.info(f"Successfully retried item {retry_item.item_id}")
                    return True
                else:
                    # Mark retry as failed
                    error_msg = result.error_message or "Unknown retry error"
                    await unified_retry_manager.mark_retry_failed(retry_item.item_id, error_msg)
                    logger.warning(f"Retry failed for item {retry_item.item_id}: {error_msg}")
                    return False
            else:
                # No results returned
                await unified_retry_manager.mark_retry_failed(
                    retry_item.item_id, "No results returned from retry processing"
                )
                logger.warning(f"Retry failed for item {retry_item.item_id}: No results returned")
                return False

        except Exception as e:
            error_msg = f"Exception during retry: {str(e)}"
            try:
                await unified_retry_manager.mark_retry_failed(retry_item.item_id, error_msg)
            except Exception as inner_e:
                logger.error(f"Error marking retry failed for {retry_item.item_id}: {str(inner_e)}")

            logger.error(f"Error retrying item {retry_item.item_id}: {error_msg}")
            return False


async def process_partial_retries(
    unified_retry_manager: FailedItemsManager,  # Using alias for backward compatibility
    metadata_extract_service: "MetadataExtractService",
    batch_size: int = 10,
) -> Dict[str, Any]:
    """
    Process partial retry items for progressive enhancement using unified retry manager

    Args:
        unified_retry_manager: Unified manager for retry items
        metadata_extract_service: Manager for metadata extraction
        batch_size: Maximum number of items to process in one batch

    Returns:
        Dictionary with task results
    """
    try:
        logger.info(f"Starting partial retry processing for up to {batch_size} items")

        # Get partial items for retry
        partial_items = await unified_retry_manager.get_partial_items_for_retry(batch_size)

        if not partial_items:
            return {
                "processed_count": 0,
                "successful_count": 0,
                "message": "No partial items ready for retry",
            }

        successful_count = 0
        processed_count = len(partial_items)

        # Process each partial item
        for retry_item in partial_items:
            try:
                # For now, delegate to the metadata extract manager's legacy method
                # TODO: Implement direct selective retry processing here
                result = await metadata_extract_service.process_partial_retries(
                    1
                )  # Process one at a time
                if result.get("successful_count", 0) > 0:
                    successful_count += 1
                    await unified_retry_manager.complete_partial_processing(
                        retry_item.item_id, True
                    )
                else:
                    await unified_retry_manager.complete_partial_processing(
                        retry_item.item_id, False
                    )

            except Exception as e:
                logger.error(f"Error processing partial retry for {retry_item.item_id}: {str(e)}")
                await unified_retry_manager.complete_partial_processing(retry_item.item_id, False)

        result = {
            "processed_count": processed_count,
            "successful_count": successful_count,
            "message": f"Processed {processed_count} partial items, {successful_count} successful",
        }

        logger.info(
            f"Partial retry task completed: {successful_count} successful, "
            f"{processed_count} total processed"
        )

        return result

    except Exception as e:
        error_msg = f"Error in partial retry task: {str(e)}"
        logger.error(error_msg)
        return {"processed_count": 0, "successful_count": 0, "error_count": 1, "message": error_msg}


async def get_partial_retry_stats(
    unified_retry_manager: FailedItemsManager,  # Using alias for backward compatibility
) -> Dict[str, Any]:
    """
    Get partial retry statistics task using unified retry manager

    Args:
        unified_retry_manager: Unified manager for retry items

    Returns:
        Dictionary with statistics
    """
    try:
        stats = await unified_retry_manager.get_retry_stats()

        # Extract partial-specific stats
        partial_stats = {
            "partial_items_in_queue": stats.get("partial_items_in_queue", 0),
            "currently_processing": stats.get("currently_processing", 0),
            "total_retry_items": stats.get("total_retry_items", 0),
        }

        result = {
            "statistics": partial_stats,
            "message": "Successfully retrieved partial retry statistics",
        }

        logger.debug(f"Partial retry stats task completed: {partial_stats}")
        return result

    except Exception as e:
        error_msg = f"Error getting partial retry stats: {str(e)}"
        logger.error(error_msg)
        return {"statistics": {}, "message": error_msg}


async def process_ai_analysis_queue(
    metadata_extract_service: "MetadataExtractService", batch_size: int = 10
) -> Dict[str, Any]:
    """
    Process queued AI analysis requests from Redis queue

    This task runs periodically to dequeue AI analysis requests and process them
    in batches using the existing batch processing pipeline.

    Args:
        metadata_extract_service: Manager for metadata extraction
        batch_size: Maximum number of items to process in one batch

    Returns:
        Dictionary with task results
    """
    try:
        # Dequeue items from Redis queue
        items = await metadata_extract_service.dequeue_analysis_requests(batch_size)

        if not items:
            logger.debug("No items in AI analysis queue")
            return {
                "processed_count": 0,
                "success_count": 0,
                "message": "No items in AI analysis queue",
            }

        logger.info(f"Processing {len(items)} items from AI analysis queue")

        # Generate batch ID
        import uuid

        batch_id = f"ai_queue_{uuid.uuid4().hex[:8]}_{int(time.time())}"

        # Process batch using existing pipeline
        processed_batch = await metadata_extract_service.process_batch(batch_id, items)

        # Send results to backend (Critical for AnalyzeLink flow)
        send_success = await metadata_extract_service.send_batch_results(processed_batch)
        if send_success:
            logger.info(f"Successfully sent AI analysis results for batch {batch_id} to backend")
        else:
            logger.warning(f"Failed to send AI analysis results for batch {batch_id} to backend")

        # Count results
        success_count = processed_batch.statistics.success_count
        partial_count = processed_batch.statistics.partial_count
        failed_count = processed_batch.statistics.failed_count

        result = {
            "processed_count": len(items),
            "success_count": success_count,
            "partial_count": partial_count,
            "failed_count": failed_count,
            "batch_id": batch_id,
            "message": (
                f"Processed {len(items)} items from queue: "
                f"{success_count} success, {partial_count} partial, {failed_count} failed"
            ),
        }

        logger.info(
            f"AI analysis queue task completed: batch {batch_id}, "
            f"{success_count} success, {partial_count} partial, {failed_count} failed"
        )

        return result

    except Exception as e:
        error_msg = f"Error processing AI analysis queue: {str(e)}"
        logger.error(error_msg)
        return {"processed_count": 0, "success_count": 0, "error_count": 1, "message": error_msg}


async def flush_pending_results(
    result_batch_service: "ResultBatchService", batch_size: int = 50
) -> Dict[str, Any]:
    """
    주기적으로 실행되는 배치 전송 태스크

    버퍼에 쌓인 결과를 배치로 백엔드에 전송합니다.

    Args:
        result_batch_service: ResultBatchService 인스턴스
        batch_size: 최대 배치 크기

    Returns:
        전송 결과 통계
    """
    try:
        result = await result_batch_service.flush_results(max_batch_size=batch_size)
        logger.info(
            f"Flushed {result.get('flushed', 0)} results to backend "
            f"(success: {result.get('success', False)})"
        )
        return result
    except Exception as e:
        logger.error(f"Error flushing pending results: {str(e)}", exc_info=True)
        return {"flushed": 0, "success": False, "error": str(e)}
