from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.core.constants import LOCATION_MAX_LENGTH, InstitutionType
from app.schemas.base import ResponseBase


class InstitutionBase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    website: HttpUrl | None = Field(default=None)


class InstitutionRequest(InstitutionBase):
    name: str
    city: str | None = Field(max_length=LOCATION_MAX_LENGTH)
    country: str = Field(max_length=LOCATION_MAX_LENGTH)
    type: InstitutionType = Field(default=InstitutionType.UNIVERSITY)


class InstitutionUpdateRequest(InstitutionBase):
    name: str | None = Field(default=None)
    city: str | None = Field(default=None, max_length=LOCATION_MAX_LENGTH)
    country: str | None = Field(default=None, max_length=LOCATION_MAX_LENGTH)
    type: InstitutionType | None = Field(default=None)


class InstitutionResponse(ResponseBase):
    institution_id: int
    name: str
    city: str
    country: str
    type: InstitutionType
    website: HttpUrl | None
