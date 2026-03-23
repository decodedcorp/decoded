from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Type
from .message import LLMMessage, LLMResponse
from .config import LLMConfig
from .types import ContentType

try:
    from pydantic import BaseModel
except ImportError:
    BaseModel = None

try:
    from ..prompt_manager import PromptManager
except ImportError:
    # Fallback if PromptManager is not available (e.g., jinja2 not installed)
    PromptManager = None


class BaseLLMClient(ABC):
    """Base abstract class for all LLM clients"""

    def __init__(self, config: LLMConfig):
        self.config = config
        
        # Initialize PromptManager for all adapters
        if PromptManager is not None:
            self.prompt_manager = PromptManager()
        else:
            self.prompt_manager = None

    @abstractmethod
    async def completion(
        self,
        messages: List[LLMMessage],
        content_type: ContentType = ContentType.TEXT,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        response_schema: Optional[Type["BaseModel"]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate completion from messages

        Args:
            messages: List of messages for conversation
            content_type: Type of content being processed (ContentType enum)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            response_schema: Pydantic model class for structured output
            **kwargs: Additional provider-specific parameters

        Returns:
            LLMResponse with generated content
        """
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """
        Check if the LLM service is available
        
        Returns:
            True if service is healthy, False otherwise
        """
        pass

    def get_provider(self) -> str:
        """Get the provider name"""
        return self.config.provider

    def get_model(self) -> str:
        """Get the model name"""
        return self.config.model

    def get_language_instruction(self, locale: str = "ko") -> str:
        """
        Get language instruction for given locale
        
        Args:
            locale: Language locale code (default: "ko")
            
        Returns:
            Language instruction string
        """
        if self.prompt_manager is not None:
            return self.prompt_manager._get_language_instruction(locale)
        else:
            # Fallback implementation if PromptManager is not available
            language_map = {
                'ko': 'Please respond in Korean.',
                'ja': 'Please respond in Japanese.',
                'zh': 'Please respond in Chinese.',
                'zh-cn': 'Please respond in Simplified Chinese.',
                'zh-tw': 'Please respond in Traditional Chinese.',
                'en': '',  # English is default, no instruction needed
            }
            return language_map.get(locale.lower(), 'Please respond in Korean.')

    def _validate_kwargs(self, content_type: ContentType, kwargs: dict) -> None:
        """
        Validate kwargs based on content_type (base implementation)

        Adapters can override this method to add their own validation logic.
        When overriding, call super()._validate_kwargs() to maintain base validation.

        Args:
            content_type: Content type enum
            kwargs: kwargs to validate

        Raises:
            ValueError: If required kwargs are missing or invalid
        """
        # Base validation logic (can be extended by subclasses)
        pass