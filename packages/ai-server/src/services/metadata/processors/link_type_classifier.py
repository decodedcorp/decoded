import logging
from typing import Literal
from src.managers.llm.base.client import BaseLLMClient
from src.managers.llm.base.message import LLMMessage
from src.managers.llm.base.types import ContentType

logger = logging.getLogger(__name__)

LinkType = Literal["product", "article", "video", "other"]


class LinkTypeClassifier:
    """
    Groq를 활용한 빠른 링크 타입 분류기
    
    Union 타입 문제를 해결하기 위해 사전에 link_type을 판별하여
    적절한 단일 스키마를 선택할 수 있도록 합니다.
    
    Example:
        classifier = LinkTypeClassifier(groq_client=groq_client)
        link_type = await classifier.classify(url, title, description)
        # Returns: "product" | "article" | "video" | "other"
    """
    
    def __init__(self, groq_client: BaseLLMClient):
        """
        Initialize LinkTypeClassifier
        
        Args:
            groq_client: Groq LLM 클라이언트 (빠른 추론용)
        """
        self.llm_client = groq_client
        self.logger = logging.getLogger(__name__)
    
    async def classify(
        self, 
        url: str, 
        title: str, 
        description: str
    ) -> LinkType:
        """
        URL과 메타데이터를 기반으로 링크 타입을 분류
        
        Args:
            url: 분석할 URL
            title: OG title 또는 페이지 제목
            description: OG description 또는 페이지 설명
            
        Returns:
            링크 타입: "product" | "article" | "video" | "other"
        """
        try:
            # 빠른 분류를 위한 간단한 프롬프트
            prompt = self._build_classification_prompt(url, title, description)
            self.logger.debug(f"Prompt: {prompt}")

            messages = [
                LLMMessage(role="user", content=prompt)
            ]
            
            # Groq로 빠르게 추론
            response = await self.llm_client.completion(
                messages=messages,
                content_type=ContentType.TEXT,
                temperature=0.1,  # 낮은 temperature로 일관된 분류
                max_tokens=10  # 단어 하나만 필요
            )
            
            # 응답에서 link_type 추출
            link_type = self._extract_link_type(response.content)
            
            self.logger.info(f"Classified link as '{link_type}': {url[:50]}...")
            return link_type
            
        except Exception as e:
            self.logger.warning(f"Link type classification failed: {e}. Defaulting to 'other'")
            return "other"
    
    def _build_classification_prompt(
        self, 
        url: str, 
        title: str, 
        description: str
    ) -> str:
        """분류를 위한 프롬프트 생성"""
        prompt_parts = [
            "Classify the following link into ONE of these categories: product, article, video, other",
            "",
            f"URL: {url}",
        ]
        
        if title:
            prompt_parts.append(f"Title: {title}")
        
        if description:
            prompt_parts.append(f"Description: {description}")
        
        prompt_parts.extend([
            "",
            "Classification criteria:",
            "- product: E-commerce pages, shopping items, product listings",
            "- article: Blog posts, news articles, documentation, written content",
            "- video: YouTube, video platforms, video content",
            "- other: Social media posts, general websites, tools, services",
            "",
            "Respond with ONLY ONE WORD: product, article, video, or other"
        ])

        return "\n".join(prompt_parts)
    
    def _extract_link_type(self, response_text: str) -> LinkType:
        """
        LLM 응답에서 link_type 추출
        
        Args:
            response_text: LLM 응답 텍스트
            
        Returns:
            유효한 link_type
        """
        # 응답 정제
        cleaned = response_text.strip().lower()
        
        # 유효한 타입 목록
        valid_types = ["product", "article", "video", "other"]
        
        # 응답에서 유효한 타입 찾기
        for valid_type in valid_types:
            if valid_type in cleaned:
                return valid_type
        
        # 기본값: other
        self.logger.warning(f"Could not extract valid link_type from: {response_text}. Using 'other'")
        return "other"
