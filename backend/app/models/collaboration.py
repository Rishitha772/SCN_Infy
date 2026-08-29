from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import Base
from app.core.constants import COLLABORATION_TYPE_MAX_LENGTH

if TYPE_CHECKING:
    from app.models.researcher import Researcher


class Collaboration(Base):
    __tablename__: str = "collaborations"

    collaboration_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    collaboration_type: Mapped[str | None] = mapped_column(
        String(COLLABORATION_TYPE_MAX_LENGTH), nullable=True, index=True
    )
    collaboration_count: Mapped[int] = mapped_column(default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    researchers: Mapped[list[Researcher]] = relationship(
        "Researcher",
        secondary="collaboration_researchers",
        back_populates="collaborations",
    )

    def __repr__(self) -> str:
        return f"<Collaboration(id={self.collaboration_id}, type={self.collaboration_type})>"
