import logging

from fastapi import HTTPException
from sqlalchemy import ScalarResult, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conference
from app.schemas import (
    ConferenceRequest,
    ConferenceResponse,
    ConferenceUpdateRequest,
)

logger: logging.Logger = logging.getLogger(__name__)


class ConferenceService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_all(self) -> list[ConferenceResponse]:
        result: ScalarResult[Conference] = await self.session.scalars(
            select(Conference)
        )
        return [ConferenceResponse.from_orm(c) for c in result.all()]

    async def get_by_id(self, conference_id: int) -> ConferenceResponse:
        conference: Conference = await self._get_by_id(conference_id)
        return ConferenceResponse.from_orm(conference)

    async def create(self, data: ConferenceRequest) -> ConferenceResponse:
        conference = Conference(
            name=data.name,
            description=data.description,
            location=data.location,
            start_date=data.start_date,
            end_date=data.end_date,
            website=str(data.website) if data.website else None,
        )
        self.session.add(conference)
        await self.session.commit()
        logger.info("conference created: %d", conference.conference_id)
        return ConferenceResponse.from_orm(conference)

    async def update(
        self, conference_id: int, data: ConferenceUpdateRequest
    ) -> ConferenceResponse:
        conference: Conference = await self._get_by_id(conference_id)
        updates = data.model_dump(exclude_none=True)
        if "website" in updates:
            updates["website"] = str(updates["website"])
        for key, val in updates.items():
            setattr(conference, key, val)
        await self.session.commit()
        logger.info("conference updated: %d", conference_id)
        return ConferenceResponse.from_orm(conference)

    async def delete(self, conference_id: int) -> None:
        conference: Conference = await self._get_by_id(conference_id)
        await self.session.delete(conference)
        await self.session.commit()
        logger.info("conference deleted: %d", conference_id)

    async def _get_by_id(self, conference_id: int) -> Conference:
        conference: Conference | None = await self.session.get(
            Conference, conference_id
        )
        if not conference:
            raise HTTPException(status_code=404, detail="conference not found")
        return conference
