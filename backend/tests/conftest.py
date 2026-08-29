import os
import uuid
from collections.abc import AsyncGenerator, Generator
from typing import Any, Literal
from unittest.mock import patch

# must be set before any app import - controls which Config class loads
os.environ["FASTAPI_ENV"] = "testing"

import pytest
from app.core import Base, Config, get_config, get_db
from app.core import domains as domains_module
from app.core.constants import UserRole, UserStatus
from app.core.security import hash_password
from app.models import Institution, Researcher, User
from app.services import AuthService, TokenService, UserService, VerificationCodeService
from app.utils import ConsoleEmailNotifier
from httpx import ASGITransport, AsyncClient
from main import app
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.engine import AsyncEngine
from sqlalchemy.pool import StaticPool

from tests.data_for_test import TEST_DOMAINS

config: Config = get_config()

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
KNOWN_VERIFICATION_CODE = "123456"


# Inject test domains
@pytest.fixture(scope="session", autouse=True)
def inject_test_domains() -> None:
    """Bypass HTTP fetch — inject known domains directly into module state."""
    domains_module.research_domains = set(TEST_DOMAINS)
    domains_module.domains_loaded = True


# Engine
@pytest.fixture(scope="session")
def engine() -> AsyncEngine:
    return create_async_engine(
        TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )


@pytest.fixture(scope="session", autouse=True)
async def create_tables(engine: AsyncEngine) -> AsyncGenerator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(autouse=True)
async def clean_tables(engine: AsyncEngine) -> AsyncGenerator[None, Any]:
    yield
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


# Session - rolled back after every test
@pytest.fixture
async def session(engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
        engine, expire_on_commit=False
    )
    async with factory() as sess:
        yield sess
        await sess.rollback()


# Verification code mock - patches generate_code to return KNOWN_VERIFICATION_CODE
@pytest.fixture
def mock_verification_code() -> Generator[Literal["123456"], Any, None]:
    """
    Patches VerificationService.generate_code to return KNOWN_VERIFICATION_CODE.
    Also patches send_code so no console output / email attempt.
    """
    with (
        patch(
            "app.services.verification_code.VerificationCodeService.generate_code",
            return_value=("dummysecret", KNOWN_VERIFICATION_CODE),
        ),
        patch(
            "app.services.verification_code.VerificationCodeService.send_code",
        ),
        patch("pyotp.TOTP.verify", return_value=True),
    ):
        yield KNOWN_VERIFICATION_CODE


# HTTP client
@pytest.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c
    app.dependency_overrides.clear()


# Auth header helper
def auth_headers(user: User) -> dict:
    token: str = TokenService(config).create_access_token(user.email)
    return {"Authorization": f"Bearer {token}"}


# Factories
async def make_user(
    session: AsyncSession,
    email: str | None = None,
    role: UserRole = UserRole.RESEARCHER,
    status: UserStatus = UserStatus.ACTIVE,
    is_verified: bool = True,
) -> User:
    if email is None:
        email = f"user_{uuid.uuid4().hex[:8]}@mit.edu"
    user = User(email=email, password=hash_password(SecretStr("TestPass123")))
    user.role = role
    user.status = status
    user.is_verified = is_verified
    session.add(user)
    await session.commit()
    return user


async def make_admin(session: AsyncSession) -> User:
    return await make_user(session, role=UserRole.SYSTEM_ADMIN)


async def make_institution(session: AsyncSession) -> Institution:
    inst = Institution(name="MIT", country="USA", city="Cambridge")
    session.add(inst)
    await session.commit()
    return inst


async def make_researcher(session: AsyncSession, user: User) -> Researcher:
    researcher = Researcher(
        user_id=user.user_id,
        name="John Smith",
        department="Computer Science",
        skills=["Python", "Web Development"],
        research_interests=["Web"],
    )
    session.add(researcher)
    await session.commit()
    return researcher


# Shared fixtures
@pytest.fixture
async def user_service(session: AsyncSession) -> UserService:
    return UserService(session)


@pytest.fixture
async def auth_service(session: AsyncSession) -> AuthService:
    return AuthService(
        TokenService(config), VerificationCodeService(session, ConsoleEmailNotifier())
    )


@pytest.fixture
async def researcher_user(session: AsyncSession) -> User:
    return await make_user(session)


@pytest.fixture
async def admin_user(session: AsyncSession) -> User:
    return await make_admin(session)


@pytest.fixture
async def institution(session: AsyncSession) -> Institution:
    return await make_institution(session)


@pytest.fixture
async def researcher(session: AsyncSession, researcher_user: User) -> Researcher:
    return await make_researcher(session, researcher_user)
