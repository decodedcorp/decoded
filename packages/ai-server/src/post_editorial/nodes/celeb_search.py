"""CelebSearch node: query DB for similar celebs and AI-rank them."""

from __future__ import annotations

import json
import logging
from typing import Any

import asyncpg
from google import genai
from google.genai import types
from pydantic import BaseModel

from src.managers.database import DatabaseManager

from ..state import PostEditorialState
from ..config import get_settings
from ..gemini_retry import call_gemini_with_fallback

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
        logger.debug("DatabaseManager unavailable — celeb search will skip")
        return None


class RankedCeleb(BaseModel):
    celeb_name: str
    celeb_image_url: str | None = None
    post_id: str
    item_name: str
    item_brand: str | None = None
    relevance_score: float


class CelebRankingOutput(BaseModel):
    celebs: list[RankedCeleb] = []


def _row_to_dict(row: asyncpg.Record | None) -> dict | None:
    if row is None:
        return None
    out = dict(row)
    # Cast UUIDs to str, parse jsonb-as-text if needed
    if "id" in out:
        out["id"] = str(out["id"])
    meta = out.get("metadata")
    if isinstance(meta, str):
        try:
            out["metadata"] = json.loads(meta)
        except json.JSONDecodeError:
            out["metadata"] = None
    return out


async def _get_artist_from_warehouse(
    conn: asyncpg.Connection, artist_id: str | None, group_id: str | None
) -> dict:
    """Fetch canonical artist/group data from warehouse tables."""
    info: dict = {}
    if artist_id:
        try:
            row = await conn.fetchrow(
                """
                SELECT id, name_ko, name_en, profile_image_url, metadata
                  FROM warehouse.artists
                 WHERE id = $1::uuid
                 LIMIT 1
                """,
                artist_id,
            )
            converted = _row_to_dict(row)
            if converted:
                info["artist"] = converted
        except Exception:
            logger.debug("warehouse artist lookup failed for %s", artist_id, exc_info=True)

    if group_id:
        try:
            row = await conn.fetchrow(
                """
                SELECT id, name_ko, name_en, profile_image_url, metadata
                  FROM warehouse.groups
                 WHERE id = $1::uuid
                 LIMIT 1
                """,
                group_id,
            )
            converted = _row_to_dict(row)
            if converted:
                info["group"] = converted
        except Exception:
            logger.debug("warehouse group lookup failed for %s", group_id, exc_info=True)

    return info


async def _query_similar_posts(
    conn: asyncpg.Connection,
    post_id: str,
    artist_id: str | None,
    group_id: str | None,
    artist_name: str | None,
    group_name: str | None,
) -> list[dict]:
    """Find similar posts — prefer FK-based matching, fallback to ilike."""
    # FK-based matching (preferred)
    if artist_id or group_id:
        rows = await conn.fetch(
            """
            SELECT id, image_url, artist_name, group_name, title
              FROM public.posts
             WHERE (($1::uuid IS NOT NULL AND artist_id = $1::uuid)
                    OR ($2::uuid IS NOT NULL AND group_id = $2::uuid))
               AND id <> $3::uuid
               AND status = 'active'
             LIMIT 20
            """,
            artist_id,
            group_id,
            post_id,
        )
        if rows:
            return [{**r, "id": str(r["id"])} for r in (dict(row) for row in rows)]

    # Fallback: string-based matching
    if not (artist_name or group_name):
        return []
    rows = await conn.fetch(
        """
        SELECT id, image_url, artist_name, group_name, title
          FROM public.posts
         WHERE (($1::text IS NOT NULL AND artist_name ILIKE '%' || $1::text || '%')
                OR ($2::text IS NOT NULL AND group_name ILIKE '%' || $2::text || '%'))
           AND id <> $3::uuid
           AND status = 'active'
         LIMIT 20
        """,
        artist_name,
        group_name,
        post_id,
    )
    return [{**r, "id": str(r["id"])} for r in (dict(row) for row in rows)]


def _build_celeb_ranking_prompt(
    post_summary: str, candidates_json: str, warehouse_context: str
) -> str:
    context_block = (
        f"\n## 아티스트 프로필 (warehouse)\n{warehouse_context}\n" if warehouse_context else ""
    )
    return f"""당신은 패션 매거진 에디터입니다.
다음 포스트 정보와 셀럽 후보를 바탕으로 관련성을 랭킹해주세요.

## 현재 포스트 요약
{post_summary}
{context_block}
## 셀럽 후보 (같은 아티스트/그룹의 다른 포스트)
{candidates_json}

celebs 배열에 관련성 높은 셀럽 최대 5명을 출력하세요.
각 셀럽에 대해 relevance_score (0.0~1.0)를 매기고, 현재 포스트의 아이템 중 하나를 대표 아이템으로 선택하세요.
반드시 유효한 JSON만 출력하세요."""


