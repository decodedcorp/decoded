"""
ARQ Worker configuration and initialization
"""
import logging
from typing import Dict, Any
from arq import create_pool
from arq.connections import RedisSettings
from arq.worker import Worker, func

logger = logging.getLogger(__name__)


def _get_functions():
    """Lazy-load job functions to avoid circular imports."""
    from src.services.metadata.core.metadata_extract_service import MetadataExtractService
    from src.services.post_editorial.post_editorial_service import PostEditorialService

    return [
        func(MetadataExtractService.analyze_link_job, name="analyze_link_job"),
        func(
            PostEditorialService.post_editorial_job,
            name="post_editorial_job",
            max_tries=1,
        ),
    ]


class WorkerSettings:
    """
    ARQ Worker settings configuration

    This class defines the ARQ worker configuration including:
    - Redis connection settings
    - Job functions to register
    - Worker behavior (max_jobs, timeout, etc.)
    """
    
    # Worker behavior settings
    # max_jobs=1: post_editorial jobs call Gemini/Perplexity heavily; concurrent runs hit API rate limits
    max_jobs = 1
    job_timeout = 600  # Job timeout in seconds (10 min for post_editorial)
    keep_result = 3600  # Keep job results for 1 hour
    
    # Health check interval
    health_check_interval = 60  # seconds
    
    # Queue name
    queue_name = "arq:queue"
    
    @classmethod
    def create_redis_settings(cls, environment) -> RedisSettings:
        """
        Create Redis settings from environment configuration
        
        Args:
            environment: Environment configuration object
            
        Returns:
            RedisSettings configured for ARQ
        """
        return RedisSettings(
            host=environment.REDIS_HOST,
            port=environment.REDIS_PORT,
            password=environment.REDIS_PASSWORD or None,
            database=environment.REDIS_DB
        )


async def create_worker(environment, metadata_container) -> Worker:
    """
    Create and configure an ARQ worker with injected dependencies
    
    This function:
    1. Creates Redis connection settings from environment
    2. Gets required services from the metadata container
    3. Creates a context dictionary for job access
    4. Initializes and returns the ARQ worker
    
    Args:
        environment: Environment configuration object
        metadata_container: Metadata service container for dependency injection
        
    Returns:
        Configured ARQ Worker instance
    """
    try:
        logger.info("Initializing ARQ worker...")
        
        # Create Redis settings
        redis_settings = WorkerSettings.create_redis_settings(environment)
        
        # Get services from container for job context
        metadata_extract_service = metadata_container.metadata_extract_service()
        failed_items_manager = metadata_container.failed_items_manager()
        result_batch_service = metadata_container.result_batch_service()

        # Create context dictionary that will be available to all jobs
        ctx = {
            'metadata_extract_service': metadata_extract_service,
            'failed_items_manager': failed_items_manager,
            'result_batch_service': result_batch_service,
            'environment': environment,
        }
        
        # Create worker with settings
        worker = Worker(
            functions=_get_functions(),
            redis_settings=redis_settings,
            max_jobs=WorkerSettings.max_jobs,
            job_timeout=WorkerSettings.job_timeout,
            keep_result=WorkerSettings.keep_result,
            health_check_interval=WorkerSettings.health_check_interval,
            queue_name=WorkerSettings.queue_name,
            ctx=ctx,
        )
        
        logger.info(
            f"ARQ worker initialized successfully - "
            f"max_jobs: {WorkerSettings.max_jobs}, "
            f"timeout: {WorkerSettings.job_timeout}s, "
            f"queue: {WorkerSettings.queue_name}"
        )
        
        return worker
        
    except Exception as e:
        logger.error(f"Failed to create ARQ worker: {str(e)}", exc_info=True)
        raise


async def get_arq_pool(environment):
    """
    Create an ARQ connection pool for enqueueing jobs
    
    This is used by the application to enqueue jobs to the ARQ queue.
    The worker consumes jobs from this queue.
    
    Args:
        environment: Environment configuration object
        
    Returns:
        ARQ connection pool (ArqRedis instance)
    """
    try:
        redis_settings = WorkerSettings.create_redis_settings(environment)
        pool = await create_pool(redis_settings)
        logger.info("ARQ connection pool created successfully")
        return pool
    except Exception as e:
        logger.error(f"Failed to create ARQ connection pool: {str(e)}", exc_info=True)
        raise
