from pathlib import Path
import os
from os import getcwd
from os.path import join, exists
from typing import Optional
from pydantic import BaseModel, ConfigDict
from dotenv import load_dotenv, set_key
from .model import RedisConfig
import logging

logger = logging.getLogger(__name__)


def _apply_legacy_env_aliases() -> None:
    """If new env keys are unset, copy from deprecated names (api-server / docs migration)."""
    pairs = [
        ("API_SERVER_HTTP_URL", "DECODED_BACKEND_URL"),
        ("API_SERVER_ACCESS_TOKEN", "DECODED_BACKEND_ACCESS_TOKEN"),
        ("API_SERVER_GRPC_HOST", "GRPC_BACKEND_HOST"),
        ("API_SERVER_GRPC_PORT", "GRPC_BACKEND_PORT"),
    ]
    for new_key, old_key in pairs:
        if new_key not in os.environ and old_key in os.environ:
            os.environ[new_key] = os.environ[old_key]


# Environment Settings
class Environment(BaseModel):
    model_config = ConfigDict(extra="allow")

    APP_ENV: str = "dev"  # 기본값 설정
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str

    LOG_DIR: str = str(Path(__file__).parent.parent / "logs")
    LOG_LEVEL: str = "INFO"

    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_PASSWORD: str
    REDIS_DB: int = 0

    QUEUE_BATCH_SIZE: int = 10

    # Postgres 직접 연결 (asyncpg pool) — 로컬/prod 투명 전환 (DATABASE_URL 값만 교체)
    DATABASE_URL: str = ""
    DATABASE_POOL_MIN: int = 1
    DATABASE_POOL_MAX: int = 5

    API_SERVER_HTTP_URL: str
    API_SERVER_ACCESS_TOKEN: str

    SELENIUM_URL: str

    API_SERVER_GRPC_HOST: str
    API_SERVER_GRPC_PORT: int

    # External API Configuration
    PERPLEXITY_API_KEY: str = ""
    PERPLEXITY_API_URL: str = "https://api.perplexity.ai"
    PERPLEXITY_MODEL: str = "sonar"
    PERPLEXITY_MAX_RETRIES: int = 3
    PERPLEXITY_REQUEST_TIMEOUT: int = 30

    LOCAL_LLM_API_KEY: str = "ollama"
    LOCAL_LLM_BASE_URL: str = "http://host.docker.internal:11434/v1"
    LOCAL_LLM_MODEL: str = "gpt-oss:20b"
    LOCAL_LLM_MAX_RETRIES: int = 3
    LOCAL_LLM_REQUEST_TIMEOUT: int = 30

    GEMINI_API_KEY: str = ""
    GEMINI_BASE_URL: str = ""
    GEMINI_MODEL: str = "gemini-3-flash-preview"
    GEMINI_MAX_RETRIES: int = 3
    GEMINI_REQUEST_TIMEOUT: int = 30
    GEMINI_EXCLUDED_DOMAINS: str = (
        ""  # Comma-separated list of domains to exclude from Gemini extraction
    )

    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = ""
    GROQ_MODEL: str = "groq/compound-mini"
    GROQ_MAX_RETRIES: int = 3
    GROQ_REQUEST_TIMEOUT: int = 30

    SEARXNG_API_URL: str = ""
    SEARXNG_MAX_RETRIES: int = 3
    SEARXNG_REQUEST_TIMEOUT: int = 10
    SEARXNG_INCLUDED_DOMAINS: str = ""

    # Processing Configuration
    BATCH_SIZE: int = 10
    MAX_CONCURRENT_REQUESTS: int = 5
    REQUEST_TIMEOUT: int = 30
    MAX_RETRIES: int = 3

    # Telegram Configuration
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    TELEGRAM_ENABLED: bool = True

    # Cost Optimization Configuration
    COST_OPTIMIZATION_THRESHOLD: int = (
        500  # Character threshold for LocalLLM summarization (performance-optimized)
    )

    # Batch Result Configuration
    BATCH_FLUSH_INTERVAL: int = 30  # 배치 전송 주기 (초)
    RESULT_BATCH_SIZE: int = 50  # 배치 크기

    @staticmethod
    def from_environ(*, env_file: Optional[str] = None):
        """Load env file(s). If `env_file` is set, only that path is used when it exists.

        Default (로컬 dev): `.dev.env` 우선, 없으면 `.env`.
        """
        cwd = getcwd()
        if env_file is not None:
            if exists(env_file):
                load_dotenv(env_file)
        else:
            dev = join(cwd, ".dev.env")
            dotenv_path = join(cwd, ".env")
            if exists(dev):
                load_dotenv(dev)
            elif exists(dotenv_path):
                load_dotenv(dotenv_path)
        _apply_legacy_env_aliases()
        return Environment(**os.environ)

    @property
    def app_env(self) -> str:
        return self.APP_ENV

    @property
    def jwt_secret_key(self) -> str:
        return self.JWT_SECRET_KEY

    @property
    def jwt_algorithm(self) -> str:
        return self.JWT_ALGORITHM

    @property
    def log_dir(self) -> str:
        return self.LOG_DIR

    @property
    def log_level(self) -> str:
        return self.LOG_LEVEL

    @property
    def queue_batch_size(self) -> int:
        return self.QUEUE_BATCH_SIZE

    @property
    def backend_url(self) -> str:
        return self.API_SERVER_HTTP_URL

    @property
    def decoded_backend_access_token(self) -> str:
        return self.API_SERVER_ACCESS_TOKEN

    @property
    def llm_host(self) -> str:
        return self.LLM_HOST

    @property
    def llm_port(self) -> int:
        return self.LLM_PORT

    @property
    def llm_model_name(self) -> str:
        return self.LLM_MODEL_NAME

    @property
    def selenium_url(self) -> str:
        return self.SELENIUM_URL

    @property
    def api_server_grpc_host(self) -> str:
        return self.API_SERVER_GRPC_HOST

    @property
    def api_server_grpc_port(self) -> int:
        return self.API_SERVER_GRPC_PORT

    @property
    def grpc_backend_host(self) -> str:
        return self.API_SERVER_GRPC_HOST

    @property
    def grpc_backend_port(self) -> int:
        return self.API_SERVER_GRPC_PORT

    # External API Properties
    @property
    def perplexity_api_key(self) -> str:
        return self.PERPLEXITY_API_KEY

    @property
    def perplexity_api_url(self) -> str:
        return self.PERPLEXITY_API_URL

    @property
    def perplexity_max_retries(self) -> int:
        return self.PERPLEXITY_MAX_RETRIES

    @property
    def perplexity_request_timeout(self) -> int:
        return self.PERPLEXITY_REQUEST_TIMEOUT

    @property
    def searxng_api_url(self) -> str:
        return self.SEARXNG_API_URL

    @property
    def searxng_max_retries(self) -> int:
        return self.SEARXNG_MAX_RETRIES

    @property
    def searxng_request_timeout(self) -> int:
        return self.SEARXNG_REQUEST_TIMEOUT

    @property
    def max_concurrent_requests(self) -> int:
        return self.MAX_CONCURRENT_REQUESTS

    @property
    def request_timeout(self) -> int:
        return self.REQUEST_TIMEOUT

    @property
    def max_retries(self) -> int:
        return self.MAX_RETRIES

    def is_production(self) -> bool:
        return self.APP_ENV == "prod"

    def redis_config(self) -> RedisConfig:
        return RedisConfig(
            host=self.REDIS_HOST,
            port=self.REDIS_PORT,
            password=self.REDIS_PASSWORD,
        )

    def refresh_backend_token(self, token: str):
        try:
            set_key(
                join(getcwd(), ".env"),
                "API_SERVER_ACCESS_TOKEN",
                token,
            )
        except Exception as e:
            logger.warning(f"Error updating .env file: {e}")

        # 중요: 인스턴스 변수 직접 업데이트
        self.API_SERVER_ACCESS_TOKEN = token
        os.environ["API_SERVER_ACCESS_TOKEN"] = token
