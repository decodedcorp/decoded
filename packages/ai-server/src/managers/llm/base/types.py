"""LLM 타입 정의 모듈"""

from enum import Enum


class ContentType(str, Enum):
    """Type that the LLM can process"""

    TEXT = "text"  # 텍스트 및 링크 분석
    IMAGE = "image"  # 이미지 분석
