import logging

from fastapi import APIRouter

from app.routes.deps import AdminUser, CurrentUser, DashboardServiceDeps
from app.schemas import InstitutionStats, ResearcherDashboard, SystemStats

logger: logging.Logger = logging.getLogger(__name__)
dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@dashboard_router.get("/me", response_model=ResearcherDashboard)
async def my_dashboard(
    current_user: CurrentUser, dashboard_service: DashboardServiceDeps
) -> ResearcherDashboard:
    return await dashboard_service.get_researcher_dashboard(current_user.user_id)


@dashboard_router.get(
    "/institution/{institution_id}",
    response_model=InstitutionStats,
)
async def institution_dashboard(
    institution_id: int, _: AdminUser, dashboard_service: DashboardServiceDeps
) -> InstitutionStats:
    return await dashboard_service.get_institution_stats(institution_id)


@dashboard_router.get("/system", response_model=SystemStats)
async def system_dashboard(
    _: AdminUser, dashboard_service: DashboardServiceDeps
) -> SystemStats:
    return await dashboard_service.get_system_stats()
