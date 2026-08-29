import logging

from fastapi import APIRouter

from app.routes.deps import AdminUser, InstitutionServiceDeps
from app.schemas import (
    InstitutionRequest,
    InstitutionResponse,
    InstitutionUpdateRequest,
)

logger: logging.Logger = logging.getLogger(__name__)

institution_router = APIRouter(prefix="/institutions", tags=["institutions"])


@institution_router.post("/", response_model=InstitutionResponse, status_code=201)
async def create_institution(
    data: InstitutionRequest,
    _: AdminUser,
    institution_service: InstitutionServiceDeps,
) -> InstitutionResponse:
    return await institution_service.create(data)


@institution_router.get("/", response_model=list[InstitutionResponse])
async def get_institutions(
    institution_service: InstitutionServiceDeps,
) -> list[InstitutionResponse]:
    return await institution_service.get_all()


@institution_router.get("/{institution_id}", response_model=InstitutionResponse)
async def get_institution(
    institution_id: int,
    institution_service: InstitutionServiceDeps,
) -> InstitutionResponse:
    return await institution_service.get_institution(institution_id)


@institution_router.patch("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(
    institution_id: int,
    data: InstitutionUpdateRequest,
    _: AdminUser,
    institution_service: InstitutionServiceDeps,
) -> InstitutionResponse:
    return await institution_service.update(institution_id, data)


@institution_router.delete("/{institution_id}", status_code=204)
async def delete_institution(
    institution_id: int,
    _: AdminUser,
    institution_service: InstitutionServiceDeps,
) -> None:
    await institution_service.delete(institution_id)
