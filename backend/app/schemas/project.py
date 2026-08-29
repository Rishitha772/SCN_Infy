from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.constants import PROJECT_NAME_MAX_LENGTH, ProjectRole, ProjectStatus
from app.schemas.base import ResponseBase, validate_dates


# -- Core Model --
class ProjectDatesMixin(BaseModel):
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        validate_dates(self.start_date, self.end_date)
        return self


# -- Requests --
class ProjectRequest(ProjectDatesMixin):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=5, max_length=PROJECT_NAME_MAX_LENGTH)
    description: str | None = None
    researcher_ids: list[int] = Field(default_factory=list)


class ProjectUpdateRequest(ProjectDatesMixin):
    name: str | None = Field(
        default=None, min_length=5, max_length=PROJECT_NAME_MAX_LENGTH
    )
    description: str | None = None
    status: ProjectStatus | None = None
    researcher_ids: list[int] | None = None


class ProjectMemberRequest(BaseModel):
    researcher_id: int
    role: ProjectRole = ProjectRole.MEMBER


# -- Response --
class ProjectResponse(ResponseBase):
    project_id: int
    name: str
    description: str | None
    start_date: date | None
    end_date: date | None
    status: ProjectStatus
    created_at: datetime
