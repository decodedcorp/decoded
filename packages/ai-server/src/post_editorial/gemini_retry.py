"""Gemini API helpers: transient error detection + model fallback."""

from __future__ import annotations

import logging
from typing import Awaitable, Callable, TypeVar

from tenacity import retry_if_exception, wait_none, before_sleep_log

logger = logging.getLogger(__name__)

T = TypeVar("T")


def _is_transient_gemini_error(exc: BaseException) -> bool:
    """Return True for transient Gemini errors (503, 429, etc.)."""
    exc_str = str(exc).lower()
    return any(
        keyword in exc_str
        for keyword in ("503", "unavailable", "overloaded", "resource_exhausted", "429")
    )


async def call_gemini_with_fallback(
    primary_model: str,
    fallback_model: str,
    generate_fn: Callable[[str], Awaitable[T]],
) -> T:
    """Try primary model; on transient 503/429, immediately retry with fallback model."""
    try:
        return await generate_fn(primary_model)
    except Exception as e:
        if _is_transient_gemini_error(e):
            logger.warning(
                "Transient error on %s (%s), downgrading to %s",
                primary_model,
                type(e).__name__,
                fallback_model,
            )
            return await generate_fn(fallback_model)
        raise
