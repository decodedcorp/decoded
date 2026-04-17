import os

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.grpc import GRPCIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from .bootstrap import bootstrap
from src.config import Application


def _init_sentry() -> None:
    """Initialize Sentry SDK. Gracefully skips if SENTRY_DSN is not set."""
    dsn = os.environ.get("SENTRY_DSN", "")
    if not dsn:
        return
    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get("APP_ENV", "development"),
        traces_sample_rate=0.1 if os.environ.get("APP_ENV") == "production" else 1.0,
        integrations=[
            StarletteIntegration(),
            FastApiIntegration(),
            GRPCIntegration(),
        ],
        send_default_pii=False,
    )


def create_app():
    application = Application()
    logger = application.logger()
    environment = Application.environment()
    run_mode = "production" if environment.is_production() else "development"
    logger.debug(f"Server is running in {run_mode} mode")

    return bootstrap(application)
