from datetime import date

from pydantic import BaseModel, ConfigDict

from app.core.constants import PublicationStatus, PublicationType


class PublicationReportFilter(BaseModel):
    model_config = ConfigDict(extra="forbid")
    researcher_id: int | None = None
    institution_id: int | None = None
    publication_type: PublicationType | None = None
    status: PublicationStatus | None = None
    from_date: date | None = None
    to_date: date | None = None


class CollaborationReportFilter(BaseModel):
    model_config = ConfigDict(extra="forbid")
    researcher_id: int | None = None
    institution_id: int | None = None
    from_date: date | None = None
    to_date: date | None = None
