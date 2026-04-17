import random
from fake_useragent import UserAgent
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def enhance_stealth_setup(
    server_url: str = "http://selenium-server:4444/wd/hub",
):
    """
    봇 탐지를 우회하기 위한 향상된 Chrome 설정
    """
    options = Options()

    # Chrome capabilities 설정
    options.set_capability("browserName", "chrome")

    # 기본적인 자동화 탐지 방지 설정
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-popup-blocking")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-infobars")

    # 랜덤 해상도 설정
    resolutions = [
        "1920,1080",
        "1366,768",
        "1536,864",
        "1440,900",
        "1280,720",
        "1600,900",
    ]
    options.add_argument(f"--window-size={random.choice(resolutions)}")

    # iPhone Safari User-Agent로 고정
    iphone_user_agent = (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2_1 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
        "Version/18.1 Mobile/15E148 Safari/604.1"
    )
    options.add_argument(f"user-agent={iphone_user_agent}")

    # 언어 및 지역 설정
    languages = [
        "en-US,en;q=0.9",
        "en-GB,en;q=0.9",
        "ko-KR,ko;q=0.9,en-US;q=0.8",
        "ja-JP,ja;q=0.9,en-US;q=0.8",
    ]
    options.add_argument(f"--lang={random.choice(languages)}")

    # WebGL 벤더 및 렌더러 정보 위장을 위한 JavaScript 코드
    webgl_vendors = [
        {
            "vendor": "Google Inc.",
            "renderer": "ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0)",
        },
        {"vendor": "Apple Inc.", "renderer": "Apple M1"},
        {"vendor": "Intel Inc.", "renderer": "Intel Iris OpenGL Engine"},
        {
            "vendor": "NVIDIA Corporation",
            "renderer": "NVIDIA GeForce GTX 1650/PCIe/SSE2",
        },
    ]

    def setup_driver(options):
        driver = webdriver.Remote(
            command_executor=server_url,
            options=options,
        )

        # WebGL 정보 위장
        webgl = random.choice(webgl_vendors)
        webgl_script = f"""
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {{
                if (parameter === 37445) {{
                    return '{webgl["vendor"]}';
                }}
                if (parameter === 37446) {{
                    return '{webgl["renderer"]}';
                }}
                return getParameter.apply(this, arguments);
            }};
        """
        driver.execute_script(webgl_script)

        # 플러그인 정보 위장
        plugins_script = """
            Object.defineProperty(navigator, 'plugins', {
                get: function() {
                    return {
                        0: {name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer'},
                        1: {name: 'Chrome PDF Viewer', filename: 'chrome-pdf-viewer'},
                        2: {name: 'Native Client', filename: 'native-client'},
                        3: {name: 'Microsoft Edge PDF Plugin', filename: 'edge-pdf-viewer'},
                        length: 4,
                        refresh: function() {},
                        item: function(index) { return this[index] },
                        namedItem: function(name) { 
                            return Object.values(this).find(plugin => plugin.name === name);
                        }
                    };
                }
            });
        """
        driver.execute_script(plugins_script)

        # 플랫폼 정보 위장
        platform_script = """
            Object.defineProperty(navigator, 'platform', {
                get: function() {
                    return 'Win32';
                }
            });
        """
        driver.execute_script(platform_script)

        return driver

    return options, setup_driver


def basic_setup(server_url: str = "http://selenium-server:4444/wd/hub"):
    """
    기본 Chrome 드라이버와 옵션 설정
    """
    options = Options()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-popup-blocking")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-infobars")

    # 기본 드라이버 설정
    driver = webdriver.Remote(
        command_executor=server_url,
        options=options,
        user_agent=UserAgent().random,
    )

    return driver
