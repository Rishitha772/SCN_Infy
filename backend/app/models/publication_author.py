from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core import Base


class PublicationAuthor(Base):
    __tablename__: str = "publication_authors"

    publication_id: Mapped[int] = mapped_column(
        ForeignKey("publications.publication_id", ondelete="CASCADE"), primary_key=True
    )
    researcher_id: Mapped[int] = mapped_column(
        ForeignKey("researchers.researcher_id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    author_order: Mapped[int] = mapped_column(nullable=False, default=1)
    is_corresponding: Mapped[bool] = mapped_column(nullable=False, default=False)

    def __repr__(self) -> str:
        return (
            f"<PublicationAuthor("
            f"publication={self.publication_id}, "
            f"researcher={self.researcher_id}, "
            f"order={self.author_order})>"
        )
