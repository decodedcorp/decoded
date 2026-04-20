"""gRPC servicer for `RawPostsWorker.EnqueueFetchRawPosts` (#258).

Receives a scrape request from api-server, enqueues an ARQ job, and
returns immediately with the ARQ job id. The actual scraping + R2 upload
happens in the worker; results are reported back via the
`RawPostsCallback` gRPC service on api-server.
"""

from __future__ import annotations

import grpc

from src.config._logger import LoggerService
from src.grpc.proto.inbound import inbound_pb2, inbound_pb2_grpc
from src.managers.queue.queue_manager import QueueManager


_FETCH_JOB_NAME = "fetch_raw_posts_job"


class RawPostsWorkerServicer(inbound_pb2_grpc.RawPostsWorkerServicer):
    def __init__(self, queue_manager: QueueManager, logger: LoggerService) -> None:
        self._queue = queue_manager
        self._logger = logger

    async def EnqueueFetchRawPosts(
        self,
        request: inbound_pb2.EnqueueFetchRawPostsRequest,
        context,
    ) -> inbound_pb2.EnqueueFetchRawPostsResponse:
        if not request.source_id or not request.platform:
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("source_id and platform are required")
            return inbound_pb2.EnqueueFetchRawPostsResponse(
                success=False,
                message="source_id and platform are required",
                job_id="",
            )

        payload = {
            "source_id": request.source_id,
            "platform": request.platform,
            "source_type": request.source_type,
            "source_identifier": request.source_identifier,
            "dispatch_id": request.dispatch_id,
            "limit": int(request.limit) if request.limit else 0,
        }

        try:
            job_id = await self._queue.enqueue_job(_FETCH_JOB_NAME, payload)
        except Exception as exc:
            self._logger.error(
                f"EnqueueFetchRawPosts: failed to enqueue job for source_id="
                f"{request.source_id} ({exc})"
            )
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Failed to enqueue job: {exc}")
            return inbound_pb2.EnqueueFetchRawPostsResponse(
                success=False,
                message=f"Failed to enqueue job: {exc}",
                job_id="",
            )

        self._logger.info(
            f"EnqueueFetchRawPosts: enqueued job {job_id} "
            f"(platform={request.platform}, source_id={request.source_id}, "
            f"dispatch_id={request.dispatch_id})"
        )
        return inbound_pb2.EnqueueFetchRawPostsResponse(
            success=True,
            message="enqueued",
            job_id=job_id or "",
        )
