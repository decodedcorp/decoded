"""
Generic Queue Manager for ARQ job processing

This module provides a generic queue management infrastructure that can be used
by any service in the application. It abstracts ARQ pool management and provides
a simple interface for enqueueing jobs.
"""

from __future__ import annotations

import logging
from typing import Optional, Dict, Any


class QueueManager:
    """
    Generic queue management infrastructure

    This class provides a service-agnostic queue management interface.
    It can be used by any service to enqueue jobs without knowing the
    underlying queue implementation details.

    Attributes:
        environment: Environment configuration object
        logger: Logger instance
        pool: ARQ connection pool (initialized after init_pool() is called)
    """

    def __init__(self, environment, logger=None):
        """
        Initialize QueueManager

        Args:
            environment: Environment configuration object
            logger: Optional logger instance
        """
        self.environment = environment
        self.logger = logger or logging.getLogger(__name__)
        self.pool = None

    async def init_pool(self):
        """
        Initialize ARQ connection pool

        This must be called before enqueueing any jobs.
        Typically called during application startup.

        Raises:
            Exception: If pool initialization fails
        """
        if self.pool is not None:
            self.logger.warning("QueueManager pool already initialized")
            return

        try:
            from .worker import get_arq_pool

            self.pool = await get_arq_pool(self.environment)
            self.logger.info("QueueManager initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize QueueManager: {str(e)}", exc_info=True)
            raise

    async def enqueue_job(self, job_name: str, *args, **kwargs) -> Optional[str]:
        """
        Enqueue a job to the ARQ queue

        This is a generic method that can enqueue any job by name.
        The job must be registered with the ARQ worker.

        Args:
            job_name: Name of the job function (e.g., "analyze_link_job")
            *args: Positional arguments to pass to the job
            **kwargs: Keyword arguments to pass to the job

        Returns:
            Job ID if successfully enqueued, None otherwise

        Raises:
            ValueError: If pool is not initialized
            Exception: If enqueue fails
        """
        if not self.pool:
            raise ValueError(
                "QueueManager pool is not initialized. Call init_pool() before enqueueing jobs."
            )

        try:
            job = await self.pool.enqueue_job(job_name, *args, **kwargs)
            job_id = job.job_id if job else None

            if job_id:
                self.logger.debug(f"Enqueued job '{job_name}' with ID: {job_id}")
            else:
                self.logger.warning(f"Failed to enqueue job '{job_name}': No job ID returned")

            return job_id
        except Exception as e:
            self.logger.error(f"Failed to enqueue job '{job_name}': {str(e)}", exc_info=True)
            raise

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a job

        Args:
            job_id: Job ID to check

        Returns:
            Dictionary with job status information, or None if job not found
        """
        if not self.pool:
            raise ValueError("QueueManager pool is not initialized")

        try:
            # ARQ job status retrieval
            # Note: ARQ stores job results in Redis with key pattern: arq:result:{job_id}
            # This is a simplified implementation - can be extended as needed
            job_result = await self.pool.get_job_result(job_id)

            if job_result is None:
                return None

            return {
                "job_id": job_id,
                "status": "completed" if job_result else "pending",
                "result": job_result,
            }
        except Exception as e:
            self.logger.error(f"Failed to get job status for {job_id}: {str(e)}")
            return None

    async def close(self):
        """
        Close the ARQ connection pool

        This should be called during application shutdown to properly
        clean up resources.
        """
        if self.pool:
            try:
                await self.pool.close()
                self.logger.info("QueueManager pool closed successfully")
            except Exception as e:
                self.logger.error(f"Error closing QueueManager pool: {str(e)}")
            finally:
                self.pool = None
