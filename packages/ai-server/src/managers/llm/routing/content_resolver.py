import re
from typing import Dict, List, Optional
from src.database.models.batch import DataItemType
import logging


class ContentTypeResolver:
    """
    Class for analyzing URLs and content to determine the appropriate content_type.

    This class analyzes URL patterns to decide which LLM client should be used.
    Example: YouTube URL -> "youtube", general link -> "link", image -> "image"
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # URL 패턴별 content_type 매핑 (현재는 모든 링크를 "link"로 통일)
        self.url_patterns = {
            # 향후 확장 시 특별한 처리가 필요한 사이트들을 위한 패턴
            # 현재는 모든 URL을 "link"로 처리하므로 비활성화
            # r"(?:https?://)?(?:www\.)?(github\.com)": "github",  # GitHub 전용 처리
            # r"(?:https?://)?(?:www\.)?(arxiv\.org|scholar\.google)": "academic",  # 학술 사이트
        }
    
    def resolve_content_type(self, url: str, data_type: DataItemType) -> str:
        """
        URL과 데이터 타입을 분석하여 적절한 content_type 결정
        
        Args:
            url: 분석할 URL
            data_type: 데이터 아이템 타입 (LINK, IMAGE 등)
            
        Returns:
            content_type string ("link", "image", "text")
        """
        try:
            # 이미지 타입은 항상 "image"
            if data_type == DataItemType.IMAGE:
                return "image"
            
            # 링크 타입인 경우 URL 패턴 분석
            if data_type == DataItemType.LINK and url:
                resolved_type = self._analyze_url_patterns(url)
                if resolved_type:
                    self.logger.debug(f"URL {url} resolved to content_type: {resolved_type}")
                    return resolved_type
                
                # 패턴에 매칭되지 않으면 기본 "link"
                return "link"
            
            # 기본값은 "text"
            return "text"
            
        except Exception as e:
            self.logger.warning(f"Error resolving content type for URL {url}: {e}")
            # 에러 발생시 안전한 기본값 반환
            return "link" if data_type == DataItemType.LINK else "text"
    
    def _analyze_url_patterns(self, url: str) -> Optional[str]:
        """
        URL을 패턴과 매칭하여 content_type 결정
        
        Args:
            url: 분석할 URL
            
        Returns:
            매칭된 content_type 또는 None
        """
        url_lower = url.lower().strip()
        
        for pattern, content_type in self.url_patterns.items():
            if re.search(pattern, url_lower, re.IGNORECASE):
                return content_type
        
        return None
    
    def is_youtube_url(self, url: str) -> bool:
        """
        YouTube URL인지 확인하는 유틸리티 메서드
        Note: 현재는 모든 링크가 "link" content_type으로 처리되므로 
        이 메서드는 참조용으로만 사용됩니다.
        
        Args:
            url: 확인할 URL
            
        Returns:
            YouTube URL이면 True, 아니면 False
        """
        youtube_pattern = r"(?:https?://)?(?:www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)"
        return bool(re.search(youtube_pattern, url.lower().strip(), re.IGNORECASE))
    
    def add_url_pattern(self, pattern: str, content_type: str):
        """
        새로운 URL 패턴 추가
        
        Args:
            pattern: 정규식 패턴
            content_type: 매핑할 content_type
        """
        self.url_patterns[pattern] = content_type
        self.logger.info(f"Added URL pattern: {pattern} -> {content_type}")
    
    def remove_url_pattern(self, pattern: str):
        """
        URL 패턴 제거
        
        Args:
            pattern: 제거할 정규식 패턴
        """
        if pattern in self.url_patterns:
            del self.url_patterns[pattern]
            self.logger.info(f"Removed URL pattern: {pattern}")
    
    def get_supported_patterns(self) -> Dict[str, str]:
        """
        지원하는 URL 패턴 목록 반환
        
        Returns:
            패턴과 content_type 매핑 딕셔너리
        """
        return self.url_patterns.copy()
    
    def get_pattern_info(self) -> List[Dict[str, str]]:
        """
        패턴 정보를 사람이 읽기 쉬운 형태로 반환
        
        Returns:
            패턴 정보 리스트
        """
        info = []
        for pattern, content_type in self.url_patterns.items():
            description = self._get_pattern_description(pattern)
            info.append({
                "pattern": pattern,
                "content_type": content_type,
                "description": description
            })
        return info
    
    def _get_pattern_description(self, pattern: str) -> str:
        """패턴에 대한 설명 생성"""
        if "youtube" in pattern:
            return "YouTube URLs (youtube.com, youtu.be, m.youtube.com)"
        elif "github" in pattern:
            return "GitHub URLs"
        elif "arxiv" in pattern:
            return "Academic sites (arXiv, Google Scholar)"
        else:
            return f"Custom pattern: {pattern}"