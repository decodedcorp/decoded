import asyncio
import json
import logging
from typing import List, Optional, Type
from pydantic import BaseModel
from google import genai
from google.genai import types as genai_types
from ..base.client import BaseLLMClient
from ..base.message import LLMMessage, LLMResponse
from ..base.config import LLMConfig
from ..base.types import ContentType

logger = logging.getLogger(__name__)


class GeminiClient(BaseLLMClient):
    """Adapter for Google Gemini API"""

    def __init__(self, config: LLMConfig, environment=None):
        super().__init__(config)
        self.environment = environment
        self.client = None
        api_key = config.api_key or (
            getattr(environment, "GEMINI_API_KEY", "") if environment else ""
        )
        if api_key:
            try:
                self.client = genai.Client(api_key=api_key)
                logger.debug(f"Gemini client initialized with model: {config.model}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {str(e)}")

    def health_check(self) -> bool:
        return self.client is not None

    def get_provider(self) -> str:
        """Get the provider name"""
        return "gemini"

    def get_model(self) -> str:
        """Get the model name"""
        return self.config.model

    def _validate_kwargs(self, content_type: ContentType, kwargs: dict) -> None:
        """Validate kwargs based on content_type"""
        super()._validate_kwargs(content_type, kwargs)

    async def completion(
        self,
        messages: List[LLMMessage],
        content_type: ContentType = ContentType.TEXT,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        response_schema: Optional[Type[BaseModel]] = None,
        **kwargs,
    ) -> LLMResponse:

        # Sanity check
        if not self.client:
            raise ValueError("Gemini client is not initialized")

        # Validate kwargs
        self._validate_kwargs(content_type, kwargs)

        model = self.config.model

        # Convert LLMMessage to Gemini Content
        contents = []
        for msg in messages:
            # Simple conversion: role mapping and content text
            role = "user" if msg.role == "user" else "model"
            parts = [genai_types.Part.from_text(text=msg.content)]
            contents.append(genai_types.Content(role=role, parts=parts))

        # Setup generation config
        # Default config params
        gen_config_params = {
            "thinking_config": genai_types.ThinkingConfig(thinking_level="MINIMAL"),
            "tools": [genai_types.Tool(googleSearch=genai_types.GoogleSearch())],
        }

        # Handle response_schema for structured output
        if response_schema is not None:
            print("Response schema is not None")
            print(f"{response_schema}")
            if hasattr(response_schema, "model_json_schema"):
                gen_config_params["response_schema"] = response_schema.model_json_schema()
            else:
                gen_config_params["response_schema"] = response_schema
            gen_config_params["response_mime_type"] = "application/json"

        generate_content_config = genai_types.GenerateContentConfig(**gen_config_params)

        try:
            # Generate content (using asyncio to run sync API call)
            loop = asyncio.get_event_loop()

            def generate_sync():
                # Use standard generate_content instead of stream for JSON reliability
                try:
                    response = self.client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=generate_content_config,
                    )
                    return response.text if response.text else ""
                except Exception as e:
                    logger.error(f"Gemini generate_content failed: {str(e)}", exc_info=True)
                    raise

            response_text = await loop.run_in_executor(None, generate_sync)

            # Parse response if JSON expected (detected via response_schema presence)
            structured_output = {}
            if response_schema is not None:
                print("Response schema is not None")
                try:
                    clean_text = response_text.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    print(f"{clean_text}")
                    structured_output = json.loads(clean_text)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse Gemini JSON response: {response_text}")
            else:
                print("Response schema is None")

            return LLMResponse(
                provider="gemini",
                content=response_text,
                structured_output=structured_output,
            )

        except Exception as e:
            logger.error(f"Gemini completion error: {str(e)}")
            raise
