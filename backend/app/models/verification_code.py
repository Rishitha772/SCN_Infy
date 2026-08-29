from datetime import datetime

from pydantic import SecretStr
from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core import Base
from app.core.constants import VerificationPurpose


class VerificationCode(Base):
    __tablename__: str = "verification_codes"

    code_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"), nullable=False, index=True
    )
    secret: Mapped[str] = mapped_column(String(32), nullable=False)
    purpose: Mapped[VerificationPurpose] = mapped_column(
        Enum(VerificationPurpose), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
