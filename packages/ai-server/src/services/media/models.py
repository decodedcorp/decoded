"""Pydantic + DTO models for the vision parsing pipeline (#260)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ParsedItem(BaseModel):
    """One fashion item detected inside a Fashion Decode image."""

    brand: str
    product_name: Optional[str] = None
    price_amount: Optional[float] = None
    price_currency: Optional[str] = None  # USD | KRW | EUR | ...
    subcategory: str                      # top | bottom | shoes | bag | accessory | ...
    position_x_pct: int                   # 0-100 → seed_spots.position_left
    position_y_pct: int                   # 0-100 → seed_spots.position_top


class ParsedDecodeResult(BaseModel):
    """Structured output Gemini Vision returns for a single raw_posts row."""

    celebrity_name: Optional[str] = None
    group_name: Optional[str] = None
    occasion: Optional[str] = None
    items: list[ParsedItem] = Field(default_factory=list)


ParseOutcome = Literal["parsed", "skipped", "failed", "retry"]


@dataclass(frozen=True)
class ParseCandidate:
    """Row claimed from `warehouse.raw_posts` for a single parse attempt."""

    id: UUID
    platform: str
    external_id: str
    external_url: str
    r2_key: Optional[str]
    r2_url: str
    caption: Optional[str]
    image_hash: Optional[str]
    parse_attempts: int
