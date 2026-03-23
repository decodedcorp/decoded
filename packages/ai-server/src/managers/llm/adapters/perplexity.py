import base64
import json
import logging
from typing import Dict, Optional, Any, List, Type
from pydantic import BaseModel
from perplexity import Perplexity

from src.config._environment import Environment
from src.managers.llm.base.config import LLMConfig
from src.managers.llm.base import BaseLLMClient, LLMMessage, LLMResponse, LLMUsage
from src.managers.llm.base.types import ContentType


class PerplexityClient(BaseLLMClient):
    """
    Perplexity API integration using official Python SDK
    
    이 클라이언트는 공식 Perplexity SDK를 사용하여:
    - Structured Output (JSON Schema) 지원
    - 자동 재시도 및 에러 핸들링
    - 타입 안전성 보장
    
    DefaultLLMAgent의 fallback으로 사용 가능
    """

    def __init__(self, environment: Environment):
        # Create LLMConfig from environment
        llm_config = LLMConfig.from_env("perplexity", environment)
        super().__init__(llm_config)
        self.environment = environment
        
        self.logger = logging.getLogger(__name__)
        self.logger.info("Perplexity Client initialized")
        
        # Perplexity API requirements
        self.MAX_IMAGE_SIZE_MB = 50
        self.SUPPORTED_FORMATS = ['png', 'jpeg', 'jpg', 'webp', 'gif']
        
        # Initialize SDK client
        if not self.config.api_key:
            self.logger.warning("Perplexity API key not configured")
            self.client = None
        else:
            self.client = Perplexity(
                api_key=self.config.api_key,
                base_url=self.config.base_url or "https://api.perplexity.ai",
                timeout=self.config.request_timeout,
                max_retries=self.config.max_retries
            )
    
    async def completion(
        self,
        messages: List[LLMMessage],
        content_type: ContentType = ContentType.TEXT,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        response_schema: Optional[Type[BaseModel]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Standard interface completion method with content_type routing
        
        Args:
            messages: List of messages for conversation
            content_type: Type of content being processed (TEXT or IMAGE)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            response_schema: Pydantic model class for structured output
            **kwargs: Additional provider-specific parameters
        
        Returns:
            LLMResponse with generated content and structured output
        """
        try:
            # Validate kwargs
            self._validate_kwargs(content_type, kwargs)
            
            if content_type == ContentType.IMAGE:
                return await self._handle_image_completion(
                    messages, 
                    response_schema=response_schema, 
                    **kwargs
                )
            elif content_type == ContentType.TEXT:
                return await self._handle_text_completion(
                    messages, 
                    response_schema=response_schema, 
                    **kwargs
                )
            else:
                raise ValueError(f"Unsupported content_type: {content_type}")
                
        except Exception as e:
            self.logger.error(f"Perplexity completion failed: {e}")
            raise
    
    def health_check(self) -> bool:
        """Check if Perplexity API is available"""
        try:
            if not self.config.api_key or not self.client:
                return False
            return True
        except Exception as e:
            self.logger.error(f"Perplexity health check failed: {e}")
            return False
    
    def get_provider(self) -> str:
        """Get the provider name"""
        return "perplexity"
    
    def get_model(self) -> str:
        """Get the model name"""
        return self.config.model
    
    def _validate_kwargs(self, content_type: ContentType, kwargs: dict) -> None:
        """Validate kwargs based on content_type"""
        super()._validate_kwargs(content_type, kwargs)
        
        if content_type == ContentType.IMAGE:
            # IMAGE requires image_data or image_url
            if not kwargs.get("image_data") and not kwargs.get("image_url"):
                self.logger.warning(
                    "IMAGE content_type requires either 'image_data' or 'image_url' in kwargs"
                )
    
    def _normalize_messages(self, messages: List[LLMMessage]) -> List[Dict[str, str]]:
        """
        Normalize messages to comply with Perplexity API requirements.
        
        Perplexity API requires:
        - System messages (optional) must come first
        - After system messages, user/assistant messages must alternate
        - Consecutive messages with the same role are not allowed
        
        Args:
            messages: List of LLMMessage objects
            
        Returns:
            Normalized list of message dictionaries
        """
        if not messages:
            return []
        
        normalized = []
        system_messages = []
        current_role = None
        current_content_parts = []
        
        # Separate system messages and process others
        for msg in messages:
            if msg.role == "system":
                system_messages.append(msg.content)
            else:
                # If role changed, save previous message
                if current_role and current_role != msg.role:
                    if current_content_parts:
                        normalized.append({
                            "role": current_role,
                            "content": "\n".join(current_content_parts)
                        })
                        current_content_parts = []
                
                current_role = msg.role
                current_content_parts.append(msg.content)
        
        # Add system message if exists
        if system_messages:
            normalized.append({
                "role": "system",
                "content": "\n".join(system_messages)
            })
        
        # Add last message
        if current_role and current_content_parts:
            normalized.append({
                "role": current_role,
                "content": "\n".join(current_content_parts)
            })
        
        # Log normalization if messages were merged
        if len(normalized) < len(messages):
            self.logger.debug(
                f"Normalized {len(messages)} messages to {len(normalized)} messages "
                f"to comply with Perplexity API requirements"
            )
        
        return normalized
    
    async def _handle_text_completion(
        self, 
        messages: List[LLMMessage], 
        response_schema: Optional[Type[BaseModel]] = None
    ) -> LLMResponse:
        """
        Handle text completion using SDK
        
        Args:
            messages: List of messages for conversation
            response_schema: Pydantic model for structured output
        
        Returns:
            LLMResponse with content and structured output
        """
        try:
            # Normalize messages to comply with Perplexity API requirements
            sdk_messages = self._normalize_messages(messages)
            
            # Build request parameters
            request_params = {
                "model": self.config.model or "sonar",
                "messages": sdk_messages,
                "return_related_questions": True,
                "search_mode": "web",
                "enable_search_classifier": True,
                "web_search_options": {
                    "search_context_size": "medium"
                },
                "max_tokens": self.config.max_tokens,
                "temperature": self.config.temperature,
                "top_p": self.config.top_p,
                "stream": False
            }
            
            # Add structured output if response_schema provided
            if response_schema:
                try:
                    json_schema = response_schema.model_json_schema()
                    request_params["response_format"] = {
                        "type": "json_schema",
                        "json_schema": {
                            "schema": json_schema
                        }
                    }
                except Exception as e:
                    self.logger.warning(f"Failed to convert response_schema to json_schema: {e}")
            
            # Make API request using SDK
            completion = self.client.chat.completions.create(**request_params)
            
            # Extract response
            content = completion.choices[0].message.content
            
            # Parse structured output if response_schema provided
            structured_output = {}
            if response_schema and content:
                try:
                    # Clean markdown code blocks if present
                    clean_text = content.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    structured_output = json.loads(clean_text.strip())
                except json.JSONDecodeError as e:
                    self.logger.error(f"Failed to parse Perplexity SDK JSON response: {content}")
                    # Don't raise, return content as-is
            
            # Convert usage
            usage = None
            if hasattr(completion, 'usage') and completion.usage:
                usage = LLMUsage(
                    prompt_tokens=completion.usage.prompt_tokens,
                    completion_tokens=completion.usage.completion_tokens,
                    total_tokens=completion.usage.total_tokens
                )
            
            # Create content for display
            display_content = content
            if structured_output:
                content_parts = []
                if structured_output.get("summary"):
                    content_parts.append(f"Summary: {structured_output['summary']}")
                if structured_output.get("keywords"):
                    content_parts.append(f"Keywords: {', '.join(structured_output['keywords'])}")
                if content_parts:
                    display_content = "\n".join(content_parts)
            
            return LLMResponse(
                provider=self.get_provider(),
                content=display_content,
                usage=usage,
                structured_output=structured_output
            )
            
        except Exception as e:
            self.logger.error(f"Error in text completion: {str(e)}")
            raise
    
    async def _handle_image_completion(
        self,
        messages: List[LLMMessage],
        response_schema: Optional[Type[BaseModel]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Handle image analysis completion using SDK
        
        Args:
            messages: List of messages for conversation
            response_schema: Pydantic model for structured output
            **kwargs: Must contain 'image_data' (base64) or 'image_url'
        
        Returns:
            LLMResponse with image analysis and structured output
        """
        image_data = kwargs.get("image_data", "")
        image_url = kwargs.get("image_url", "")
        
        if not image_data and not image_url:
            raise ValueError("Either image_data or image_url must be provided for image analysis")
        
        # Only support image_data (base64) for now
        if not image_data:
            raise ValueError("image_data (base64) is required for image analysis")
        
        # Validate base64 image data
        is_valid, mime_type = self._validate_base64_image(image_data)
        if not is_valid:
            raise ValueError("Invalid base64 image data")
        
        # Create proper data URI with detected MIME type
        image_data_uri = f"data:{mime_type};base64,{image_data}"
        
        # Build comprehensive prompt for image analysis
        prompt = self._build_image_data_analysis_prompt()
        
        try:
            # Build SDK request for image analysis
            system_message = "You are professional image analyzer. All of the info must be your own analysis"
            
            # Convert to SDK message format with image
            sdk_messages = [
                {
                    "role": "system",
                    "content": system_message
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_data_uri
                            }
                        }
                    ]
                }
            ]
            
            # Build request parameters
            request_params = {
                "model": self.config.model,
                "messages": sdk_messages,
                "max_tokens": 1000,
                "temperature": 0.2,
                "top_p": 0.9,
                "stream": False
            }
            
            # Add structured output schema for image analysis
            if not response_schema:
                # Use default image analysis schema
                request_params["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "description": {"type": "string"},
                                "objects": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "context": {"type": "string"},
                                "style": {"type": "string"},
                                "category": {"type": "string"},
                                "metadata": {
                                    "type": "object",
                                    "additionalProperties": {"type": "string"}
                                },
                                "qna": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "question": {"type": "string"},
                                            "answer": {"type": "string"}
                                        },
                                        "required": ["question", "answer"]
                                    },
                                    "maxItems": 5
                                }
                            },
                            "required": ["description", "category"]
                        }
                    }
                }
            else:
                # Use provided response_schema
                try:
                    json_schema = response_schema.model_json_schema()
                    request_params["response_format"] = {
                        "type": "json_schema",
                        "json_schema": {
                            "schema": json_schema
                        }
                    }
                except Exception as e:
                    self.logger.warning(f"Failed to convert response_schema: {e}")
            
            # Make API request using SDK
            completion = self.client.chat.completions.create(**request_params)
            
            # Extract response
            content = completion.choices[0].message.content
            
            # Parse structured output
            structured_output = {}
            if content:
                try:
                    clean_text = content.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    structured_output = json.loads(clean_text.strip())
                except json.JSONDecodeError as e:
                    self.logger.error(f"Failed to parse image JSON response: {content}")
            
            # Convert usage
            usage = None
            if hasattr(completion, 'usage') and completion.usage:
                usage = LLMUsage(
                    prompt_tokens=completion.usage.prompt_tokens,
                    completion_tokens=completion.usage.completion_tokens,
                    total_tokens=completion.usage.total_tokens
                )
            
            # Create content for display
            content_parts = []
            if structured_output.get("description"):
                content_parts.append(f"Description: {structured_output['description']}")
            if structured_output.get("objects"):
                objects_str = ', '.join(structured_output['objects']) if isinstance(structured_output['objects'], list) else structured_output['objects']
                content_parts.append(f"Objects: {objects_str}")
            if structured_output.get("category"):
                content_parts.append(f"Category: {structured_output['category']}")
            
            display_content = "\n".join(content_parts) if content_parts else content
            
            return LLMResponse(
                provider=self.get_provider(),
                content=display_content,
                usage=usage,
                structured_output=structured_output
            )
            
        except Exception as e:
            self.logger.error(f"Perplexity image API request failed: {str(e)}")
            raise
    
    def _build_image_data_analysis_prompt(self) -> str:
        """Build prompt for binary image data analysis"""
        base_instruction = "You are an image analysis expert."
        
        prompt_parts = [
            f"{base_instruction} Analyze the provided image and provide detailed metadata.",
            "",
            "Please provide:",
            "1. Detailed description of what you see in the image",
            "2. List of main objects in the image",
            "3. Context of the image if possible",
            "4. Style of the image",
            "5. Category of the image",
            "6. Any kind of metadata you can find in the image",
            "7. List of questions and answers (maximum 5 questions)"
        ]
        
        return "\n".join(prompt_parts)
    
    def _validate_base64_image(self, base64_data: str) -> tuple[bool, Optional[str]]:
        """
        Validate base64 image data according to Perplexity requirements
        
        Returns:
            (is_valid, mime_type)
        """
        try:
            # Decode base64 to check size and format
            image_bytes = base64.b64decode(base64_data)
            
            # Check file size (50MB limit)
            size_mb = len(image_bytes) / (1024 * 1024)
            if size_mb > self.MAX_IMAGE_SIZE_MB:
                self.logger.error(f"Image size {size_mb:.2f}MB exceeds 50MB limit")
                return False, None
            
            # Detect image format
            mime_type = self._detect_image_format(image_bytes)
            if not mime_type:
                self.logger.error("Unsupported image format")
                return False, None
            
            format_name = mime_type.split('/')[-1].lower()
            if format_name not in self.SUPPORTED_FORMATS:
                self.logger.error(f"Unsupported format: {format_name}")
                return False, None
            
            return True, mime_type
            
        except Exception as e:
            self.logger.error(f"Error validating base64 image: {str(e)}")
            return False, None
    
    def _detect_image_format(self, image_bytes: bytes) -> Optional[str]:
        """Detect image format from bytes"""
        # Check common image signatures
        if image_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'image/png'
        elif image_bytes.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        elif image_bytes.startswith(b'RIFF') and image_bytes[8:12] == b'WEBP':
            return 'image/webp'
        elif image_bytes.startswith(b'GIF87a') or image_bytes.startswith(b'GIF89a'):
            return 'image/gif'
        
        return None
