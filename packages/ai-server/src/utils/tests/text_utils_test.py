from src.utils.text_utils import extract_text_from_url
import logging

logger = logging.getLogger(__name__)


def test_extract_text_from_url():
    url = "https://www.balenciaga.com/ko-kr/바스켓볼-시리즈---보머-블랙-화이트-822777TRS011000.html"
    text = extract_text_from_url(url)
    logger.info(f"Extracted text: {text}")
    # 기본 검증
    assert isinstance(text, str)
    assert len(text) > 0

    # 가격 형식 검증
    assert "₩" in text
    assert "₩ 12,000,000" in text  # 정확한 가격 형식 확인
