from datetime import date
from typing import Any, Self

from pydantic import BaseModel, ConfigDict


class ResponseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm(cls, obj: Any) -> Self:
        return cls.model_validate(obj)


class MessageResponse(BaseModel):
    message: str


def validate_dates(start_date: date | None, end_date: date | None) -> None:
    if start_date is not None and end_date is not None and end_date < start_date:
        raise ValueError("end_date cannot be before start_date")


def validate_unique_ids(ids: list[int], message: str) -> None:
    if len(set(ids)) != len(ids):
        raise ValueError(message)
