"""ImageAnalysis node: Gemini Vision analysis of the post image."""

from __future__ import annotations

import logging

import httpx
from google import genai
from google.genai import types
from pydantic import BaseModel

from ..state import PostEditorialState
from ..config import get_settings
from ..gemini_retry import call_gemini_with_fallback

logger = logging.getLogger(__name__)

IMAGE_ANALYSIS_PROMPT = """You are a senior fashion editor at Decoded analyzing a celebrity's Instagram post image.
Extract visual details for editorial content. Be specific and observational. Write all values in English.

Output ONLY valid JSON matching this schema:
{
  "overall_mood": "overall mood/vibe in English (e.g., 'casual chic', 'streetwear mood')",
  "color_palette": ["3-5 dominant colors visible in the image, in English"],
  "setting": "shooting location/background in English (e.g., 'airport', 'studio', 'street')",
  "styling_details": "visual observations on layering, fit, proportions, how pieces are worn (English, 2-3 sentences)",
  "hidden_details": ["easily-missed details in English — accessories, logos, text, nails, hair, etc."]
}

Focus on what you SEE in the image, not assumptions. Every value must be English."""


class ImageAnalysisOutput(BaseModel):
    overall_mood: str
    color_palette: list[str] = []
    setting: str = ""
    styling_details: str = ""
    hidden_details: list[str] = []


async def _download_image(url: str) -> tuple[bytes, str]:
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        return resp.content, content_type


async def _analyze_image(
    client: genai.Client, model: str, prompt: str, image_bytes: bytes, mime_type: str
) -> ImageAnalysisOutput:
    response = await client.aio.models.generate_content(
        model=model,
        contents=[
            prompt,
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ImageAnalysisOutput,
            temperature=0.3,
        ),
    )
    raw_text = response.text or "{}"
    return ImageAnalysisOutput.model_validate_json(raw_text)


async def image_analysis_node(state: PostEditorialState) -> dict:
    """Analyze the post image with Gemini Vision."""
    try:
        post_data = state["post_data"]
        image_url = post_data.image_url
        if not image_url:
            logger.warning("No image_url, skipping image analysis")
            return {"image_analysis": None}

        image_bytes, mime_type = await _download_image(image_url)
        settings = get_settings()
        client = genai.Client(api_key=settings.gemini_api_key)
        output = await call_gemini_with_fallback(
            settings.gemini_model,
            settings.gemini_fallback_model,
            lambda model: _analyze_image(
                client, model, IMAGE_ANALYSIS_PROMPT, image_bytes, mime_type
            ),
        )
        return {"image_analysis": output.model_dump()}

    except Exception:
        logger.warning("image_analysis_node failed, continuing without", exc_info=True)
        return {"image_analysis": None}
