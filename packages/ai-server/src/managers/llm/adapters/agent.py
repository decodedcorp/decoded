import logging
from typing import List, Optional, Type
from pydantic import BaseModel
from src.managers.llm.base.client import BaseLLMClient
from src.managers.llm.base.message import LLMMessage, LLMResponse
from src.managers.llm.base.types import ContentType

logger = logging.getLogger(__name__)


class DefaultLLMAgent(BaseLLMClient):
    """
    Primary 클라이언트 실패 시 Fallback 클라이언트로 자동 전환하는 기본 LLM Agent 클래스

    이 클래스는 LLM 작업의 표준 래퍼로 사용되며, 자동 fallback을 통해 안정성을 보장합니다.

    Example:
        llm_agent = DefaultLLMAgent(
            primary=gemini_client,
            fallback=perplexity_client
        )
    """

    def __init__(self, primary: BaseLLMClient, fallback: BaseLLMClient):
        """
        Initialize DefaultLLMAgent

        Args:
            primary: 1차 시도할 LLM 클라이언트
            fallback: Primary 실패 시 사용할 LLM 클라이언트
        """
        super().__init__(primary.config)
        self.primary = primary
        self.fallback = fallback

    async def completion(
        self,
        messages: List[LLMMessage],
        content_type: ContentType = ContentType.TEXT,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        response_schema: Optional[Type[BaseModel]] = None,
        **kwargs,
    ) -> LLMResponse:
        """
        Default LLM Agent completion that tries primary and fallback LLMs in sequence if primary fails
        """
        try:
            # Try primary LLM
            logger.debug(
                f"Attempting primary LLM: {self.primary.get_provider()} ({self.primary.get_model()})"
            )
            return await self.primary.completion(
                messages=messages,
                content_type=content_type,
                max_tokens=max_tokens,
                temperature=temperature,
                response_schema=response_schema,
                **kwargs,
            )
        except Exception as e:
            # Try fallback LLM if primary fails
            logger.warning(
                f"Primary LLM ({self.primary.get_provider()}/{self.primary.get_model()}) failed: {e}. "
                f"Switching to fallback ({self.fallback.get_provider()}/{self.fallback.get_model()})."
            )

            try:
                return await self.fallback.completion(
                    messages=messages,
                    content_type=content_type,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    response_schema=response_schema,
                    **kwargs,
                )
            except Exception as fallback_error:
                logger.error(f"Fallback LLM failed as well: {fallback_error}")
                raise fallback_error

    def health_check(self) -> bool:
        return self.primary.health_check() or self.fallback.health_check()

    def get_provider(self) -> str:
        return f"fallback({self.primary.get_provider()}->{self.fallback.get_provider()})"

    def get_model(self) -> str:
        return f"fallback({self.primary.get_model()}->{self.fallback.get_model()})"
