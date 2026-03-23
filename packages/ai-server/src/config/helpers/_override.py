from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.config import Application


def use_dev_mock_overrides(application: "Application") -> "Application":

    # 기존 Environment 객체 복사
    original_env = application.environment()

    # 필요한 필드만 오버라이드
    overridden_env = original_env.model_copy(
        update={
            "DECODED_BACKEND_URL": "http://localhost:8000",
            "REDIS_HOST": "localhost",
            "REDIS_PORT": 6300,
            "REDIS_PASSWORD": "password",
            "LLM_HOST": "localhost",
        }
    )
    # 오버라이드된 환경 설정
    application.environment.override(overridden_env)
    return application


def use_prod_mock_overrides(application: "Application") -> "Application":

    # 기존 Environment 객체 복사
    original_env = application.environment()

    # 필요한 필드만 오버라이드
    overridden_env = original_env.model_copy(
        update={
            "DECODED_BACKEND_URL": "https://api.decoded.style",
            "REDIS_HOST": "localhost",
            "REDIS_PORT": 6379,
            "REDIS_PASSWORD": "password",
            "LLM_HOST": "localhost",
        }
    )
    # 오버라이드된 환경 설정
    application.environment.override(overridden_env)
    return application
