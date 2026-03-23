from .bootstrap import bootstrap
from src.config import Application


def create_app():
    application = Application()
    logger = application.logger()
    environment = Application.environment()
    run_mode = "production" if environment.is_production() else "development"
    logger.debug(f"Server is running in {run_mode} mode")

    return bootstrap(application)