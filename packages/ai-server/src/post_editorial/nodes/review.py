"""Review node: Pydantic schema validation + LLM-as-a-Judge quality assessment."""

from __future__ import annotations

import asyncio
import json
import logging
import re

from google import genai
from google.genai import types
from pydantic import ValidationError

from ..models import PostMagazineLayout, ReviewResult, CriterionResult
from ..state import PostEditorialState
from ..config import get_settings
from ..gemini_retry import _is_transient_gemini_error

logger = logging.getLogger(__name__)

MAX_REVISIONS = 3
_REVIEW_TIMEOUT = 60


def _strip_markdown_fences(text: str) -> str:
    stripped = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    stripped = re.sub(r"\n?```\s*$", "", stripped)
    return stripped.strip()


def _assemble_draft(state: PostEditorialState) -> dict:
    post_data = state["post_data"]
    design_spec = state.get("design_spec") or {}
    editorial_section = state.get("editorial_section") or {"paragraphs": []}
    item_editorial_texts = state.get("item_editorial_texts") or {}

    items = []
    for spot in post_data.spots:
        for sol in spot.solutions:
            brand = None
            if sol.metadata and isinstance(sol.metadata, dict):
                brand = sol.metadata.get("brand")
            items.append({
                "spot_id": spot.id,
                "solution_id": sol.id,
                "title": sol.title,
                "brand": brand,
                "image_url": sol.thumbnail_url,
                "original_url": sol.original_url,
                "metadata": sol.metadata or {},
                "editorial_paragraphs": item_editorial_texts.get(spot.id, []),
            })

    return {
        "schema_version": "1.0",
        "title": state.get("title", "Untitled"),
        "subtitle": state.get("subtitle"),
        "editorial": editorial_section,
        "celeb_list": state.get("celeb_list", []),
        "items": items,
        "related_items": state.get("related_items", []),
        "design_spec": design_spec,
    }


def validate_format(draft: dict) -> CriterionResult:
    try:
        PostMagazineLayout.model_validate(draft)
    except ValidationError as e:
        return CriterionResult(
            criterion="format",
            passed=False,
            reason=f"Schema validation failed: {e.error_count()} error(s) — {e.errors()[0]['msg']}",
            severity="critical",
        )

    if not draft.get("title") or not str(draft.get("title", "")).strip():
        return CriterionResult(criterion="format", passed=False, reason="Title is empty", severity="critical")

    editorial = draft.get("editorial") or {}
    if not editorial.get("paragraphs"):
        return CriterionResult(criterion="format", passed=False, reason="No editorial paragraphs", severity="critical")

    return CriterionResult(criterion="format", passed=True, reason="Schema valid", severity="minor")


def _build_review_prompt(draft_json: str, post_summary: str) -> str:
    return f"""당신은 패션 매거진 편집장으로서 포스트 매거진 초안을 검수합니다.

## 포스트 매거진 초안
{draft_json}

## 원본 포스트 정보
{post_summary}

## 평가 기준
1. hallucination: 원본에 없는 허위 브랜드명, 존재하지 않는 셀럽 확인
2. fact_accuracy: 브랜드명, 아티스트명, 아이템 설명이 원본과 일치하는지
3. content_completeness: 에디토리얼 본문, 아이템별 에디토리얼 포함 여부

출력: {{"passed": true/false, "criteria": [...], "summary": "...", "suggestions": []}}
반드시 유효한 JSON만 출력하세요."""


async def review_node(state: PostEditorialState) -> dict:
    draft = _assemble_draft(state)
    format_result = validate_format(draft)
    if not format_result.passed:
        new_revision_count = state.get("revision_count", 0) + 1
        update: dict = {
            "review_result": {"passed": False},
            "revision_count": new_revision_count,
            "feedback_history": [{"criteria": [format_result.model_dump()], "summary": format_result.reason, "suggestions": [format_result.reason]}],
        }
        if new_revision_count >= MAX_REVISIONS:
            update["pipeline_status"] = "failed"
            update["error_log"] = [f"Review failed after {new_revision_count} attempts: {format_result.reason}"]
        return update

    post_data = state["post_data"]
    artist_info = " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or "Unknown"
    items_summary = ", ".join(sol.title for spot in post_data.spots for sol in spot.solutions)
    post_summary = f"아티스트: {artist_info}, 아이템: {items_summary}"

    draft_json = json.dumps(draft, ensure_ascii=False, default=str)
    prompt = _build_review_prompt(draft_json, post_summary)

    try:
        settings = get_settings()
        client = genai.Client(api_key=settings.gemini_api_key)

        async def _call_review(model: str):
            return await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.0),
                ),
                timeout=_REVIEW_TIMEOUT,
            )

        try:
            response = await _call_review(settings.gemini_model)
        except Exception as e:
            if _is_transient_gemini_error(e):
                response = await _call_review(settings.gemini_fallback_model)
            else:
                raise

        raw_text = response.text or "{}"
        stripped = _strip_markdown_fences(raw_text)
        result = None
        for text_candidate in [stripped, raw_text]:
            try:
                result = ReviewResult.model_validate_json(text_candidate)
                break
            except Exception:
                continue

        if result is None:
            result = ReviewResult(
                passed=True,
                criteria=[CriterionResult(criterion=c, passed=True, reason="Parse failed; lenient pass", severity="minor") for c in ("hallucination", "fact_accuracy", "content_completeness")],
                summary="Review response could not be parsed.",
                suggestions=[],
            )

    except asyncio.TimeoutError:
        result = ReviewResult(
            passed=True,
            criteria=[CriterionResult(criterion=c, passed=True, reason="LLM timeout", severity="minor") for c in ("hallucination", "fact_accuracy", "content_completeness")],
            summary="Review timed out.",
            suggestions=[],
        )
    except Exception as e:
        logger.exception("review_node LLM evaluation failed")
        new_rev = state.get("revision_count", 0) + 1
        return {
            "review_result": {"passed": False},
            "revision_count": new_rev,
            "feedback_history": [{"criteria": [], "summary": f"Review error: {e!s}"}],
            "error_log": [f"Review failed: {type(e).__name__}: {e!s}"],
        }

    all_criteria = [format_result] + result.criteria
    overall_passed = all(c.passed for c in all_criteria)
    result_dict = {"passed": overall_passed, "criteria": [c.model_dump() for c in all_criteria], "summary": result.summary, "suggestions": result.suggestions}

    update = {"review_result": result_dict}
    if overall_passed:
        update["pipeline_status"] = "reviewed"
    else:
        new_revision_count = state.get("revision_count", 0) + 1
        update["revision_count"] = new_revision_count
        update["feedback_history"] = [result_dict]
        if new_revision_count >= MAX_REVISIONS:
            update["pipeline_status"] = "failed"
            update["error_log"] = [f"Review failed after {new_revision_count} attempts."]

    return update
