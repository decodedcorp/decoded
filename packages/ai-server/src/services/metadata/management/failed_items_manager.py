import json
import time
from typing import List, Dict, Any, Optional
import logging
from dataclasses import dataclass
from enum import Enum
from src.managers.redis._manager import RedisManager


class ErrorType(Enum):
    """Error type enumeration for classification"""

    NETWORK_ERROR = "network_error"
    RATE_LIMIT = "rate_limit"
    INVALID_CONTENT = "invalid_content"
    LLM_SERVICE_DOWN = "service_down"
    TIMEOUT = "timeout"
    API_KEY_ERROR = "api_key_error"
    UNKNOWN = "unknown"


class ItemStatus(Enum):
    """Item status enumeration for retry management"""

    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class RetryItem:
    """Data class for retry items (both failed and partial)"""

    item_id: str
    url: str
    item_type: str  # "link" or "image"
    status: ItemStatus
    error_type: Optional[ErrorType] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    first_failed_at: float = None
    last_retry_at: float = None
    next_retry_at: float = None
    # Partial-specific fields
    missing_fields: List[str] = None
    retry_targets: List[str] = None
    current_metadata: Optional[Dict[str, Any]] = None
    priority: int = 5

    def __post_init__(self):
        if self.first_failed_at is None:
            self.first_failed_at = time.time()
        if self.missing_fields is None:
            self.missing_fields = []
        if self.retry_targets is None:
            self.retry_targets = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "item_id": self.item_id,
            "url": self.url,
            "item_type": self.item_type,
            "status": self.status.value,
            "error_type": self.error_type.value if self.error_type else None,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "first_failed_at": self.first_failed_at,
            "last_retry_at": self.last_retry_at,
            "next_retry_at": self.next_retry_at,
            "missing_fields": self.missing_fields,
            "retry_targets": self.retry_targets,
            "current_metadata": self.current_metadata,
            "priority": self.priority,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RetryItem":
        return cls(
            item_id=data["item_id"],
            url=data["url"],
            item_type=data["item_type"],
            status=ItemStatus(data["status"]),
            error_type=ErrorType(data["error_type"]) if data.get("error_type") else None,
            error_message=data.get("error_message"),
            retry_count=data.get("retry_count", 0),
            first_failed_at=data.get("first_failed_at"),
            last_retry_at=data.get("last_retry_at"),
            next_retry_at=data.get("next_retry_at"),
            missing_fields=data.get("missing_fields", []),
            retry_targets=data.get("retry_targets", []),
            current_metadata=data.get("current_metadata"),
            priority=data.get("priority", 5),
        )


