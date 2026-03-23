"""Summary node: generate a 3-5 sentence AI summary using Groq."""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq

from ..state import PostEditorialState
from ..config import get_settings
from ..utils import _llm_content_to_str

logger = logging.getLogger(__name__)

SUMMARY_PROMPT_TEMPLATE = """패션 매거진 에디터로서 아래 포스트의 요약을 작성하세요.

아티스트: {artist_info}
컨텍스트: {context}
아이템: {items_section}

에디토리얼 참고:
{editorial_context}

한국어 3-5문장(150~300자)으로 자연스러운 문체로 작성하세요.
요약만 출력하세요:"""


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
    return "\n".join(lines) if lines else "(아이템 없음)"


def _build_editorial_context(state: PostEditorialState) -> str:
    parts: list[str] = []
    if state.get("title"):
        parts.append(f"제목: {state['title']}")
    if state.get("subtitle"):
        parts.append(f"부제: {state['subtitle']}")
    editorial = state.get("editorial_section")
    if editorial and isinstance(editorial, dict):
        paragraphs = editorial.get("paragraphs", [])
        if paragraphs:
            parts.append("본문:\n" + "\n".join(paragraphs))
    item_texts = state.get("item_editorial_texts")
    if item_texts and isinstance(item_texts, dict):
        for spot_id, paras in item_texts.items():
            if paras:
                parts.append(f"아이템({spot_id}): " + " ".join(paras))
    analysis = state.get("image_analysis")
    if analysis and isinstance(analysis, dict):
        mood = analysis.get("overall_mood", "")
        setting = analysis.get("setting", "")
        if mood or setting:
            parts.append(f"이미지 분석: 무드={mood}, 장소={setting}")
    research = state.get("item_research")
    if research and isinstance(research, dict):
        ctx = research.get("artist_brand_context", "")
        if ctx:
            parts.append(f"아티스트-브랜드: {ctx[:200]}")
    return "\n\n".join(parts) if parts else "(에디토리얼 미생성)"


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
    for prefix in ["요약:", "요약 :"]:
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
    return text.strip('"').strip("'")


async def summary_node(state: PostEditorialState) -> dict:
    """Generate a rich AI summary referencing editorial content."""
    try:
        post_data = state["post_data"]
        artist_info = " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or "Unknown"
        context = post_data.context or post_data.title or "패션 포스트"
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
