"""Shared data models for the raw_posts pipeline.

- `RawMedia`: what a SourceAdapter returns per scraped post (pre-R2).
- `RawPostResult`: what the pipeline returns to its caller (post-R2).
- `SourceAdapter`: Protocol each platform adapter implements.
- `FetchRequest`: input DTO produced by the ai-server scheduler.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional, Protocol, runtime_checkable

from pydantic import BaseModel, Field


FetchMode = Literal["initial", "incremental"]


class RawMedia(BaseModel):
    """A single scraped item emitted by a SourceAdapter (before R2 upload)."""

    external_id: str
    external_url: str
    image_url: str
    caption: Optional[str] = None
    author_name: Optional[str] = None
    platform_metadata: Dict[str, Any] = Field(default_factory=dict)


class RawPostResult(BaseModel):
    """A fully-processed raw post ready for DB upsert (post-R2).

    `image_url` 은 R2 업로드 결과 퍼블릭 URL — 외부 CDN URL 은 보관하지 않는다 (#347).
    재다운로드가 필요하면 어댑터가 `external_url` 로 다시 메타 fetch.
    """

    external_id: str
    external_url: str
    image_url: str  # R2 퍼블릭 URL
    caption: Optional[str] = None
    author_name: Optional[str] = None
    platform_metadata: Dict[str, Any] = Field(default_factory=dict)


@dataclass(frozen=True)
class FetchRequest:
    """Adapter input produced by the ai-server scheduler.

    `mode` lets adapters distinguish the first "deep" scrape of a newly
    registered source (`initial`) from routine polling for new items
    (`incremental`) — see `public.raw_post_sources.initial_scraped_at`.
    """

    source_id: str
    platform: str
    source_type: str
    source_identifier: str
    dispatch_id: str
    limit: int = 50
    mode: FetchMode = "incremental"


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
