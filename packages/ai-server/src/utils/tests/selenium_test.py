import time
import random
from src.utils.selenium_utils import enhance_stealth_setup


def test_stealth_browser():
    """
    향상된 stealth 설정으로 브라우저 테스트
    """
    options, setup_driver = enhance_stealth_setup()
    driver = setup_driver(options)

    try:
        # 테스트할 웹사이트 목록
        test_urls = [
            "https://www.ssense.com/en-us/women/product/sacai/khaki-suiting-and-nylon-twill-bomber-jacket/17291271",
            "https://www.ssense.com/en-us/women/product/blumarine/black-and-red-floral-print-maxi-dress/17338831",
        ]

        for url in test_urls:
            # 웹사이트 접속
            print(f"\n테스트 URL: {url}")
            driver.get(url)

            # 자연스러운 지연 시간 추가
            time.sleep(random.uniform(3, 5))

            # 페이지 타이틀 출력
            print(f"페이지 타이틀: {driver.title}")

            # 현재 URL 출력
            print(f"현재 URL: {driver.current_url}")

            # WebGL 정보 확인
            webgl_vendor = driver.execute_script(
                "const canvas = document.createElement('canvas'); "
                "const gl = canvas.getContext('webgl'); "
                "return gl.getParameter(gl.VENDOR);"
            )
            print(f"WebGL Vendor: {webgl_vendor}")

            # 플러그인 정보 확인
            plugins = driver.execute_script(
                "return Array.from(navigator.plugins).map(p => p.name);"
            )
            print(f"플러그인: {plugins}")

            # 플랫폼 정보 확인
            platform = driver.execute_script("return navigator.platform;")
            print(f"플랫폼: {platform}")

            # 스크린샷 저장 (선택사항)
            driver.save_screenshot(f"test_screenshot_{url.split('//')[1].split('/')[0]}.png")

            print("\n" + "=" * 50)

    except Exception as e:
        print(f"에러 발생: {str(e)}")

    finally:
        # 브라우저 종료
        print("\n브라우저 종료")
        driver.quit()


if __name__ == "__main__":
    test_stealth_browser()
