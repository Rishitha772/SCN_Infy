import logging

import aiofiles
from fastapi import HTTPException, UploadFile
from sqlalchemy import ScalarResult, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PublicationFile
from app.models import Publication, PublicationAuthor, Researcher
from app.schemas import (
    PublicationRequest,
    PublicationResponse,
    PublicationUpdateRequest,
)

logger: logging.Logger = logging.getLogger(__name__)


class PublicationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_all(self) -> list[PublicationResponse]:
        logger.debug("fetching all publications")
        result: ScalarResult[Publication] = await self.session.scalars(
            select(Publication)
        )
        return [PublicationResponse.from_orm(p) for p in result.all()]

    async def get_by_id(self, publication_id: int) -> PublicationResponse:
        publication: Publication = await self._get_by_id(publication_id)
        return PublicationResponse.from_orm(publication)

    async def get_by_researcher(self, researcher_id: int) -> list[PublicationResponse]:
        logger.debug("fetching publications for researcher: %d", researcher_id)
        result: ScalarResult[Publication] = await self.session.scalars(
            select(Publication)
            .join(PublicationAuthor)
            .where(PublicationAuthor.researcher_id == researcher_id)
        )
        return [PublicationResponse.from_orm(p) for p in result.all()]

    async def create(
        self, data: PublicationRequest, researcher: Researcher
    ) -> PublicationResponse:
        if data.doi:
            existing: Publication | None = await self.session.scalar(
                select(Publication).where(Publication.doi == data.doi)
            )
            if existing:
                raise HTTPException(status_code=409, detail="DOI already exists")

        publication = Publication(
            title=data.title,
            abstract=data.abstract,
            doi=data.doi,
            publication_type=data.publication_type,
            status=data.status,
            publication_date=data.publication_date,
            conference_id=data.conference_id,
            external_authors=data.external_authors,
        )
        self.session.add(publication)
        await self.session.flush()  # get publication_id before adding authors

        # add submitting researcher as first author
        primary_author = PublicationAuthor(
            publication_id=publication.publication_id,
            researcher_id=researcher.researcher_id,
            author_order=1,
            is_corresponding=True,
        )
        self.session.add(primary_author)
        await self._add_additional_researchers(data, publication)
        await self.session.commit()
        await self.session.refresh(publication)
        return PublicationResponse.from_orm(publication)

    async def update(
        self,
        publication_id: int,
        data: PublicationUpdateRequest,
        researcher: Researcher,
    ) -> PublicationResponse:
        publication: Publication = await self._get_by_id(publication_id)
        await self._check_ownership(publication, researcher)
        updates = data.model_dump(exclude_none=True)
        researcher_ids = updates.pop("researcher_ids", None)

        for key, val in updates.items():
            setattr(publication, key, val)

        if researcher_ids is not None:
            await self.session.execute(
                delete(PublicationAuthor).where(
                    PublicationAuthor.publication_id == publication_id,
                    PublicationAuthor.researcher_id != researcher.researcher_id,
                )
            )
            for order, rid in enumerate(researcher_ids, start=2):
                co_researcher: Researcher = await self._get_researcher(rid)
                author = PublicationAuthor(
                    publication_id=publication_id,
                    researcher_id=co_researcher.researcher_id,
                    author_order=order,
                    is_corresponding=False,
                )
                self.session.add(author)

        await self.session.commit()
        await self.session.refresh(publication)
        return PublicationResponse.from_orm(publication)

    async def delete(self, publication_id: int, researcher: Researcher) -> None:
        publication: Publication = await self._get_by_id(publication_id)
        await self._check_ownership(publication, researcher)
        await self.session.delete(publication)
        await self.session.commit()

    async def upload_file(
        self, publication_id: int, file: UploadFile, researcher: Researcher
    ) -> PublicationResponse:
        publication: Publication = await self._get_by_id(publication_id)
        await self._check_ownership(publication, researcher)

        if not file.filename:
            raise HTTPException(status_code=400, detail="no filename provided")

        ext: str = "." + file.filename.rsplit(".", 1)[-1].lower()
        if ext not in PublicationFile.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"file type not allowed — use {PublicationFile.ALLOWED_EXTENSIONS}",
            )

        content = await file.read()
        if len(content) > PublicationFile.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="file too large — max 10MB")

        # save locally — replace with S3 in production
        file_path: str = f"uploads/{publication_id}_{file.filename}"
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        publication.file_path = file_path
        await self.session.commit()
        return PublicationResponse.from_orm(publication)

    async def _check_ownership(
        self, publication: Publication, researcher: Researcher
    ) -> None:
        author: PublicationAuthor | None = await self.session.scalar(
            select(PublicationAuthor).where(
                PublicationAuthor.publication_id == publication.publication_id,
                PublicationAuthor.researcher_id == researcher.researcher_id,
            )
        )
        if not author:
            raise HTTPException(
                status_code=403,
                detail="you are not an author of this publication",
            )

    async def _get_by_id(self, publication_id: int) -> Publication:
        publication: Publication | None = await self.session.get(
            Publication, publication_id
        )
        if not publication:
            raise HTTPException(status_code=404, detail="publication not found")
        return publication

    async def _get_researcher(self, researcher_id: int) -> Researcher:
        researcher: Researcher | None = await self.session.get(
            Researcher, researcher_id
        )
        if not researcher:
            raise HTTPException(
                status_code=404, detail=f"researcher {researcher_id} not found"
            )
        return researcher

    async def _add_additional_researchers(
        self, data: PublicationRequest, publication: Publication
    ) -> None:
        for order, researcher_id in enumerate(data.researcher_ids, start=2):
            co_researcher: Researcher = await self._get_researcher(researcher_id)
            author = PublicationAuthor(
                publication_id=publication.publication_id,
                researcher_id=co_researcher.researcher_id,
                author_order=order,
                is_corresponding=False,
            )
            self.session.add(author)
