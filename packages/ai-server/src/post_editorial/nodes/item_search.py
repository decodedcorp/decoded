"""ItemSearch node: find related items via internal DB + Perplexity + decoded-ai OG."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from google import genai
from google.genai import types
from pydantic import BaseModel
from supabase import AsyncClient, acreate_client

from ..state import PostEditorialState
from ..config import get_settings
from ..gemini_retry import call_gemini_with_fallback

logger = logging.getLogger(__name__)


class RankedRelatedItem(BaseModel):
    title: str
    brand: str | None = None
    image_url: str | None = None
    original_url: str | None = None
    relevance_reason: str | None = None
    source: str = "internal"
    for_spot_id: str | None = None


class ItemRankingOutput(BaseModel):
    related_items: list[RankedRelatedItem] = []


def _extract_items_from_post(state: PostEditorialState) -> list[dict]:
    items = []
    post_data = state["post_data"]
    for spot in post_data.spots:
        for sol in spot.solutions:
            brand = None
            if sol.metadata and isinstance(sol.metadata, dict):
                brand = sol.metadata.get("brand")
            items.append({
                "title": sol.title,
                "brand": brand,
                "original_url": sol.original_url,
                "spot_id": spot.id,
            })
    return items


def _extract_brands(state: PostEditorialState) -> list[str]:
    brands = []
    for spot in state["post_data"].spots:
        for sol in spot.solutions:
            if sol.metadata and isinstance(sol.metadata, dict):
                brand = sol.metadata.get("brand")
                if brand:
                    brands.append(brand)
    return list(set(brands))


async def _query_internal_items(
    client: AsyncClient,
    brands: list[str],
    current_solution_ids: set[str],
) -> list[dict]:
    if not brands:
        return []
    all_results = []
    for brand in brands[:5]:
        result = (
            await client.table("solutions")
            .select("id, title, thumbnail_url, original_url, metadata")
            .ilike("metadata->>brand", f"%{brand}%")
            .limit(10)
            .execute()
        )
        for row in (result.data or []):
            if row["id"] not in current_solution_ids:
                all_results.append(row)
    seen_ids = set()
    deduped = []
    for r in all_results:
        if r["id"] not in seen_ids:
            seen_ids.add(r["id"])
            deduped.append(r)
    return deduped[:20]


async def _perplexity_search_items(items: list[dict]) -> tuple[str, list[str]]:
    settings = get_settings()
    if not settings.perplexity_api_key:
        return "", []

    search_queries = []
    for item in items[:5]:
        query = f"{item.get('brand') or ''} {item.get('title') or ''}".strip()
        if query:
            search_queries.append(query)
    if not search_queries:
        return "", []

    items_list = "\n".join(f"- {q}" for q in search_queries)
    prompt = f"""다음 패션 아이템들과 비슷하거나 관련된 상품을 검색해주세요.
검색할 아이템:
{items_list}
각 아이템에 대해 2~3개의 관련 상품을 찾아주세요."""

    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.perplexity_api_key}",
        "Content-Type": "application/json",
    }
    payload = {"model": "sonar", "messages": [{"role": "user", "content": prompt}], "max_tokens": 2048, "temperature": 0.2}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    urls: list[str] = list(data.get("citations") or [])
    if not urls:
        for r in data.get("search_results") or []:
            u = r.get("url") if isinstance(r, dict) else None
            if u:
                urls.append(u)
    return content, urls


async def _extract_metadata_from_urls(
    urls: list[str],
    metadata_extract_service: Any | None = None,
) -> list[dict]:
    """Extract OG metadata. Uses MetadataExtractService if provided, else skips (internal run)."""
    if metadata_extract_service:
        results = []
        for url in urls[:15]:
            try:
                link_preview = await metadata_extract_service.extract_og_metadata(url=url)
                if link_preview and link_preview.title:
                    results.append({
                        "title": link_preview.title or "",
                        "image_url": link_preview.img_url,
                        "original_url": url,
                        "site_name": link_preview.site_name,
                    })
            except Exception as e:
                logger.debug("[item_search] extract_og failed for %s: %s", url[:60], e)
        logger.info("[item_search] OG extraction: %d/%d URLs (internal)", len(results), len(urls))
        return results

    logger.warning("No metadata_extract_service, skipping OG extraction")
    return []


async def _search_external_items(
    items: list[dict],
    metadata_extract_service: Any | None = None,
) -> list[dict]:
    if not items:
        return []
    _content, citation_urls = await _perplexity_search_items(items)
    if not citation_urls:
        return []
    og_results = await _extract_metadata_from_urls(citation_urls, metadata_extract_service)
    return [
        {"title": r["title"], "brand": None, "image_url": r.get("image_url"), "original_url": r["original_url"], "source": "external"}
        for r in og_results
    ]


def _build_ranking_prompt(post_summary: str, original_items_json: str, candidates_json: str) -> str:
    return f"""당신은 패션 매거진 에디터입니다.
