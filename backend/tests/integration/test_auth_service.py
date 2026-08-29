from app.models import User
from app.schemas import EmailChangeRequest, MessageResponse
from app.services import (
    AuthService,
    TokenService,
    UserService,
    VerificationCodeService,
)
from app.utils import ConsoleEmailNotifier
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import config, make_user


# Update email
async def test_update_email(session: AsyncSession, mock_verification_code: str) -> None:
    CURRENT_EMAIL = "current_email@mit.edu"
    NEW_EMAIL = "new_email@ox.ac.uk"
    user: User = await make_user(session, email=CURRENT_EMAIL)
    notifier = ConsoleEmailNotifier()
    verification_code_service = VerificationCodeService(session, notifier)
    auth_service = AuthService(TokenService(config=config), verification_code_service)
    user_service = UserService(session)
    req = EmailChangeRequest(new_email=NEW_EMAIL)
    result: MessageResponse = await auth_service.request_email_change(
        req, user, user_service
    )
    assert isinstance(result, MessageResponse)
    assert "verification" in result.message.lower()
    assert user.pending_email == NEW_EMAIL
    assert user.email == CURRENT_EMAIL