async def _rank_celebs(client: genai.Client, prompt: str, model: str) -> CelebRankingOutput:
    response = await client.aio.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CelebRankingOutput,
            temperature=0.3,
        ),
    )
    raw_text = response.text or "{}"
    return CelebRankingOutput.model_validate_json(raw_text)


async def celeb_search_node(state: PostEditorialState, config: Any = None) -> dict:
    """Query DB for similar celebs and AI-rank them."""
    existing = state.get("celeb_list")
    if existing:
        return {}

    database_manager = _get_database_manager(config)
    if database_manager is None:
        logger.warning("celeb_search_node: database_manager not available; skipping")
        return {"celeb_list": []}

    try:
        post_data = state["post_data"]

        async with database_manager.acquire() as conn:
            # Fetch warehouse artist/group data
            warehouse_info = await _get_artist_from_warehouse(
                conn, post_data.artist_id, post_data.group_id
            )

            similar_posts = await _query_similar_posts(
                conn,
                post_data.id,
                post_data.artist_id,
                post_data.group_id,
                post_data.artist_name,
                post_data.group_name,
            )

        if not similar_posts:
            return {"celeb_list": []}

        # Build richer artist info from warehouse data
        artist_parts = []
        if "artist" in warehouse_info:
            a = warehouse_info["artist"]
            artist_parts.append(a.get("name_ko") or a.get("name_en") or "")
        elif post_data.artist_name:
            artist_parts.append(post_data.artist_name)

        if "group" in warehouse_info:
            g = warehouse_info["group"]
            artist_parts.append(g.get("name_ko") or g.get("name_en") or "")
        elif post_data.group_name:
            artist_parts.append(post_data.group_name)

        artist_info = " / ".join(filter(None, artist_parts)) or "Unknown"

        items_lines = []
        for spot in post_data.spots:
            for sol in spot.solutions:
                brand = ""
                if sol.metadata and isinstance(sol.metadata, dict):
                    brand = sol.metadata.get("brand", "")
                label = f"{brand} - {sol.title}" if brand else sol.title
                items_lines.append(label)
        post_summary = f"아티스트: {artist_info}, 아이템: {', '.join(items_lines)}"

        # Build warehouse context for ranking prompt
        warehouse_context_parts = []
        if "artist" in warehouse_info:
            a = warehouse_info["artist"]
            warehouse_context_parts.append(
                f"아티스트: {a.get('name_ko', '')} ({a.get('name_en', '')}), "
                f"프로필: {a.get('profile_image_url', 'N/A')}"
            )
        if "group" in warehouse_info:
            g = warehouse_info["group"]
            warehouse_context_parts.append(
                f"그룹: {g.get('name_ko', '')} ({g.get('name_en', '')}), "
                f"프로필: {g.get('profile_image_url', 'N/A')}"
            )
        warehouse_context = "\n".join(warehouse_context_parts)

        settings = get_settings()
        genai_client = genai.Client(api_key=settings.gemini_api_key)

        prompt = _build_celeb_ranking_prompt(
            post_summary,
            json.dumps(similar_posts[:10], ensure_ascii=False, default=str),
            warehouse_context,
        )

        output = await call_gemini_with_fallback(
            settings.gemini_model,
            settings.gemini_fallback_model,
            lambda model: _rank_celebs(genai_client, prompt, model),
        )

        # Enrich celeb results with warehouse profile images
        celeb_results = []
        for c in output.celebs:
            celeb_dict = c.model_dump()
            if not celeb_dict.get("celeb_image_url"):
                if "artist" in warehouse_info:
                    celeb_dict["celeb_image_url"] = warehouse_info["artist"].get(
                        "profile_image_url"
                    )
                elif "group" in warehouse_info:
                    celeb_dict["celeb_image_url"] = warehouse_info["group"].get("profile_image_url")
            celeb_results.append(celeb_dict)

        return {"celeb_list": celeb_results}

    except Exception as e:
        logger.exception("celeb_search_node failed")
        return {"celeb_list": [], "error_log": [f"CelebSearch failed: {type(e).__name__}: {e!s}"]}
