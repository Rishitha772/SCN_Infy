import logging

from fastapi import HTTPException
from sqlalchemy import ScalarResult, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Citation, Publication
from app.schemas import CitationRequest, CitationResponse

logger: logging.Logger = logging.getLogger(__name__)


class CitationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_by_publication(self, publication_id: int) -> list[CitationResponse]:
        result: ScalarResult[Citation] = await self.session.scalars(
            select(Citation).where(Citation.citing_publication_id == publication_id)
        )
        return [CitationResponse.from_orm(c) for c in result.all()]

    async def get_cited_by(self, publication_id: int) -> list[CitationResponse]:
        result: ScalarResult[Citation] = await self.session.scalars(
            select(Citation).where(Citation.cited_publication_id == publication_id)
        )
        return [CitationResponse.from_orm(c) for c in result.all()]

    async def create(self, data: CitationRequest) -> list[CitationResponse]:
        logger.debug(
            "creating %d citations from publication %d",
            len(data.cited_publication_ids),
            data.citing_publication_id,
        )
        await self._get_publication(data.citing_publication_id)

        created: list[Citation] = []
        for cited_id in data.cited_publication_ids:
            await self._get_publication(cited_id)
            existing: Citation | None = await self.session.scalar(
                select(Citation).where(
                    Citation.citing_publication_id == data.citing_publication_id,
                    Citation.cited_publication_id == cited_id,
                )
            )
            if existing:
                raise HTTPException(
                    status_code=409,
                    detail=f"citation {data.citing_publication_id}->{cited_id} already exists",
                )
            citation = Citation(
                citing_publication_id=data.citing_publication_id,
                cited_publication_id=cited_id,
            )
            self.session.add(citation)
            created.append(citation)

        await self.session.commit()
        logger.info("created %d citations", len(created))
        return [CitationResponse.from_orm(c) for c in created]

    async def delete(self, citation_id: int) -> None:
        citation: Citation | None = await self.session.get(Citation, citation_id)
        if not citation:
            raise HTTPException(status_code=404, detail="citation not found")
        await self.session.delete(citation)
        await self.session.commit()
        logger.info("citation deleted: %d", citation_id)

    async def _get_publication(self, publication_id: int) -> Publication:
        pub: Publication | None = await self.session.get(Publication, publication_id)
        if not pub:
            raise HTTPException(
                status_code=404, detail=f"publication {publication_id} not found"
            )
        return pub
