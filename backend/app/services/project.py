import logging

from fastapi import HTTPException
from sqlalchemy import ScalarResult, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import ProjectRole
from app.models import Project, ProjectResearcher, Researcher
from app.schemas import ProjectRequest, ProjectResponse, ProjectUpdateRequest

logger: logging.Logger = logging.getLogger(__name__)


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self.session: AsyncSession = session

    async def get_all(self) -> list[ProjectResponse]:
        result: ScalarResult[Project] = await self.session.scalars(select(Project))
        return [ProjectResponse.from_orm(p) for p in result.all()]

    async def get_by_id(self, project_id: int) -> ProjectResponse:
        project: Project = await self._get_by_id(project_id)
        return ProjectResponse.from_orm(project)

    async def get_by_researcher(self, researcher_id: int) -> list[ProjectResponse]:
        result: ScalarResult[Project] = await self.session.scalars(
            select(Project)
            .join(ProjectResearcher)
            .where(ProjectResearcher.researcher_id == researcher_id)
        )
        return [ProjectResponse.from_orm(p) for p in result.all()]

    async def create(
        self, data: ProjectRequest, researcher: Researcher
    ) -> ProjectResponse:
        project = Project(
            name=data.name,
            description=data.description,
            start_date=data.start_date,
            end_date=data.end_date,
        )
        self.session.add(project)
        await self.session.flush()

        # creator is PI
        pi = ProjectResearcher(
            project_id=project.project_id,
            researcher_id=researcher.researcher_id,
            role=ProjectRole.PI,
        )
        self.session.add(pi)

        for rid in data.researcher_ids:
            member = ProjectResearcher(
                project_id=project.project_id,
                researcher_id=rid,
                role=ProjectRole.MEMBER,
            )
            self.session.add(member)

        await self.session.commit()
        logger.info("project created: %d", project.project_id)
        return ProjectResponse.from_orm(project)

    async def update(
        self, project_id: int, data: ProjectUpdateRequest, researcher: Researcher
    ) -> ProjectResponse:
        project: Project = await self._get_by_id(project_id)
        await self._check_membership(project_id, researcher.researcher_id)
        updates = data.model_dump(exclude_none=True)
        for key, val in updates.items():
            setattr(project, key, val)
        await self.session.commit()
        logger.info("project updated: %d", project_id)
        return ProjectResponse.from_orm(project)

    async def delete(self, project_id: int, researcher: Researcher) -> None:
        project: Project = await self._get_by_id(project_id)
        member: ProjectResearcher = await self._check_membership(
            project_id, researcher.researcher_id
        )
        if member.role != ProjectRole.PI:
            raise HTTPException(
                status_code=403, detail="only the PI can delete a project"
            )
        await self.session.delete(project)
        await self.session.commit()
        logger.info("project deleted: %d", project_id)

    async def _get_by_id(self, project_id: int) -> Project:
        project: Project | None = await self.session.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="project not found")
        return project

    async def _check_membership(
        self, project_id: int, researcher_id: int
    ) -> ProjectResearcher:
        member: ProjectResearcher | None = await self.session.scalar(
            select(ProjectResearcher).where(
                ProjectResearcher.project_id == project_id,
                ProjectResearcher.researcher_id == researcher_id,
            )
        )
        if not member:
            raise HTTPException(
                status_code=403, detail="you are not a member of this project"
            )
        return member
