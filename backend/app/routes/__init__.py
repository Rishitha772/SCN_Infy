from fastapi import APIRouter

from app.routes.auth import auth_router
from app.routes.citation import citation_router
from app.routes.collaboration import collaboration_router
from app.routes.conference import conference_router
from app.routes.dashboard import dashboard_router
from app.routes.institution import institution_router
from app.routes.project import project_router
from app.routes.publication import publication_router
from app.routes.report import report_router
from app.routes.researcher import researcher_router
from app.routes.user import user_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(citation_router)
router.include_router(collaboration_router)
router.include_router(conference_router)
router.include_router(dashboard_router)
router.include_router(project_router)
router.include_router(publication_router)
router.include_router(report_router)
router.include_router(institution_router)
router.include_router(researcher_router)
router.include_router(user_router)
