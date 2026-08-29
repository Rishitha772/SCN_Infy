from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import Base
from app.core.constants import CONFERENCE_NAME_MAX_LENGTH, LOCATION_MAX_LENGTH

if TYPE_CHECKING:
    from app.models.publication import Publication


class Conference(Base):
    __tablename__: str = "conferences"

    conference_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(
        String(CONFERENCE_NAME_MAX_LENGTH), nullable=False, index=True
    )
    location: Mapped[str | None] = mapped_column(
        String(LOCATION_MAX_LENGTH), nullable=True
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default= func.now(), nullable=False
    )
    website: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    publications: Mapped[list[Publication]] = relationship(
        "Publication", back_populates="conference"
    )

    def __repr__(self) -> str:
        return f"<Conference(id={self.conference_id}, name={self.name})>"
