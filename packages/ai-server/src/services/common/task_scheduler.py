import asyncio
import time
from typing import Dict, Any, Optional, Callable
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR, EVENT_JOB_SUBMITTED


class TaskScheduler:
    """Async task scheduler using APScheduler internally"""
    
    def __init__(self):
        # Configure APScheduler logging
        apscheduler_logger = logging.getLogger('apscheduler')
        apscheduler_logger.setLevel(logging.INFO)
        
        # Don't specify event_loop here - let APScheduler use the current loop when start() is called
        # This ensures the scheduler runs in the correct event loop context
        self.scheduler = AsyncIOScheduler()
        self.logger = logging.getLogger(__name__)
        
        # Statistics
        self.stats = {
            "scheduler_starts": 0,
            "total_task_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "last_run_time": None
        }
        
        # Track task intervals for get_status
        self._task_intervals: Dict[str, int] = {}
        
        # Setup event listeners for statistics
        self.scheduler.add_listener(self._on_job_submitted, EVENT_JOB_SUBMITTED)
        self.scheduler.add_listener(self._on_job_executed, EVENT_JOB_EXECUTED)
        self.scheduler.add_listener(self._on_job_error, EVENT_JOB_ERROR)

    def _on_job_submitted(self, event):
        """Handle job submission (when job starts executing)"""
        self.logger.debug(f"Job '{event.job_id}' submitted for execution")

    def _on_job_executed(self, event):
        """Handle successful job execution"""
        self.stats["total_task_executions"] += 1
        self.stats["successful_executions"] += 1
        self.stats["last_run_time"] = time.time()
        self.logger.info(f"Job '{event.job_id}' executed successfully")

    def _on_job_error(self, event):
        """Handle job execution error"""
        self.stats["total_task_executions"] += 1
        self.stats["failed_executions"] += 1
        self.stats["last_run_time"] = time.time()
        error_msg = str(event.exception) if event.exception else "Unknown error"
        self.logger.error(f"Job '{event.job_id}' failed: {error_msg}")

    def register_task(self, name: str, task_func: Callable, interval: int) -> bool:
        """
        Register a task to be executed periodically
        
        Args:
            name: Unique task name
            task_func: Async function to execute (can be partial-wrapped)
            interval: Execution interval in seconds
            
        Returns:
            True if registered successfully, False if task already exists
        """
        try:
            # Check if job already exists
            if self.scheduler.get_job(name):
                self.logger.warning(f"Task '{name}' already registered, skipping")
                return False
            
            # Create async wrapper to ensure APScheduler recognizes it as async
            # This is needed because functools.partial breaks asyncio.iscoroutinefunction()
            async def async_wrapper():
                try:
                    if asyncio.iscoroutinefunction(task_func):
                        result = await task_func()
                    else:
                        # Handle partial-wrapped functions
                        result = task_func()
                        # If result is a coroutine, await it
                        if asyncio.iscoroutine(result):
                            result = await result
                    return result
                except Exception as e:
                    self.logger.error(f"Error executing task '{name}': {e}", exc_info=True)
                    raise
            
            # Add job to APScheduler with the async wrapper
            # max_instances=1: 동시에 1개 인스턴스만 실행 (기본값이지만 명시적으로 설정)
            # coalesce=True: 여러 실행이 쌓여도 하나만 실행
            # misfire_grace_time: 작업이 예정 시간을 지나도 실행 허용 시간 (초)
            self.scheduler.add_job(
                async_wrapper,
                "interval",
                seconds=interval,
                id=name,
                replace_existing=True,
                max_instances=1,
                coalesce=True,
                misfire_grace_time=interval  # 간격만큼의 유예 시간 제공
            )
            
            # Store interval for get_status
            self._task_intervals[name] = interval
            
            self.logger.info(f"Registered task '{name}' with {interval}s interval")
            return True
            
        except Exception as e:
            self.logger.error(f"Error registering task '{name}': {str(e)}", exc_info=True)
            return False

    def unregister_task(self, name: str) -> bool:
        """
        Unregister a task
        
        Args:
            name: Task name to remove
            
        Returns:
            True if removed successfully, False if task not found
        """
        try:
            job = self.scheduler.get_job(name)
            if job:
                self.scheduler.remove_job(name)
                if name in self._task_intervals:
                    del self._task_intervals[name]
                self.logger.info(f"Unregistered task '{name}'")
                return True
            else:
                self.logger.warning(f"Task '{name}' not found for unregistration")
                return False
        except Exception as e:
            self.logger.error(f"Error unregistering task '{name}': {str(e)}")
            return False

    def start_scheduler(self) -> bool:
        """
        Start the task scheduler
        
        Returns:
            True if started successfully, False if already running
        """
        if self.scheduler.running:
            self.logger.warning("Task scheduler is already running")
            return False
        
        jobs = self.scheduler.get_jobs()
        if not jobs:
            self.logger.warning("No tasks registered, scheduler not started")
            return False
        
        try:
            # APScheduler.start() is synchronous, not async
            self.scheduler.start()
            self.stats["scheduler_starts"] += 1
            
            task_names = [job.id for job in jobs]
            self.logger.info(f"Task scheduler started with {len(task_names)} tasks: {task_names}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error starting task scheduler: {str(e)}", exc_info=True)
            return False

    async def stop_scheduler(self) -> bool:
        """
        Stop the task scheduler
        
        Returns:
            True if stopped successfully, False if not running
        """
        if not self.scheduler.running:
            self.logger.warning("Task scheduler is not running")
            return False
        
        try:
            self.scheduler.shutdown(wait=True)
            self.logger.info("Task scheduler stopped")
            return True
            
        except Exception as e:
            self.logger.error(f"Error stopping task scheduler: {str(e)}")
            return False

    def get_status(self) -> Dict[str, Any]:
        """
        Get scheduler status and statistics
        
        Returns:
            Dictionary with scheduler status
        """
        task_status = {}
        current_time = time.time()
        
        jobs = self.scheduler.get_jobs()
        for job in jobs:
            job_id = job.id
            interval = self._task_intervals.get(job_id, 0)
            
            # Get next run time from APScheduler
            next_run = job.next_run_time.timestamp() if job.next_run_time else current_time
            
            # Calculate last run time (approximate from next_run and interval)
            last_run = None
            if job.next_run_time and interval > 0:
                last_run = next_run - interval
            
            task_status[job_id] = {
                "interval_seconds": interval,
                "last_run": last_run,
                "next_run": next_run,
                "overdue": next_run < current_time if last_run else False
            }
        
        return {
            "running": self.scheduler.running,
            "total_tasks": len(jobs),
            "statistics": self.stats.copy(),
            "tasks": task_status
        }

    async def execute_task_manually(self, name: str) -> Dict[str, Any]:
        """
        Manually execute a specific task (for testing/debugging)
        
        Args:
            name: Task name to execute
            
        Returns:
            Dictionary with execution result
        """
        job = self.scheduler.get_job(name)
        if not job:
            return {
                "success": False,
                "error": f"Task '{name}' not found",
                "task_name": name
            }
        
        start_time = time.time()
        try:
            self.logger.debug(f"Manually executing task: {name}")
            
            # Run the job manually - handle both sync and async functions
            task_func = job.func
            if asyncio.iscoroutinefunction(task_func):
                result = await task_func()
            else:
                result = task_func()
            
            duration = time.time() - start_time
            
            self.logger.info(f"Task '{name}' executed manually in {duration:.2f}s")
            
            return {
                "success": True,
                "duration": duration,
                "task_name": name,
                "result": result if isinstance(result, dict) else {"data": result}
            }
            
        except Exception as e:
            duration = time.time() - start_time
            error_msg = str(e)
            
            self.logger.error(f"Task '{name}' failed after {duration:.2f}s: {error_msg}")
            
            return {
                "success": False,
                "duration": duration,
                "task_name": name,
                "error": error_msg
            }
