import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.engine.result import ScalarResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Researcher, User
from app.schemas import (
    ResearcherRequest,
    ResearcherResponse,
    ResearcherUpdateRequest,
)

logger: logging.Logger = logging.getLogger(__name__)


class ResearcherService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_by_id(self, researcher_id: int) -> ResearcherResponse:
        logger.debug("fetching researcher by id: %d", researcher_id)
        researcher: Researcher | None = await self.session.scalar(
            select(Researcher).where(Researcher.researcher_id == researcher_id)
        )
        if not researcher:
            raise HTTPException(status_code=404, detail="researcher not found")
        return ResearcherResponse.from_orm(researcher)

    async def get_by_user_id(self, user_id: int) -> Researcher | None:
        logger.debug("fetching researcher by user_id: %d", user_id)
        return await self.session.scalar(
            select(Researcher).where(Researcher.user_id == user_id)
        )

    async def get_all(self) -> list[ResearcherResponse]:
        logger.debug("fetching all researchers")
        result: ScalarResult[Researcher] = await self.session.scalars(
            select(Researcher)
        )
        return [ResearcherResponse.from_orm(r) for r in result.all()]

    async def create(self, data: ResearcherRequest, user: User) -> ResearcherResponse:
        existing: Researcher | None = await self.get_by_user_id(user.user_id)
        if existing:
            raise HTTPException(
                status_code=409,
                detail="researcher profile already exists",
            )
        researcher = Researcher(
            user_id=user.user_id,
            name=data.name,
            bio=data.bio,
            department=data.department,
            orcid=data.orcid,
            skills=data.skills,
            research_interests=data.research_interests,
            institution_id=data.institution_id,
        )
        self.session.add(researcher)
        await self.session.commit()
        logger.info("researcher profile created for user: %d", user.user_id)
        return ResearcherResponse.from_orm(researcher)

    async def update(
        self, data: ResearcherUpdateRequest, user: User
    ) -> ResearcherResponse:
        researcher: Researcher | None = await self.get_by_user_id(user.user_id)
        if not researcher:
            raise HTTPException(status_code=404, detail="researcher profile not found")
        updates = data.model_dump(exclude_none=True)
        for key, val in updates.items():
            setattr(researcher, key, val)
        await self.session.commit()
        logger.info("researcher profile updated for user: %d", user.user_id)
        return ResearcherResponse.from_orm(researcher)

    async def delete(self, user: User) -> None:
        researcher: Researcher | None = await self.get_by_user_id(user.user_id)
        if not researcher:
            raise HTTPException(status_code=404, detail="researcher profile not found")
        await self.session.delete(researcher)
        await self.session.commit()
        logger.info("researcher profile deleted for user: %d", user.user_id)
