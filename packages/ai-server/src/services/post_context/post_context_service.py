"""PostContextService: extract context and style_tags from post image using Ollama vision."""

from __future__ import annotations

import base64
import json
import logging
import os

import httpx

logger = logging.getLogger(__name__)

CONTEXT_ENUM = [
    "airport",
    "stage",
    "drama",
    "variety",
    "daily",
    "photoshoot",
    "event",
    "brand_campaign",
    "sns",
    "street",
    "fan_meeting",
    "interview",
]

OLLAMA_FORMAT_SCHEMA = {
    "type": "object",
    "properties": {
        "context": {
            "type": "string",
            "enum": CONTEXT_ENUM,
        },
        "style_tags": {
            "type": "array",
            "items": {"type": "string"},
        },
        "mood": {"type": "string"},
        "setting": {"type": "string"},
    },
    "required": ["context", "style_tags", "mood", "setting"],
}

PROMPT = """이 이미지의 촬영 상황(context)과 스타일을 분석해줘.

context는 반드시 아래 목록 중 하나를 선택:
- airport (공항 패션)
- stage (무대/공연/콘서트/뮤직비디오)
- drama (드라마/영화 촬영)
- variety (예능/버라이어티 출연)
- daily (일상/OOTD)
- photoshoot (화보/매거진 촬영)
- event (시상식/행사/레드카펫)
- brand_campaign (브랜드 캠페인/광고)
- sns (SNS/셀카)
- street (거리/파파라치/스트리트)
- fan_meeting (팬미팅/팬사인회)
- interview (인터뷰/방송)

style_tags는 이미지에서 느껴지는 스타일 키워드를 자유롭게 추출 (한국어, 3~6개)"""


class PostContextService:
    """Ollama Gemma4 vision을 사용하여 포스트 이미지에서 context/style_tags 추출."""

    def __init__(
        self,
        ollama_base_url: str | None = None,
        ollama_model: str | None = None,
        ollama_timeout: int | None = None,
    ):
        self.base_url = ollama_base_url or os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = ollama_model or os.environ.get("OLLAMA_VISION_MODEL", "gemma4:e4b")
        self.timeout = ollama_timeout or int(os.environ.get("OLLAMA_VISION_TIMEOUT", "60"))

    async def extract_context(self, image_url: str) -> dict:
        """이미지 URL에서 context와 style_tags를 추출.

        Returns:
            {"context": str, "style_tags": list[str], "mood": str, "setting": str}
        Raises:
            Exception on Ollama or network failure.
        """
        img_b64 = await self._download_image_as_base64(image_url)

        payload = {
            "model": self.model,
            "prompt": PROMPT,
            "images": [img_b64],
            "stream": False,
            "format": OLLAMA_FORMAT_SCHEMA,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()

        response_text = data.get("response", "")
        result = json.loads(response_text)

        # Validate context is in enum
        if result.get("context") not in CONTEXT_ENUM:
            logger.warning("Ollama returned invalid context: %s, defaulting to 'daily'", result.get("context"))
            result["context"] = "daily"

        return result

    async def extract_and_update(self, post_id: str, image_url: str, supabase_url: str, supabase_key: str) -> dict:
        """이미지 분석 후 Supabase posts 테이블 업데이트."""
        from supabase import acreate_client

        result = await self.extract_context(image_url)

        client = await acreate_client(supabase_url, supabase_key)
        await (
            client.table("posts")
            .update({
                "context": result["context"],
                "style_tags": json.dumps(result["style_tags"]),
            })
            .eq("id", post_id)
            .execute()
        )

        logger.info(
            "Post %s context updated: %s, style_tags: %s",
            post_id, result["context"], result["style_tags"],
        )
        return result

    @staticmethod
    async def _download_image_as_base64(url: str) -> str:
        """이미지 URL을 다운로드하여 base64 문자열로 반환."""
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return base64.b64encode(resp.content).decode("utf-8")
