import logging

from fastapi import APIRouter

from app.routes.deps import CollaborationServiceDeps, CurrentResearcher, CurrentUser
from app.schemas import CollaborationRequest, CollaborationResponse

logger: logging.Logger = logging.getLogger(__name__)
collaboration_router = APIRouter(prefix="/collaborations", tags=["collaborations"])


@collaboration_router.get("/", response_model=list[CollaborationResponse])
async def get_collaborations(
    collaboration_service: CollaborationServiceDeps,
) -> list[CollaborationResponse]:
    return await collaboration_service.get_all()


@collaboration_router.get("/my", response_model=list[CollaborationResponse])
async def get_my_collaborations(
    current_researcher: CurrentResearcher,
    collaboration_service: CollaborationServiceDeps,
) -> list[CollaborationResponse]:
    return await collaboration_service.get_by_researcher(
        current_researcher.researcher_id
    )


@collaboration_router.post("/", response_model=CollaborationResponse, status_code=201)
async def create_collaboration(
    data: CollaborationRequest,
    _: CurrentUser,
    collaboration_service: CollaborationServiceDeps,
) -> CollaborationResponse:
    return await collaboration_service.create(data)


@collaboration_router.delete("/{collaboration_id}", status_code=204)
async def delete_collaboration(
    collaboration_id: int,
    _: CurrentUser,
    collaboration_service: CollaborationServiceDeps,
) -> None:
    await collaboration_service.delete(collaboration_id)
