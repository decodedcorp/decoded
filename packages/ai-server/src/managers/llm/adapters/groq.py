import asyncio
import json
import re
from typing import Dict, Optional, Any, List, Type
import logging
import httpx
from pydantic import BaseModel
from src.config._environment import Environment
from src.managers.llm.base.config import LLMConfig
from src.managers.llm.base import BaseLLMClient, LLMConfig, LLMMessage, LLMResponse, LLMUsage
from src.managers.llm.base.types import ContentType


class GroqClient(BaseLLMClient):
    """Client for Groq API integration"""

    def __init__(
        self,
        environment: Environment,
    ):
        # Create LLMConfig from environment
        llm_config = LLMConfig.from_env("groq", environment)
        super().__init__(llm_config)
        self.environment = environment

        # Initialize logger
        self.logger = logging.getLogger(__name__)
        self.logger.debug("Groq Client initialized")
        
        # Initialize HTTP client instead of Groq library
        self.api_key = self.config.api_key
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

        if not self.config.api_key:
            self.logger.warning("Groq API key not configured")
        
    # Standard LLM interface methods
    async def completion(
        self,
        messages: List[LLMMessage],
        content_type: ContentType = ContentType.TEXT,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        response_schema: Optional[Type[BaseModel]] = None,
        **kwargs
    ) -> LLMResponse:
        """Standard interface completion method with content_type routing"""
        try:
            # Validate kwargs
            self._validate_kwargs(content_type, kwargs)

            if content_type == ContentType.IMAGE:
                # Groq doesn't support image analysis, fallback gracefully
                raise ValueError("Groq doesn't support image analysis")
            else:  # ContentType.TEXT
                # Check if this is a link analysis (url kwarg present)
                if kwargs.get("url"):
                    return await self._handle_link_completion(messages, **kwargs)
                else:
                    return await self._handle_text_completion(messages, max_tokens, temperature, **kwargs)
        except Exception as e:
            self.logger.error(f"Groq completion failed: {e}")
            raise

    def health_check(self) -> bool:
        """Check if Groq API is available"""
        try:
            # Simple check with API key validation
            if not self.config.api_key:
                return False
            return True
        except Exception as e:
            self.logger.error(f"Groq health check failed: {e}")
            return False

    def get_provider(self) -> str:
        """Get the provider name"""
        return "groq"

    def get_model(self) -> str:
        """Get the model name"""
        return self.config.model

    def _validate_kwargs(self, content_type: ContentType, kwargs: dict) -> None:
        """Validate kwargs based on content_type"""
        super()._validate_kwargs(content_type, kwargs)

        if content_type == ContentType.IMAGE:
            # Groq doesn't support image analysis
            raise ValueError("Groq doesn't support IMAGE content_type")

    def _build_link_analysis_prompt(self, content: str) -> str:
        """Build prompt for link analysis"""
        # Truncate content to prevent token limit exceeded errors
        truncated_content = self._truncate_content(content, max_tokens=3000)
        
        prompt_parts = []
        
        prompt_parts.extend([
            "Return with following fields: title, description, metadata, category, qna",
            f"Content: {truncated_content}",
            "Format your response as JSON:",
            "{",
            '  "title": "Improved title here",',
            '  "description": "Improved description here",',
            '  "metadata": "metadata of the content here in key-value pairs",',
            '  "category": "content category of the link(MUST be video)",',
            '  "qna": [{"question": "question", "answer": "answer"}, ..]',
            "}"
        ])

        return "\n".join(prompt_parts)

    def _clean_response_text(self, text: str) -> str:
        """Clean response text by removing excessive newlines and whitespace"""
        if not text:
            return text
        
        # Replace multiple consecutive newlines with single newlines
        cleaned = re.sub(r'\n\s*\n+', '\n', text)
        
        # Strip leading/trailing whitespace
        cleaned = cleaned.strip()
        
        return cleaned

    def _process_metadata_field(self, metadata: Any) -> Dict[str, str]:
        """Process metadata field to ensure it's a Dict[str, str]"""
        try:
            if isinstance(metadata, dict):
                # Convert all values to strings
                processed = {}
                for key, value in metadata.items():
                    if isinstance(value, list):
                        # Convert list to comma-separated string
                        processed[str(key)] = ", ".join(str(item) for item in value)
                    else:
                        processed[str(key)] = str(value)
                return processed
            elif isinstance(metadata, list):
                # Convert list to tags field
                if metadata:
                    return {"tags": ", ".join(str(item) for item in metadata)}
                else:
                    return {}
            elif isinstance(metadata, str):
                # If it's already a string, treat as general metadata
                return {"content": metadata}
            else:
                # For any other type, convert to string
                return {"value": str(metadata)} if metadata else {}
        except Exception as e:
            self.logger.warning(f"Error processing metadata field: {e}")
            return {}

    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation (1 token ≈ 4 characters)"""
        return len(text) // 4

    def _truncate_content(self, content: str, max_tokens: int = 6000) -> str:
        """Truncate content to fit within token limits with buffer"""
        estimated_tokens = self._estimate_tokens(content)
        
        if estimated_tokens <= max_tokens:
            return content
        
        # Calculate approximate character limit (with safety buffer)
        max_chars = max_tokens * 4
        
        if len(content) <= max_chars:
            return content
        
        # Truncate content intelligently
        # Keep beginning and end for context
        keep_start = max_chars // 3
        keep_end = max_chars // 3
        middle_text = f"\n\n[Content truncated - original length: {len(content)} chars, estimated {estimated_tokens} tokens]\n\n"
        
        if keep_start + len(middle_text) + keep_end >= max_chars:
            # If still too long, just truncate from end
            return content[:max_chars - 100] + "\n\n[Content truncated due to length]"
        
        truncated = content[:keep_start] + middle_text + content[-keep_end:]
        
        self.logger.warning(f"Content truncated from {estimated_tokens} to ~{self._estimate_tokens(truncated)} tokens")
        
        return truncated

    async def _make_api_request(self, messages: List[Dict[str, str]], max_tokens: Optional[int] = None, temperature: Optional[float] = None) -> Dict[str, Any]:
        """Make request to Groq API using HTTP"""
        
        # Estimate total tokens in messages
        total_content = " ".join([msg.get("content", "") for msg in messages])
        estimated_tokens = self._estimate_tokens(total_content)
        
        if estimated_tokens > 7500:  # Leave buffer for response tokens
            self.logger.warning(f"High token usage detected: ~{estimated_tokens} tokens. This might exceed Groq's limit.")
        
        try:
            payload = {
                "model": self.config.model,
                "messages": messages,
                "max_tokens": 1000,
                "temperature": temperature or 0.2
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload,
                    timeout=60.0
                )
                
            if response.status_code != 200:
                error_msg = f"Groq API error: {response.status_code} - {response.text}"
                self.logger.error(error_msg)
                raise Exception(error_msg)
                
            result = response.json()
            # Extract usage information
            usage_data = {}
            if result.get("usage"):
                usage_info = result["usage"]
                usage_data = {
                    "prompt_tokens": usage_info.get("prompt_tokens", 0),
                    "completion_tokens": usage_info.get("completion_tokens", 0),
                    "total_tokens": usage_info.get("total_tokens", 0)
                }
            
            return {
                "content": self._clean_response_text(result["choices"][0]["message"]["content"]),
                "usage": usage_data
            }

        except Exception as e:
            self.logger.error(f"Groq API request failed: {str(e)}")
            raise

    def _parse_link_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse response from link analysis"""
        try:
            content = response.get("content", "")

            # Try to extract JSON from the response
            start_idx = content.find("{")
            end_idx = content.rfind("}") + 1

            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                parsed_data = json.loads(json_str)

                # Handle metadata field conversion
                raw_metadata = parsed_data.get("metadata", {})
                processed_metadata = self._process_metadata_field(raw_metadata)

                return {
                    "title": parsed_data.get("title", ""),
                    "description": parsed_data.get("description", ""),
                    "summary": parsed_data.get("summary", ""),
                    "qna": parsed_data.get("qna", []),
                    "category": parsed_data.get("category", ""),
                    "metadata": processed_metadata,
                    "usage": response.get("usage", {})
                }
            else:
                # Fallback: return raw content
                return {
                    "description": content[:300],
                    "usage": response.get("usage", {})
                }

        except json.JSONDecodeError as e:
            self.logger.warning(f"Failed to parse JSON response: {str(e)}")
            # Return raw content as fallback
            content = response.get("content", "")
            return {
                "description": content[:300] if content else "",
                "usage": response.get("usage", {})
            }

    async def _handle_link_completion(self, messages: List[LLMMessage], **kwargs) -> LLMResponse:
        """Handle link analysis completion"""
        url = kwargs.get("url", "")

        # Use the content from the provided messages (includes enhanced content like YouTube transcript)
        user_content = self._build_link_analysis_prompt(messages[0].content)

        # Convert to Groq message format with language instruction
        system_message = "You are a professional content analyzer. Provide accurate and concise analysis."

        groq_messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_content}
        ]

        # Make API request
        response = await self._make_api_request(groq_messages)
        result = self._parse_link_response(response)
        
        # Convert to standard LLMResponse format
        usage = None
        if result.get("usage"):
            usage_data = result["usage"]
            usage = LLMUsage(
                prompt_tokens=usage_data.get("prompt_tokens"),
                completion_tokens=usage_data.get("completion_tokens"),
                total_tokens=usage_data.get("total_tokens")
            )
        
        # Create structured content from Groq result
        content_parts = []
        if result.get("title"):
            content_parts.append(f"Title: {result['title']}")
        if result.get("description"):
            content_parts.append(f"Description: {result['description']}")
        if result.get("category"):
            content_parts.append(f"Category: {result['category']}")
        
        content = "\n".join(content_parts) if content_parts else "No analysis available"
        
        return LLMResponse(
            content=content,
            usage=usage,
            structured_output=result
        )

    async def _handle_text_completion(self, messages: List[LLMMessage], max_tokens: Optional[int], temperature: Optional[float], **kwargs) -> LLMResponse:
        """Handle general text completion"""

        # Convert messages to Groq format with language instruction
        groq_messages = []
        
        for i, msg in enumerate(messages):
            groq_messages.append({"role": msg.role, "content": msg.content})

        # Make API request
        response = await self._make_api_request(groq_messages, max_tokens, temperature)
        
        usage = None
        if response.get("usage"):
            usage_data = response["usage"]
            usage = LLMUsage(
                prompt_tokens=usage_data.get("prompt_tokens"),
                completion_tokens=usage_data.get("completion_tokens"), 
                total_tokens=usage_data.get("total_tokens")
            )
        
        return LLMResponse(
            provider="groq",
            content=response.get("content", ""),
            usage=usage
        )
