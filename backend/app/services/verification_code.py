from datetime import UTC, datetime, timedelta

import pyotp
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import TOTP_INTERVAL, VerificationPurpose
from app.core.interfaces import EmailNotifier
from app.models import VerificationCode


class VerificationCodeService:
    def __init__(self, session: AsyncSession, email_notifier: EmailNotifier) -> None:
        self.session: AsyncSession = session
        self.email_notifier: EmailNotifier = email_notifier

    def generate_code(self) -> tuple[str, str]:
        secret: str = pyotp.random_base32()
        code: str = pyotp.TOTP(
            secret, interval=int(TOTP_INTERVAL.total_seconds())
        ).now()
        return secret, code

    def send_code(self, email: str, code: str) -> None:
        self.email_notifier.send_verification_email(email, code)

    async def create_code(
        self,
        user_id: int,
        secret: str,
        purpose: VerificationPurpose,
        expires_in: timedelta = TOTP_INTERVAL,
    ) -> None:
        existing: VerificationCode | None = await self.session.scalar(
            select(VerificationCode).where(
                VerificationCode.user_id == user_id,
                VerificationCode.purpose == purpose,
                VerificationCode.expires_at > datetime.now(UTC),
            )
        )
        if existing:
            await self.session.delete(existing)
            await self.session.flush()
        verification_code = VerificationCode(
            user_id=user_id,
            secret=secret,
            purpose=purpose,
            expires_at=datetime.now(UTC) + expires_in,
        )
        self.session.add(verification_code)
        await self.session.commit()

    async def verify_code(
        self, user_id: int, code: str, purpose: VerificationPurpose
    ) -> None:
        verification_code: VerificationCode | None = await self.session.scalar(
            select(VerificationCode).where(
                VerificationCode.user_id == user_id,
                VerificationCode.purpose == purpose,
                VerificationCode.expires_at > datetime.now(UTC),
            )
        )
        if not verification_code:
            raise HTTPException(status_code=404, detail="invalid or expired code")
        totp = pyotp.TOTP(
            verification_code.secret, interval=int(TOTP_INTERVAL.total_seconds())
        )
        if not totp.verify(code, valid_window=1):
            raise HTTPException(status_code=400, detail="invalid or expired code")
        await self.session.delete(verification_code)
        await self.session.commit()
