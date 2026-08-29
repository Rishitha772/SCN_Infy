import logging

from fastapi import APIRouter

from app.routes.deps import CitationServiceDeps, CurrentUser
from app.schemas import CitationRequest, CitationResponse

logger: logging.Logger = logging.getLogger(__name__)
citation_router = APIRouter(prefix="/citations", tags=["citations"])


@citation_router.post("/", response_model=list[CitationResponse], status_code=201)
async def create_citation(
    data: CitationRequest, _: CurrentUser, citation_service: CitationServiceDeps
) -> list[CitationResponse]:
    return await citation_service.create(data)


@citation_router.get(
    "/by-publication/{publication_id}", response_model=list[CitationResponse]
)
async def get_citations_by_publication(
    publication_id: int, citation_service: CitationServiceDeps
) -> list[CitationResponse]:
    return await citation_service.get_by_publication(publication_id)


@citation_router.get(
    "/cited-by/{publication_id}", response_model=list[CitationResponse]
)
async def get_cited_by(
    publication_id: int, citation_service: CitationServiceDeps
) -> list[CitationResponse]:
    return await citation_service.get_cited_by(publication_id)


@citation_router.delete("/{citation_id}", status_code=204)
async def delete_citation(
    citation_id: int, _: CurrentUser, citation_service: CitationServiceDeps
) -> None:
    await citation_service.delete(citation_id)
