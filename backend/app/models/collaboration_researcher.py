from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core import Base


class CollaborationResearcher(Base):
    __tablename__: str = "collaboration_researchers"

    collaboration_id: Mapped[int] = mapped_column(
        ForeignKey("collaborations.collaboration_id", ondelete="CASCADE"),
        primary_key=True,
    )
    researcher_id: Mapped[int] = mapped_column(
        ForeignKey("researchers.researcher_id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
