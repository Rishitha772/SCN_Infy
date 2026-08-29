import logging
from collections.abc import Sequence

from fastapi import HTTPException
from sqlalchemy import Result, Row, ScalarResult, Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    ProjectStatus,
    PublicationStatus,
    PublicationType,
    UserStatus,
)
from app.models import (
    Citation,
    Collaboration,
    CollaborationResearcher,
    Institution,
    Project,
    ProjectResearcher,
    Publication,
    PublicationAuthor,
    Researcher,
    User,
)
from app.schemas import (
    InstitutionStats,
    ProjectStats,
    PublicationStats,
    ResearcherDashboard,
    SystemStats,
)

logger: logging.Logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_researcher_dashboard(self, user_id: int) -> ResearcherDashboard:
        logger.debug("fetching researcher dashboard for user: %d", user_id)

        researcher: Researcher | None = await self.session.scalar(
            select(Researcher).where(Researcher.user_id == user_id)
        )
        if not researcher:
            raise HTTPException(status_code=404, detail="researcher profile not found")

        # publication stats
        pub_rows: Result[
            tuple[PublicationType, PublicationStatus, int]
        ] = await self.session.execute(
            select(Publication.publication_type, Publication.status, func.count())
            .join(PublicationAuthor)
            .where(PublicationAuthor.researcher_id == researcher.researcher_id)
            .group_by(Publication.publication_type, Publication.status)
        )
        rows: Sequence[Row[tuple[PublicationType, PublicationStatus, int]]] = (
            pub_rows.all()
        )

        total_pubs: int = sum(r[2] for r in rows)
        by_type: dict[str, int] = {}
        by_status: dict[str, int] = {}
        for pub_type, status, count in rows:
            by_type[pub_type] = by_type.get(pub_type, 0) + count
            by_status[status] = by_status.get(status, 0) + count

        # project stats
        project_rows: Result[tuple[ProjectStatus, int]] = await self.session.execute(
            select(Project.status, func.count())
            .join(ProjectResearcher)
            .where(ProjectResearcher.researcher_id == researcher.researcher_id)
            .group_by(Project.status)
        )
        project_counts = {row[0]: row[1] for row in project_rows.all()}

        # collaboration count
        collab_count: int | None = await self.session.scalar(
            select(
                func.count(CollaborationResearcher.collaboration_id.distinct())
            ).where(CollaborationResearcher.researcher_id == researcher.researcher_id)
        )

        # citation count - how many times this researcher's papers were cited
        citation_count: int | None = await self.session.scalar(
            select(func.count(Citation.citation_id))
            .join(
                Publication, Citation.cited_publication_id == Publication.publication_id
            )
            .join(PublicationAuthor)
            .where(PublicationAuthor.researcher_id == researcher.researcher_id)
        )

        return ResearcherDashboard(
            researcher_id=researcher.researcher_id,
            name=researcher.name,
            publication_stats=PublicationStats(
                total=total_pubs,
                by_type=by_type,
                by_status=by_status,
            ),
            project_stats=ProjectStats(
                total=sum(project_counts.values()),
                active=project_counts.get(ProjectStatus.ACTIVE, 0),
                completed=project_counts.get(ProjectStatus.COMPLETED, 0),
            ),
            collaboration_count=collab_count or 0,
            citation_count=citation_count or 0,
        )

    async def get_institution_stats(self, institution_id: int) -> InstitutionStats:
        logger.debug("fetching institution stats: %d", institution_id)

        institution: Institution | None = await self.session.get(
            Institution, institution_id
        )
        if not institution:
            raise HTTPException(status_code=404, detail="institution not found")

        researcher_count: int | None = await self.session.scalar(
            select(func.count(Researcher.researcher_id)).where(
                Researcher.institution_id == institution_id
            )
        )

        researcher_ids: ScalarResult[int] = await self.session.scalars(
            select(Researcher.researcher_id).where(
                Researcher.institution_id == institution_id
            )
        )
        rid_list: list[int] = list(researcher_ids.all())

        pub_count = 0
        active_projects = 0

        if rid_list:
            pub_count: int | None = await self.session.scalar(
                select(func.count(PublicationAuthor.publication_id.distinct())).where(
                    PublicationAuthor.researcher_id.in_(rid_list)
                )
            )
            active_projects: int | None = await self.session.scalar(
                select(func.count(ProjectResearcher.project_id.distinct()))
                .join(Project)
                .where(
                    ProjectResearcher.researcher_id.in_(rid_list),
                    Project.status == ProjectStatus.ACTIVE,
                )
            )

        return InstitutionStats(
            institution_id=institution_id,
            name=institution.name,
            total_researchers=researcher_count or 0,
            total_publications=pub_count or 0,
            active_projects=active_projects or 0,
        )

    async def get_system_stats(self) -> SystemStats:
        logger.debug("fetching system stats")

        async def count(model, condition=None) -> int:
            q: Select[tuple[int]] = select(func.count()).select_from(model)
            if condition is not None:
                q = q.where(condition)
            return await self.session.scalar(q) or 0

        return SystemStats(
            total_users=await count(User),
            pending_users=await count(User, User.status == UserStatus.PENDING),
            active_users=await count(User, User.status == UserStatus.ACTIVE),
            total_researchers=await count(Researcher),
            total_institutions=await count(Institution),
            total_publications=await count(Publication),
            total_projects=await count(Project),
            total_collaborations=await count(Collaboration),
            total_citations=await count(Citation),
        )
