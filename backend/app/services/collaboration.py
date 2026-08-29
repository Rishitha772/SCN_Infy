import logging

from fastapi import HTTPException
from sqlalchemy import ScalarResult, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Collaboration, CollaborationResearcher, Researcher
from app.schemas import CollaborationRequest, CollaborationResponse

logger: logging.Logger = logging.getLogger(__name__)


class CollaborationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_all(self) -> list[CollaborationResponse]:
        logger.debug("fetching all collaborations")
        result: ScalarResult[Collaboration] = await self.session.scalars(
            select(Collaboration)
        )
        return [CollaborationResponse.from_orm(c) for c in result.all()]

    async def get_by_researcher(
        self, researcher_id: int
    ) -> list[CollaborationResponse]:
        logger.debug("fetching collaborations for researcher: %d", researcher_id)
        result: ScalarResult[Collaboration] = await self.session.scalars(
            select(Collaboration)
            .join(CollaborationResearcher)
            .where(CollaborationResearcher.researcher_id == researcher_id)
        )
        return [CollaborationResponse.from_orm(c) for c in result.all()]

    async def create(self, data: CollaborationRequest) -> CollaborationResponse:
        logger.debug("creating collaboration for researchers: %s", data.researcher_ids)
        for researcher_id in data.researcher_ids:
            await self._get_researcher(researcher_id)

        existing: Collaboration | None = await self._find_existing(data.researcher_ids)
        if existing:
            # increment count rather than reject
            existing.collaboration_count += 1
            await self.session.commit()
            logger.info(
                "collaboration count incremented: %d", existing.collaboration_id
            )
            return CollaborationResponse.from_orm(existing)

        collaboration = Collaboration(collaboration_type=data.collaboration_type)
        self.session.add(collaboration)
        await self.session.flush()

        for researcher_id in data.researcher_ids:
            member = CollaborationResearcher(
                collaboration_id=collaboration.collaboration_id,
                researcher_id=researcher_id,
            )
            self.session.add(member)

        await self.session.commit()
        logger.info("collaboration created: %d", collaboration.collaboration_id)
        return CollaborationResponse.from_orm(collaboration)

    async def delete(self, collaboration_id: int) -> None:
        collaboration: Collaboration | None = await self.session.get(
            Collaboration, collaboration_id
        )
        if not collaboration:
            raise HTTPException(status_code=404, detail="collaboration not found")
        await self.session.delete(collaboration)
        await self.session.commit()
        logger.warning("collaboration deleted: %d", collaboration_id)

    async def _get_researcher(self, researcher_id: int) -> Researcher:
        researcher: Researcher | None = await self.session.get(
            Researcher, researcher_id
        )
        if not researcher:
            raise HTTPException(
                status_code=404,
                detail=f"researcher {researcher_id} not found",
            )
        return researcher

    async def _find_existing(self, researcher_ids: list[int]) -> Collaboration | None:
        # find a collaboration that contains ALL the given researchers
        # start with collaborations containing first researcher
        result: ScalarResult[Collaboration] = await self.session.scalars(
            select(Collaboration)
            .join(CollaborationResearcher)
            .where(CollaborationResearcher.researcher_id == researcher_ids[0])
        )
        for collab in result.all():
            members: ScalarResult[int] = await self.session.scalars(
                select(CollaborationResearcher.researcher_id).where(
                    CollaborationResearcher.collaboration_id == collab.collaboration_id
                )
            )
            if set(members.all()) == set(researcher_ids):
                return collab
        return None
