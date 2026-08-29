from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import Base
from app.core.constants import (
    DOI_MAX_LENGTH,
    TITLE_MAX_LENGTH,
    PublicationStatus,
    PublicationType,
)

if TYPE_CHECKING:
    from app.models.citation import Citation
    from app.models.conference import Conference
    from app.models.researcher import Researcher


class Publication(Base):
    __tablename__: str = "publications"

    publication_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), nullable=False)
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)
    doi: Mapped[str | None] = mapped_column(
        String(DOI_MAX_LENGTH), unique=True, nullable=True, index=True
    )
    publication_type: Mapped[PublicationType] = mapped_column(
        Enum(PublicationType), nullable=False, default=PublicationType.JOURNAL
    )
    status: Mapped[PublicationStatus] = mapped_column(
        Enum(PublicationStatus),
        nullable=False,
        default=PublicationStatus.DRAFT,
        index=True,
    )
    file_path: Mapped[str | None] = mapped_column(String, nullable=True)
    publication_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    conference_id: Mapped[int | None] = mapped_column(
        ForeignKey("conferences.conference_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    external_authors: Mapped[list[str]] = mapped_column(
        JSON, default=list, nullable=False
    )

    conference: Mapped[Conference | None] = relationship(
        "Conference", back_populates="publications"
    )
    authors: Mapped[list[Researcher]] = relationship(
        "Researcher", secondary="publication_authors", back_populates="publications"
    )
    citations_made: Mapped[list[Citation]] = relationship(
        "Citation",
        foreign_keys="Citation.citing_publication_id",
        back_populates="citing_publication",
    )
    citations_received: Mapped[list[Citation]] = relationship(
        "Citation",
        foreign_keys="Citation.cited_publication_id",
        back_populates="cited_publication",
    )

    def __repr__(self) -> str:
        return f"<Publication(title={self.title}, status={self.status})>"
