from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import Base
from app.core.constants import PROJECT_NAME_MAX_LENGTH, ProjectStatus

if TYPE_CHECKING:
    from app.models.researcher import Researcher


class Project(Base):
    __tablename__: str = "projects"

    project_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(PROJECT_NAME_MAX_LENGTH), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False, index=True
    )

    researchers: Mapped[list[Researcher]] = relationship(
        "Researcher", secondary="project_researchers", back_populates="projects"
    )

    def __repr__(self) -> str:
        return f"<Project(id={self.project_id}, name={self.name})>"
