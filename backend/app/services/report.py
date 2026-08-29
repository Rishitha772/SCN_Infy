import csv
import io
import json
import logging
from _csv import Writer

from fastapi.responses import StreamingResponse
from sqlalchemy import ScalarResult, Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PublicationStatus, PublicationType
from app.models import (
    Collaboration,
    CollaborationResearcher,
    Publication,
    PublicationAuthor,
    Researcher,
)
from app.schemas import CollaborationReportFilter, PublicationReportFilter

logger: logging.Logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def _get_publications(
        self, filters: PublicationReportFilter
    ) -> list[Publication]:
        query = select(Publication)

        if filters.researcher_id:
            query: Select[tuple[Publication]] = query.join(PublicationAuthor).where(
                PublicationAuthor.researcher_id == filters.researcher_id
            )
        if filters.institution_id:
            query = (
                query.join(PublicationAuthor)
                .join(Researcher)
                .where(Researcher.institution_id == filters.institution_id)
            )
        if filters.publication_type:
            query = query.where(
                Publication.publication_type == filters.publication_type
            )
        if filters.status:
            query = query.where(Publication.status == filters.status)
        if filters.from_date:
            query = query.where(Publication.publication_date >= filters.from_date)
        if filters.to_date:
            query = query.where(Publication.publication_date <= filters.to_date)

        result: ScalarResult[Publication] = await self.session.scalars(query)
        return list(result.all())

    async def publication_report_csv(
        self, filters: PublicationReportFilter
    ) -> StreamingResponse:
        logger.info("generating publication CSV report")
        publications: list[Publication] = await self._get_publications(filters)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "ID",
                "Title",
                "Type",
                "Status",
                "DOI",
                "Publication Date",
                "Created At",
            ]
        )
        for p in publications:
            writer.writerow(
                [
                    p.publication_id,
                    p.title,
                    p.publication_type,
                    p.status,
                    p.doi or "",
                    p.publication_date or "",
                    p.created_at.date(),
                ]
            )

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=publications.csv"},
        )

    async def publication_report_json(
        self, filters: PublicationReportFilter
    ) -> StreamingResponse:
        logger.info("generating publication JSON report")
        publications: list[Publication] = await self._get_publications(filters)

        data: list[
            dict[str, int | str | PublicationType | PublicationStatus | None]
        ] = [
            {
                "id": p.publication_id,
                "title": p.title,
                "type": p.publication_type,
                "status": p.status,
                "doi": p.doi,
                "publication_date": str(p.publication_date)
                if p.publication_date
                else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in publications
        ]

        return StreamingResponse(
            iter([json.dumps(data, indent=2)]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=publications.json"},
        )

    async def collaboration_report_csv(
        self, filters: CollaborationReportFilter
    ) -> StreamingResponse:
        query: Select[tuple[Collaboration]] = select(Collaboration)
        if filters.researcher_id:
            query = query.join(CollaborationResearcher).where(
                CollaborationResearcher.researcher_id == filters.researcher_id
            )
        if filters.from_date:
            query = query.where(Collaboration.created_at >= filters.from_date)
        if filters.to_date:
            query = query.where(Collaboration.created_at <= filters.to_date)

        result: ScalarResult[Collaboration] = await self.session.scalars(query)
        collaborations: list[Collaboration] = list(result.all())

        output = io.StringIO()
        writer: Writer = csv.writer(output)
        writer.writerow(["ID", "Type", "Researcher IDs", "Count", "Created At"])

        for c in collaborations:
            members: ScalarResult[int] = await self.session.scalars(
                select(CollaborationResearcher.researcher_id).where(
                    CollaborationResearcher.collaboration_id == c.collaboration_id
                )
            )
            member_ids: str = ", ".join(str(m) for m in members.all())
            writer.writerow(
                [
                    c.collaboration_id,
                    c.collaboration_type or "",
                    member_ids,
                    c.collaboration_count,
                    c.created_at.date(),
                ]
            )

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=collaborations.csv"},
        )
