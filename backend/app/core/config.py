import os

from dotenv import load_dotenv
from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

ALLOWED_ALGORITHMS: frozenset[str] = frozenset({"HS256", "HS384", "HS512"})
_SHARED_SETTINGS = SettingsConfigDict(env_file_encoding="utf-8", extra="ignore")


def validate_positive(value: int) -> int:
    if value <= 0:
        raise ValueError("Must be a positive integer")
    return value


class AuthConfig(BaseSettings):
    model_config = _SHARED_SETTINGS

    JWT_KEY: SecretStr
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    @field_validator("ALGORITHM")
    @classmethod
    def validate_algorithm(cls, value: str) -> str:
        if value not in ALLOWED_ALGORITHMS:
            raise ValueError(f"Unsupported HMAC algorithm: {value}")
        return value

    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES", "REFRESH_TOKEN_EXPIRE_DAYS")
    @classmethod
    def check_positive(cls, value: int) -> int:
        return validate_positive(value)


class DatabaseConfig(BaseSettings):
    model_config = _SHARED_SETTINGS

    DATABASE_URL: str


class SMTPConfig(BaseSettings):
    model_config = _SHARED_SETTINGS

    SMTP_HOST: str = Field(default="localhost")
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: str = Field(default="")
    SMTP_PASSWORD: SecretStr = Field(default=SecretStr(""))

    @field_validator("SMTP_PORT")
    @classmethod
    def check_positive(cls, value: int) -> int:
        return validate_positive(value)


class Config(AuthConfig, DatabaseConfig, SMTPConfig):
    DEBUG: bool = False
    TESTING: bool = False


class DevelopmentConfig(Config):
    JWT_KEY: SecretStr = SecretStr("dev-key-minimum-32-characters-long")
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///database/dev.db")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DEBUG: bool = True


class TestingConfig(Config):
    JWT_KEY: SecretStr = SecretStr("test-key-minimum-32-characters-long")
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///database/test.db")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    TESTING: bool = True


class ProductionConfig(Config):
    pass


_config: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config() -> Config:
    env: str = os.environ.get("FASTAPI_ENV", "development")
    if env not in _config:
        raise SystemExit(
            f"[config] FASTAPI_ENV must be in {list(_config.keys())}, got '{env}'"
        )
    cls = _config[env]
    return cls.model_validate({})
