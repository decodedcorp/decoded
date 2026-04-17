import asyncio
from typing import Dict, Any, List, Optional
import logging
import json
import time
from src.database.models.batch import ProcessedDataBatch
from src.database.models.content import (
    LinkProcessingResult,
    ProcessingStatus,
)
from src.managers.redis._manager import RedisManager
from src.config._environment import Environment


class ResultAggregator:
    """Aggregates and sends processing results to backend"""

    def __init__(self, environment: Environment, redis_manager: RedisManager):
        self.environment = environment
        self.redis_manager = redis_manager
        self.logger = logging.getLogger(__name__)

        # Lazy import to avoid circular dependency
        from src.grpc.client.backend_client import GRPCBackendClient

        self.grpc_backend_client = GRPCBackendClient(
            host=environment.grpc_backend_host,
            port=environment.grpc_backend_port,
            logger=self.logger,
        )

    async def send_results_to_backend(
        self, processed_batch: ProcessedDataBatch, max_retries: int = 3
    ) -> bool:
        """
        Send processed batch results to backend via gRPC

        Args:
            processed_batch: Complete batch results
            max_retries: Maximum number of retry attempts

        Returns:
            True if successfully sent, False otherwise
        """
        batch_id = processed_batch.batch_id

        for attempt in range(max_retries):
            try:
                self.logger.info(f"Sending results for batch {batch_id} (attempt {attempt + 1})")

                # Convert batch to format expected by backend
                backend_data = self._convert_to_backend_format(processed_batch)

                # Send via gRPC
                async with self.grpc_backend_client as client:
                    success = await client.send_processed_batch(
                        batch_id=batch_id, batch_data=backend_data
                    )

                if success:
                    self.logger.info(f"Successfully sent results for batch {batch_id}")

                    # Store final batch results and update status to completed
                    await self._store_batch_results(batch_id, backend_data)
                    await self._store_batch_status(
                        batch_id=batch_id,
                        status="completed",
                        progress=1.0,
                        statistics=backend_data["statistics"],
                    )

                    return True
                else:
                    self.logger.warning(f"Backend rejected batch {batch_id}")

            except (ConnectionError, asyncio.TimeoutError) as e:
                backend_address = (
                    f"{self.environment.grpc_backend_host}:{self.environment.grpc_backend_port}"
                )
                self.logger.warning(
                    f"Connection timeout/error for batch {batch_id} on attempt {attempt + 1}: {str(e)}. "
                    f"Backend server at {backend_address} may be unreachable or slow to respond. "
                    f"Please verify: 1) Backend server is running, 2) Port {self.environment.grpc_backend_port} is accessible, "
                    f"3) Docker network configuration allows connection to host.docker.internal"
                )
                if attempt < max_retries - 1:
                    # Exponential backoff
                    wait_time = (2**attempt) * 2
                    self.logger.info(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.error(
                        f"Failed to send batch {batch_id} after {max_retries} attempts. "
                        f"Backend server at {backend_address} may be down or unreachable. "
                        f"Check Docker logs and network connectivity."
                    )
                    await self._store_batch_status(
                        batch_id=batch_id,
                        status="failed",
                        error_message=f"Connection failed after {max_retries} attempts: {str(e)}",
                    )
            except Exception as e:
                self.logger.error(
                    f"Failed to send batch {batch_id} on attempt {attempt + 1}: {str(e)}"
                )

                if attempt < max_retries - 1:
                    # Exponential backoff
                    wait_time = (2**attempt) * 2
                    self.logger.info(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.error(
                        f"Failed to send batch {batch_id} after {max_retries} attempts"
                    )

                    # Mark batch as failed if all retries exhausted
                    await self._store_batch_status(
                        batch_id=batch_id,
                        status="failed",
                        error_message=f"Failed to send results after {max_retries} attempts: {str(e)}",
                    )

        return False

    def _convert_to_backend_format(self, processed_batch: ProcessedDataBatch) -> Dict[str, Any]:
        """
        Convert ProcessedDataBatch to format expected by backend

        Args:
            processed_batch: Processed batch data

        Returns:
            Dictionary in backend-expected format with new processing results
        """
        backend_data = {
            "batch_id": processed_batch.batch_id,
            "processing_timestamp": int(asyncio.get_event_loop().time()),
            "statistics": {
                "total_count": processed_batch.statistics.total_count,
                "success_count": processed_batch.statistics.success_count,
                "partial_count": processed_batch.statistics.partial_count,
                "failed_count": processed_batch.statistics.failed_count,
                "processing_time_seconds": processed_batch.statistics.processing_time_seconds,
            },
            "results": [],
        }

        # Convert link processing results - send successful and partial items to backend
        for link_result in processed_batch.link_results:
            # Include successful and partial items in backend data for progressive enhancement
            if link_result.status in [ProcessingStatus.SUCCESS, ProcessingStatus.PARTIAL]:
                link_data = {
                    "item_id": link_result.item_id,
                    "url": link_result.url,
                    "type": "link",
                    "status": link_result.status.value,
                    "error_message": link_result.error_message,
                }

                metadata = link_result.metadata
                print(f"Metadata: {metadata}")
                if metadata:
                    # Build link_metadata with all required fields for backend
                    link_data["link_metadata"] = {
                        "link_type": metadata.link_type or "other",
                        "summary": metadata.summary or "",
                        "qna": [
                            {"question": q.question, "answer": q.answer}
                            for q in (metadata.qa_pairs or [])
                        ],
                        "keywords": metadata.keywords or [],
                        "metadata": metadata.metadata or {},
                    }

                backend_data["results"].append(link_data)

        # Convert image processing results - send successful and partial items to backend
        for image_result in processed_batch.image_results:
            # Include successful and partial items in backend data for progressive enhancement
            if image_result.status in [ProcessingStatus.SUCCESS, ProcessingStatus.PARTIAL]:
                image_data = {
                    "item_id": image_result.item_id,
                    "url": image_result.url,
                    "type": "image",
                    "status": image_result.status.value,
                    "error_message": image_result.error_message,
                }

                # Image metadata mapping (simplified)
                if image_result.metadata:
                    image_data["image_metadata"] = {
                        "summary": image_result.metadata.description or "",
                        # ... map other fields as needed
                    }

                backend_data["results"].append(image_data)

        return backend_data

    def generate_processing_summary(self, processed_batch: ProcessedDataBatch) -> Dict[str, Any]:
        """
        Generate a summary of the processing results for logging/monitoring
        """
        stats = processed_batch.statistics

        # Calculate success rates
        success_rate = (
            (stats.success_count / stats.total_count * 100) if stats.total_count > 0 else 0
        )
        partial_rate = (
            (stats.partial_count / stats.total_count * 100) if stats.total_count > 0 else 0
        )
        failed_rate = (stats.failed_count / stats.total_count * 100) if stats.total_count > 0 else 0

        # Count by type
        link_count = len(processed_batch.link_results)
        image_count = len(processed_batch.image_results)

        # Performance metrics
        avg_time_per_item = (
            stats.processing_time_seconds / stats.total_count if stats.total_count > 0 else 0
        )

        summary = {
            "batch_id": processed_batch.batch_id,
            "overview": {
                "total_items": stats.total_count,
                "links": link_count,
                "images": image_count,
                "processing_time_seconds": stats.processing_time_seconds,
                "avg_time_per_item_seconds": round(avg_time_per_item, 2),
            },
            "results": {
                "successful": stats.success_count,
                "partial": stats.partial_count,
                "failed": stats.failed_count,
                "success_rate_percent": round(success_rate, 1),
                "partial_rate_percent": round(partial_rate, 1),
                "failed_rate_percent": round(failed_rate, 1),
            },
            "performance": {
                "items_per_second": round(stats.total_count / stats.processing_time_seconds, 2)
                if stats.processing_time_seconds > 0
                else 0,
                "processing_efficiency": "excellent"
                if success_rate >= 90
                else "good"
                if success_rate >= 70
                else "needs_improvement",
            },
        }

        return summary

    async def store_results_locally(
        self, processed_batch: ProcessedDataBatch, storage_path: Optional[str] = None
    ) -> bool:
        # Implementation omitted for brevity (same as before)
        return True

    async def _store_batch_status(
        self,
        batch_id: str,
        status: str,
        progress: float = 0.0,
        statistics: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        estimated_completion_time: Optional[int] = None,
    ):
        """Store batch status in Redis"""
        status_data = {"status": status, "progress": progress, "updated_at": int(time.time())}

        if statistics:
            status_data["statistics"] = statistics
        if error_message:
            status_data["error_message"] = error_message
        if estimated_completion_time:
            status_data["estimated_completion_time"] = estimated_completion_time

        batch_key = f"batch_status:{batch_id}"
        await self.redis_manager.set(batch_key, json.dumps(status_data), ex=86400)  # 24 hours TTL

    async def _store_batch_results(self, batch_id: str, results: Dict[str, Any]):
        """Store batch results in Redis"""
        results_key = f"batch_results:{batch_id}"
        await self.redis_manager.set(results_key, json.dumps(results), ex=86400)  # 24 hours TTL

    async def update_batch_progress(
        self, batch_id: str, progress: float, status: str = "processing"
    ):
        """Update batch processing progress"""
        await self._store_batch_status(batch_id=batch_id, status=status, progress=progress)

    async def send_retry_updates_to_backend(
        self,
        updated_results: List[LinkProcessingResult],
        batch_id: str = "retry_updates",
        max_retries: int = 3,
    ) -> bool:
        """
        Send updated retry results to backend via gRPC
        """
        if not updated_results:
            return True

        for attempt in range(max_retries):
            try:
                self.logger.info(
                    f"Sending {len(updated_results)} retry updates to backend (attempt {attempt + 1})"
                )

                # Convert updated results to backend format using the same helper (but customized for updates)
                # For retry updates, we use _convert_retry_updates_to_backend_format
                backend_data = self._convert_retry_updates_to_backend_format(
                    updated_results, batch_id
                )

                # Send via gRPC
                async with self.grpc_backend_client as client:
                    success = await client.send_processed_batch(
                        batch_id=f"{batch_id}_{int(time.time())}",  # Unique batch ID
                        batch_data=backend_data,
                    )

                if success:
                    self.logger.info(f"Successfully sent {len(updated_results)} retry updates")
                    return True
                else:
                    self.logger.warning(f"Backend rejected retry updates on attempt {attempt + 1}")

            except Exception as e:
                self.logger.error(
                    f"Failed to send retry updates on attempt {attempt + 1}: {str(e)}"
                )
                if attempt < max_retries - 1:
                    wait_time = (2**attempt) * 2
                    await asyncio.sleep(wait_time)

        return False

    def _convert_retry_updates_to_backend_format(
        self, updated_results: List[LinkProcessingResult], batch_id: str
    ) -> Dict[str, Any]:
        """
        Convert retry update results to backend format
        """
        # Count status distribution
        success_count = sum(1 for r in updated_results if r.status == ProcessingStatus.SUCCESS)
        partial_count = sum(1 for r in updated_results if r.status == ProcessingStatus.PARTIAL)
        failed_count = sum(1 for r in updated_results if r.status == ProcessingStatus.FAILED)

        backend_data = {
            "batch_id": batch_id,
            "processing_timestamp": int(time.time()),
            "statistics": {
                "total_count": len(updated_results),
                "success_count": success_count,
                "partial_count": partial_count,
                "failed_count": failed_count,
                "processing_time_seconds": 0.0,
            },
            "results": [],
        }

        # Reuse logic for item conversion
        for link_result in updated_results:
            if link_result.status in [ProcessingStatus.SUCCESS, ProcessingStatus.PARTIAL]:
                link_data = {
                    "item_id": link_result.item_id,
                    "url": link_result.url,
                    "type": "link",
                    "status": link_result.status.value,
                    "error_message": link_result.error_message,
                }

                metadata = link_result.metadata
                if metadata:
                    # Build link_metadata with all required fields for backend
                    link_data["link_metadata"] = {
                        "link_type": metadata.link_type or "other",
                        "summary": metadata.summary or "",
                        "qna": [
                            {"question": q.question, "answer": q.answer}
                            for q in (metadata.qa_pairs or [])
                        ],
                        "keywords": metadata.keywords or [],
                        "metadata": metadata.metadata or {},
                    }

                backend_data["results"].append(link_data)

        return backend_data

    async def _store_retry_update_results(self, batch_id: str, results: Dict[str, Any]):
        """Store retry update results in Redis"""
        try:
            update_key = f"retry_updates:{batch_id}:{int(time.time())}"
            await self.redis_manager.set(
                update_key,
                json.dumps(results),
                ex=86400,  # 24 hours TTL
            )
        except Exception as e:
            self.logger.error(f"Failed to store retry update results: {str(e)}")
