import time
import uuid
from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from src.schemas.metadata import (
    MetadataExtractRequest, MetadataExtractResponse,
    ExtractOGRequest, ExtractOGResponse
)
from src.services.metadata.core import MetadataExtractService
from src.config import Application
from src.database.models.content import ProcessingStatus


router = APIRouter(prefix="/api/metadata", tags=["Metadata"])


def get_metadata_extract_service() -> MetadataExtractService:
    """의존성 주입: MetadataExtractService 인스턴스 반환"""
    app = Application()
    metadata_container = app.metadata()
    return metadata_container.metadata_extract_service()


@router.post("/extract", response_model=MetadataExtractResponse)
async def extract_metadata(
    request: MetadataExtractRequest,
    manager: Annotated[MetadataExtractService, Depends(get_metadata_extract_service)]
) -> MetadataExtractResponse:
    """
    단일 URL에 대한 메타데이터 추출 테스트 엔드포인트
    
    Args:
        request: URL이 포함된 요청 객체
        manager: MetadataExtractService 인스턴스 (의존성 주입)
        
    Returns:
        MetadataExtractResponse: 추출된 메타데이터의 간단한 요약 정보
    """
    start_time = time.time()
    item_id = str(uuid.uuid4())
    
    try:
        # Step 1: Extract OG metadata
        link_preview = await manager.extract_og_metadata(url=request.url)

        if not link_preview or not link_preview.title:
            return MetadataExtractResponse(
                url=request.url,
                status=ProcessingStatus.FAILED,
                processing_time_seconds=round(time.time() - start_time, 2),
                error_message="OG 메타데이터 추출 실패"
            )

        # Step 2: AI analysis with extracted OG metadata
        og_metadata = {
            "title": link_preview.title or "",
            "description": link_preview.description or "",
            "site_name": link_preview.site_name or ""
        }

        result = await manager._analyze_link(
            url=request.url,
            item_id=item_id,
            og_metadata=og_metadata
        )
        
        processing_time = time.time() - start_time
        
        # LinkProcessingResult를 간단한 응답 형식으로 변환
        if result.status == ProcessingStatus.FAILED:
            return MetadataExtractResponse(
                url=request.url,
                status=result.status,
                processing_time_seconds=round(processing_time, 2),
                error_message=result.error_message
            )
        
        # 성공 또는 부분 성공인 경우 메타데이터 추출
        metadata = result.metadata
        if metadata:
            return MetadataExtractResponse(
                url=request.url,
                status=result.status,
                title=link_preview.title,
                description=link_preview.description,
                image_url=link_preview.img_url,
                site_name=link_preview.site_name,
                metadata=metadata,
                processing_time_seconds=round(processing_time, 2),
                error_message=result.error_message
            )
        else:
            # 메타데이터가 없는 경우
            return MetadataExtractResponse(
                url=request.url,
                status=result.status,
                processing_time_seconds=round(processing_time, 2),
                error_message="메타데이터를 추출할 수 없습니다"
            )
            
    except Exception as e:
        processing_time = time.time() - start_time
        raise HTTPException(
            status_code=500,
            detail=f"메타데이터 추출 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/extract-og", response_model=ExtractOGResponse)
async def extract_og_metadata(
    url: str,
    manager: Annotated[MetadataExtractService, Depends(get_metadata_extract_service)]
) -> ExtractOGResponse:
    """
    OG 메타데이터만 추출하는 테스트 엔드포인트 (동기 처리)
    
    Args:
        url: 추출할 URL (query parameter)
        manager: MetadataExtractService 인스턴스 (의존성 주입)
        
    Returns:
        ExtractOGResponse: 추출된 OG 메타데이터 (Title, Description, Image, SiteName)
    """
    start_time = time.time()
    
    try:
        # OG 메타데이터만 추출 (동기적)
        link_preview = await manager.extract_og_metadata(url)
        processing_time = time.time() - start_time

        if not link_preview:
            return ExtractOGResponse(
                success=False,
                url=url,
                processing_time_seconds=round(processing_time, 2),
                error_message="OG 메타데이터 추출 실패"
            )

        # LinkPreviewMetadata를 응답 형식으로 변환
        return ExtractOGResponse(
            success=True,
            url=url,
            title=link_preview.title or "",
            description=link_preview.description or "",
            image=link_preview.img_url or "",
            site_name=link_preview.site_name or "",
            extra_metadata=link_preview.extra_metadata,
            processing_time_seconds=round(processing_time, 2),
            error_message=None
        )
            
    except Exception as e:
        processing_time = time.time() - start_time
        return ExtractOGResponse(
            success=False,
            url=url,
            processing_time_seconds=round(processing_time, 2),
            error_message=f"OG 메타데이터 추출 중 오류가 발생했습니다: {str(e)}"
        )
