import os
import asyncio
import uvicorn
from grpc import aio
from src.app import create_app
from src.config._container import Application
from src.grpc.proto.inbound import inbound_pb2_grpc
from src.services.common.task_scheduler import TaskScheduler
from src.services.metadata.management.task_configuration import configure_metadata_tasks
from src.managers.queue.worker import create_worker
from src.services.raw_posts.scheduler import RawPostsScheduler


async def start_api_server() -> None:
    app = create_app()
    config = uvicorn.Config(app, host="0.0.0.0", port=10000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


async def start_grpc_server(grpc_container, host: str, port: int) -> None:
    """Start GRPC server with all registered servicers"""
    server = aio.server()

    # Register servicers directly
    metadata_servicer = grpc_container.metadata_servicer()
    inbound_pb2_grpc.add_QueueServicer_to_server(metadata_servicer, server)

    # #214 RawPostsWorker removed — raw_posts scheduler lives in-process.

    listen_addr = f"{host}:{port}"
    server.add_insecure_port(listen_addr)

    await server.start()
    await server.wait_for_termination()


async def start_task_scheduler(metadata_container) -> None:
    """Start the task scheduler with all registered tasks"""
    task_scheduler = None
    shutdown_event = asyncio.Event()

    try:
        # Create TaskScheduler directly
        task_scheduler = TaskScheduler()

        # Get required services from container
        failed_items_manager = metadata_container.failed_items_manager()
        metadata_extract_service = metadata_container.metadata_extract_service()
        result_batch_service = metadata_container.result_batch_service()

        # Configure tasks
        configure_metadata_tasks(
            task_scheduler, failed_items_manager, metadata_extract_service, result_batch_service
        )

        # Start the scheduler (APScheduler.start() is synchronous, not async)
        started = task_scheduler.start_scheduler()
        if not started:
            return

        # Keep the coroutine alive while scheduler is running
        # APScheduler runs in the background, so we just wait until shutdown
        await shutdown_event.wait()

    except asyncio.CancelledError:
        if task_scheduler:
            await task_scheduler.stop_scheduler()
        shutdown_event.set()
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Error in task scheduler: {str(e)}", exc_info=True)
        if task_scheduler:
            await task_scheduler.stop_scheduler()
        shutdown_event.set()


async def start_raw_posts_scheduler(
    raw_posts_container, shutdown_event: asyncio.Event
) -> None:
    """#214 — start APScheduler-driven raw_posts dispatcher, keep coroutine alive."""
    import logging

    logger = logging.getLogger(__name__)
    scheduler: RawPostsScheduler = raw_posts_container.scheduler()
    try:
        scheduler.start()
        await shutdown_event.wait()
    except asyncio.CancelledError:
        pass
    except Exception:
        logger.exception("raw_posts scheduler crashed")
    finally:
        await scheduler.shutdown()


async def start_arq_worker(
    environment, metadata_container, infrastructure_container
) -> None:
    """
    Start ARQ worker for processing async jobs

    This worker handles link analysis jobs that are enqueued via the AnalyzeLink RPC.
    It processes jobs from the ARQ queue and sends results back to the backend.
    """
    import logging

    logger = logging.getLogger(__name__)

    worker = None
    try:
        # Create worker with injected dependencies (incl. DatabaseManager for post_editorial)
        worker = await create_worker(
            environment,
            metadata_container,
            infrastructure_container=infrastructure_container,
        )

        # Initialize QueueManager (NEW - replaces service.initialize_arq_pool)
        queue_manager = infrastructure_container.queue_manager()
        await queue_manager.init_pool()

        logger.info("ARQ worker and queue manager initialized successfully")

        # Run the worker (this blocks until shutdown)
        await worker.async_run()

    except asyncio.CancelledError:
        logger.info("ARQ worker shutdown requested")
        if worker:
            await worker.close()
    except Exception as e:
        logger.error(f"Error in ARQ worker: {str(e)}", exc_info=True)
        if worker:
            await worker.close()
        raise


async def main():
    app = Application()
    logger = app.logger()
    environment = app.environment()
    env = environment.app_env

    # Get containers
    grpc_container = app.grpc()
    metadata_container = app.metadata()
    infrastructure_container = app.infrastructure()
    raw_posts_container = app.raw_posts()

    # Initialize backend client connection
    backend_client = metadata_container.backend_client()
    try:
        await backend_client.connect()
        logger.info("Backend client connected successfully")
    except Exception as e:
        logger.warning(f"Failed to connect backend client: {str(e)}. Will retry on first use.")

    # GRPC server configuration (Docker: set AI_GRPC_LISTEN_PORT to match api's AI_SERVER_GRPC_URL)
    grpc_host = "0.0.0.0"
    grpc_port_env = os.environ.get("AI_GRPC_LISTEN_PORT", "").strip()
    if grpc_port_env:
        grpc_port = int(grpc_port_env)
    else:
        grpc_port = 50052 if env == "dev" else 50051

    logger.debug("API Server: http://0.0.0.0:10000")
    logger.info(f"GRPC Server: {grpc_host}:{grpc_port}")

    # Run all services concurrently
    raw_posts_shutdown = asyncio.Event()
    try:
        await asyncio.gather(
            start_task_scheduler(metadata_container),
            start_arq_worker(
                environment,
                metadata_container,
                infrastructure_container,
            ),
            start_raw_posts_scheduler(raw_posts_container, raw_posts_shutdown),
            start_grpc_server(grpc_container, grpc_host, grpc_port),
            start_api_server(),
            return_exceptions=False,
        )
    except Exception as e:
        logger.error(f"Error in main: {e}", exc_info=True)
    finally:
        # Signal raw_posts scheduler to stop
        raw_posts_shutdown.set()

        # Cleanup backend client connection
        try:
            await backend_client.close()
            logger.info("Backend client closed")
        except Exception as e:
            logger.warning(f"Error closing backend client: {str(e)}")

        # Cleanup asyncpg pool (#266)
        try:
            await infrastructure_container.database_manager().close()
            logger.info("Database pool closed")
        except Exception as e:
            logger.warning(f"Error closing database pool: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())
