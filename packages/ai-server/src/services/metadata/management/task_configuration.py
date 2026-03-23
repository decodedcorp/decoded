"""
Task configuration for metadata services
"""
from functools import partial
from src.services.common.task_scheduler import TaskScheduler
from src.services.metadata.management.failed_items_manager import FailedItemsManager
from src.services.metadata.core import MetadataExtractService, ResultBatchService
from src.services.metadata.management import tasks


def configure_metadata_tasks(
    scheduler: TaskScheduler,
    unified_retry_manager: FailedItemsManager,  # Using alias name for backward compatibility
    metadata_extract_service: MetadataExtractService,
    result_batch_service: ResultBatchService
) -> None:
    """Configure and register all metadata-related tasks using unified retry manager"""
    
    # Register retry task (every 1 minute)
    retry_task = partial(
        tasks.retry_failed_items,
        unified_retry_manager=unified_retry_manager,
        metadata_extract_service=metadata_extract_service,
        batch_size=5,
        max_concurrent_retries=3
    )
    scheduler.register_task("retry_failed_items", retry_task, 60)

    # Register cleanup task (every 6 hours)
    cleanup_task = partial(
        tasks.cleanup_old_failed_items,
        unified_retry_manager=unified_retry_manager,
        max_age_days=7
    )
    scheduler.register_task("cleanup_old_items", cleanup_task, 21600)

    # Register stats task (every 5 minutes)
    stats_task = partial(
        tasks.get_failed_items_stats,
        unified_retry_manager=unified_retry_manager
    )
    scheduler.register_task("failed_items_stats", stats_task, 300)

    # Register partial retry task (every 2 minutes) - now using unified manager
    partial_retry_task = partial(
        tasks.process_partial_retries,
        unified_retry_manager=unified_retry_manager,
        metadata_extract_service=metadata_extract_service,
        batch_size=10
    )
    scheduler.register_task("process_partial_retries", partial_retry_task, 120)
    
    # Register partial stats task (every 5 minutes) - now using unified manager
    partial_stats_task = partial(
        tasks.get_partial_retry_stats,
        unified_retry_manager=unified_retry_manager
    )
    scheduler.register_task("partial_retry_stats", partial_stats_task, 300)
    
    # Register batch flush task (every 30 seconds by default)
    flush_task = partial(
        tasks.flush_pending_results,
        result_batch_service=result_batch_service,
        batch_size=result_batch_service.batch_size
    )
    flush_interval = result_batch_service.environment.BATCH_FLUSH_INTERVAL
    scheduler.register_task("flush_pending_results", flush_task, flush_interval)
    
    # NOTE: AI analysis queue processing has been migrated to ARQ worker
    # The process_ai_analysis_queue task has been removed and replaced with
    # event-driven ARQ job processing in src/managers/queue/