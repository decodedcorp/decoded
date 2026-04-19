"""gRPC client that calls api-server's RawPostsCallback service (#258).

After an ARQ job finishes scraping + uploading to R2, it reports the results
back to api-server via `ReportRawPostsFetched`. api-server owns the DB.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import List, Optional

from grpc import aio

from src.config._logger import LoggerService
from src.grpc.proto.outbound import outbound_pb2, outbound_pb2_grpc
from src.services.raw_posts.models import RawPostResult


logger = logging.getLogger(__name__)


class RawPostsCallbackClient:
    """Thin wrapper around the RawPostsCallback stub.

    The channel is lazily created on first call. Connection failures are
    logged and propagated so the calling ARQ job can retry.
    """

    def __init__(self, host: str, port: int, logger_service: LoggerService) -> None:
        self.address = f"{host}:{port}"
        self._logger = logger_service
        self._channel: Optional[aio.Channel] = None
        self._stub: Optional[outbound_pb2_grpc.RawPostsCallbackStub] = None
        self._lock = asyncio.Lock()

    async def _ensure_connected(self, timeout: float = 10.0) -> None:
        if self._stub is not None:
            return
        async with self._lock:
            if self._stub is not None:
                return
            self._logger.info(f"RawPostsCallbackClient: connecting to {self.address}")
            channel = aio.insecure_channel(self.address)
            try:
                await asyncio.wait_for(channel.channel_ready(), timeout=timeout)
            except asyncio.TimeoutError:
                await channel.close()
                raise ConnectionError(
                    f"RawPostsCallbackClient: channel ready timeout ({timeout}s)"
                )
            self._channel = channel
            self._stub = outbound_pb2_grpc.RawPostsCallbackStub(channel)
            self._logger.info("RawPostsCallbackClient: connected")

    async def close(self) -> None:
        if self._channel is not None:
            try:
                await self._channel.close()
            except Exception as exc:
                self._logger.warning(f"RawPostsCallbackClient: close error {exc}")
            finally:
                self._channel = None
                self._stub = None

    async def report(
        self,
        *,
        source_id: str,
        dispatch_id: str,
        platform: str,
        results: List[RawPostResult],
        status: str = "SUCCESS",
        error_message: str = "",
    ) -> int:
        """Send results to api-server. Returns the `upserted_count` ack field."""
        await self._ensure_connected()
        assert self._stub is not None

        request = outbound_pb2.ReportRawPostsFetchedRequest(
            source_id=source_id,
            dispatch_id=dispatch_id,
            platform=platform,
            raw_posts=[_to_proto(r) for r in results],
            fetched_count=len(results),
            status=_status_enum(status),
            error_message=error_message,
        )
        response = await self._stub.ReportRawPostsFetched(request)
        if not response.received:
            raise RuntimeError(
                f"RawPostsCallback: api-server reported not received "
                f"(source_id={source_id}, dispatch_id={dispatch_id})"
            )
        self._logger.info(
            f"RawPostsCallback: reported {len(results)} result(s), "
            f"upserted={response.upserted_count} (source_id={source_id})"
        )
        return response.upserted_count


def _to_proto(result: RawPostResult) -> outbound_pb2.RawPostResult:
    return outbound_pb2.RawPostResult(
        external_id=result.external_id,
        external_url=result.external_url,
        image_url=result.image_url,
        r2_key=result.r2_key,
        r2_url=result.r2_url,
        caption=result.caption or "",
        author_name=result.author_name or "",
        platform_metadata_json=json.dumps(result.platform_metadata or {}),
    )


_STATUS_MAP = {
    "SUCCESS": outbound_pb2.RAW_POSTS_FETCH_STATUS_SUCCESS,
    "PARTIAL": outbound_pb2.RAW_POSTS_FETCH_STATUS_PARTIAL,
    "FAILED": outbound_pb2.RAW_POSTS_FETCH_STATUS_FAILED,
}


def _status_enum(name: str) -> int:
    return _STATUS_MAP.get(name.upper(), outbound_pb2.RAW_POSTS_FETCH_STATUS_UNSPECIFIED)
