"""Manual reparse endpoint for the vision parser (#260).

The media scheduler runs every `MEDIA_PARSE_INTERVAL_SECONDS`; this endpoint
lets the admin dashboard force an immediate reparse of one `raw_posts` row
(e.g. after the prompt was tuned, or a row got stuck in `failed`).
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException

from src.config import Application


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["Media Parsing"])


@router.post("/items/{raw_post_id}/reparse")
async def reparse_item(raw_post_id: UUID):
    """Reparse one raw_posts row synchronously.

    Resets attempts/error, runs the vision call + seed_writer, and returns
    the final `parse_status` ("parsed" | "skipped" | "failed" | "pending").
    Parsing usually takes 3–15 s — short enough to await the response.
    """
    scheduler = Application.media().scheduler()
    try:
        status = await scheduler.reparse_by_id(raw_post_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("media reparse failed for %s", raw_post_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {
        "triggered": True,
        "raw_post_id": str(raw_post_id),
        "status": status,
    }
