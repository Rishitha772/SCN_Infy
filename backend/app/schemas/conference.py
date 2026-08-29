from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

from app.core.constants import CONFERENCE_NAME_MAX_LENGTH, LOCATION_MAX_LENGTH
from app.schemas.base import ResponseBase, validate_dates


# -- Core Model
class ConferenceMixin(BaseModel):
    description: str | None = None
    location: str | None = Field(
        default=None, min_length=5, max_length=LOCATION_MAX_LENGTH
    )
    start_date: date | None = None
    end_date: date | None = None
    website: HttpUrl | None = None

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        validate_dates(self.start_date, self.end_date)
        return self


# -- Requests
class ConferenceRequest(ConferenceMixin):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=5, max_length=CONFERENCE_NAME_MAX_LENGTH)


class ConferenceUpdateRequest(ConferenceMixin):
    name: str | None = Field(
        default=None, min_length=5, max_length=CONFERENCE_NAME_MAX_LENGTH
    )


# -- Response --
class ConferenceResponse(ResponseBase):
    conference_id: int
    name: str
    description: str | None
    location: str | None
    start_date: date | None
    end_date: date | None
    created_at: datetime
    website: HttpUrl | None
