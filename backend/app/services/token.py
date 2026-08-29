from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import HTTPException

from app.core import Config
from app.core.constants import TokenClaims, TokenType
from app.schemas import TokenPayload


class TokenService:
    def __init__(self, config: Config) -> None:
        self.config: Config = config

    def create_access_token(self, email: str) -> str:
        payload: dict[str, str | datetime] = {
            TokenClaims.SUBJECT: email,
            TokenClaims.TYPE: TokenType.ACCESS,
            TokenClaims.EXPIRY: datetime.now(UTC)
            + timedelta(minutes=self.config.ACCESS_TOKEN_EXPIRE_MINUTES),
        }
        return jwt.encode(
            payload=payload,
            key=self.config.JWT_KEY.get_secret_value(),
            algorithm=self.config.ALGORITHM,
        )

    def create_refresh_token(self, email: str) -> str:
        payload: dict[str, str | datetime] = {
            TokenClaims.SUBJECT: email,
            TokenClaims.TYPE: TokenType.REFRESH,
            TokenClaims.EXPIRY: datetime.now(UTC)
            + timedelta(days=self.config.REFRESH_TOKEN_EXPIRE_DAYS),
        }
        return jwt.encode(
            payload=payload,
            key=self.config.JWT_KEY.get_secret_value(),
            algorithm=self.config.ALGORITHM,
        )

    def decode_token(self, token: str) -> TokenPayload:
        try:
            payload: dict[str, Any] = jwt.decode(
                jwt=token,
                key=self.config.JWT_KEY.get_secret_value(),
                algorithms=[self.config.ALGORITHM],
            )
            return TokenPayload(**payload)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="invalid token")
