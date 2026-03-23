import httpx
from openai import AsyncOpenAI
from typing import Optional, List, Dict, Any, Type
import logging
import json
from pydantic import BaseModel
from src.managers.llm.base import BaseLLMClient, LLMConfig, LLMMessage, LLMResponse, LLMUsage
from src.managers.llm.base.types import ContentType
from src.config._environment import Environment


class LocalLLMClient(BaseLLMClient):
    """Local LLM client following standard LLM pattern"""

    def __init__(self, environment: Environment, searxng_client=None):
        """
        Initialize LocalLLMClient with Environment

        Args:
            environment: Environment object containing configuration
            searxng_client: SearXNG client for enhanced search capabilities
        """
        # Create LLMConfig from environment
        llm_config = LLMConfig.from_env("local_llm", environment)
        super().__init__(llm_config)
        self.searxng_client = searxng_client
        self.logger = logging.getLogger(__name__)

        # OpenAI-compatible client for local LLM
        self.client = AsyncOpenAI(
            base_url=self.config.base_url,
            api_key=self.config.api_key or "local",
            timeout=self.config.request_timeout
        )

        self.logger.info(f"LocalLLM Client initialized with URL: {self.config.base_url}")

    async def completion(
        self,
        messages: List[LLMMessage],
        content_type: ContentType = ContentType.TEXT,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        response_schema: Optional[Type[BaseModel]] = None,
        **kwargs
    ) -> LLMResponse:
        """Standard interface completion method with content_type support"""
        try:
            # Validate kwargs
            self._validate_kwargs(content_type, kwargs)

            if content_type == ContentType.IMAGE:
                return await self._handle_image_completion(messages, max_tokens, temperature, **kwargs)
            else:  # ContentType.TEXT
                # Check if this is a link analysis (url kwarg present)
                if kwargs.get("url"):
                    return await self._handle_link_completion(messages, max_tokens, temperature, **kwargs)
                else:
                    return await self._handle_text_completion(messages, max_tokens, temperature, **kwargs)
        except Exception as e:
            self.logger.error(f"LocalLLM completion failed: {e}")
            raise

    def health_check(self) -> bool:
        """Check LocalLLM health status (Ollama compatible)"""
        try:
            # Extract base URL without /v1 suffix for health checks
            base_url = self.config.base_url.replace("/v1", "")
            
            # Try Ollama API first (most common for local setups)
            response = httpx.get(f"{base_url}/api/tags", timeout=5.0)
            response.raise_for_status()
            
            # Ollama /api/tags returns list of models, so if we get valid JSON, it's healthy
            tags = response.json()
            if isinstance(tags, dict) and "models" in tags:
                return len(tags.get("models", [])) > 0
            elif isinstance(tags, list):
                return True
            
            return False
            
        except Exception as e:
            # Fallback to llama-server style health check
            try:
                response = httpx.get(f"{self.config.base_url}/health", timeout=5.0)
                response.raise_for_status()
                return response.json().get("status") == "ok"
            except Exception as fallback_e:
                self.logger.error(f"LocalLLM health check failed (Ollama: {e}, llama-server: {fallback_e})")
                return False

    def get_provider(self) -> str:
        """Get provider name"""
        return "local_llm"

    def get_model(self) -> str:
        """Get model name"""
        return self.config.model

    def _validate_kwargs(self, content_type: ContentType, kwargs: dict) -> None:
        """Validate kwargs based on content_type"""
        super()._validate_kwargs(content_type, kwargs)

        if content_type == ContentType.IMAGE:
            # LocalLLM typically doesn't support image analysis
            self.logger.warning("LocalLLM may not support IMAGE content_type")

    async def _handle_text_completion(
        self,
        messages: List[LLMMessage],
        max_tokens: Optional[int],
        temperature: Optional[float],
        **kwargs
    ) -> LLMResponse:
        """Handle general text completion"""

        # Add language instruction to system message if needed
        processed_messages = []
        
        for i, msg in enumerate(messages):
            processed_messages.append({"role": msg.role, "content": msg.content})
        
        response = await self.client.chat.completions.create(
            model=self.config.model,
            messages=processed_messages,
            max_tokens=max_tokens or self.config.max_tokens,
            temperature=temperature or self.config.temperature,
        )
        
        usage = None
        if response.usage:
            usage = LLMUsage(
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=response.usage.total_tokens
            )
        
        return LLMResponse(
            content=response.choices[0].message.content,
            usage=usage
        )

    async def _handle_link_completion(
        self,
        messages: List[LLMMessage],
        max_tokens: Optional[int],
        temperature: Optional[float],
        **kwargs
    ) -> LLMResponse:
        """Handle link analysis completion with SearXNG enhancement"""
        url = kwargs.get("url", "")
        existing_title = kwargs.get("existing_title", "")
        existing_description = kwargs.get("existing_description", "")
        search_context = kwargs.get("search_context", "")
        
        if not url:
            # Extract URL from messages if not provided
            for msg in messages:
                if "http" in msg.content:
                    parts = msg.content.split()
                    for part in parts:
                        if part.startswith("http"):
                            url = part
                            break
    
        result = await self.analyze_link(url, existing_title, existing_description, search_context)
        
        # Convert to standard LLMResponse format
        usage = LLMUsage(
            prompt_tokens=0,  # Local LLM doesn't provide usage stats
            completion_tokens=0,
            total_tokens=0
        )
        
        content = result.get("description", "") or result.get("enhanced_description", "")
        
        return LLMResponse(
            content=content,
            usage=usage,
            structured_output=result
        )

    async def _handle_image_completion(
        self,
        messages: List[LLMMessage],
        max_tokens: Optional[int],
        temperature: Optional[float],
        **kwargs
    ) -> LLMResponse:
        """Handle image analysis - LocalLLM cannot process images directly"""
        self.logger.warning("LocalLLM cannot process images directly")
        
        enhanced_messages = [
            LLMMessage(
                role="system",
                content="You are being asked to analyze an image, but as a text-based model, you cannot process images directly."
            ),
            LLMMessage(
                role="user",
                content="I need image analysis, but this is a text-only model. Please explain what image analysis typically involves."
            )
        ]
        
        return await self._handle_text_completion(enhanced_messages, max_tokens, temperature, **kwargs)

    async def analyze_link(self, url: str, existing_title: str = "", existing_description: str = "", search_context: str = "") -> Dict[str, Any]:
        """
        Analyze a link URL using Local LLM (same interface as PerplexityClient)
        
        Args:
            url: URL to analyze
            existing_title: Existing title from OG tags
            existing_description: Existing description from OG tags
            search_context: Additional context from search results
            
        Returns:
            Dictionary with enhanced title, description, and other metadata
        """
        if not url:
            self.logger.error("No URL provided for analysis")
            raise ValueError("No URL provided for analysis")

        prompt = self._build_link_analysis_prompt(url, existing_title, existing_description, search_context)
        
        try:
            response = await self._make_api_request(prompt)
            return self._parse_link_response(response, url)
        except Exception as e:
            self.logger.error(f"Error analyzing link {url}: {str(e)}")
            raise

    def _build_link_analysis_prompt(self, url: str, existing_title: str, existing_description: str, search_context: str = "") -> str:
        """Build prompt for link analysis (same as PerplexityClient)"""
        base_instruction = "You are a web content analysis expert."
        
        prompt_parts = [
            f"{base_instruction} Analyze the content at the given URL and provide enhanced metadata.",
            "",
            f"URL to analyze: {url}",
        ]

        # Add search context if available
        if search_context:
            prompt_parts.extend([
                "",
                "Additional context from web search:",
                search_context,
                ""
            ])

        if existing_title:
            prompt_parts.extend([
                f"Existing title: {existing_title}",
                "Task: Improve or enhance this title if needed using all available information."
            ])
        else:
            prompt_parts.append("Task: Generate a clear, descriptive title for this content using all available information.")

        if existing_description:
            prompt_parts.extend([
                f"Existing description: {existing_description}",
                "Task: Improve or enhance this description if needed using all available information."
            ])
        else:
            prompt_parts.append("Task: Generate a comprehensive description of this content using all available information.")

        prompt_parts.extend([
            "",
            "Please provide:",
            "1. Improved title (max 100 characters)",
            "2. Improved description (max 300 characters)",
            "3. Main topics or keywords (comma-separated)",
            "4. Content category (e.g., article, product, service, news, blog, video, etc)",
            "5. List of questions and answers (maximum 5 questions)",
            "",
            "Format your response as JSON:",
            "{",
            '  "title": "Improved title here",',
            '  "description": "Improvded description here",',
            '  "metadata": "metadata of the content here in key-value pairs",',
            '  "category": "content category of the link(e.g video, article, news, etc..)"',
            '  "qna": [{"question": "question", "answer": "answer"}, ..]',
            "}"
        ])

        return "\n".join(prompt_parts)

    async def _make_api_request(self, prompt: str) -> Dict[str, Any]:
        """Make API request to Local LLM"""
        try:
            system_message = "You are a helpful assistant that provides information and returns structured JSON responses."
                
            response = await self.client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature
            )
            
            content = response.choices[0].message.content
            return {
                "content": content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                    "total_tokens": response.usage.total_tokens if response.usage else 0
                }
            }
        except Exception as e:
            self.logger.error(f"LocalLLM API request failed: {e}")
            raise

    def _parse_link_response(self, response: Dict[str, Any], url: str) -> Dict[str, Any]:
        """Parse response from Local LLM link analysis (same format as PerplexityClient)"""
        try:
            content = response.get("content", "")

            # Try to extract JSON from the response
            start_idx = content.find("{")
            end_idx = content.rfind("}") + 1

            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                parsed_data = json.loads(json_str)

                # Return standardized format (no prefixes)
                return {
                    "title": parsed_data.get("title", ""),
                    "description": parsed_data.get("description", ""),
                    "summary": parsed_data.get("description", "")[:200],
                    "qna": parsed_data.get("qna", []),
                    "category": parsed_data.get("category", ""),
                    "metadata": parsed_data.get("metadata", {}),
                    "usage": response.get("usage", {}),
                    "source": "local_llm_with_searxng",
                    "url": url
                }
            else:
                # Fallback: return raw content
                return {
                    "description": content[:300],
                    "title": url,
                    "summary": content[:200],
                    "qna": [],
                    "category": "unknown",
                    "metadata": {},
                    "usage": response.get("usage", {}),
                    "source": "local_llm_with_searxng",
                    "url": url
                }

        except json.JSONDecodeError as e:
            self.logger.warning(f"Failed to parse JSON response from Local LLM: {str(e)}")
            # Return raw content as fallback
            content = response.get("content", "")
            return {
                "description": content[:300] if content else "",
                "title": url,
                "summary": content[:200] if content else "",
                "qna": [],
                "category": "unknown",
                "metadata": {},
                "usage": response.get("usage", {}),
                "source": "local_llm_with_searxng",
                "url": url
            }
        except Exception as e:
            self.logger.error(f"Error parsing Local LLM response: {e}")
            return {
                "description": "Analysis failed",
                "title": url,
                "summary": "Analysis failed",
                "qna": [],
                "category": "unknown",
                "metadata": {},
                "usage": {},
                "source": "local_llm_with_searxng",
                "url": url,
                "error": str(e)
            }

