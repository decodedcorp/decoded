"""Post editorial configuration from environment."""

from __future__ import annotations

import os
from functools import lru_cache


def get_settings() -> PostEditorialSettings:
    """Return post editorial settings from environment."""
    return _get_settings_impl()


@lru_cache()
def _get_settings_impl() -> PostEditorialSettings:
    return PostEditorialSettings(
        supabase_url=os.environ.get("DATABASE_API_URL") or os.environ.get("SUPABASE_URL", ""),
        supabase_service_role_key=(
            os.environ.get("DATABASE_SERVICE_ROLE_KEY")
            or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        ),
        gemini_api_key=os.environ.get("GEMINI_API_KEY", ""),
        gemini_model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
        gemini_pro_model=os.environ.get("GEMINI_PRO_MODEL", "gemini-2.5-pro"),
        gemini_fallback_model=os.environ.get("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite"),
        perplexity_api_key=os.environ.get("PERPLEXITY_API_KEY", ""),
        groq_api_key=os.environ.get("GROQ_API_KEY", ""),
        groq_researcher_model=os.environ.get("GROQ_RESEARCHER_MODEL", "llama-3.3-70b-versatile"),
    )


class PostEditorialSettings:
    """Settings for post editorial pipeline."""

    def __init__(
        self,
        *,
        supabase_url: str = "",
        supabase_service_role_key: str = "",
        gemini_api_key: str = "",
        gemini_model: str = "gemini-2.5-flash",
        gemini_pro_model: str = "gemini-2.5-pro",
        gemini_fallback_model: str = "gemini-2.5-flash-lite",
        perplexity_api_key: str = "",
        groq_api_key: str = "",
        groq_researcher_model: str = "llama-3.3-70b-versatile",
    ):
        self.supabase_url = supabase_url
        self.supabase_service_role_key = supabase_service_role_key
        self.gemini_api_key = gemini_api_key
        self.gemini_model = gemini_model
        self.gemini_pro_model = gemini_pro_model
        self.gemini_fallback_model = gemini_fallback_model
        self.perplexity_api_key = perplexity_api_key
        self.groq_api_key = groq_api_key
        self.groq_researcher_model = groq_researcher_model
