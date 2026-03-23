"""
Pydantic schemas for link metadata extraction with discriminated unions
"""
from pydantic import BaseModel, Field
from typing import Literal, Union, Optional, List


class QnA(BaseModel):
    """Question and Answer pair"""
    question: str
    answer: str


class BaseMetadata(BaseModel):
    """Base metadata fields common to all link types"""
    category: str = Field(description="Category in English")
    sub_category: Optional[str] = Field(default=None, description="Sub-category in English")


class ProductMetadata(BaseMetadata):
    """Metadata specific to product links"""
    price: str
    currency: str
    brand: Optional[str] = None
    material: Optional[List[str]] = None
    origin: Optional[str] = None


class ArticleMetadata(BaseMetadata):
    """Metadata specific to article links"""
    author: Optional[str] = None
    published_date: Optional[str] = None
    reading_time: Optional[str] = None
    topics: Optional[List[str]] = None


class VideoMetadata(BaseMetadata):
    """Metadata specific to video links"""
    channel: Optional[str] = None
    duration: Optional[str] = None
    view_count: Optional[str] = None
    upload_date: Optional[str] = None


class OtherMetadata(BaseMetadata):
    """Metadata for other/generic link types"""
    content_type: Optional[str] = None


class ProductResponse(BaseModel):
    """Response schema for product type links"""
    link_type: Literal["product"]
    summary: str
    keywords: List[str]
    metadata: ProductMetadata
    qna: Optional[List[QnA]] = None


class ArticleResponse(BaseModel):
    """Response schema for article type links"""
    link_type: Literal["article"]
    summary: str
    keywords: List[str]
    metadata: ArticleMetadata
    qna: Optional[List[QnA]] = None


class VideoResponse(BaseModel):
    """Response schema for video type links"""
    link_type: Literal["video"]
    summary: str
    keywords: List[str]
    metadata: VideoMetadata
    qna: Optional[List[QnA]] = None


class OtherResponse(BaseModel):
    """Response schema for other/generic type links"""
    link_type: Literal["other"]
    summary: str
    keywords: List[str]
    metadata: OtherMetadata
    qna: Optional[List[QnA]] = None


# Discriminated union based on link_type field
LinkAnalysisResponse = Union[ProductResponse, ArticleResponse, VideoResponse, OtherResponse]
