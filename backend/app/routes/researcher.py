from fastapi import APIRouter

from app.routes.deps import CurrentUser, ResearcherServiceDeps
from app.schemas import (
    ResearcherRequest,
    ResearcherResponse,
    ResearcherUpdateRequest,
)

researcher_router = APIRouter(prefix="/researchers", tags=["researchers"])


@researcher_router.post("/", response_model=ResearcherResponse, status_code=201)
async def create_researcher(
    data: ResearcherRequest,
    current_user: CurrentUser,
    researcher_service: ResearcherServiceDeps,
) -> ResearcherResponse:
    return await researcher_service.create(data, current_user)


@researcher_router.get("/", response_model=list[ResearcherResponse])
async def get_researchers(
    researcher_service: ResearcherServiceDeps,
) -> list[ResearcherResponse]:
    return await researcher_service.get_all()


@researcher_router.get("/researcher_id", response_model=ResearcherResponse)
async def get_researcher(
    researcher_id: int,
    researcher_service: ResearcherServiceDeps,
) -> ResearcherResponse:
    return await researcher_service.get_by_id(researcher_id)


@researcher_router.patch("/me", response_model=ResearcherResponse)
async def update_researcher(
    data: ResearcherUpdateRequest,
    current_user: CurrentUser,
    researcher_service: ResearcherServiceDeps,
) -> ResearcherResponse:
    return await researcher_service.update(data, current_user)


# admin update researcher_id from URL (add later when roles are implemented)
# @researcher_router.patch("/{researcher_id}")
# async def admin_update_researcher(): ...


@researcher_router.delete("/me", status_code=204)
async def delete_researcher(
    current_user: CurrentUser,
    researcher_service: ResearcherServiceDeps,
) -> None:
    await researcher_service.delete(current_user)
