"""Manual trigger endpoint for the raw_posts scheduler (#214).

The scheduler polls `public.raw_post_sources` every
`RAW_POSTS_SCHEDULER_INTERVAL_SECONDS`; this endpoint lets the admin dashboard
force an immediate run against a single source (re-using the exact scheduler
codepath, no duplication).
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException

from src.config import Application


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/raw-posts", tags=["Raw Posts"])


@router.post("/sources/{source_id}/trigger")
async def trigger_source(source_id: UUID):
    """Run a single source through the scheduler synchronously.

    Returns 404 if the source doesn't exist. Errors during execution are
    logged and bubbled up as 500.
    """
    scheduler = Application.raw_posts().scheduler()
    try:
        ran = await scheduler.run_source_by_id(source_id)
    except Exception as exc:
        logger.exception("raw_posts manual trigger failed for %s", source_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not ran:
        raise HTTPException(status_code=404, detail="source not found")
    return {"triggered": True, "source_id": str(source_id)}
