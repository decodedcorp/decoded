"""Post editorial ARQ job and service."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from src.managers.database import DatabaseManager
from src.post_editorial.state import PostData

logger = logging.getLogger(__name__)


class PostEditorialService:
    """Service for running post editorial pipeline as ARQ job."""

    @staticmethod
    async def post_editorial_job(
        ctx: Dict[str, Any],
        post_magazine_id: str,
        post_data_json: str,
    ) -> Dict[str, Any]:
        """
        Run the post editorial pipeline for a single post magazine.

        Args:
            ctx: ARQ job context (metadata_extract_service, etc.)
            post_magazine_id: UUID of the post_magazine record
            post_data_json: JSON-serialized PostData from Backend

        Returns:
            Dict with pipeline_status and any error info
        """
        database_manager: DatabaseManager | None = ctx.get("database_manager")

        try:
            post_data = PostData.model_validate_json(post_data_json)
        except Exception as e:
            logger.exception(
                "Failed to parse post_data_json for %s: %s (first 500 chars: %s)",
                post_magazine_id,
                e,
                post_data_json[:500] if post_data_json else "(empty)",
            )
            await _mark_magazine_failed(database_manager, post_magazine_id, f"Invalid post_data: {e!s}")
            return {"success": False, "error": str(e)}

        metadata_extract_service = ctx.get("metadata_extract_service")
        database_manager = ctx.get("database_manager")
        from src.post_editorial.graph import create_post_editorial_graph

        graph = create_post_editorial_graph()

        initial_state = {
            "post_magazine_id": post_magazine_id,
            "post_data": post_data,
            "design_spec": None,
            "title": "",
            "subtitle": None,
            "editorial_section": None,
            "item_editorial_texts": {},
            "celeb_list": [],
            "related_items": [],
            "review_result": None,
            "revision_count": 0,
            "feedback_history": [],
            "pipeline_status": "starting",
            "error_log": [],
        }

        config = {"configurable": {}}
        if metadata_extract_service:
            config["configurable"]["metadata_extract_service"] = metadata_extract_service
        if database_manager:
            config["configurable"]["database_manager"] = database_manager

        import uuid

        thread_id = str(uuid.uuid4())
        config["configurable"]["thread_id"] = thread_id

        try:
            result = await graph.ainvoke(initial_state, config)
            final_status = result.get("pipeline_status", "unknown")
            logger.info(
                "Post editorial completed for %s: status=%s", post_magazine_id, final_status
            )

            if final_status == "failed":
                error_log = result.get("error_log", [])
                await _mark_magazine_failed(database_manager, post_magazine_id, "; ".join(str(x) for x in error_log))

            return {
                "success": final_status in ("published", "reviewed"),
                "pipeline_status": final_status,
            }

        except Exception as e:
            logger.exception("Post editorial pipeline failed for %s", post_magazine_id)
            await _mark_magazine_failed(
                database_manager,
                post_magazine_id,
                f"Pipeline crash: {type(e).__name__}: {e!s}",
            )
            return {"success": False, "error": str(e)}


async def _mark_magazine_failed(
    database_manager: DatabaseManager | None,
    post_magazine_id: str,
    error_msg: str,
) -> None:
    """Update post_magazines.status = failed via asyncpg pool."""
    if database_manager is None:
        logger.warning("_mark_magazine_failed: no DatabaseManager — skip")
        return
    try:
        async with database_manager.acquire() as conn:
            await conn.execute(
                """
                UPDATE public.post_magazines
                   SET status = 'failed',
                       error_log = $1::jsonb,
                       updated_at = $2
                 WHERE id = $3::uuid
                """,
                json.dumps([error_msg]),
                datetime.now(timezone.utc),
                post_magazine_id,
            )
    except Exception:
        logger.exception("Failed to update magazine status after failure")
