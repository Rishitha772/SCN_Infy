from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.constants import COLLABORATION_TYPE_MAX_LENGTH
from app.schemas.base import ResponseBase, validate_unique_ids


class CollaborationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    researcher_ids: list[int] = Field(..., min_length=2)
    collaboration_type: str | None = Field(
        default=None, min_length=1, max_length=COLLABORATION_TYPE_MAX_LENGTH
    )

    @model_validator(mode="after")
    def validate_researchers(self) -> Self:
        message = "A researcher cannot collaborate with themselves"
        validate_unique_ids(self.researcher_ids, message)
        return self


class CollaborationUpdateRequest(BaseModel):
    collaboration_type: str | None = Field(
        default=None, min_length=1, max_length=COLLABORATION_TYPE_MAX_LENGTH
    )
    collaboration_count: int | None = Field(default=None, ge=1)


class CollaborationResponse(ResponseBase):
    collaboration_id: int
    researcher_ids: list[int]
    collaboration_type: str | None
    collaboration_count: int
    created_at: datetime
