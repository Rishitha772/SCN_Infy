from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import Base
from app.core.constants import (
    DEPARTMENT_MAX_LENGTH,
    ORCID_MAX_LENGTH,
    USERNAME_MAX_LENGTH,
)

if TYPE_CHECKING:
    from app.models.collaboration import Collaboration
    from app.models.institution import Institution
    from app.models.project import Project
    from app.models.publication import Publication
    from app.models.user import User


class Researcher(Base):
    __tablename__: str = "researchers"

    researcher_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"), unique=True, nullable=False
    )
    institution_id: Mapped[int | None] = mapped_column(
        ForeignKey("institutions.institution_id"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(USERNAME_MAX_LENGTH), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    department: Mapped[str | None] = mapped_column(
        String(DEPARTMENT_MAX_LENGTH), nullable=True
    )
    orcid: Mapped[str | None] = mapped_column(
        String(ORCID_MAX_LENGTH), unique=True, nullable=True
    )
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    research_interests: Mapped[list[str]] = mapped_column(JSON, default=list)

    user: Mapped[User] = relationship("User", back_populates="researcher")
    institution: Mapped[Institution | None] = relationship(
        "Institution", back_populates="researchers"
    )
    publications: Mapped[list[Publication]] = relationship(
        "Publication",
        secondary="publication_authors",
        back_populates="authors",
    )
    projects: Mapped[list[Project]] = relationship(
        "Project", secondary="project_researchers", back_populates="researchers"
    )
    collaborations: Mapped[list[Collaboration]] = relationship(
        "Collaboration",
        secondary="collaboration_researchers",
        back_populates="researchers",
    )

    def __repr__(self) -> str:
        return f"<Researcher(name={self.name}, department={self.department})>"
