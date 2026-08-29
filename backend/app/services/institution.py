import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.engine.result import ScalarResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Institution
from app.schemas import (
    InstitutionRequest,
    InstitutionResponse,
    InstitutionUpdateRequest,
)

logger: logging.Logger = logging.getLogger(__name__)


class InstitutionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_all(self) -> list[InstitutionResponse]:
        logger.info("fetching all institutions")
        institutions: ScalarResult[Institution] = await self.session.scalars(
            select(Institution)
        )
        return [
            InstitutionResponse.from_orm(institution) for institution in institutions
        ]

    async def get_institution(self, institution_id: int) -> InstitutionResponse:
        institution: Institution = await self._get_by_id(institution_id)
        return InstitutionResponse.from_orm(institution)

    async def create(self, data: InstitutionRequest) -> InstitutionResponse:
        existing: Institution | None = await self.session.scalar(
            select(Institution).where(Institution.name == data.name)
        )
        if existing:
            logger.warning("institution already exists: %s", data.name)
            raise HTTPException(status_code=409, detail="institution already exists")
        institution = Institution(
            name=data.name,
            city=data.city,
            country=data.country,
            type=data.type,
            website=str(data.website) if data.website else None,
        )
        self.session.add(institution)
        await self.session.commit()
        logger.info("institution created: %d", institution.institution_id)
        return InstitutionResponse.from_orm(institution)

    async def update(
        self, institution_id: int, data: InstitutionUpdateRequest
    ) -> InstitutionResponse:
        institution: Institution = await self._get_by_id(institution_id)
        updates = data.model_dump(exclude_none=True)
        for key, val in updates.items():
            setattr(institution, key, val)
        await self.session.commit()
        logger.info("institution updated: %d", institution_id)
        return InstitutionResponse.from_orm(institution)

    async def delete(self, institution_id: int) -> None:
        institution: Institution = await self._get_by_id(institution_id)
        await self.session.delete(institution)
        await self.session.commit()
        logger.info("institution deleted: %d", institution_id)

    async def _get_by_id(self, institution_id: int) -> Institution:
        logger.info("fetching institution: %d", institution_id)
        institution: Institution | None = await self.session.get(
            Institution, institution_id
        )
        if not institution:
            raise HTTPException(status_code=404, detail="institution not found")
        return institution
