from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import SecretStr
from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import Base
from app.core.constants import UserRole, UserStatus
from app.core.security import verify_password

if TYPE_CHECKING:
    from app.models.researcher import Researcher


class User(Base):
    __tablename__: str = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.RESEARCHER, nullable=False, index=True
    )
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False, index=True)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus), default=UserStatus.PENDING, nullable=False, index=True
    )
    pending_email: Mapped[str | None] = mapped_column(String, nullable=True)
    requested_role: Mapped[UserRole | None] = mapped_column(
        Enum(UserRole), nullable=True
    )

    researcher: Mapped[Researcher | None] = relationship(
        "Researcher", back_populates="user", uselist=False
    )

    def check_password(self, plain_password: SecretStr) -> bool:
        return verify_password(plain_password, self.password)

    def __repr__(self) -> str:
        return f"<User(email={self.user_id}, role={self.role}, status={self.status})>"
