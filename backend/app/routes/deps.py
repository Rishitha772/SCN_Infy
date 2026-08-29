from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import Config, get_config, get_db
from app.core.constants import UserRole
from app.core.interfaces import EmailNotifier
from app.models import Researcher, User
from app.schemas import TokenPayload
from app.services import (
    AuthService,
    CitationService,
    CollaborationService,
    ConferenceService,
    DashboardService,
    InstitutionService,
    ProjectService,
    PublicationService,
    ReportService,
    ResearcherService,
    TokenService,
    UserAdminService,
    UserService,
    VerificationCodeService,
)
from app.utils import ConsoleEmailNotifier, SMTPConfig, SMTPEmailNotifier

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
config: Config = get_config()

DBSession = Annotated[AsyncSession, Depends(get_db)]
Token = Annotated[str, Depends(oauth2_scheme)]


# -- Service factories --
@lru_cache
def get_email_notifier() -> EmailNotifier:
    if config.DEBUG or config.TESTING:
        return ConsoleEmailNotifier()
    smtp_config = SMTPConfig(
        host=config.SMTP_HOST,
        port=config.SMTP_PORT,
        user=config.SMTP_USER,
        password=config.SMTP_PASSWORD.get_secret_value(),
    )
    return SMTPEmailNotifier(smtp_config)


def get_user_service(session: DBSession) -> UserService:
    return UserService(session)


def get_user_admin_service(session: DBSession) -> UserAdminService:
    return UserAdminService(session, get_email_notifier())


@lru_cache
def get_token_service() -> TokenService:
    return TokenService(config)


def get_verification_code_service(session: DBSession) -> VerificationCodeService:
    return VerificationCodeService(session, get_email_notifier())


def get_auth_service(session: DBSession) -> AuthService:
    return AuthService(
        get_token_service(),
        get_verification_code_service(session),
    )


def get_researcher_service(session: DBSession) -> ResearcherService:
    return ResearcherService(session)


def get_institution_service(session: DBSession) -> InstitutionService:
    return InstitutionService(session)


def get_publication_service(session: DBSession) -> PublicationService:
    return PublicationService(session)


def get_project_service(session: DBSession) -> ProjectService:
    return ProjectService(session)


def get_conference_service(session: DBSession) -> ConferenceService:
    return ConferenceService(session)


def get_citation_service(session: DBSession) -> CitationService:
    return CitationService(session)


def get_collaboration_service(session: DBSession) -> CollaborationService:
    return CollaborationService(session)


def get_dashboard_service(session: DBSession) -> DashboardService:
    return DashboardService(session)


def get_report_service(session: DBSession) -> ReportService:
    return ReportService(session)


# -- Auth guard --
async def get_current_user(token: Token, session: DBSession) -> User:
    token_service: TokenService = get_token_service()
    payload: TokenPayload = token_service.decode_token(token)
    if not payload.sub:
        raise HTTPException(status_code=401, detail="invalid token payload")

    user: User | None = await UserService(session).get_by_email(payload.sub)
    if not user:
        raise HTTPException(status_code=401, detail="user not found")
    return user


def require_role(*roles: UserRole):
    async def checker(current_user: CurrentUser) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="insufficient permissions")
        return current_user

    return checker


# -- Type aliases --
CurrentUser = Annotated[User, Depends(get_current_user)]
AuthServiceDeps = Annotated[AuthService, Depends(get_auth_service)]
UserServiceDeps = Annotated[UserService, Depends(get_user_service)]
UserAdminServiceDeps = Annotated[UserAdminService, Depends(get_user_admin_service)]
ResearcherServiceDeps = Annotated[ResearcherService, Depends(get_researcher_service)]
InstitutionServiceDeps = Annotated[InstitutionService, Depends(get_institution_service)]
PublicationServiceDeps = Annotated[PublicationService, Depends(get_publication_service)]
ProjectServiceDeps = Annotated[ProjectService, Depends(get_project_service)]
ConferenceServiceDeps = Annotated[ConferenceService, Depends(get_conference_service)]
CitationServiceDeps = Annotated[CitationService, Depends(get_citation_service)]
CollaborationServiceDeps = Annotated[
    CollaborationService, Depends(get_collaboration_service)
]
DashboardServiceDeps = Annotated[DashboardService, Depends(get_dashboard_service)]
ReportServiceDeps = Annotated[ReportService, Depends(get_report_service)]

# Role guards
AdminUser = Annotated[User, Depends(require_role(UserRole.SYSTEM_ADMIN))]
InstitutionAdminUser = Annotated[
    User, Depends(require_role(UserRole.SYSTEM_ADMIN, UserRole.INSTITUTION_ADMIN))
]
ReviewerUser = Annotated[
    User, Depends(require_role(UserRole.REVIEWER, UserRole.SYSTEM_ADMIN))
]


# -- Domain-level dependencies --
async def get_current_researcher(
    current_user: CurrentUser, researcher_service: ResearcherServiceDeps
) -> Researcher:
    researcher: Researcher | None = await researcher_service.get_by_user_id(
        current_user.user_id
    )
    if not researcher:
        raise HTTPException(status_code=404, detail="create a researcher profile first")
    return researcher


CurrentResearcher = Annotated[Researcher, Depends(get_current_researcher)]
