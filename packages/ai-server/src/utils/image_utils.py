def image_url_validation(url: str) -> bool:
    """
    이미지 URL 유효성 검사
    """
    return url.endswith((".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".ico", ".webp"))
