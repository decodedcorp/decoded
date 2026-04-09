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


async def _fetch_warehouse_brands(client: AsyncClient, brand_ids: list[str]) -> dict[str, dict]:
    """Batch-fetch brand data from warehouse.brands by IDs."""
    if not brand_ids:
        return {}
    try:
        result = (
            await client.schema("warehouse")
            .table("brands")
            .select("id, name_ko, name_en, logo_image_url, metadata")
            .in_("id", brand_ids)
            .execute()
        )
        return {b["id"]: b for b in (result.data or [])}
    except Exception:
        logger.debug("warehouse brands lookup failed in publish", exc_info=True)
        return {}


async def publish_node(state: PostEditorialState) -> dict:
    """Assemble PostMagazineLayout and save to post_magazines table."""
    post_magazine_id = state["post_magazine_id"]

    try:
        post_data = state["post_data"]
        design_spec = state.get("design_spec") or {}
        editorial_section = state.get("editorial_section") or {"paragraphs": []}
        item_editorial_texts = state.get("item_editorial_texts") or {}

        client = await _get_supabase_client()

        # Batch-fetch warehouse brands for enrichment
        brand_ids = list({
            sol.brand_id
            for spot in post_data.spots
            for sol in spot.solutions
            if sol.brand_id
        })

        # Try to reuse warehouse_brands from item_research if available
        item_research = state.get("item_research") or {}
        warehouse_brands = item_research.get("warehouse_brands") or {}
        if brand_ids and not warehouse_brands:
            warehouse_brands = await _fetch_warehouse_brands(client, brand_ids)

        items = []
        for spot in post_data.spots:
            for sol in spot.solutions:
                brand = None
                brand_logo_url = None
                metadata = sol.metadata or {}

                if isinstance(metadata, dict):
                    brand = metadata.get("brand")

                # Enrich with warehouse brand data
                if sol.brand_id and sol.brand_id in warehouse_brands:
                    wb = warehouse_brands[sol.brand_id]
                    brand = wb.get("name_en") or wb.get("name_ko") or brand
                    brand_logo_url = wb.get("logo_image_url")
                    # Merge warehouse brand metadata
                    if wb.get("metadata") and isinstance(wb["metadata"], dict):
                        enriched_meta = dict(metadata) if isinstance(metadata, dict) else {}
                        for k, v in wb["metadata"].items():
                            if v and k not in enriched_meta:
                                enriched_meta[k] = v
                        metadata = enriched_meta

                items.append({
                    "spot_id": spot.id,
                    "solution_id": sol.id,
                    "title": sol.title,
                    "brand": brand,
                    "brand_logo_url": brand_logo_url,
                    "image_url": sol.thumbnail_url,
                    "original_url": sol.original_url,
                    "metadata": metadata,
                    "editorial_paragraphs": item_editorial_texts.get(spot.id, []),
                })

        news_references = state.get("news_references") or []

        layout = PostMagazineLayout(
            title=state.get("title", "Untitled"),
            subtitle=state.get("subtitle"),
            editorial=editorial_section,
            celeb_list=state.get("celeb_list", []),
            items=items,
            related_items=state.get("related_items", []),
            news_references=news_references,
            design_spec=design_spec,
        )
        layout_dict = layout.model_dump()

        now = datetime.now(timezone.utc).isoformat()
        review_result = state.get("review_result") or {}

        # Build keyword from artist/group name
        keyword_parts = list(filter(None, [post_data.artist_name, post_data.group_name]))
        keyword = ", ".join(keyword_parts) if keyword_parts else None

        await (
            client.table("post_magazines")
            .update({
                "title": layout.title,
                "subtitle": layout.subtitle,
                "keyword": keyword,
                "layout_json": layout_dict,
                "status": "published",
                "review_summary": review_result.get("summary"),
                "published_at": now,
                "updated_at": now,
            })
            .eq("id", post_magazine_id)
            .execute()
        )

        # Save news references to dedicated table
        if news_references:
            for ref in news_references:
                try:
                    await (
                        client.table("post_magazine_news_references")
                        .insert({
                            "post_magazine_id": post_magazine_id,
                            "title": ref.get("title", ""),
                            "url": ref.get("url", ""),
                            "source": ref.get("source", ""),
                            "summary": ref.get("summary"),
                            "og_title": ref.get("og_title"),
                            "og_description": ref.get("og_description"),
                            "og_image": ref.get("og_image"),
                            "og_site_name": ref.get("og_site_name"),
                            "relevance_score": ref.get("relevance_score", 0),
                            "credibility_score": ref.get("credibility_score", 0),
                            "matched_item": ref.get("matched_item"),
                        })
                        .execute()
                    )
                except Exception:
                    logger.warning(
                        "Failed to save news reference: %s", ref.get("url"), exc_info=True
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
