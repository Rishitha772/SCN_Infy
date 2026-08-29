from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core import Base
from app.core.constants import ProjectRole


class ProjectResearcher(Base):
    __tablename__: str = "project_researchers"

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.project_id", ondelete="CASCADE"), primary_key=True
    )
    researcher_id: Mapped[int] = mapped_column(
        ForeignKey("researchers.researcher_id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    role: Mapped[ProjectRole] = mapped_column(
        Enum(ProjectRole), default=ProjectRole.MEMBER, nullable=False
    )
