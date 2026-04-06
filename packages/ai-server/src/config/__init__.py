# flake8: noqa

from ._environment import Environment
from ._logger import LoggerService, get_logger
from .model import RedisConfig


def __getattr__(name):
    """Lazy-load Application to avoid circular imports with managers/services."""
    if name == "Application":
        from ._container import Application
        return Application
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["Application", "Environment", "LoggerService", "get_logger", "RedisConfig"]
