from datetime import date

import pytest
from app.core.constants import UserRole
from app.schemas import (
    CitationRequest,
    CollaborationRequest,
    EmailChangeRequest,
    ProjectRequest,
    RoleChangeRequest,
    UserRequest,
)
from app.schemas.base import validate_dates
from pydantic import SecretStr, ValidationError

VALID_EMAIL = "john@mit.edu"
VALID_PASSWORD = SecretStr("SecurePass123")


# Email domain
@pytest.mark.parametrize(
    "email",
    [
        "user@mit.edu",
        "user@ox.ac.uk",
        "user@iitd.ac.in",
    ],
)
def test_valid_academic_email(email: str) -> None:
    user = UserRequest(email=email, password=VALID_PASSWORD)
    assert user.email == email


@pytest.mark.parametrize(
    "email",
    [
        "user@gmail.com",
        "user@hotmail.com",
        "user@outlook.com",
    ],
)
def test_valid_social_email(email: str) -> None:
    user = UserRequest(email=email, password=VALID_PASSWORD)
    assert user.email == email


# Password
@pytest.mark.parametrize(
    "password, match",
    [
        ("12345678", "letter"),
        ("abcdefgh", "number"),
        ("ab", "least"),
    ],
)
def test_invalid_password(password: SecretStr, match: str) -> None:
    with pytest.raises(ValidationError, match=match):
        UserRequest(email=VALID_EMAIL, password=password)


def test_valid_password() -> None:
    user = UserRequest(email=VALID_EMAIL, password=VALID_PASSWORD)
    assert user.password == VALID_PASSWORD


# UserRequest role
def test_default_role_is_researcher() -> None:
    user = UserRequest(email=VALID_EMAIL, password=VALID_PASSWORD)
    assert user.requested_role == "researcher"


def test_reviewer_role_accepted_in_registration() -> None:
    user = UserRequest(
        email=VALID_EMAIL,
        password=VALID_PASSWORD,
        requested_role=UserRole.REVIEWER,
    )
    assert user.requested_role == "reviewer"


def test_institution_admin_role_accepted_in_registration() -> None:
    user = UserRequest(
        email=VALID_EMAIL,
        password=VALID_PASSWORD,
        requested_role=UserRole.INSTITUTION_ADMIN,
    )
    assert user.requested_role == "institution_admin"


def test_system_admin_role_rejected_in_registration() -> None:
    with pytest.raises(ValidationError, match="system admin"):
        UserRequest(
            email=VALID_EMAIL,
            password=VALID_PASSWORD,
            requested_role=UserRole.SYSTEM_ADMIN,
        )


# Role self-declaration
def test_system_admin_role_rejected() -> None:
    with pytest.raises(ValidationError, match="system_admin"):
        UserRequest(
            email=VALID_EMAIL,
            password=VALID_PASSWORD,
            requested_role=UserRole.SYSTEM_ADMIN,
        )


def test_reviewer_role_accepted() -> None:
    user = UserRequest(
        email=VALID_EMAIL,
        password=VALID_PASSWORD,
        requested_role=UserRole.REVIEWER,
    )
    assert user.requested_role == "reviewer"


# Date validation
def test_valid_dates() -> None:
    validate_dates(date(2024, 1, 1), date(2024, 12, 31))


def test_end_before_start_raises() -> None:
    with pytest.raises(ValueError, match="end_date"):
        validate_dates(date(2024, 12, 31), date(2024, 1, 1))


def test_none_dates_valid() -> None:
    validate_dates(None, None)
    validate_dates(None, date(2024, 1, 1))


# Citation
def test_self_citation_rejected() -> None:
    with pytest.raises(ValidationError, match="cannot cite itself"):
        CitationRequest(citing_publication_id=1, cited_publication_ids=[1, 2])


def test_duplicate_cited_rejected() -> None:
    with pytest.raises(ValidationError, match="duplicate"):
        CitationRequest(citing_publication_id=1, cited_publication_ids=[2, 2])


def test_valid_citation() -> None:
    req = CitationRequest(citing_publication_id=1, cited_publication_ids=[2, 3])
    assert len(req.cited_publication_ids) == 2


def test_citation_requires_at_least_one_cited() -> None:
    with pytest.raises(ValidationError):
        CitationRequest(citing_publication_id=1, cited_publication_ids=[])


# Collaboration
def test_collaboration_duplicate_ids_rejected() -> None:
    with pytest.raises(ValidationError, match="cannot collaborate with themselves"):
        CollaborationRequest(researcher_ids=[1, 2, 1])


def test_self_collaboration_rejected() -> None:
    with pytest.raises(ValidationError, match="cannot collaborate with themselves"):
        CollaborationRequest(researcher_ids=[1, 1])


def test_collaboration_needs_two() -> None:
    with pytest.raises(ValidationError):
        CollaborationRequest(researcher_ids=[1])


def test_valid_collaboration() -> None:
    req = CollaborationRequest(researcher_ids=[1, 2, 3])
    assert len(req.researcher_ids) == 3


# Project dates
def test_project_end_before_start() -> None:
    with pytest.raises(ValidationError, match="cannot be before start_date"):
        ProjectRequest(
            name="TestProject",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 1, 1),
        )


def test_project_same_start_end_valid() -> None:
    req = ProjectRequest(
        name="One Day Project",
        start_date=date(2024, 6, 1),
        end_date=date(2024, 6, 1),
    )
    assert req.name == "One Day Project"


# Role change request
def test_role_change_request_valid() -> None:
    req = RoleChangeRequest(requested_role=UserRole.REVIEWER)
    assert req.requested_role == "reviewer"


def test_role_change_request_system_admin_rejected() -> None:
    with pytest.raises(ValidationError, match="system admin"):
        RoleChangeRequest(requested_role=UserRole.SYSTEM_ADMIN)


# Email change request
def test_email_change_request_gmail() -> None:
    req = EmailChangeRequest(new_email="user@gmail.com")
    assert req.new_email == "user@gmail.com"


def test_email_change_request_academic() -> None:
    req = EmailChangeRequest(new_email="user@oxford.ac.uk")
    assert req.new_email == "user@oxford.ac.uk"
