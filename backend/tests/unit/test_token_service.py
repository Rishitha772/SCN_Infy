from datetime import UTC, datetime, timedelta

import jwt
import pytest
from app.core.constants import TokenType
from app.schemas import TokenPayload
from app.services import TokenService
from fastapi import HTTPException
from tests.conftest import config


@pytest.fixture
def token_service() -> TokenService:
    return TokenService(config)


def test_create_access_token(token_service: TokenService) -> None:
    token: str = token_service.create_access_token("user@mit.edu")
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_refresh_token(token_service: TokenService) -> None:
    token: str = token_service.create_refresh_token("user@mit.edu")
    assert isinstance(token, str)


def test_decode_access_token(token_service: TokenService) -> None:
    token: str = token_service.create_access_token("user@mit.edu")
    payload: TokenPayload = token_service.decode_token(token)
    assert payload.sub == "user@mit.edu"
    assert payload.token_type == TokenType.ACCESS


def test_decode_refresh_token(token_service: TokenService) -> None:
    token: str = token_service.create_refresh_token("user@mit.edu")
    payload: TokenPayload = token_service.decode_token(token)
    assert payload.token_type == TokenType.REFRESH


def test_expired_token_raises(token_service: TokenService) -> None:
    expired: str = jwt.encode(
        {
            "sub": "user@mit.edu",
            "type": "access",
            "exp": datetime.now(UTC) - timedelta(minutes=1),
        },
        token_service.config.JWT_KEY.get_secret_value(),
        algorithm=token_service.config.ALGORITHM,
    )
    with pytest.raises(HTTPException) as exc:
        token_service.decode_token(expired)
    assert exc.value.status_code == 401
    assert "expired" in exc.value.detail


def test_invalid_token_raises(token_service: TokenService) -> None:
    with pytest.raises(HTTPException) as exc:
        token_service.decode_token("not.a.valid.token")
    assert exc.value.status_code == 401


def test_access_and_refresh_tokens_differ(token_service: TokenService) -> None:
    access: str = token_service.create_access_token("user@mit.edu")
    refresh: str = token_service.create_refresh_token("user@mit.edu")
    assert access != refresh


def test_different_emails_produce_different_tokens(token_service: TokenService) -> None:
    token_a: str = token_service.create_access_token("user_a@mit.edu")
    token_b: str = token_service.create_access_token("user_b@mit.edu")
    assert token_a != token_b
