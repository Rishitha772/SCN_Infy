from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import Base

if TYPE_CHECKING:
    from app.models.publication import Publication


class Citation(Base):
    __tablename__: str = "citations"

    citation_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    citing_publication_id: Mapped[int] = mapped_column(
        ForeignKey("publications.publication_id", ondelete="CASCADE"),
        nullable=False,
    )
    cited_publication_id: Mapped[int] = mapped_column(
        ForeignKey("publications.publication_id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    citing_publication: Mapped[Publication] = relationship(
        "Publication",
        foreign_keys=[citing_publication_id],
        back_populates="citations_made",
    )
    cited_publication: Mapped[Publication] = relationship(
        "Publication",
        foreign_keys=[cited_publication_id],
        back_populates="citations_received",
    )

    __table_args__ = (
        UniqueConstraint(
            "citing_publication_id",
            "cited_publication_id",
            name="uq_publication_citation",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Citation("
            f"id={self.citation_id}, "
            f"citing={self.citing_publication_id}, "
            f"cited={self.cited_publication_id}"
            f")>"
        )
