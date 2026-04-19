"""Shared data models for the raw_posts pipeline.

- `RawMedia`: what a SourceAdapter returns per scraped post (pre-R2).
- `RawPostResult`: what the pipeline returns to the caller (post-R2).
- `SourceAdapter`: Protocol each platform adapter implements.
- `FetchRequest`: flat DTO mirroring the gRPC EnqueueFetchRawPosts payload.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Protocol, runtime_checkable

from pydantic import BaseModel, Field


class RawMedia(BaseModel):
    """A single scraped item emitted by a SourceAdapter (before R2 upload)."""

    external_id: str
    external_url: str
    image_url: str
    caption: Optional[str] = None
    author_name: Optional[str] = None
    platform_metadata: Dict[str, Any] = Field(default_factory=dict)


class RawPostResult(BaseModel):
    """A fully-processed raw post ready to be sent to api-server via gRPC callback."""

    external_id: str
    external_url: str
    image_url: str
    r2_key: str
    r2_url: str
    caption: Optional[str] = None
    author_name: Optional[str] = None
    platform_metadata: Dict[str, Any] = Field(default_factory=dict)


@dataclass(frozen=True)
class FetchRequest:
    """Adapter input. Mirrors gRPC EnqueueFetchRawPostsRequest fields."""

    source_id: str
    platform: str
    source_type: str
    source_identifier: str
    dispatch_id: str
    limit: int = 50


@runtime_checkable
class SourceAdapter(Protocol):
    """Per-platform scraping adapter contract.

    Implementations are platform-specific (Pinterest, Instagram, ...).
    They interpret `FetchRequest.source_type` and `source_identifier`
    according to their own conventions.
    """

    platform: str

    async def fetch(self, req: FetchRequest) -> List[RawMedia]:  # pragma: no cover - protocol
        ...
