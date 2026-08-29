from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import (
    DOI_MAX_LENGTH,
    TITLE_MAX_LENGTH,
    PublicationStatus,
    PublicationType,
)
from app.schemas.base import ResponseBase


class PublicationBase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    abstract: str | None = None
    doi: str | None = Field(default=None, max_length=DOI_MAX_LENGTH)
    publication_date: date | None = None
    conference_id: int | None = None


class PublicationRequest(PublicationBase):
    title: str = Field(min_length=5, max_length=TITLE_MAX_LENGTH)
    publication_type: PublicationType = PublicationType.JOURNAL
    status: PublicationStatus = PublicationStatus.DRAFT
    researcher_ids: list[int] = Field(default_factory=list)
    external_authors: list[str] = Field(default_factory=list)


class PublicationUpdateRequest(PublicationBase):
    title: str | None = Field(
        default=None,
        min_length=5,
        max_length=TITLE_MAX_LENGTH,
    )
    publication_type: PublicationType | None = None
    status: PublicationStatus | None = None
    researcher_ids: list[int] | None = None
    external_authors: list[str] | None = None


# class PublicationAuthorRequest(BaseModel):
#     researcher_id: int
#     author_order: int = Field(default=1, ge=1)
#     is_corresponding: bool = False


class PublicationResponse(ResponseBase):
    publication_id: int
    title: str
    abstract: str | None
    doi: str | None
    publication_type: str
    status: str
    file_path: str | None
    publication_date: date | None
    conference_id: int | None
    external_authors: list[str] | None = None
    created_at: datetime
    updated_at: datetime