다음 포스트의 아이템과 관련된 상품 후보를 관련성 기준으로 랭킹하고, 각 관련 상품이 어떤 원본 아이템과 가장 관련있는지 매핑해주세요.

## 현재 포스트 요약
{post_summary}

## 원본 아이템 (spot_id 포함)
{original_items_json}

## 관련 상품 후보
{candidates_json}

related_items 배열에 관련성 높은 상품을 최대 10개 출력하세요.
각 상품에 대해 relevance_reason, source, for_spot_id를 포함하세요.
반드시 유효한 JSON만 출력하세요."""


async def _rank_items(client: genai.Client, prompt: str, model: str) -> ItemRankingOutput:
    response = await client.aio.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ItemRankingOutput,
            temperature=0.3,
        ),
    )
    raw_text = response.text or "{}"
    return ItemRankingOutput.model_validate_json(raw_text)


def _get_metadata_extract_service(config: Any) -> Any:
    """Get metadata_extract_service from config, or from DI container as fallback."""
    configurable = {}
    if config is not None:
        configurable = getattr(config, "configurable", {}) if hasattr(config, "configurable") else config.get("configurable", {}) if isinstance(config, dict) else {}
    svc = configurable.get("metadata_extract_service")
    if svc is not None:
        return svc
    # Fallback: get from Application container (same process as ARQ worker)
    try:
        from src.config._container import Application
        app = Application()
        return app.metadata().metadata_extract_service()
    except Exception:
        return None


async def item_search_node(state: PostEditorialState, config: Any = None) -> dict:
    """Find related items via internal DB + Perplexity + decoded-ai OG."""
    existing = state.get("related_items")
    if existing:
        return {}

    post_data = state["post_data"]
    if not post_data.spots:
        return {"related_items": []}

    metadata_extract_service = _get_metadata_extract_service(config)

    try:
        items = _extract_items_from_post(state)
        brands = _extract_brands(state)
        current_sol_ids = {sol.id for spot in post_data.spots for sol in spot.solutions}
        current_urls = {sol.original_url for spot in post_data.spots for sol in spot.solutions if sol.original_url}

        settings = get_settings()
        sb_client = await acreate_client(settings.supabase_url, settings.supabase_service_role_key)

        internal_results = await _query_internal_items(sb_client, brands, current_sol_ids)
        internal_candidates = [
            {
                "title": r.get("title", ""),
                "brand": (r.get("metadata") or {}).get("brand"),
                "image_url": r.get("thumbnail_url"),
                "original_url": r.get("original_url"),
                "source": "internal",
            }
            for r in internal_results
        ]

        external_candidates = await _search_external_items(items, metadata_extract_service)

        all_candidates = internal_candidates + external_candidates
        seen_urls: set[str] = set(current_urls)
        deduped = []
        for c in all_candidates:
            url = c.get("original_url") or ""
            if url and url in seen_urls:
                continue
            if url:
                seen_urls.add(url)
            deduped.append(c)

        if not deduped:
            return {"related_items": []}

        genai_client = genai.Client(api_key=settings.gemini_api_key)
        artist_info = " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or "Unknown"
        items_summary = ", ".join(f"{i.get('brand', '')} {i['title']}".strip() for i in items)
        post_summary = f"아티스트: {artist_info}, 아이템: {items_summary}"
        original_items_for_prompt = [{"spot_id": i["spot_id"], "title": i["title"], "brand": i.get("brand")} for i in items]

        prompt = _build_ranking_prompt(
            post_summary,
            json.dumps(original_items_for_prompt, ensure_ascii=False, default=str),
            json.dumps(deduped[:20], ensure_ascii=False, default=str),
        )
        output = await call_gemini_with_fallback(
            settings.gemini_model,
            settings.gemini_fallback_model,
            lambda model: _rank_items(genai_client, prompt, model),
        )

        return {"related_items": [r.model_dump() for r in output.related_items]}

    except Exception as e:
        logger.exception("item_search_node failed")
        return {"related_items": [], "error_log": [f"ItemSearch failed: {type(e).__name__}: {e!s}"]}
