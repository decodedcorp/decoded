"""Summary node: generate a 3-5 sentence AI summary using Groq."""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq

from ..state import PostEditorialState
from ..config import get_settings
from ..utils import _llm_content_to_str

logger = logging.getLogger(__name__)

SUMMARY_PROMPT_TEMPLATE = """You are a senior fashion editor at Decoded. Write a concise summary of the post below.

Artist: {artist_info}
Context: {context}
Items: {items_section}

Editorial reference:
{editorial_context}

Write 3-5 natural sentences in English (roughly 150-300 characters).
Output the summary only, without any prefix or quotation marks:"""


def _build_items_brief(state: PostEditorialState) -> str:
    post_data = state["post_data"]
    lines = []
    for spot in post_data.spots:
        for sol in spot.solutions:
            brand = ""
            sub_category = ""
            if sol.metadata and isinstance(sol.metadata, dict):
                brand = sol.metadata.get("brand", "")
                sub_category = sol.metadata.get("sub_category", "")
            entry = f"- {sol.title or '(untitled)'}"
            if brand:
                entry += f" ({brand})"
            if sub_category:
                entry += f" [{sub_category}]"
            lines.append(entry)
    return "\n".join(lines) if lines else "(no items)"


def _build_editorial_context(state: PostEditorialState) -> str:
    parts: list[str] = []
    if state.get("title"):
        parts.append(f"Title: {state['title']}")
    if state.get("subtitle"):
        parts.append(f"Subtitle: {state['subtitle']}")
    editorial = state.get("editorial_section")
    if editorial and isinstance(editorial, dict):
        paragraphs = editorial.get("paragraphs", [])
        if paragraphs:
            parts.append("Body:\n" + "\n".join(paragraphs))
    item_texts = state.get("item_editorial_texts")
    if item_texts and isinstance(item_texts, dict):
        for spot_id, paras in item_texts.items():
            if paras:
                parts.append(f"Item({spot_id}): " + " ".join(paras))
    analysis = state.get("image_analysis")
    if analysis and isinstance(analysis, dict):
        mood = analysis.get("overall_mood", "")
        setting = analysis.get("setting", "")
        if mood or setting:
            parts.append(f"Image analysis: mood={mood}, setting={setting}")
    research = state.get("item_research")
    if research and isinstance(research, dict):
        ctx = research.get("artist_brand_context", "")
        if ctx:
            parts.append(f"Artist-brand: {ctx[:200]}")
    return "\n\n".join(parts) if parts else "(no editorial generated)"


async def _generate_summary_groq(prompt: str) -> str:
    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not configured")

    llm = ChatGroq(
        model=settings.groq_researcher_model,
        api_key=settings.groq_api_key,
        temperature=0.7,
        max_tokens=1024,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    raw = response.content
    text = _llm_content_to_str(raw).strip()
    for prefix in ["Summary:", "summary:", "요약:", "요약 :"]:
        if text.startswith(prefix):
            text = text[len(prefix) :].strip()
    return text.strip('"').strip("'")


async def summary_node(state: PostEditorialState) -> dict:
    """Generate a rich AI summary referencing editorial content."""
    try:
        post_data = state["post_data"]
        artist_info = (
            " / ".join(filter(None, [post_data.artist_name, post_data.group_name]))
            or "Unknown"
        )
        context = post_data.context or post_data.title or "fashion post"
        items_section = _build_items_brief(state)
        editorial_context = _build_editorial_context(state)

        prompt = SUMMARY_PROMPT_TEMPLATE.format(
            artist_info=artist_info,
            context=context,
            items_section=items_section,
            editorial_context=editorial_context,
        )

        summary = await _generate_summary_groq(prompt)
        return {"ai_summary": summary}

    except Exception:
        logger.warning("summary_node failed, continuing without summary", exc_info=True)
        return {"ai_summary": None}
