"""Editorial node: Decoded piece-by-piece breakdown editorial (English)."""

from __future__ import annotations

import logging

from google import genai
from google.genai import types
from pydantic import BaseModel

from ..state import PostEditorialState
from ..config import get_settings
from ..gemini_retry import call_gemini_with_fallback

logger = logging.getLogger(__name__)


class SpotEditorial(BaseModel):
    spot_id: str
    paragraphs: list[str]


class EditorialOutput(BaseModel):
    title: str
    subtitle: str | None = None
    editorial_paragraphs: list[str]
    pull_quote: str | None = None
    item_editorials: list[SpotEditorial]


def _build_vision_section(state: PostEditorialState) -> str:
    analysis = state.get("image_analysis")
    if not analysis or not isinstance(analysis, dict):
        return "(no image analysis)"
    parts = []
    if analysis.get("overall_mood"):
        parts.append(f"Mood: {analysis['overall_mood']}")
    if analysis.get("setting"):
        parts.append(f"Setting: {analysis['setting']}")
    if analysis.get("color_palette"):
        parts.append(f"Color palette: {', '.join(analysis['color_palette'])}")
    if analysis.get("styling_details"):
        parts.append(f"Styling observations: {analysis['styling_details']}")
    if analysis.get("hidden_details"):
        parts.append(f"Hidden details: {', '.join(analysis['hidden_details'])}")
    return "\n".join(parts) if parts else "(no image analysis)"


def _build_research_section(state: PostEditorialState) -> tuple[str, str]:
    research = state.get("item_research")
    if not research or not isinstance(research, dict):
        return "", ""
    return research.get("artist_brand_context", ""), research.get("raw_research", "")


def _build_items_section(state: PostEditorialState) -> str:
    post_data = state["post_data"]
    research = state.get("item_research") or {}
    item_stories = research.get("item_stories", {}) if isinstance(research, dict) else {}
    lines: list[str] = []
    for spot in post_data.spots:
        for sol in spot.solutions:
            meta = sol.metadata if isinstance(sol.metadata, dict) else {}
            brand = meta.get("brand", "")
            price = meta.get("price", "")
            material = meta.get("material", [])
            if isinstance(material, list):
                material = ", ".join(material)
            sub_category = meta.get("sub_category", "")
            origin = meta.get("origin", "")
            entry = f"- spot_id: {spot.id}\n  item: {sol.title}"
            if brand:
                entry += f" ({brand})"
            details = []
            if price:
                details.append(f"price: {price}")
            if material:
                details.append(f"material: {material}")
            if sub_category:
                details.append(f"category: {sub_category}")
            if origin:
                details.append(f"origin: {origin}")
            if details:
                entry += f"\n  {' | '.join(details)}"
            story = item_stories.get(spot.id)
            if story:
                entry += f"\n  research: {story[:300]}"
            lines.append(entry)
    return "\n".join(lines) if lines else "(no items)"


def _build_news_section(state: PostEditorialState) -> str:
    refs = state.get("news_references")
    if not refs:
        return "(no related news)"
    lines = []
    for ref in refs:
        item = ref.get("matched_item", "")
        item_tag = f" [item: {item}]" if item else ""
        lines.append(f"- {ref['title']} ({ref['source']}): {ref['summary']}{item_tag}")
    return "\n".join(lines)


def _build_editorial_prompt(state: PostEditorialState) -> str:
    post_data = state["post_data"]
    artist_info = (
        " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or "Unknown"
    )
    vision_section = _build_vision_section(state)
    artist_brand_ctx, raw_research = _build_research_section(state)
    items_section = _build_items_section(state)
    news_section = _build_news_section(state)

    feedback_section = ""
    feedback_history = state.get("feedback_history") or []
    if feedback_history:
        feedback_section = "\n\n--- Previous review feedback (must incorporate) ---\n"
        for i, fb in enumerate(feedback_history, 1):
            feedback_section += f"\n[Attempt {i}]\n"
            for criterion in fb.get("criteria", []):
                if not criterion.get("passed"):
                    feedback_section += f"- {criterion['criterion']}: {criterion['reason']}\n"
            suggestions = fb.get("suggestions", [])
            if suggestions:
                feedback_section += f"Improvement suggestions: {', '.join(suggestions)}\n"

    research_block = ""
    if artist_brand_ctx:
        research_block += f"\n[Artist-Brand Context]\n{artist_brand_ctx}\n"
    if raw_research:
        research_block += f"\n[Raw Item Research (reference)]\n{raw_research[:1500]}\n"

    return f"""{feedback_section}You are a senior fashion editor at Decoded, writing a piece-by-piece breakdown of a celebrity post. Analyze each item in the post thoroughly in Decoded's own editorial voice.

IMPORTANT: Do NOT mention "Hypebeast" or "Tagged" anywhere in the output under any circumstances. Write as Decoded. Brand and product names (e.g., Nike, Gucci, Prada) are expected and encouraged when describing items.

Artist/Group: {artist_info}
Post context: {post_data.context or "none"}
{research_block}
[Image analysis]
{vision_section}

[Item details]
{items_section}

[Related news and articles]
{news_section}

Output requirements (all fields in English):
- title: a compelling editorial title.
- subtitle: a one-sentence subtitle.
- editorial_paragraphs: 3-4 paragraphs, roughly 200-350 characters each.
- pull_quote: one memorable one-line quote.
- item_editorials: per-spot piece-by-piece commentary, in the form {{"spot_id": "...", "paragraphs": ["..."]}}.
- When referencing related news, cite the source neutrally (e.g., "according to the linked article") — do not invent publication names.

Output must be valid JSON only."""


def _get_genai_client() -> genai.Client:
    settings = get_settings()
    return genai.Client(api_key=settings.gemini_api_key)


async def _generate_editorial(client: genai.Client, prompt: str, model: str) -> EditorialOutput:
    response = await client.aio.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=EditorialOutput,
            temperature=0.7,
        ),
    )
    raw_text = response.text or "{}"
    return EditorialOutput.model_validate_json(raw_text)


async def editorial_node(state: PostEditorialState) -> dict:
    """Generate title, main editorial, and per-item editorial texts."""
    try:
        prompt = _build_editorial_prompt(state)
        settings = get_settings()
        client = _get_genai_client()

        output = await call_gemini_with_fallback(
            settings.gemini_pro_model,
            settings.gemini_model,
            lambda model: _generate_editorial(client, prompt, model),
        )
        item_editorial_dict = {se.spot_id: se.paragraphs for se in output.item_editorials}

        return {
            "title": output.title,
            "subtitle": output.subtitle,
            "editorial_section": {
                "paragraphs": output.editorial_paragraphs,
                "pull_quote": output.pull_quote,
            },
            "item_editorial_texts": item_editorial_dict,
            "pipeline_status": "drafting",
        }

    except Exception as e:
        logger.exception("editorial_node failed")
        return {
            "pipeline_status": "failed",
            "error_log": [f"Editorial failed: {type(e).__name__}: {e!s}"],
        }