class FailedItemsManager:
    """Manages both failed and partial items using Redis for persistence"""

    def __init__(self, redis_manager: RedisManager, max_retry_count: int = 5):
        self.redis_manager = redis_manager
        self.max_retry_count = max_retry_count
        self.logger = logging.getLogger(__name__)

        # Redis keys for both failed and partial items
        self.RETRY_ITEMS_KEY = "retry_items"  # Hash: item_id -> RetryItem data
        self.FAILED_QUEUE_KEY = "failed_retry_queue"  # Sorted Set: next_retry_at -> item_id
        self.PARTIAL_QUEUE_KEY = "partial_retry_queue"  # Sorted Set: priority -> item_id
        self.PROCESSING_KEY = "retry_processing"  # Set: items currently being processed
        self.PERMANENT_FAILED_KEY = "permanent_failed"  # Set: permanently failed item_ids

        # Retry policy settings
        self.base_delay = 60  # 1 minute base delay
        self.max_delay = 3600  # 1 hour max delay
        self.exponential_backoff = True

        # Permanent failure error types
        self.permanent_failure_errors = {ErrorType.INVALID_CONTENT, ErrorType.API_KEY_ERROR}

    async def add_failed_item(
        self,
        item_id: str,
        url: str,
        item_type: str,
        error_message: str,
        error_type: Optional[ErrorType] = None,
    ) -> bool:
        """
        Add a failed item to the manager

        Args:
            item_id: Unique identifier for the item
            url: URL that failed
            item_type: "link" or "image"
            error_message: Error message from the failure
            error_type: Classified error type

        Returns:
            True if added successfully, False otherwise
        """
        try:
            # Classify error type if not provided
            if error_type is None:
                error_type = self._classify_error(error_message)

            # Check if it's a permanent failure
            if error_type in self.permanent_failure_errors:
                await self._mark_permanent_failure(item_id, url, error_message)
                return True

            # Check if item already exists
            existing_data = await self.redis_manager.hget(self.RETRY_ITEMS_KEY, item_id)
            if existing_data:
                retry_item = RetryItem.from_dict(json.loads(existing_data))

                # Check if max retries exceeded
                if retry_item.retry_count >= self.max_retry_count:
                    await self._mark_permanent_failure(
                        item_id, url, f"Max retries ({self.max_retry_count}) exceeded"
                    )
                    return True

                # Update existing item
                retry_item.retry_count += 1
                retry_item.last_retry_at = time.time()
                retry_item.error_message = error_message  # Update with latest error
                retry_item.error_type = error_type
            else:
                # Create new failed item
                retry_item = RetryItem(
                    item_id=item_id,
                    url=url,
                    item_type=item_type,
                    status=ItemStatus.FAILED,
                    error_type=error_type,
                    error_message=error_message,
                )

            # Calculate next retry time
            retry_item.next_retry_at = self._calculate_next_retry_time(retry_item.retry_count)

            # Store in Redis
            await self.redis_manager.hset(
                self.RETRY_ITEMS_KEY, item_id, json.dumps(retry_item.to_dict())
            )

            # Add to retry queue
            await self.redis_manager.zadd(
                self.FAILED_QUEUE_KEY, {item_id: retry_item.next_retry_at}
            )

            self.logger.info(
                f"Added failed item {item_id} ({item_type}) to retry queue. "
                f"Retry count: {retry_item.retry_count}, Next retry: {time.ctime(retry_item.next_retry_at)}"
            )

            return True

        except Exception as e:
            self.logger.error(f"Error adding failed item {item_id}: {str(e)}")
            return False

    async def add_partial_item(
        self,
        item_id: str,
        url: str,
        item_type: str,
        missing_fields: List[str],
        current_metadata: Dict[str, Any],
        priority: int = 5,
    ) -> bool:
        """
        Add a partial item for selective retry

        Args:
            item_id: Unique identifier for the item
            url: URL that needs enhancement
            item_type: "link" or "image"
            missing_fields: List of fields that need enhancement
            current_metadata: Current partial metadata
            priority: Retry priority (1=highest, 10=lowest)

        Returns:
            True if added successfully, False otherwise
        """
        try:
            # Determine retry targets based on missing fields
            retry_targets = self._determine_retry_targets(missing_fields, current_metadata)

            # Create partial item
            retry_item = RetryItem(
                item_id=item_id,
                url=url,
                item_type=item_type,
                status=ItemStatus.PARTIAL,
                missing_fields=missing_fields,
                retry_targets=retry_targets,
                current_metadata=current_metadata,
                priority=priority,
            )

            # Store in Redis
            await self.redis_manager.hset(
                self.RETRY_ITEMS_KEY, item_id, json.dumps(retry_item.to_dict())
            )

            # Add to partial retry queue with priority as score
            await self.redis_manager.zadd(self.PARTIAL_QUEUE_KEY, {item_id: priority})

            self.logger.info(
                f"Added partial item {item_id} ({item_type}) for selective retry with targets: {retry_targets}"
            )

            return True

        except Exception as e:
            self.logger.error(f"Error adding partial item {item_id}: {str(e)}")
            return False

    async def get_failed_items_for_retry(self, max_items: int = 10) -> List[RetryItem]:
        """
        Get FAILED items that are ready for retry

        Args:
            max_items: Maximum number of items to return

        Returns:
            List of RetryItem objects ready for retry
        """
        try:
            current_time = time.time()

            # Get items from failed retry queue that are ready
            ready_items = await self.redis_manager.zrangebyscore(
                self.FAILED_QUEUE_KEY, min_score=0, max_score=current_time, start=0, num=max_items
            )

            if not ready_items:
                return []

            # Get full item data
            retry_items = []
            for item_id in ready_items:
                item_data = await self.redis_manager.hget(self.RETRY_ITEMS_KEY, item_id)
                if item_data:
                    retry_item = RetryItem.from_dict(json.loads(item_data))
                    if retry_item.status == ItemStatus.FAILED:
                        retry_items.append(retry_item)
                else:
                    # Clean up orphaned queue entry
                    await self.redis_manager.zrem(self.FAILED_QUEUE_KEY, item_id)

            return retry_items

        except Exception as e:
            self.logger.error(f"Error getting failed items for retry: {str(e)}")
            return []

    async def get_partial_items_for_retry(self, max_items: int = 10) -> List[RetryItem]:
        """
        Get PARTIAL items for selective retry (highest priority first)

        Args:
            max_items: Maximum number of items to return

        Returns:
            List of RetryItem objects ready for selective retry
        """
        try:
            # Get items with lowest priority scores (highest priority)
            ready_items = await self.redis_manager.zrangebyscore(
                self.PARTIAL_QUEUE_KEY, min_score=0, max_score=10, start=0, num=max_items
            )

            if not ready_items:
                return []

            # Get full item data
            retry_items = []
            for item_id in ready_items:
                item_data = await self.redis_manager.hget(self.RETRY_ITEMS_KEY, item_id)
                if item_data:
                    retry_item = RetryItem.from_dict(json.loads(item_data))
                    if retry_item.status == ItemStatus.PARTIAL:
                        retry_items.append(retry_item)
                        # Move to processing set to avoid duplicate processing
                        await self.redis_manager.sadd(self.PROCESSING_KEY, item_id)
                        await self.redis_manager.zrem(self.PARTIAL_QUEUE_KEY, item_id)
                else:
                    # Clean up orphaned queue entry
                    await self.redis_manager.zrem(self.PARTIAL_QUEUE_KEY, item_id)

            return retry_items

        except Exception as e:
            self.logger.error(f"Error getting partial items for retry: {str(e)}")
            return []

    # Legacy compatibility method
    async def get_items_for_retry(self, max_items: int = 10) -> List[RetryItem]:
        """Legacy method for backward compatibility - returns failed items"""
        return await self.get_failed_items_for_retry(max_items)

    async def mark_retry_success(self, item_id: str) -> bool:
        """
        Mark an item as successfully processed after retry

        Args:
            item_id: Item identifier

        Returns:
            True if marked successfully, False otherwise
        """
        try:
            # Remove from all retry structures
            await self.redis_manager.hdel(self.RETRY_ITEMS_KEY, item_id)
            await self.redis_manager.zrem(self.FAILED_QUEUE_KEY, item_id)
            await self.redis_manager.zrem(self.PARTIAL_QUEUE_KEY, item_id)
            await self.redis_manager.srem(self.PROCESSING_KEY, item_id)

            self.logger.info(f"Successfully processed item {item_id} after retry")
            return True

        except Exception as e:
            self.logger.error(f"Error marking retry success for {item_id}: {str(e)}")
            return False

    async def mark_retry_failed(self, item_id: str, error_message: str) -> bool:
        """
        Mark a retry attempt as failed

        Args:
            item_id: Item identifier
            error_message: Latest error message

        Returns:
            True if marked successfully, False otherwise
        """
        try:
            item_data = await self.redis_manager.hget(self.RETRY_ITEMS_KEY, item_id)
            if not item_data:
                self.logger.warning(f"Item {item_id} not found in retry items")
                return False

            retry_item = RetryItem.from_dict(json.loads(item_data))

            # Check if max retries exceeded
            if retry_item.retry_count >= self.max_retry_count:
                await self._mark_permanent_failure(
                    item_id,
                    retry_item.url,
                    f"Max retries ({self.max_retry_count}) exceeded. Last error: {error_message}",
                )
                return True

            # Update retry information
            retry_item.retry_count += 1
            retry_item.last_retry_at = time.time()
            retry_item.error_message = error_message

            # Different handling based on item status
            if retry_item.status == ItemStatus.FAILED:
                retry_item.next_retry_at = self._calculate_next_retry_time(retry_item.retry_count)
                # Update in Redis
                await self.redis_manager.hset(
                    self.RETRY_ITEMS_KEY, item_id, json.dumps(retry_item.to_dict())
                )
                # Update failed retry queue
                await self.redis_manager.zadd(
                    self.FAILED_QUEUE_KEY, {item_id: retry_item.next_retry_at}
                )
            else:  # PARTIAL item
                # For partial items, re-add to queue with lower priority if retry count < 3
                if retry_item.retry_count < 3:
                    new_priority = min(10, retry_item.priority + 1)
                    retry_item.priority = new_priority
                    await self.redis_manager.hset(
                        self.RETRY_ITEMS_KEY, item_id, json.dumps(retry_item.to_dict())
                    )
                    await self.redis_manager.zadd(self.PARTIAL_QUEUE_KEY, {item_id: new_priority})
                else:
                    # Max retries for partial - just remove it
                    await self.mark_retry_success(item_id)

            # Remove from processing set
            await self.redis_manager.srem(self.PROCESSING_KEY, item_id)

            self.logger.info(
                f"Updated retry item {item_id} ({retry_item.status.value}). Retry count: {retry_item.retry_count}"
            )

            return True

        except Exception as e:
            self.logger.error(f"Error marking retry failed for {item_id}: {str(e)}")
            return False

    async def complete_partial_processing(
        self, item_id: str, success: bool, updated_metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Complete processing for a partial item

        Args:
            item_id: Item identifier
            success: Whether the retry was successful
            updated_metadata: Updated metadata if successful

        Returns:
            True if completed successfully
        """
        try:
            if success:
                if updated_metadata:
                    # Update metadata in Redis before marking success
                    item_data = await self.redis_manager.hget(self.RETRY_ITEMS_KEY, item_id)
                    if item_data:
                        retry_item = RetryItem.from_dict(json.loads(item_data))
                        retry_item.current_metadata = updated_metadata
                        await self.redis_manager.hset(
                            self.RETRY_ITEMS_KEY, item_id, json.dumps(retry_item.to_dict())
                        )
                await self.mark_retry_success(item_id)
            else:
                await self.mark_retry_failed(item_id, "Partial enhancement failed")

            return True

        except Exception as e:
            self.logger.error(f"Error completing partial processing for {item_id}: {str(e)}")
            return False

    async def get_retry_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive statistics about retry items

        Returns:
            Dictionary with statistics
        """
        try:
            total_items = await self.redis_manager.hlen(self.RETRY_ITEMS_KEY)
            failed_in_queue = await self.redis_manager.zcard(self.FAILED_QUEUE_KEY)
            partial_in_queue = await self.redis_manager.zcard(self.PARTIAL_QUEUE_KEY)
            currently_processing = await self.redis_manager.scard(self.PROCESSING_KEY)
            total_permanent = await self.redis_manager.scard(self.PERMANENT_FAILED_KEY)

            # Count ready for retry
            current_time = time.time()
            failed_ready_for_retry = await self.redis_manager.zcount(
                self.FAILED_QUEUE_KEY, 0, current_time
            )

            return {
                "total_retry_items": total_items,
                "failed_items_in_queue": failed_in_queue,
                "partial_items_in_queue": partial_in_queue,
                "currently_processing": currently_processing,
                "permanent_failures": total_permanent,
                "failed_ready_for_retry": failed_ready_for_retry,
                "failed_waiting_for_retry": failed_in_queue - failed_ready_for_retry,
            }

        except Exception as e:
            self.logger.error(f"Error getting retry stats: {str(e)}")
            return {}

    # Legacy compatibility method
    async def get_failed_items_stats(self) -> Dict[str, Any]:
        """Legacy method for backward compatibility"""
        return await self.get_retry_stats()

    async def cleanup_old_items(self, max_age_days: int = 7) -> int:
        """
        Clean up old retry items

        Args:
            max_age_days: Maximum age in days for items to keep

        Returns:
            Number of items cleaned up
        """
        try:
            cutoff_time = time.time() - (max_age_days * 24 * 60 * 60)
            cleaned_count = 0

            # Get all retry items
            all_items = await self.redis_manager.hgetall(self.RETRY_ITEMS_KEY)

            for item_id, item_data in all_items.items():
                try:
                    retry_item = RetryItem.from_dict(json.loads(item_data))

                    if retry_item.first_failed_at < cutoff_time:
                        # Remove from all Redis structures
                        await self.redis_manager.hdel(self.RETRY_ITEMS_KEY, item_id)
                        await self.redis_manager.zrem(self.FAILED_QUEUE_KEY, item_id)
                        await self.redis_manager.zrem(self.PARTIAL_QUEUE_KEY, item_id)
                        await self.redis_manager.srem(self.PROCESSING_KEY, item_id)
                        cleaned_count += 1

                except Exception as e:
                    self.logger.warning(f"Error processing item {item_id} during cleanup: {e}")
                    continue

            self.logger.info(f"Cleaned up {cleaned_count} old retry items")
            return cleaned_count

        except Exception as e:
            self.logger.error(f"Error during cleanup: {str(e)}")
            return 0

    def _determine_retry_targets(
        self, missing_fields: List[str], current_metadata: Dict[str, Any]
    ) -> List[str]:
        """
        Determine what specifically needs to be retried for this partial item

        Args:
            missing_fields: List of missing fields
            current_metadata: Current partial metadata

        Returns:
            List of retry targets
        """
        targets = []

        # LLM enhancement needed
        if not current_metadata.get("llm_enhanced", False):
            if "summary" in missing_fields:
                targets.append("llm_summary")
            if "qa_pairs" in missing_fields:
                targets.append("llm_qa")
            if "category" in missing_fields:
                targets.append("llm_category")

        # Image search needed
        if "og_image" in missing_fields and not current_metadata.get("search_enhanced", False):
            targets.append("image_search")

        # OG extraction retry (if completely failed)
        if not current_metadata.get("og_extraction_success", False):
            targets.append("og_extraction")

        return targets if targets else ["full_retry"]  # Fallback to full retry

    def _classify_error(self, error_message: str) -> ErrorType:
        """
        Classify error type based on error message

        Args:
            error_message: Error message to classify

        Returns:
            ErrorType enum value
        """
        error_lower = error_message.lower()

        if "timeout" in error_lower or "timed out" in error_lower:
            return ErrorType.TIMEOUT
        elif "rate limit" in error_lower or "429" in error_lower:
            return ErrorType.RATE_LIMIT
        elif "network" in error_lower or "connection" in error_lower:
            return ErrorType.NETWORK_ERROR
        elif "api key" in error_lower or "unauthorized" in error_lower or "401" in error_lower:
            return ErrorType.API_KEY_ERROR
        elif "invalid" in error_lower or "bad request" in error_lower or "400" in error_lower:
            return ErrorType.INVALID_CONTENT
        elif "service" in error_lower or "503" in error_lower or "502" in error_lower:
            return ErrorType.LLM_SERVICE_DOWN
        else:
            return ErrorType.UNKNOWN

    def _calculate_next_retry_time(self, retry_count: int) -> float:
        """
        Calculate next retry time using exponential backoff

        Args:
            retry_count: Current retry count

        Returns:
            Unix timestamp for next retry
        """
        if self.exponential_backoff:
            delay = min(self.base_delay * (2**retry_count), self.max_delay)
        else:
            delay = self.base_delay

        return time.time() + delay

    async def _mark_permanent_failure(self, item_id: str, url: str, reason: str) -> None:
        """
        Mark an item as permanently failed

        Args:
            item_id: Item identifier
            url: Item URL
            reason: Reason for permanent failure
        """
        try:
            # Add to permanent failures set
            await self.redis_manager.sadd(self.PERMANENT_FAILED_KEY, item_id)

            # Remove from all retry structures
            await self.redis_manager.hdel(self.RETRY_ITEMS_KEY, item_id)
            await self.redis_manager.zrem(self.FAILED_QUEUE_KEY, item_id)
            await self.redis_manager.zrem(self.PARTIAL_QUEUE_KEY, item_id)
            await self.redis_manager.srem(self.PROCESSING_KEY, item_id)

            self.logger.warning(f"Marked item {item_id} ({url}) as permanent failure: {reason}")

        except Exception as e:
            self.logger.error(f"Error marking permanent failure for {item_id}: {str(e)}")


# Legacy alias for backward compatibility
UnifiedRetryManager = FailedItemsManager
# Legacy alias for the data class
FailedItem = RetryItem
