"""DesignSpec node: generate color palette and fonts from post image/context."""

from __future__ import annotations

import logging

from google import genai
from google.genai import types

from ..models import DesignSpec, default_design_spec
from ..state import PostEditorialState
from ..config import get_settings
from ..gemini_retry import call_gemini_with_fallback

logger = logging.getLogger(__name__)

DESIGN_SPEC_PROMPT_TEMPLATE = """You are a creative director for a high-end fashion editorial magazine.
Generate a design specification for a post magazine about: "{context}"

Artist/Group: {artist_info}
Post image URL: {image_url}

Output ONLY valid JSON matching this exact schema:

{{
  "accent_color": "<hex color — the MOST IMPORTANT field>",
  "primary_color": "<hex color>",
  "secondary_color": "<hex color>",
  "bg_color": "<hex color>",
  "font_heading": "",
  "font_body": "",
  "style_tags": ["<tag1>", "<tag2>", "<tag3>"]
}}

style_tags: 2-3 Korean tags for style/mood (e.g. "스마트캐주얼", "믹스매치", "데일리룩"). Short, no spaces.

CRITICAL: The frontend app has fixed fonts (Playfair Display + Inter) and a dark theme.
Only `accent_color` is actually used by the frontend as a highlight/decoration color.
Focus your creative effort on choosing an expressive, mood-appropriate accent_color
that complements the artist/content while being visible on a dark background.

ACCENT COLOR GUIDELINES:
- Should be vibrant enough to stand out on dark (#1f1f1f) backgrounds
- Should evoke the mood/aesthetic of the content and artist
- Avoid pure white, pure black, or very dark colors
- Examples: coral #FF6B6B, teal #2EC4B6, amber #FFBE0B, lavender #A78BFA

Output JSON only, no markdown fences, no explanation."""


def _get_genai_client() -> genai.Client:
    settings = get_settings()
    return genai.Client(api_key=settings.gemini_api_key)


async def _generate_spec(client: genai.Client, prompt: str, model: str) -> DesignSpec:
    response = await client.aio.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DesignSpec,
            temperature=0.7,
        ),
    )
    raw_text = response.text or "{}"
    return DesignSpec.model_validate_json(raw_text)


async def design_spec_node(state: PostEditorialState) -> dict:
    """Generate design spec (colors, fonts) from post image and context."""
    try:
        post_data = state["post_data"]
        artist_info = (
            " / ".join(filter(None, [post_data.artist_name, post_data.group_name])) or "Unknown"
        )
        context = post_data.context or post_data.title or artist_info

        prompt = DESIGN_SPEC_PROMPT_TEMPLATE.format(
            context=context,
            artist_info=artist_info,
            image_url=post_data.image_url,
        )

        settings = get_settings()
        client = _get_genai_client()
        spec = await call_gemini_with_fallback(
            settings.gemini_model,
            settings.gemini_fallback_model,
            lambda model: _generate_spec(client, prompt, model),
        )
        logger.info("Generated design spec: accent=%s", spec.accent_color)
        return {"design_spec": spec.model_dump(), "pipeline_status": "designing"}

    except Exception:
        logger.warning("design_spec_node failed, using default", exc_info=True)
        return {
            "design_spec": default_design_spec().model_dump(),
            "pipeline_status": "designing",
        }
