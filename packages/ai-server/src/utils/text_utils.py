import logging
import requests
from bs4 import BeautifulSoup
from langdetect import detect_langs
import random
import time
from urllib.parse import urlparse


logger = logging.getLogger(__name__)


def clean_text(text: str) -> str:
    if not text:
        return None
    cleaned = text.replace('\\"', "").replace('"', "").replace("\\", "")
    cleaned = " ".join(cleaned.replace("\n", " ").split())
    return cleaned


def extract_text_from_url(url: str, is_dirty: bool = False) -> str:
    """웹페이지에서 텍스트를 추출하고 정제"""
    return _extract_text_from_url_impl(url, is_dirty)


def _extract_text_from_url_impl(url: str, is_dirty: bool = False) -> str:
    """웹페이지에서 텍스트를 추출하고 정제"""
    parsed_url = urlparse(url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    user_agent = (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
        "Version/16.6 Mobile/15E148 Safari/604.1"
    )

    try:
        headers = {
            "User-Agent": user_agent,
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;"
                "q=0.9,image/avif,image/webp,*/*;q=0.8"
            ),
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        }

        session = requests.Session()
        session.get(url)
        time.sleep(random.uniform(1, 3))

        response = session.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        components = ["script", "style"]
        if not is_dirty:
            components.extend(
                [
                    "link",
                    "footer",
                    "nav",
                    "noscript",
                    "[data-tracking]",
                ]
            )

        # 불필요한 태그 제거
        for tag in soup(components):
            tag.decompose()
        # 텍스트 정제
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = " ".join(chunk for chunk in chunks if chunk)
        return text

    except requests.exceptions.RequestException as e:
        logger.error(f"Bot detection blocked access to {base_url}. Error: {str(e)}")


def detect_main_language(
    text: str, supported_languages: list[str], default_language: str = "en"
) -> str:
    """텍스트의 주요 언어 감지"""
    try:
        # 언어 감지 및 확률 계산
        langs = detect_langs(text)
        # 가장 높은 확률의 언어 반환
        main_lang = max(langs, key=lambda x: x.prob)
        logger.info(f"Detected languages: {langs}")

        # 지원하는 언어인지 확인
        if main_lang.lang in supported_languages:
            return main_lang.lang

        # 지원하지 않는 언어면 기본 언어 사용
        logger.warning(
            f"Unsupported language {main_lang.lang}, using default language {default_language}"
        )
        return default_language

    except Exception as e:
        logger.warning(
            f"Language detection failed: {str(e)}, using default language:en",
        )
        return default_language


def extract_img_tags_from_url(url: str) -> list[str]:
    """웹페이지에서 이미지 태그 추출"""
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, "html.parser")
        return [img["src"] for img in soup.find_all("img")]
    except Exception as e:
        logger.error(f"Error extracting image tags from URL {url}: {str(e)}")
        return []
