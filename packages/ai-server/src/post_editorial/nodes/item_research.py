"""ItemResearch node: Perplexity Sonar research for item backstories, enriched with warehouse brand data."""

from __future__ import annotations

import logging

import httpx
from supabase import AsyncClient, acreate_client

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
        logger.debug("warehouse brands lookup failed", exc_info=True)
        return {}


def _build_research_query(state: PostEditorialState, warehouse_brands: dict[str, dict]) -> str:
    post_data = state["post_data"]
    artist = " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or "Unknown"

    brands = set()
    item_lines: list[str] = []
    for spot in post_data.spots:
        for sol in spot.solutions:
            meta = sol.metadata or {}
            brand = meta.get("brand", "") if isinstance(meta, dict) else ""

            # Prefer canonical brand name from warehouse
            if sol.brand_id and sol.brand_id in warehouse_brands:
                wb = warehouse_brands[sol.brand_id]
                brand = wb.get("name_en") or wb.get("name_ko") or brand

            price = meta.get("price", "") if isinstance(meta, dict) else ""
            material = meta.get("material", []) if isinstance(meta, dict) else []
            if isinstance(material, list):
                material = ", ".join(material)

            if brand:
                brands.add(brand)
            parts = [f"{sol.title}"]
            if brand:
                parts[0] += f" by {brand}"
            if price:
                parts.append(f"price: {price}")
            if material:
                parts.append(f"material: {material}")
            item_lines.append(" | ".join(parts))

    brands_str = ", ".join(brands) if brands else "various brands"

    # Add warehouse brand context if available
    brand_context_lines = []
    for wb in warehouse_brands.values():
        name = wb.get("name_en") or wb.get("name_ko") or ""
        if name and wb.get("metadata") and isinstance(wb["metadata"], dict):
            meta_summary = ", ".join(f"{k}: {v}" for k, v in wb["metadata"].items() if v)
            if meta_summary:
                brand_context_lines.append(f"- {name}: {meta_summary}")

    brand_context = ""
    if brand_context_lines:
        brand_context = f"\n\nKnown brand information:\n" + "\n".join(brand_context_lines)

    return f"""{artist} fashion style and relationship with {brands_str} (ambassador, muse, collaboration history).

Items worn in this post:
{chr(10).join(f"- {line}" for line in item_lines)}
{brand_context}
For each item, provide factual information about:
1. Which collection or season it belongs to (if identifiable)
2. Design story or notable features
3. Cultural significance or celebrity connection
4. Resale or market context (if notable)

Be concise and factual. Cite sources where possible."""


async def _perplexity_search_async(query: str) -> tuple[str, list[str]]:
    settings = get_settings()
    if not settings.perplexity_api_key:
        return "", []

    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.perplexity_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "sonar",
        "messages": [{"role": "user", "content": f"Brief, factual answer. Cite sources.\n\n{query}"}],
        "max_tokens": 2048,
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    urls = list(data.get("citations") or [])
    if not urls:
        for r in data.get("search_results") or []:
            u = r.get("url") if isinstance(r, dict) else None
            if u:
                urls.append(u)
    return content, urls


def _parse_item_stories(
    raw_content: str, state: PostEditorialState, warehouse_brands: dict[str, dict]
) -> dict[str, str]:
    post_data = state["post_data"]
    result: dict[str, str] = {}
    for spot in post_data.spots:
        for sol in spot.solutions:
            title = sol.title or ""
            brand = ""
            if sol.metadata and isinstance(sol.metadata, dict):
                brand = sol.metadata.get("brand", "")

            # Also search by canonical warehouse brand name
            canonical_brand = ""
            if sol.brand_id and sol.brand_id in warehouse_brands:
                wb = warehouse_brands[sol.brand_id]
                canonical_brand = wb.get("name_en") or wb.get("name_ko") or ""

            search_terms = [t for t in [title, brand, canonical_brand] if t]
            relevant_lines: list[str] = []
            for line in raw_content.split("\n"):
                if any(term.lower() in line.lower() for term in search_terms if len(term) > 2):
                    relevant_lines.append(line.strip())
            if relevant_lines:
                result[spot.id] = " ".join(relevant_lines[:5])
    return result


def _extract_artist_brand_context(raw_content: str, state: PostEditorialState) -> str:
    post_data = state["post_data"]
    artist = post_data.artist_name or post_data.group_name or ""
    if not artist:
        return ""

    keywords = ["ambassador", "앰버서더", "muse", "뮤즈", "collaboration", "콜라보", "campaign", "캠페인", "contract", "계약"]
    relevant: list[str] = []
    for line in raw_content.split("\n"):
        line_lower = line.lower()
        if artist.lower() in line_lower and any(kw in line_lower for kw in keywords):
            relevant.append(line.strip())
    if not relevant:
        for line in raw_content.split("\n"):
            line_lower = line.lower()
            if artist.lower() in line_lower:
                relevant.append(line.strip())
                if len(relevant) >= 3:
                    break
    return " ".join(relevant[:5])


async def item_research_node(state: PostEditorialState) -> dict:
    """Research item backstories via Perplexity Sonar, enriched with warehouse brand data."""
    try:
        post_data = state["post_data"]

        # Collect distinct brand_ids and fetch from warehouse
        brand_ids = list({
            sol.brand_id
            for spot in post_data.spots
            for sol in spot.solutions
            if sol.brand_id
        })
        warehouse_brands: dict[str, dict] = {}
        if brand_ids:
            sb_client = await _get_supabase_client()
            warehouse_brands = await _fetch_warehouse_brands(sb_client, brand_ids)

        query = _build_research_query(state, warehouse_brands)
        raw_content, source_urls = await _perplexity_search_async(query)

        if not raw_content:
            return {
                "item_research": {
                    "warehouse_brands": warehouse_brands,
                } if warehouse_brands else None
            }

        artist_brand_context = _extract_artist_brand_context(raw_content, state)
        item_stories = _parse_item_stories(raw_content, state, warehouse_brands)

        return {
            "item_research": {
                "artist_brand_context": artist_brand_context,
                "item_stories": item_stories,
                "raw_research": raw_content,
                "source_urls": source_urls,
                "warehouse_brands": warehouse_brands,
            }
        }

    except Exception:
        logger.warning("item_research_node failed, continuing without", exc_info=True)
        return {"item_research": None}
