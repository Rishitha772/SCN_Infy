import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import TOTP_INTERVAL, TokenType, UserStatus, VerificationPurpose
from app.core.security import hash_password
from app.models import RevokedToken, User
from app.schemas import (
    EmailChangeRequest,
    MessageResponse,
    TokenPayload,
    TokenResponse,
    UserRequest,
    VerificationCodeRequest,
)
from app.services.token import TokenService
from app.services.user import UserService
from app.services.verification_code import VerificationCodeService

logger: logging.Logger = logging.getLogger(__name__)


class AuthService:
    def __init__(
        self,
        token_service: TokenService,
        verification_code_service: VerificationCodeService,
    ) -> None:
        self.token_service: TokenService = token_service
        self.verification_code_service: VerificationCodeService = (
            verification_code_service
        )

    async def register(
        self, credentials: UserRequest, user_service: UserService
    ) -> MessageResponse:
        existing: User | None = await user_service.get_by_email(credentials.email)
        if existing:
            if not existing.is_verified:
                return await self._resend_verification_code(existing)
            raise HTTPException(status_code=409, detail="user already exists")
        new_user: User = await self._create_user(credentials, user_service)
        await self._verification_process(
            new_user, new_user.email, VerificationPurpose.REGISTER
        )
        return MessageResponse(message="verification code sent to your email")

    async def verify_email(
        self, data: VerificationCodeRequest, user_service: UserService
    ) -> MessageResponse:
        user: User | None = await user_service.get_by_email(data.email)
        if not user:
            raise HTTPException(status_code=404, detail="user not found")
        if user.status in (UserStatus.BANNED, UserStatus.REJECTED):
            raise HTTPException(
                status_code=403, detail="account is not eligible for verification"
            )
        if user.is_verified:
            raise HTTPException(status_code=400, detail="user is already verified")
        await self.verification_code_service.verify_code(
            user.user_id, data.code, VerificationPurpose.REGISTER
        )
        user.is_verified = True
        await user_service.session.commit()
        logger.info("email verified: %d", user.user_id)
        return MessageResponse(message="email verified - awaiting admin approval")

    async def login(
        self, credentials: UserRequest, user_service: UserService
    ) -> MessageResponse:
        user: User | None = await user_service.get_by_email(credentials.email)
        if not user or not user.check_password(credentials.password):
            raise HTTPException(status_code=401, detail="invalid email or password")
        self._validate_user_status(user)
        await self._verification_process(user, user.email, VerificationPurpose.LOGIN)
        return MessageResponse(message="verification code sent to your email")

    async def verify_login_code(
        self, data: VerificationCodeRequest, user_service: UserService
    ) -> TokenResponse:
        user: User | None = await user_service.get_by_email(data.email)
        if not user:
            raise HTTPException(status_code=404, detail="user not found")
        self._validate_user_status(user)
        await self.verification_code_service.verify_code(
            user.user_id, data.code, VerificationPurpose.LOGIN
        )
        logger.info("login successful: %d", user.user_id)
        return TokenResponse(
            access_token=self.token_service.create_access_token(user.email),
            refresh_token=self.token_service.create_refresh_token(user.email),
            token_type=TokenType.BEARER,
        )

    async def logout(self, refresh_token: str, session: AsyncSession) -> None:
        payload: TokenPayload = self.token_service.decode_token(refresh_token)
        if payload.token_type != TokenType.REFRESH:
            raise HTTPException(status_code=400, detail="invalid refresh token")
        await self._revoke_token(refresh_token, session)

    async def refresh(
        self, refresh_token: str, user_service: UserService, session: AsyncSession
    ) -> TokenResponse:
        payload: TokenPayload = self.token_service.decode_token(refresh_token)
        if payload.token_type != TokenType.REFRESH:
            raise HTTPException(status_code=400, detail="invalid refresh token")
        if await self._is_revoked(refresh_token, session):
            raise HTTPException(
                status_code=401, detail="refresh token has been revoked"
            )
        user: User | None = await user_service.get_by_email(payload.sub)
        if not user:
            raise HTTPException(status_code=401, detail="user not found")
        return TokenResponse(
            access_token=self.token_service.create_access_token(payload.sub),
            token_type=TokenType.BEARER,
        )

    async def request_email_change(
        self, data: EmailChangeRequest, user: User, user_service: UserService
    ) -> MessageResponse:
        existing: User | None = await user_service.get_by_email(data.new_email)
        if existing:
            raise HTTPException(status_code=409, detail="email already in use")
        user.pending_email = data.new_email
        await user_service.session.commit()
        await self._verification_process(
            user, data.new_email, VerificationPurpose.CHANGE_EMAIL
        )
        return MessageResponse(message="verification code sent to new email")

    async def verify_change_email(
        self, data: VerificationCodeRequest, user: User, user_service: UserService
    ) -> MessageResponse:
        if not user.pending_email:
            raise HTTPException(status_code=400, detail="no email change request")
        await self.verification_code_service.verify_code(
            user.user_id, data.code, VerificationPurpose.CHANGE_EMAIL
        )
        user.email = user.pending_email
        user.pending_email = None
        await user_service.session.commit()
        logger.info("email changed for user %d", user.user_id)
        return MessageResponse(message="email updated successfully")

    async def _resend_verification_code(self, user: User) -> MessageResponse:
        if user.status in (UserStatus.BANNED, UserStatus.REJECTED):
            raise HTTPException(
                status_code=403, detail="account is not eligible for verification"
            )
        await self._verification_process(user, user.email, VerificationPurpose.REGISTER)
        return MessageResponse(
            message="account exists but unverified, new verification code sent"
        )

    async def _verification_process(
        self, user: User, target_email: str, purpose: VerificationPurpose
    ) -> None:
        secret, code = self.verification_code_service.generate_code()
        await self.verification_code_service.create_code(
            user.user_id, secret, purpose, TOTP_INTERVAL
        )
        self.verification_code_service.send_code(target_email, code)

    async def _create_user(
        self, credentials: UserRequest, user_service: UserService
    ) -> User:
        user = User(
            email=credentials.email,
            password=hash_password(credentials.password),
            role=credentials.requested_role,
            status=UserStatus.PENDING,
        )
        user_service.session.add(user)
        await user_service.session.commit()
        logger.info("user created: %d", user.user_id)
        return user

    def _validate_user_status(self, user: User) -> None:
        if not user.is_verified:
            raise HTTPException(status_code=403, detail="email not verified")
        if user.status == UserStatus.PENDING:
            raise HTTPException(status_code=403, detail="account pending approval")
        if user.status == UserStatus.REJECTED:
            raise HTTPException(status_code=403, detail="account rejected")
        if user.status == UserStatus.BANNED:
            raise HTTPException(status_code=403, detail="account banned")

    async def _is_revoked(self, token: str, session: AsyncSession) -> bool:
        return (
            await session.scalar(
                select(RevokedToken).where(RevokedToken.token == token)
            )
            is not None
        )

    async def _revoke_token(self, token: str, session: AsyncSession) -> None:
        if not await self._is_revoked(token, session):
            session.add(RevokedToken(token=token))
            await session.commit()
