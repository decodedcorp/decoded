"""Publish node: assemble final PostMagazineLayout and save to DB."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import asyncpg

from src.managers.database import DatabaseManager

from ..models import PostMagazineLayout
from ..state import PostEditorialState

logger = logging.getLogger(__name__)


def _get_database_manager(config: Any) -> DatabaseManager | None:
    """Fetch DatabaseManager from LangGraph config or DI fallback."""
    configurable: dict = {}
    if config is not None:
        configurable = (
            getattr(config, "configurable", {})
            if hasattr(config, "configurable")
            else config.get("configurable", {})
            if isinstance(config, dict)
            else {}
        )
    svc = configurable.get("database_manager")
    if svc is not None:
        return svc
    try:
        from src.config._container import Application

        app = Application()
        return app.infrastructure().database_manager()
    except Exception:
        logger.warning(
            "DatabaseManager unavailable — publish_node cannot persist results"
        )
        return None


async def _fetch_warehouse_brands(
    conn: asyncpg.Connection, brand_ids: list[str]
) -> dict[str, dict]:
    """Batch-fetch brand data from warehouse.brands by IDs."""
    if not brand_ids:
        return {}
    try:
        rows = await conn.fetch(
            """
            SELECT id, name_ko, name_en, logo_image_url, metadata
              FROM warehouse.brands
             WHERE id = ANY($1::uuid[])
            """,
            brand_ids,
        )
        result: dict[str, dict] = {}
        for row in rows:
            metadata = row["metadata"]
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except json.JSONDecodeError:
                    metadata = None
            result[str(row["id"])] = {
                "id": str(row["id"]),
                "name_ko": row["name_ko"],
                "name_en": row["name_en"],
                "logo_image_url": row["logo_image_url"],
                "metadata": metadata,
            }
        return result
    except Exception:
        logger.debug("warehouse brands lookup failed in publish", exc_info=True)
        return {}


async def _mark_magazine_failed(
    conn: asyncpg.Connection, post_magazine_id: str, error_msg: str
) -> None:
    try:
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
        logger.exception("Failed to update magazine status to failed")


async def publish_node(state: PostEditorialState, config: Any = None) -> dict:
    """Assemble PostMagazineLayout and save to post_magazines table."""
    post_magazine_id = state["post_magazine_id"]

    database_manager = _get_database_manager(config)
    if database_manager is None:
        logger.error("publish_node: DatabaseManager unavailable")
        return {
            "pipeline_status": "failed",
            "error_log": ["Publish failed: DatabaseManager unavailable"],
        }

    try:
        post_data = state["post_data"]
        design_spec = state.get("design_spec") or {}
        editorial_section = state.get("editorial_section") or {"paragraphs": []}
        item_editorial_texts = state.get("item_editorial_texts") or {}

        # Batch-fetch warehouse brands for enrichment (fall back to item_research result)
        brand_ids = list(
            {sol.brand_id for spot in post_data.spots for sol in spot.solutions if sol.brand_id}
        )
        item_research = state.get("item_research") or {}
        warehouse_brands = item_research.get("warehouse_brands") or {}

        async with database_manager.acquire() as conn:
            if brand_ids and not warehouse_brands:
                warehouse_brands = await _fetch_warehouse_brands(conn, brand_ids)

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
                        if wb.get("metadata") and isinstance(wb["metadata"], dict):
                            enriched_meta = dict(metadata) if isinstance(metadata, dict) else {}
                            for k, v in wb["metadata"].items():
                                if v and k not in enriched_meta:
                                    enriched_meta[k] = v
                            metadata = enriched_meta

                    items.append(
                        {
                            "spot_id": spot.id,
                            "solution_id": sol.id,
                            "title": sol.title,
                            "brand": brand,
                            "brand_logo_url": brand_logo_url,
                            "image_url": sol.thumbnail_url,
                            "original_url": sol.original_url,
                            "metadata": metadata,
                            "editorial_paragraphs": item_editorial_texts.get(spot.id, []),
                        }
                    )

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

            now = datetime.now(timezone.utc)
            review_result = state.get("review_result") or {}
            keyword_parts = list(filter(None, [post_data.artist_name, post_data.group_name]))
            keyword = ", ".join(keyword_parts) if keyword_parts else None

            await conn.execute(
                """
                UPDATE public.post_magazines
                   SET title = $1,
                       subtitle = $2,
                       keyword = $3,
                       layout_json = $4::jsonb,
                       status = 'published',
                       review_summary = $5,
                       published_at = $6,
                       updated_at = $7
                 WHERE id = $8::uuid
                """,
                layout.title,
                layout.subtitle,
                keyword,
                json.dumps(layout_dict, default=str),
                review_result.get("summary"),
                now,
                now,
                post_magazine_id,
            )

            if news_references:
                for ref in news_references:
                    try:
                        await conn.execute(
                            """
                            INSERT INTO public.post_magazine_news_references (
                                post_magazine_id, title, url, source, summary,
                                og_title, og_description, og_image, og_site_name,
                                relevance_score, credibility_score, matched_item
                            ) VALUES (
                                $1::uuid, $2, $3, $4, $5,
                                $6, $7, $8, $9,
                                $10, $11, $12
                            )
                            """,
                            post_magazine_id,
                            ref.get("title", ""),
                            ref.get("url", ""),
                            ref.get("source", ""),
                            ref.get("summary"),
                            ref.get("og_title"),
                            ref.get("og_description"),
                            ref.get("og_image"),
                            ref.get("og_site_name"),
                            ref.get("relevance_score", 0),
                            ref.get("credibility_score", 0),
                            ref.get("matched_item"),
                        )
                    except Exception:
                        logger.warning(
                            "Failed to save news reference: %s",
                            ref.get("url"),
                            exc_info=True,
                        )

            ai_summary = state.get("ai_summary")
            if ai_summary:
                try:
                    await conn.execute(
                        """
                        UPDATE public.posts
                           SET ai_summary = $1
                         WHERE id = $2::uuid
                        """,
                        ai_summary,
                        post_data.id,
                    )
                except Exception:
                    logger.warning(
                        "Failed to save ai_summary to post %s", post_data.id, exc_info=True
                    )

        return {"pipeline_status": "published"}

    except Exception as e:
        logger.exception("publish_node failed")
        error_msg = f"Publish failed: {type(e).__name__}: {e!s}"
        try:
            async with database_manager.acquire() as conn:
                await _mark_magazine_failed(conn, post_magazine_id, error_msg)
        except Exception:
            logger.exception("Failed to mark magazine as failed")
        return {"pipeline_status": "failed", "error_log": [error_msg]}
