import logging
from fastapi import Request
from fastapi.responses import JSONResponse
import time
from src.config import Environment
from fastapi import HTTPException

environment = Environment.from_environ()

logger = logging.getLogger("ai")


async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    # 헬스체크는 로깅 제외
    if request.url.path == "/health":
        return await call_next(request)

    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        if 400 <= response.status_code < 500:
            logger.warning(
                f"{request.method} {request.url.path} "
                f"- {response.status_code} "
                f"- {process_time:.2f}ms"
            )
        elif response.status_code >= 500:
            logger.error(
                f"{request.method} {request.url.path} "
                f"- {response.status_code} "
                f"- {process_time:.2f}ms"
            )
        else:
            logger.info(
                f"{request.method} {request.url.path} "
                f"- {response.status_code} "
                f"- {process_time:.2f}ms"
            )
        return response

    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        logger.error(
            f"{request.method} {request.url.path} "
            f"- 500 "
            f"- {process_time:.2f}ms "
            f"- Error: {str(e)}"
        )
        raise


async def debug_middleware(request: Request, call_next):
    if environment.APP_ENV == "dev":
        logger.debug(f"Request path: {request.url.path}")
        logger.debug(f"Request method: {request.method}")
        logger.debug(f"Request headers: {request.headers}")

        response = await call_next(request)

        logger.debug(f"Response headers: {response.headers}")
        return response
    return await call_next(request)


async def model_error_handler(request: Request, exc: Exception):
    logger.error(f"Model error: {str(exc)}")
    return JSONResponse(
        status_code=500, content={"message": "AI Model processing error"}
    )


async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        if exc.status_code == 422:
            # 422 오류에 대한 추가 정보 로깅
            logger.error(
                f"422 Unprocessable Entity: {exc.detail} - Request body: {await request.json()}"
            )
        else:
            logger.error(f"HTTP Exception: {exc.detail}")
    else:
        logger.error(f"Unexpected error: {str(exc)}")

    return JSONResponse(
        status_code=exc.status_code if isinstance(exc, HTTPException) else 500,
        content={"detail": str(exc)},
    )