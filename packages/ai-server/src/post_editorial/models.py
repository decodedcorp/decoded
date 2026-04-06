"""Post Magazine layout schema with fixed 6-section structure."""

from __future__ import annotations

from pydantic import BaseModel


class DesignSpec(BaseModel):
    accent_color: str
    primary_color: str = ""
    secondary_color: str = ""
    bg_color: str = ""
    font_heading: str = ""
    font_body: str = ""
    style_tags: list[str] = []


def default_design_spec() -> DesignSpec:
    return DesignSpec(
        accent_color="#e94560",
        primary_color="#1a1a2e",
        secondary_color="#16213e",
        bg_color="#ffffff",
        font_heading="Playfair Display",
        font_body="Noto Sans KR",
        style_tags=[],
    )


class EditorialSection(BaseModel):
    paragraphs: list[str]
    pull_quote: str | None = None


class CelebWithItem(BaseModel):
    celeb_name: str
    celeb_image_url: str | None = None
    post_id: str
    item_name: str
    item_brand: str | None = None
    relevance_score: float


class SpotItemWithEditorial(BaseModel):
    spot_id: str
    solution_id: str | None = None
    title: str
    brand: str | None = None
    brand_logo_url: str | None = None
    image_url: str | None = None
    original_url: str | None = None
    metadata: dict = {}
    editorial_paragraphs: list[str]


class RelatedItem(BaseModel):
    title: str
    brand: str | None = None
    image_url: str | None = None
    original_url: str | None = None
    relevance_reason: str | None = None
    source: str = "internal"
    for_spot_id: str | None = None


class PostMagazineLayout(BaseModel):
    schema_version: str = "1.0"
    title: str
    subtitle: str | None = None
    editorial: EditorialSection
    celeb_list: list[CelebWithItem] = []
    items: list[SpotItemWithEditorial] = []
    related_items: list[RelatedItem] = []
    design_spec: DesignSpec


class CriterionResult(BaseModel):
    criterion: str
    passed: bool
    reason: str
    severity: str = "major"


class ReviewResult(BaseModel):
    passed: bool
    criteria: list[CriterionResult]
    summary: str
    suggestions: list[str] = []
