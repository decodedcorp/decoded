import logging
import logging.config
from pathlib import Path
from src.config._environment import Environment

env = Environment.from_environ()


def setup_logging():
    log_dir = env.LOG_DIR
    Path(log_dir).mkdir(parents=True, exist_ok=True)

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "default",
                "filename": str(Path(log_dir) / "ai_app.log"),
                "maxBytes": 10485760,  # 10MB
                "level": "INFO",
                "filters": ["exclude_error"],
                "backupCount": 5,
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "default",
                "filename": str(Path(log_dir) / "ai_error.log"),
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "level": "ERROR",
            },
        },
        "filters": {
            "exclude_error": {
                "()": "src.log.ExcludeErrorFilter",
            }
        },
        "loggers": {
            "": {  # root logger
                "handlers": ["console", "file", "error_file"],
                "level": "INFO",
            },
            "ai": {
                "handlers": ["console", "file", "error_file"],
                "level": "INFO",
                "propagate": False,
            },
            "models": {
                "handlers": ["console", "file", "error_file"],
                "level": "WARNING",
                "propagate": False,
            },
        },
    }

    # dev 환경에서는 DEBUG 레벨로 설정
    if env.APP_ENV == "dev":
        logging_config["loggers"][""]["level"] = "DEBUG"
        for logger in logging_config["loggers"].values():
            logger["level"] = "DEBUG"

    logging.config.dictConfig(logging_config)


class ExcludeErrorFilter(logging.Filter):
    def filter(self, record):
        return record.levelno < logging.ERROR
