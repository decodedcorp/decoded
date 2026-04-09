"""NewsResearch node: find item-specific fashion news via per-item Perplexity search + OG extraction + Gemini filtering."""

from __future__ import annotations

import asyncio
import logging
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from google import genai
from google.genai import types
from pydantic import BaseModel

from ..state import PostEditorialState
from ..config import get_settings
from ..gemini_retry import call_gemini_with_fallback
from ...services.metadata.extractors.og_extractor import OGTagExtractor

logger = logging.getLogger(__name__)

_og_extractor = OGTagExtractor()


class NewsArticleEvaluation(BaseModel):
    title: str
    url: str
    source: str
    summary: str
    relevance_score: float
    credibility_score: float
    matched_item: str


class NewsFilterOutput(BaseModel):
    articles: list[NewsArticleEvaluation]


def _build_item_queries(state: PostEditorialState) -> list[dict]:
    """Build per-item search queries: artist + brand + item title."""
    post_data = state["post_data"]
    artist = " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or ""

    queries = []
    seen = set()
    for spot in post_data.spots:
        for sol in spot.solutions:
            meta = sol.metadata if isinstance(sol.metadata, dict) else {}
            brand = meta.get("brand", "")
            title = sol.title or ""
            sub_category = meta.get("sub_category", "")

            # Build a specific query per item
            key = f"{brand}:{title}".lower().strip()
            if not key or key in seen or (not brand and not title):
                continue
            seen.add(key)

            parts = []
            if artist:
                parts.append(artist)
            if brand:
                parts.append(brand)
            if title and title.lower() != brand.lower():
                parts.append(title)
            if sub_category:
                parts.append(sub_category)

            queries.append({
                "query": " ".join(parts),
                "item_label": f"{brand} {title}".strip() if brand else title,
                "spot_id": spot.id,
            })

    return queries[:6]  # Cap at 6 to avoid too many API calls


async def _perplexity_search(query: str) -> tuple[str, list[str]]:
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
        "messages": [
            {
                "role": "user",
                "content": (
                    "Find recent credible fashion news or reviews specifically about the following item or collaboration. "
                    "Focus on: product launches, collection reveals, celebrity styling, editorial features, or brand announcements "
                    "that directly involve this specific item or product line. "
                    "Do NOT include generic artist news unrelated to this item. "
                    "Cite all sources.\n\n"
                    f"{query}"
                ),
            }
        ],
        "max_tokens": 1024,
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


async def _search_for_item(item_query: dict) -> dict:
    """Search Perplexity for a single item and return results with item context."""
    try:
        content, urls = await _perplexity_search(item_query["query"])
        return {
            "item_label": item_query["item_label"],
            "spot_id": item_query["spot_id"],
            "content": content,
            "urls": urls,
        }
    except Exception:
        logger.debug("Perplexity search failed for %s", item_query["item_label"], exc_info=True)
        return {
            "item_label": item_query["item_label"],
            "spot_id": item_query["spot_id"],
            "content": "",
            "urls": [],
        }


async def _fetch_og_for_url(url: str) -> dict:
    """Fetch a URL and extract OG metadata using the existing OGTagExtractor."""
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        preview = _og_extractor.extract(soup, url)
        return {
            "url": url,
            "og_title": preview.title,
            "og_description": preview.description,
            "og_image": preview.img_url,
            "og_site_name": preview.site_name,
        }
    except Exception:
        logger.debug("OG extraction failed for %s", url, exc_info=True)
        domain = urlparse(url).netloc.replace("www.", "")
        return {
            "url": url,
            "og_title": None,
            "og_description": None,
            "og_image": None,
            "og_site_name": domain or None,
        }


