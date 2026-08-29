from app.models import User
from app.schemas import UserResponse, UserUpdateRequest
from app.services import UserService
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import make_user


# Email
async def test_get_by_email_found(session: AsyncSession) -> None:
    EMAIL = "found@mit.edu"
    user: User = await make_user(session, email=EMAIL)
    user_service = UserService(session)
    result: User | None = await user_service.get_by_email(EMAIL)
    assert result is not None
    assert result.email == user.email


# Update password
async def test_update_password(session: AsyncSession) -> None:
    NEW_PASSWORD = "newpassword123"
    user: User = await make_user(session, email="password_update@mit.edu")
    old_hash: str = user.password
    user_service = UserService(session)
    req = UserUpdateRequest(password=SecretStr(NEW_PASSWORD))
    result: UserResponse = await user_service.update(req, user)
    assert result.email == user.email
    assert user.password != old_hash
    assert user.password != NEW_PASSWORD


async def test_delete_user(session: AsyncSession) -> None:
    EMAIL = "todelete@mit.edu"
    user: User = await make_user(session, email=EMAIL)
    user_service = UserService(session)
    await user_service.delete(user)
    deleted: User | None = await user_service.get_by_email(EMAIL)
    assert deleted is None
