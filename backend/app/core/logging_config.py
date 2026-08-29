import logging
import os
from logging.handlers import RotatingFileHandler
from typing import Final, TextIO

# Constants
FILE_NAME: Final[str] = "app.log"
FILE_DIR: Final[str] = "./logs"
FILE_SIZE: Final[int] = 1024 * 1024  # 1MB per file
BACKUP_COUNT: Final[int] = 5  # keeps last 5 files = 5MB max
FORMAT: Final[str] = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DEFAULT_NOISY_LOGGERS: Final[tuple[str, ...]] = (
    "watchfiles",
    "watchfiles.main",
    "granian",
    "granian.access",
    "aiosqlite",
    "sqlalchemy.engine",
    "sqlalchemy.engine.Engine",
    "sqlalchemy.pool",
    "sqlalchemy.dialects",
    "asyncpg",  # PostgreSQL
    "aiopg",  # another PostgreSQL driver
    "aiomysql",  # MySQL
)


def setup_logging(
    debug: bool = False,
    noisy_loggers: tuple[str, ...] | None = None,
    log_format: str = FORMAT,
) -> None:
    _check_directory()
    log_handlers: list[logging.Handler] = _setup_handlers(log_format)
    log_level: int = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(level=log_level, format=log_format, handlers=log_handlers)
    _silence_noisy_loggers(noisy_loggers or DEFAULT_NOISY_LOGGERS)


# Ensure log directory exists
def _check_directory() -> None:
    try:
        os.makedirs(FILE_DIR, exist_ok=True)
    except OSError as e:
        raise SystemExit(f"Error creating directory '{FILE_DIR}': {e}")


# Handlers
def _setup_handlers(log_format: str) -> list[logging.Handler]:
    file_handler = RotatingFileHandler(
        filename=str(os.path.join(FILE_DIR, FILE_NAME)),
        maxBytes=FILE_SIZE,
        backupCount=BACKUP_COUNT,
    )
    file_handler.setFormatter(logging.Formatter(log_format))
    console_handler: logging.StreamHandler[TextIO] = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format))
    return [file_handler, console_handler]


# Silence noisy libraries in one loop
def _silence_noisy_loggers(noisy_loggers: tuple[str, ...]) -> None:
    for name in noisy_loggers:
        _logger: logging.Logger = logging.getLogger(name)
        _logger.setLevel(logging.WARNING)
        _logger.propagate = False  # prevent bubbling up to root
