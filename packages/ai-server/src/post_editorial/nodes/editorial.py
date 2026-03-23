"""Editorial node: Tagged-style piece-by-piece breakdown editorial."""

from __future__ import annotations

import json
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
        return "(이미지 분석 없음)"
    parts = []
    if analysis.get("overall_mood"):
        parts.append(f"무드: {analysis['overall_mood']}")
    if analysis.get("setting"):
        parts.append(f"장소/배경: {analysis['setting']}")
    if analysis.get("color_palette"):
        parts.append(f"컬러 팔레트: {', '.join(analysis['color_palette'])}")
    if analysis.get("styling_details"):
        parts.append(f"스타일링 관찰: {analysis['styling_details']}")
    if analysis.get("hidden_details"):
        parts.append(f"숨겨진 디테일: {', '.join(analysis['hidden_details'])}")
    return "\n".join(parts) if parts else "(이미지 분석 없음)"


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
            entry = f"- spot_id: {spot.id}\n  아이템: {sol.title}"
            if brand:
                entry += f" ({brand})"
            details = []
            if price:
                details.append(f"가격: {price}")
            if material:
                details.append(f"소재: {material}")
            if sub_category:
                details.append(f"카테고리: {sub_category}")
            if origin:
                details.append(f"원산지: {origin}")
            if details:
                entry += f"\n  {' | '.join(details)}"
            story = item_stories.get(spot.id)
            if story:
                entry += f"\n  리서치: {story[:300]}"
            lines.append(entry)
    return "\n".join(lines) if lines else "(아이템 없음)"


def _build_editorial_prompt(state: PostEditorialState) -> str:
    post_data = state["post_data"]
    artist_info = " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or "Unknown"
    vision_section = _build_vision_section(state)
    artist_brand_ctx, raw_research = _build_research_section(state)
    items_section = _build_items_section(state)

    feedback_section = ""
    feedback_history = state.get("feedback_history") or []
    if feedback_history:
        feedback_section = "\n\n--- 이전 검수 피드백 (반드시 반영하세요) ---\n"
        for i, fb in enumerate(feedback_history, 1):
            feedback_section += f"\n[시도 {i}]\n"
            for criterion in fb.get("criteria", []):
                if not criterion.get("passed"):
                    feedback_section += f"- {criterion['criterion']}: {criterion['reason']}\n"
            suggestions = fb.get("suggestions", [])
            if suggestions:
                feedback_section += f"개선 제안: {', '.join(suggestions)}\n"

    research_block = ""
    if artist_brand_ctx:
        research_block += f"\n[아티스트-브랜드 관계]\n{artist_brand_ctx}\n"
    if raw_research:
        research_block += f"\n[아이템 리서치 원문 (참고용)]\n{raw_research[:1500]}\n"

    return f"""{feedback_section}당신은 Hypebeast 'Tagged' 시리즈의 패션 해설자입니다.
셀럽의 인스타 포스트 한 장에서 아이템을 하나하나 파헤치는 콘텐츠를 작성하세요.

아티스트/그룹: {artist_info}
포스트 컨텍스트: {post_data.context or "없음"}
{research_block}
[이미지 분석 결과]
{vision_section}

[아이템 상세]
{items_section}

작성 조건:
- title: 흥미를 끄는 에디토리얼 제목 (한국어).
- subtitle: 부제목 (한국어, 1문장).
- editorial_paragraphs: 3~4개 단락 (각 200~350자, 한국어).
- pull_quote: 인상적인 한 줄 인용문.
- item_editorials: 각 spot별 piece-by-piece 해설. {{"spot_id": "...", "paragraphs": ["..."]}} 형태.

반드시 유효한 JSON만 출력하세요."""


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
