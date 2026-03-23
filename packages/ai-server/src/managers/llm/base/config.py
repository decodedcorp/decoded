from typing import Optional, Dict, Any, ClassVar
from pydantic import BaseModel
import os


class LLMConfig(BaseModel):
    """Base configuration for LLM clients"""
    provider: str  # "local_llm", "perplexity", "gemini", "groq"
    api_key: Optional[str] = None
    model: str = "default"
    base_url: Optional[str] = None
    max_tokens: int = 1024
    temperature: float = 0.2
    top_p: float = 0.9
    max_retries: int = 3
    request_timeout: int = 30
    extra_params: Dict[str, Any] = {}

    api_key_env_vars: ClassVar[Dict[str, str]] = {
        "perplexity": "PERPLEXITY_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "groq": "GROQ_API_KEY",
        "local_llm": "LOCAL_LLM_API_KEY"
    }

    base_url_env_vars: ClassVar[Dict[str, str]] = {
        "perplexity": "PERPLEXITY_BASE_URL",
        "gemini": "GEMINI_BASE_URL",
        "groq": "GROQ_BASE_URL",
        "local_llm": "LOCAL_LLM_BASE_URL"
    }

    default_model: ClassVar[Dict[str, str]] = {
        "perplexity": "sonar",
        "gemini": "gemini-2.5-flash",
        "groq": "llama-3.3-70b-versatile",
        "local_llm": "qwen3-8b-gguf"
    }

    @classmethod
    def create_config(cls, provider: str, model: Optional[str] = None, api_key: Optional[str] = None, base_url: Optional[str] = None) -> "LLMConfig":
        if provider not in cls.api_key_env_vars:
            raise ValueError(f"Unsupported provider: {provider}")
        
        return cls(
            provider=provider,
            api_key=api_key or os.getenv(cls.api_key_env_vars[provider], ""),
            model=model or cls.default_model[provider],
            base_url=base_url or os.getenv(cls.base_url_env_vars[provider]),
        )
    
    @classmethod
    def from_env(cls, provider: str, environment) -> "LLMConfig":
        """Create configuration from Environment object"""
        if provider not in cls.api_key_env_vars:
            raise ValueError(f"Unsupported provider: {provider}")
        
        # Handle special cases for different providers
        if provider == "perplexity":
            return cls(
                provider=provider,
                api_key=getattr(environment, "PERPLEXITY_API_KEY", ""),
                model=getattr(environment, "PERPLEXITY_MODEL", cls.default_model[provider]),
                base_url=getattr(environment, "PERPLEXITY_API_URL", ""),
                max_retries=getattr(environment, "PERPLEXITY_MAX_RETRIES", 3),
                request_timeout=getattr(environment, "PERPLEXITY_REQUEST_TIMEOUT", 30)
            )
        elif provider == "local_llm":
            return cls(
                provider=provider,
                api_key=getattr(environment, "LOCAL_LLM_API_KEY", "local"),
                model=getattr(environment, "LOCAL_LLM_MODEL", cls.default_model[provider]),
                base_url=getattr(environment, "LOCAL_LLM_BASE_URL", ""),
                max_retries=getattr(environment, "LOCAL_LLM_MAX_RETRIES", 3),
                request_timeout=getattr(environment, "LOCAL_LLM_REQUEST_TIMEOUT", 30)
            )
        elif provider == "gemini":
            return cls(
                provider=provider,
                api_key=getattr(environment, "GEMINI_API_KEY", ""),
                model=getattr(environment, "GEMINI_MODEL", cls.default_model[provider]),
                base_url=getattr(environment, "GEMINI_BASE_URL", ""),
                max_retries=getattr(environment, "GEMINI_MAX_RETRIES", 3),
                request_timeout=getattr(environment, "GEMINI_REQUEST_TIMEOUT", 30)
            )
        elif provider == "groq":
            return cls(
                provider=provider,
                api_key=getattr(environment, "GROQ_API_KEY", ""),
                model=getattr(environment, "GROQ_MODEL", cls.default_model[provider]),
                base_url=getattr(environment, "GROQ_BASE_URL", ""),
                max_retries=getattr(environment, "GROQ_MAX_RETRIES", 3),
                request_timeout=getattr(environment, "GROQ_REQUEST_TIMEOUT", 30)
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")