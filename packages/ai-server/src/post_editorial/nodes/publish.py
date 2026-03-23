"""Publish node: assemble final PostMagazineLayout and save to DB."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from supabase import AsyncClient, acreate_client

from ..models import PostMagazineLayout
from ..state import PostEditorialState
from ..config import get_settings

logger = logging.getLogger(__name__)


async def _get_supabase_client() -> AsyncClient:
    settings = get_settings()
    return await acreate_client(settings.supabase_url, settings.supabase_service_role_key)


async def publish_node(state: PostEditorialState) -> dict:
    """Assemble PostMagazineLayout and save to post_magazines table."""
    post_magazine_id = state["post_magazine_id"]

    try:
        post_data = state["post_data"]
        design_spec = state.get("design_spec") or {}
        editorial_section = state.get("editorial_section") or {"paragraphs": []}
        item_editorial_texts = state.get("item_editorial_texts") or {}

        items = []
        for spot in post_data.spots:
            for sol in spot.solutions:
                brand = None
                if sol.metadata and isinstance(sol.metadata, dict):
                    brand = sol.metadata.get("brand")
                items.append({
                    "spot_id": spot.id,
                    "solution_id": sol.id,
                    "title": sol.title,
                    "brand": brand,
                    "image_url": sol.thumbnail_url,
                    "original_url": sol.original_url,
                    "metadata": sol.metadata or {},
                    "editorial_paragraphs": item_editorial_texts.get(spot.id, []),
                })

        layout = PostMagazineLayout(
            title=state.get("title", "Untitled"),
            subtitle=state.get("subtitle"),
            editorial=editorial_section,
            celeb_list=state.get("celeb_list", []),
            items=items,
            related_items=state.get("related_items", []),
            design_spec=design_spec,
        )
        layout_dict = layout.model_dump()

        now = datetime.now(timezone.utc).isoformat()
        review_result = state.get("review_result") or {}
        client = await _get_supabase_client()

        await (
            client.table("post_magazines")
            .update({
                "title": layout.title,
                "subtitle": layout.subtitle,
                "layout_json": layout_dict,
                "status": "published",
                "review_summary": review_result.get("summary"),
                "published_at": now,
                "updated_at": now,
            })
            .eq("id", post_magazine_id)
            .execute()
        )

        ai_summary = state.get("ai_summary")
        if ai_summary:
            try:
                await (
                    client.table("posts")
                    .update({"ai_summary": ai_summary})
                    .eq("id", post_data.id)
                    .execute()
                )
            except Exception:
                logger.warning("Failed to save ai_summary to post %s", post_data.id, exc_info=True)

        return {"pipeline_status": "published"}

    except Exception as e:
        logger.exception("publish_node failed")
        error_msg = f"Publish failed: {type(e).__name__}: {e!s}"
        try:
            client = await _get_supabase_client()
            await (
                client.table("post_magazines")
                .update({
                    "status": "failed",
                    "error_log": json.dumps([error_msg]),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                })
                .eq("id", post_magazine_id)
                .execute()
            )
        except Exception:
            logger.exception("Failed to update magazine status to failed")
        return {"pipeline_status": "failed", "error_log": [error_msg]}
