from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import USERNAME_MAX_LENGTH
from app.schemas.base import ResponseBase


class ResearcherBase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    bio: str | None = None
    department: str | None = None
    orcid: str | None = None
    institution_id: int | None = None


class ResearcherRequest(ResearcherBase):
    name: str = Field(min_length=5, max_length=USERNAME_MAX_LENGTH)
    skills: list[str] = Field(default_factory=list)
    research_interests: list[str] = Field(default_factory=list)


class ResearcherUpdateRequest(ResearcherBase):
    name: str | None = Field(
        default=None, min_length=5, max_length=USERNAME_MAX_LENGTH
    )
    skills: list[str] | None = None
    research_interests: list[str] | None = None


class ResearcherResponse(ResponseBase):
    researcher_id: int
    user_id: int
    name: str
    bio: str | None
    department: str | None
    orcid: str | None
    skills: list[str]
    research_interests: list[str]
    institution_id: int | None
