from datetime import timedelta
from enum import StrEnum
from typing import Final

VERIFICATION_CODE_LENGTH: Final[int] = 6
PASSWORD_MIN_LENGTH: Final[int] = 8
ORCID_MAX_LENGTH: Final[int] = 16
PASSWORD_MAX_LENGTH: Final[int] = 64
LOCATION_MAX_LENGTH: Final[int] = 128
USERNAME_MAX_LENGTH: Final[int] = 128
CONFERENCE_NAME_MAX_LENGTH: Final[int] = 255
TITLE_MAX_LENGTH: Final[int] = 255
PROJECT_NAME_MAX_LENGTH: Final[int] = 255
DOI_MAX_LENGTH: Final[int] = 255
COLLABORATION_TYPE_MAX_LENGTH: Final[int] = 255
INSTITUTION_NAME_MAX_LENGTH: Final[int] = 255
DEPARTMENT_MAX_LENGTH: Final[int] = 255
TOTP_INTERVAL: Final[timedelta] = timedelta(minutes=5)


class TokenClaims:
    SUBJECT: Final[str] = "sub"
    TYPE: Final[str] = "type"
    EXPIRY: Final[str] = "exp"


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"
    BEARER = "bearer"


class UserRole(StrEnum):
    RESEARCHER = "researcher"
    INSTITUTION_ADMIN = "institution_admin"
    REVIEWER = "reviewer"
    SYSTEM_ADMIN = "system_admin"


class UserStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"
    BANNED = "banned"


class InstitutionType(StrEnum):
    UNIVERSITY = "university"
    RESEARCH_INSTITUTE = "research_institute"
    GOVERNMENT_LAB = "government_lab"
    PRIVATE_COMPANY = "private_company"
    NONPROFIT_ORGANIZATION = "non_profit_organization"


class PublicationType(StrEnum):
    JOURNAL = "journal"
    CONFERENCE = "conference"
    BOOK = "book"
    PATENT = "patent"
    REPORT = "report"


class PublicationStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class PublicationFile:
    ALLOWED_EXTENSIONS: Final[set[str]] = {".docx", ".pdf"}
    MAX_FILE_SIZE: Final[int] = 10 * 1024 * 1024


class ProjectStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProjectRole(StrEnum):
    PI = "principal_investigator"
    CO_PI = "co_investigator"
    MEMBER = "member"


class VerificationPurpose(StrEnum):
    REGISTER = "register"
    LOGIN = "login"
    CHANGE_EMAIL = "change_email"