async def _extract_og_for_urls(urls: list[str]) -> dict[str, dict]:
    if not urls:
        return {}
    tasks = [_fetch_og_for_url(u) for u in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    og_map: dict[str, dict] = {}
    for r in results:
        if isinstance(r, dict):
            og_map[r["url"]] = r
    return og_map


async def _filter_with_gemini(
    search_results: list[dict],
    og_map: dict[str, dict],
    state: PostEditorialState,
) -> list[dict]:
    """Filter articles: each must be directly about a specific item, not just the artist."""
    post_data = state["post_data"]
    artist = " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or "Unknown"

    # Build per-item search context
    item_sections = []
    for sr in search_results:
        if not sr["content"]:
            continue
        # Gather OG info for this item's URLs
        url_details = []
        for u in sr["urls"]:
            og = og_map.get(u, {})
            parts = [f"URL: {u}"]
            if og.get("og_title"):
                parts.append(f"Title: {og['og_title']}")
            if og.get("og_site_name"):
                parts.append(f"Source: {og['og_site_name']}")
            if og.get("og_description"):
                parts.append(f"Desc: {og['og_description'][:150]}")
            url_details.append(" | ".join(parts))

        item_sections.append(
            f"=== Item: {sr['item_label']} ===\n"
            f"Research:\n{sr['content'][:800]}\n"
            f"URLs:\n" + "\n".join(url_details)
        )

    if not item_sections:
        return []

    prompt = f"""You are a fashion editorial fact-checker. Your job is to verify that each news article is DIRECTLY about a specific item or product, not just generally about the artist.

Artist: {artist}

{chr(10).join(item_sections)}

STRICT evaluation criteria:
- relevance_score (0-1): The article must be DIRECTLY about the specific item, brand collaboration, product line, or collection mentioned. Generic artist news (dating, music, general celebrity gossip) scores 0. An article about the brand but not the specific item scores 0.3-0.4. An article specifically mentioning the item, its collection, or the artist wearing/endorsing this exact product scores 0.7-1.0.
- credibility_score (0-1): Source credibility.
  High (0.8-1.0): Hypebeast, Vogue, GQ, WWD, BOF, Dazed, i-D, Elle, Harper's Bazaar, Highsnobiety, SSENSE
  Medium (0.5-0.7): L'Officiel, Tatler, regional fashion media, SCMP Style
  Low (0-0.4): Unknown blogs, tabloids

- matched_item: Which specific item this article is about (must match one of the items above)

Return ONLY articles where relevance_score >= 0.7 AND credibility_score >= 0.6.
For each article: title, url, source, summary (1-2 sentences in Korean explaining the item connection), relevance_score, credibility_score, matched_item.
If NO articles meet these strict criteria, return an empty articles list.
Output valid JSON only."""

    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)

    async def _generate(model: str) -> NewsFilterOutput:
        response = await client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=NewsFilterOutput,
                temperature=0.1,
            ),
        )
        return NewsFilterOutput.model_validate_json(response.text or '{"articles":[]}')

    output = await call_gemini_with_fallback(
        settings.gemini_model,
        settings.gemini_fallback_model,
        _generate,
    )

    results = []
    for article in output.articles:
        og = og_map.get(article.url, {})
        results.append({
            "title": article.title,
            "url": article.url,
            "source": article.source,
            "summary": article.summary,
            "og_title": og.get("og_title"),
            "og_description": og.get("og_description"),
            "og_image": og.get("og_image"),
            "og_site_name": og.get("og_site_name"),
            "relevance_score": article.relevance_score,
            "credibility_score": article.credibility_score,
            "matched_item": article.matched_item,
        })
    return results


async def news_research_node(state: PostEditorialState) -> dict:
    """Search for item-specific fashion news, extract OG metadata, and filter by strict relevance."""
    try:
        item_queries = _build_item_queries(state)
        if not item_queries:
            logger.info("news_research: no items with brand/title, skipping")
            return {"news_references": None}

        logger.info(
            "news_research: searching for %d items: %s",
            len(item_queries),
            [q["item_label"] for q in item_queries],
        )

        # Search Perplexity per item (parallel, capped at 6)
        search_tasks = [_search_for_item(q) for q in item_queries]
        search_results = await asyncio.gather(*search_tasks)
        search_results = [sr for sr in search_results if sr["content"] and sr["urls"]]

        if not search_results:
            logger.info("news_research: no results from Perplexity")
            return {"news_references": None}

        # Collect all unique URLs for OG extraction
        all_urls = list({u for sr in search_results for u in sr["urls"]})
        og_map = await _extract_og_for_urls(all_urls)

        # Filter with strict item-level relevance
        filtered = await _filter_with_gemini(search_results, og_map, state)

        logger.info(
            "news_research: %d articles passed strict filter (from %d URLs across %d items)",
            len(filtered),
            len(all_urls),
            len(search_results),
        )
        return {"news_references": filtered if filtered else None}

    except Exception:
        logger.warning("news_research_node failed, continuing without", exc_info=True)
        return {"news_references": None}
