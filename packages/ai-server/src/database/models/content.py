from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum


class ProcessingStatus(Enum):
    """Processing status enumeration"""
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


class LinkPreviewMetadata(BaseModel):
    """
    model for link preview metadata
    """
    title: Optional[str] = None
    description: Optional[str] = None
    img_url: Optional[str] = None
    site_name: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None

    def __str__(self):
        res = ""
        if self.title:
            res += f"Title: {self.title}, "
        if self.description:
            res += f"Description: {self.description}, "
        if self.img_url:
            res += f"Image URL: {self.img_url}, "
        if self.site_name:
            res += f"Site Name: {self.site_name},"
        if self.extra_metadata:
            res += f"Extra Metadata: {self.extra_metadata}"
        return res


class QAPair(BaseModel):
    """
    model for question and answer pair
    """
    question: str
    answer: str


class AIGenMetadata(BaseModel):
    """
    model for ai generated metadata
    """
    summary: str
    qa_list: List[QAPair]


class ProcessedLinkMetadata(BaseModel):
    """
    Complete processed link metadata for backend
    """
    link_type: str = "other"  # "product", "article", "video", "other"
    summary: Optional[str] = None
    qa_pairs: List[QAPair] = []
    keywords: Optional[List[str]] = None
    metadata: Dict[str, Any] = {}  # Type-specific dynamic metadata


class ProcessedImageMetadata(BaseModel):
    """
    Complete processed image metadata for backend
    """
    description: Optional[str] = None
    objects: Optional[List[str]] = None
    context: Optional[str] = None
    style: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None
    category: Optional[str] = None
    qna: Optional[List[QAPair]] = None


class LinkProcessingResult(BaseModel):
    """
    Complete link processing result with metadata and status
    """
    item_id: str  # Solution ID (same as solution_id from backend)
    url: str
    status: ProcessingStatus
    error_message: Optional[str] = None
    metadata: Optional[ProcessedLinkMetadata] = None
    processing_time: Optional[float] = None  # Total processing time in seconds


class ImageProcessingResult(BaseModel):
    """
    Complete image processing result with metadata and status
    """
    item_id: str  # Solution ID (same as solution_id from backend)
    url: str
    status: ProcessingStatus
    error_message: Optional[str] = None
    metadata: Optional[ProcessedImageMetadata] = None
    processing_time: Optional[float] = None  # Total processing time in seconds
