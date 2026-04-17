from pydantic import BaseModel
from typing import Optional, Dict, Any
from src.database.models.content import ProcessedLinkMetadata, ProcessingStatus


class MetadataExtractRequest(BaseModel):
    """URL 메타데이터 추출 요청 모델"""

    url: str


class MetadataExtractResponse(BaseModel):
    """URL 메타데이터 추출 응답 모델 (간단한 요약 정보)"""

    url: str
    status: ProcessingStatus
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    site_name: Optional[str] = None
    metadata: Optional[ProcessedLinkMetadata] = None
    processing_time_seconds: float
    error_message: Optional[str] = None


class ExtractOGRequest(BaseModel):
    """OG 메타데이터 추출 요청 모델"""

    url: str


class ExtractOGResponse(BaseModel):
    """OG 메타데이터 추출 응답 모델"""

    success: bool
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    site_name: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None
    processing_time_seconds: float
    error_message: Optional[str] = None
