"""MediaVisionParser tests (#260).

Mocks `google.genai.Client` so no real API call is made; we assert:
  - happy path returns ParsedDecodeResult
  - transient 503 triggers fallback model retry (via call_gemini_with_fallback)
  - caption is embedded in the prompt when provided
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.services.media.models import ParsedDecodeResult
from src.services.media.vision_parser import MediaVisionParser, _build_prompt


class _FakeEnv:
    GEMINI_API_KEY = "fake-key"
    GEMINI_MODEL = "gemini-2.5-flash"
    GEMINI_VISION_MODEL = "gemini-2.5-flash"
    GEMINI_VISION_FALLBACK_MODEL = "gemini-2.5-flash-lite"


def _mock_response(json_text: str) -> MagicMock:
    resp = MagicMock()
    resp.text = json_text
    return resp


@pytest.mark.asyncio
async def test_happy_path_returns_parsed_result():
    env = _FakeEnv()
    parser = MediaVisionParser(env)

    payload = (
        '{"celebrity_name": "Alice", "group_name": null, "occasion": "Airport",'
        ' "items": [{"brand": "Gucci", "product_name": "Shoes",'
        ' "price_amount": 500.0, "price_currency": "USD",'
        ' "subcategory": "shoes", "position_x_pct": 60,'
        ' "position_y_pct": 75}]}'
    )

    fake_client = MagicMock()
    fake_client.aio.models.generate_content = AsyncMock(
        return_value=_mock_response(payload)
    )

    with patch(
        "src.services.media.vision_parser.genai.Client",
        return_value=fake_client,
    ):
        result = await parser.parse(
            image_bytes=b"imagebytes",
            mime_type="image/jpeg",
            caption=None,
        )

    assert isinstance(result, ParsedDecodeResult)
    assert result.celebrity_name == "Alice"
    assert len(result.items) == 1
    assert result.items[0].brand == "Gucci"

    # Called once with the primary model.
    call_args = fake_client.aio.models.generate_content.await_args
    assert call_args.kwargs["model"] == "gemini-2.5-flash"


@pytest.mark.asyncio
async def test_transient_error_triggers_fallback_model():
    env = _FakeEnv()
    parser = MediaVisionParser(env)

    payload = '{"items": []}'
    calls: list[str] = []

    async def _fake_gen(model, contents, config):
        calls.append(model)
        if model == "gemini-2.5-flash":
            raise RuntimeError("503 overloaded")
        return _mock_response(payload)

    fake_client = MagicMock()
    fake_client.aio.models.generate_content = AsyncMock(side_effect=_fake_gen)

    with patch(
        "src.services.media.vision_parser.genai.Client",
        return_value=fake_client,
    ):
        result = await parser.parse(
            image_bytes=b"bytes",
            mime_type="image/png",
            caption="caption-text",
        )

    assert isinstance(result, ParsedDecodeResult)
    assert result.items == []
    assert calls == ["gemini-2.5-flash", "gemini-2.5-flash-lite"]


@pytest.mark.asyncio
async def test_non_transient_error_bubbles():
    env = _FakeEnv()
    parser = MediaVisionParser(env)

    fake_client = MagicMock()
    fake_client.aio.models.generate_content = AsyncMock(
        side_effect=RuntimeError("invalid api key")
    )

    with patch(
        "src.services.media.vision_parser.genai.Client",
        return_value=fake_client,
    ):
        with pytest.raises(RuntimeError, match="invalid api key"):
            await parser.parse(
                image_bytes=b"bytes",
                mime_type="image/jpeg",
                caption=None,
            )


@pytest.mark.asyncio
async def test_missing_api_key_raises_before_calling_genai():
    class _NoKey(_FakeEnv):
        GEMINI_API_KEY = ""

    parser = MediaVisionParser(_NoKey())
    with patch("src.services.media.vision_parser.genai.Client") as mock_cls:
        with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
            await parser.parse(
                image_bytes=b"b",
                mime_type="image/jpeg",
                caption=None,
            )
        mock_cls.assert_not_called()


def test_prompt_without_caption():
    prompt = _build_prompt(None)
    assert "Caption from the source post" not in prompt
    assert "Fashion Decode" in prompt


def test_prompt_with_caption_embeds_text():
    prompt = _build_prompt("IU airport OOTD 2023")
    assert "Caption from the source post" in prompt
    assert "IU airport OOTD 2023" in prompt


def test_prompt_ignores_whitespace_only_caption():
    prompt = _build_prompt("   \n\t  ")
    assert "Caption from the source post" not in prompt
