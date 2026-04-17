import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.metadata_controller import router as metadata_router
from src.config import Application
from src.middleware import global_exception_handler, logging_middleware


def create_app(application: Application) -> FastAPI:
    """기본 FastAPI 앱 생성 및 동기적 설정"""
    # Sentry는 FastAPI 인스턴스 생성 전에 초기화해야 한다
    from .app import _init_sentry

    _init_sentry()
    environment = application.environment()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """
        redis 주기적 프로세스 실행
        """

        yield

    app = FastAPI(
        title="DECODED AI API",
        description="AI Service for DECODED",
        version="1.0.0",
        debug=not environment.is_production(),
        lifespan=lifespan,
    )
    return app


async def initialize_async_resources(application: Application):
    """비동기 리소스 초기화"""
    pass


def configure_routes(app: FastAPI, application: Application) -> FastAPI:
    environment = application.environment()

    # CORS 설정
    is_prod = environment.is_production()
    origins = (
        ["*"]
        if not is_prod
        else [
            "https://decoded.style",
            "http://decoded.style",
            "https://ai.decoded.style",
            "http://ai.decoded.style",
            "https://api.decoded.style",
            "http://api.decoded.style",
            "https://admin.decoded.style",
            "http://admin.decoded.style",
            "https://dev.decoded.style",
            "http://dev.decoded.style",
        ]
    )

    # 미들웨어 설정
    app.middleware("http")(logging_middleware)
    app.exception_handler(Exception)(global_exception_handler)

    # CORS 미들웨어 추가
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["Root"])
    async def read_root():
        return {"message": "WELCOME TO DECODED AI SERVER", "status": "running"}

    @app.get("/health", tags=["Health Check"])
    async def health_check():
        try:
            return {
                "status": "healthy",
                "timestamp": datetime.datetime.now().isoformat(),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.datetime.now().isoformat(),
            }

    # 메타데이터 추출 테스트 컨트롤러 라우터 등록
    app.include_router(metadata_router)

    return app


def bootstrap(application: Application) -> FastAPI:
    """전체 애플리케이션 부트스트래핑"""
    app = create_app(application)
    configure_routes(app, application)
    return app
