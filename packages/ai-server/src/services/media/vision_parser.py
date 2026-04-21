"""Gemini Vision wrapper that turns a Fashion Decode image into a `ParsedDecodeResult`.

Reuses `call_gemini_with_fallback` from post_editorial so transient 503/429
errors automatically retry against the fallback model. The fallback retry
helper has no editorial coupling and is safe to share.
"""

from __future__ import annotations

import logging
from typing import Optional

from google import genai
from google.genai import types

from src.config._environment import Environment
from src.post_editorial.gemini_retry import call_gemini_with_fallback
from src.services.media.models import ParsedDecodeResult


logger = logging.getLogger(__name__)


PROMPT_HEADER = (
    "You analyze Fashion Decode images. The canonical format is a split frame:\n"
    "left = celebrity/artist portrait, right = the item(s) they're wearing.\n"
    "Other layouts exist — use the whole image, not just the right half.\n\n"
    "For each fashion item visible, extract: brand, product name, price (amount + "
    "currency code like USD/KRW/EUR), subcategory "
    "(top | bottom | shoes | bag | accessory | outer | dress | set | hat | other), "
    "and its center position as integer percentages of the image "
    "(position_x_pct and position_y_pct, both 0-100, origin top-left).\n"
    "Also extract: celebrity_name, group_name, occasion if visible.\n\n"
    "If the image is clearly NOT a fashion-decode post (no identifiable fashion "
    "items), return items as an empty array. Never invent data."
)


def _build_prompt(caption: Optional[str]) -> str:
    if not caption:
        return PROMPT_HEADER
    clean = caption.strip()
    if not clean:
        return PROMPT_HEADER
    return (
        f"{PROMPT_HEADER}\n\n"
        f"Caption from the source post (may contain hints — treat as "
        f"secondary to what you see in the image):\n{clean}"
    )


class MediaVisionParser:
    def __init__(self, environment: Environment) -> None:
        self._env = environment
        self._primary = (
            environment.GEMINI_VISION_MODEL or environment.GEMINI_MODEL
        )
        self._fallback = (
            environment.GEMINI_VISION_FALLBACK_MODEL or self._primary
        )

    async def parse(
        self,
        *,
        image_bytes: bytes,
        mime_type: str,
        caption: Optional[str],
    ) -> ParsedDecodeResult:
        if not self._env.GEMINI_API_KEY:
            raise RuntimeError("MediaVisionParser: GEMINI_API_KEY is not configured")

        client = genai.Client(api_key=self._env.GEMINI_API_KEY)
        prompt = _build_prompt(caption)
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        async def _generate(model: str) -> ParsedDecodeResult:
            resp = await client.aio.models.generate_content(
                model=model,
                contents=[image_part, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ParsedDecodeResult,
                    temperature=0.2,
                ),
            )
            raw_text = resp.text or "{}"
            return ParsedDecodeResult.model_validate_json(raw_text)

        return await call_gemini_with_fallback(
            self._primary, self._fallback, _generate
        )
