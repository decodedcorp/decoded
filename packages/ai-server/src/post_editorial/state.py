"""PostEditorialState: shared state for the post editorial LangGraph pipeline."""

from __future__ import annotations

import operator
from typing import Annotated, TypedDict

from pydantic import BaseModel


class SolutionData(BaseModel):
    id: str
    spot_id: str
    title: str
    brand_id: str | None = None
    link_type: str | None = None
    original_url: str | None = None
    affiliate_url: str | None = None
    thumbnail_url: str | None = None
    description: str | None = None
    comment: str | None = None
    metadata: dict | None = None
    keywords: list | None = None
    qna: list | None = None

    def model_post_init(self, _context) -> None:
        if self.keywords is None:
            object.__setattr__(self, "keywords", [])
        elif not isinstance(self.keywords, list):
            object.__setattr__(self, "keywords", [])
        if self.qna is None:
            object.__setattr__(self, "qna", [])
        elif not isinstance(self.qna, list):
            object.__setattr__(self, "qna", [])


class SpotData(BaseModel):
    id: str
    post_id: str
    position_left: str = "0"
    position_top: str = "0"
    subcategory_id: str | None = None
    solutions: list[SolutionData] = []


class PostData(BaseModel):
    id: str
    user_id: str
    image_url: str = ""
    media_type: str = "image"
    title: str | None = None
    artist_name: str | None = None
    artist_id: str | None = None
    group_name: str | None = None
    group_id: str | None = None
    context: str | None = None
    view_count: int = 0
    trending_score: float | None = None
    spots: list[SpotData] = []


class PostEditorialState(TypedDict):
    """LangGraph shared state for post editorial pipeline."""

    post_magazine_id: str
    post_data: PostData

    ai_summary: str | None
    image_analysis: dict | None
    item_research: dict | None
    design_spec: dict | None

    title: str
    subtitle: str | None
    editorial_section: dict | None
    item_editorial_texts: dict

    celeb_list: list[dict]
    related_items: list[dict]

    news_references: list[dict] | None

    review_result: dict | None
    revision_count: int
    feedback_history: Annotated[list[dict], operator.add]

    pipeline_status: str
    error_log: Annotated[list[str], operator.add]
