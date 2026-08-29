import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.routes.deps import CurrentUser, ReportServiceDeps
from app.schemas import CollaborationReportFilter, PublicationReportFilter

logger: logging.Logger = logging.getLogger(__name__)
report_router = APIRouter(prefix="/reports", tags=["reports"])


@report_router.post("/publications/csv")
async def publications_csv(
    filters: PublicationReportFilter, _: CurrentUser, report_service: ReportServiceDeps
) -> StreamingResponse:
    return await report_service.publication_report_csv(filters)


@report_router.post("/publications/json")
async def publications_json(
    filters: PublicationReportFilter, _: CurrentUser, report_service: ReportServiceDeps
) -> StreamingResponse:
    return await report_service.publication_report_json(filters)


@report_router.post("/collaborations/csv")
async def collaborations_csv(
    filters: CollaborationReportFilter,
    _: CurrentUser,
    report_service: ReportServiceDeps,
) -> StreamingResponse:
    return await report_service.collaboration_report_csv(filters)
