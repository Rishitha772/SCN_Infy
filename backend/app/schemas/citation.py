from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.base import ResponseBase, validate_unique_ids


class CitationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    citing_publication_id: int  # the paper doing the citing
    cited_publication_ids: list[int] = Field(min_length=1)  # papers being cited

    @model_validator(mode="after")
    def check_not_self_citation(self) -> Self:
        if self.citing_publication_id in self.cited_publication_ids:
            raise ValueError("a publication cannot cite itself")
        validate_unique_ids(
            self.cited_publication_ids,
            "duplicate cited publication IDs not allowed",
        )
        return self


class CitationResponse(ResponseBase):
    citation_id: int
    citing_publication_id: int
    cited_publication_id: int
    created_at: datetime
