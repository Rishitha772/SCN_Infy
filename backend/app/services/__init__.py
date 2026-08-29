from app.services.auth import AuthService
from app.services.citation import CitationService
from app.services.collaboration import CollaborationService
from app.services.conference import ConferenceService
from app.services.dashboard import DashboardService
from app.services.institution import InstitutionService
from app.services.project import ProjectService
from app.services.publication import PublicationService
from app.services.report import ReportService
from app.services.researcher import ResearcherService
from app.services.token import TokenService
from app.services.user import UserService
from app.services.user_admin import UserAdminService
from app.services.verification_code import VerificationCodeService

__all__: list[str] = [
    "AuthService",
    "CitationService",
    "CollaborationService",
    "ConferenceService",
    "DashboardService",
    "InstitutionService",
    "ProjectService",
    "PublicationService",
    "ReportService",
    "ResearcherService",
    "TokenService",
    "UserAdminService",
    "UserService",
    "VerificationCodeService",
]
