from contextlib import asynccontextmanager
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


class SeleniumManager:
    def __init__(
        self,
        selenium_url: str,
        logger,
    ):
        self.selenium_url = selenium_url
        self.driver = None
        self.logger = logger
        self.logger.info(
            f"SeleniumManager initialized with URL: {self.selenium_url}",
        )
        self.options = Options()
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")

        # Add Twitter Bot headers
        self.options.add_argument(
            "--user-agent=Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"
        )
        self.options.add_argument("--accept-language=ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
        self.options.add_argument(
            "--accept=text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
        )
        self.options.add_argument("--x-slackbot-client=Slackbot-LinkExpanding")
        self.options.add_argument("--x-slackbot-client-version=1.0")

        # Selenium Grid에 맞는 capabilities 설정
        self.options.set_capability("browserName", "chrome")

    async def get_driver(self):
        """필요시에만 생성 client_context 로 호출 권장"""
        if self.driver is None:
            self.driver = webdriver.Remote(
                command_executor=self.selenium_url,
                options=self.options,
            )
        return self.driver

    @asynccontextmanager
    async def client_context(self):
        if self.driver is None:
            self.driver = await self.get_driver()
        try:
            yield self.driver
            self.driver.quit()
            self.driver = None
        except Exception as e:
            self.logger.error(f"Error in client context: {str(e)}")
            if self.driver:
                self.driver.quit()
                self.driver = None
