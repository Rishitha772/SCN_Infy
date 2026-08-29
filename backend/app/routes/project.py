import logging

from fastapi import APIRouter

from app.routes.deps import CurrentResearcher, ProjectServiceDeps
from app.schemas import ProjectRequest, ProjectResponse, ProjectUpdateRequest

logger: logging.Logger = logging.getLogger(__name__)
project_router = APIRouter(prefix="/projects", tags=["projects"])


@project_router.get("/", response_model=list[ProjectResponse])
async def get_projects(project_service: ProjectServiceDeps) -> list[ProjectResponse]:
    return await project_service.get_all()


@project_router.get("/my", response_model=list[ProjectResponse])
async def get_my_projects(
    current_researcher: CurrentResearcher, project_service: ProjectServiceDeps
) -> list[ProjectResponse]:
    return await project_service.get_by_researcher(current_researcher.researcher_id)


@project_router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int, project_service: ProjectServiceDeps
) -> ProjectResponse:
    return await project_service.get_by_id(project_id)


@project_router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectRequest,
    current_researcher: CurrentResearcher,
    project_service: ProjectServiceDeps,
) -> ProjectResponse:
    return await project_service.create(data, current_researcher)


@project_router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdateRequest,
    current_researcher: CurrentResearcher,
    project_service: ProjectServiceDeps,
) -> ProjectResponse:
    return await project_service.update(project_id, data, current_researcher)


@project_router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    current_researcher: CurrentResearcher,
    project_service: ProjectServiceDeps,
) -> None:
    await project_service.delete(project_id, current_researcher)
