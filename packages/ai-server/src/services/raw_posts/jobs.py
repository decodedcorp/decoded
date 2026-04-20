"""ARQ jobs for the raw_posts pipeline (#258).

The gRPC servicer enqueues `fetch_raw_posts_job`. The worker pulls the job,
runs `RawPostsPipeline.fetch(...)`, then calls back api-server via
`RawPostsCallbackClient.report(...)`.

On exception, we report FAILED to api-server and then re-raise so ARQ's
built-in retry kicks in (bounded by `max_tries`).
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from src.grpc.client.raw_posts_callback_client import RawPostsCallbackClient
from src.services.raw_posts.models import FetchRequest
from src.services.raw_posts.pipeline import RawPostsPipeline


logger = logging.getLogger(__name__)


async def fetch_raw_posts_job(ctx: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
    """ARQ worker entry point.

    `payload` mirrors EnqueueFetchRawPostsRequest fields; see gRPC servicer.
    Returns a small summary for ARQ's result store; the real results go to
    api-server via the callback.
    """
    pipeline: RawPostsPipeline = ctx["raw_posts_pipeline"]
    callback: RawPostsCallbackClient = ctx["raw_posts_callback_client"]

    req = FetchRequest(
        source_id=payload["source_id"],
        platform=payload["platform"],
        source_type=payload["source_type"],
        source_identifier=payload["source_identifier"],
        dispatch_id=payload["dispatch_id"],
        limit=int(payload.get("limit") or 0) or 50,
    )

    logger.info(
        "fetch_raw_posts_job: start source_id=%s platform=%s dispatch_id=%s",
        req.source_id,
        req.platform,
        req.dispatch_id,
    )

    try:
        results = await pipeline.fetch(req)
    except Exception as exc:
        logger.exception("fetch_raw_posts_job: pipeline failed")
        try:
            await callback.report(
                source_id=req.source_id,
                dispatch_id=req.dispatch_id,
                platform=req.platform,
                results=[],
                status="FAILED",
                error_message=str(exc)[:500],
            )
        except Exception as cb_exc:
            logger.warning(
                "fetch_raw_posts_job: failure callback also failed: %s", cb_exc
            )
        raise

    status = "SUCCESS" if results else "PARTIAL"
    upserted = await callback.report(
        source_id=req.source_id,
        dispatch_id=req.dispatch_id,
        platform=req.platform,
        results=results,
        status=status,
    )

    return {
        "source_id": req.source_id,
        "platform": req.platform,
        "dispatch_id": req.dispatch_id,
        "fetched": len(results),
        "upserted": upserted,
        "status": status,
    }
