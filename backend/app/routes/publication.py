import logging

from fastapi import APIRouter, UploadFile

from app.routes.deps import CurrentResearcher, PublicationServiceDeps
from app.schemas import (
    PublicationRequest,
    PublicationResponse,
    PublicationUpdateRequest,
)

logger: logging.Logger = logging.getLogger(__name__)
publication_router = APIRouter(prefix="/publications", tags=["publications"])


@publication_router.get("/", response_model=list[PublicationResponse])
async def get_publications(
    publication_service: PublicationServiceDeps,
) -> list[PublicationResponse]:
    return await publication_service.get_all()


@publication_router.get("/my", response_model=list[PublicationResponse])
async def get_my_publications(
    current_researcher: CurrentResearcher, publication_service: PublicationServiceDeps
) -> list[PublicationResponse]:
    return await publication_service.get_by_researcher(current_researcher.researcher_id)


@publication_router.get("/{publication_id}", response_model=PublicationResponse)
async def get_publication(
    publication_id: int, publication_service: PublicationServiceDeps
) -> PublicationResponse:
    return await publication_service.get_by_id(publication_id)


@publication_router.post("/", response_model=PublicationResponse, status_code=201)
async def create_publication(
    data: PublicationRequest,
    current_researcher: CurrentResearcher,
    publication_service: PublicationServiceDeps,
) -> PublicationResponse:
    return await publication_service.create(data, current_researcher)


@publication_router.patch("/{publication_id}", response_model=PublicationResponse)
async def update_publication(
    publication_id: int,
    data: PublicationUpdateRequest,
    current_researcher: CurrentResearcher,
    publication_service: PublicationServiceDeps,
) -> PublicationResponse:
    return await publication_service.update(publication_id, data, current_researcher)


@publication_router.delete("/{publication_id}", status_code=204)
async def delete_publication(
    publication_id: int,
    current_researcher: CurrentResearcher,
    publication_service: PublicationServiceDeps,
) -> None:
    await publication_service.delete(publication_id, current_researcher)


@publication_router.post("/{publication_id}/upload", response_model=PublicationResponse)
async def upload_file(
    publication_id: int,
    file: UploadFile,
    current_researcher: CurrentResearcher,
    publication_service: PublicationServiceDeps,
) -> PublicationResponse:
    return await publication_service.upload_file(
        publication_id, file, current_researcher
    )
