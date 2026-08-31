from app.core.constants import UserRole, UserStatus
from app.models import User
from httpx import AsyncClient, Response
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import (
    KNOWN_VERIFICATION_CODE,
    auth_headers,
    make_user,
    mock_verification_code,
)

AUTH_URL = "/api/auth"
REGISTER_URL = f"{AUTH_URL}/register"
VERIFY_EMAIL_URL = f"{AUTH_URL}/verify-email"
LOGIN_URL = f"{AUTH_URL}/login"
VERIFY_LOGIN_URL = f"{AUTH_URL}/verify-login-code"
PASSWORD = "TestPass123"


# Registration
async def test_register_success(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL, json={"email": "newuser@mit.edu", "password": PASSWORD}
    )
    assert res.status_code == 201
    assert "message" in res.json()


async def test_register_success_with_role(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL,
        json={
            "email": "newuser@mit.edu",
            "password": PASSWORD,
            "requested_role": UserRole.RESEARCHER,
        },
    )
    assert res.status_code == 201
    assert "message" in res.json()


async def test_register_invalid_email(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL, json={"email": "notanemail", "password": PASSWORD}
    )
    assert res.status_code == 422
    assert "value is not a valid email address" in str(res.json()) or "email" in str(res.json())


async def test_register_password_no_letter(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL, json={"email": "user@mit.edu", "password": "12345678"}
    )
    assert res.status_code == 422
    assert "letter" in str(res.json())


async def test_register_password_no_number(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL, json={"email": "user@mit.edu", "password": "onlyletters"}
    )
    assert res.status_code == 422
    assert "number" in str(res.json())


async def test_register_extra_fields_rejected(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL,
        json={
            "email": "user@mit.edu",
            "password": PASSWORD,
            "requested_role": UserRole.RESEARCHER,
            "extra_field": "bad",
        },
    )
    assert res.status_code == 422


async def test_register_system_admin_role_rejected(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL,
        json={
            "email": "user2@mit.edu",
            "password": PASSWORD,
            "requested_role": "system_admin",
        },
    )
    assert res.status_code == 422
    assert "system admin" in str(res.json())


async def test_register_reviewer_role_accepted(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL,
        json={
            "email": "reviewer@ox.ac.uk",
            "password": PASSWORD,
            "requested_role": UserRole.REVIEWER,
        },
    )
    assert res.status_code == 201


async def test_register_institution_role_accepted(client: AsyncClient) -> None:
    res: Response = await client.post(
        REGISTER_URL,
        json={
            "email": "institution_admin@ox.ac.uk",
            "password": PASSWORD,
            "requested_role": UserRole.INSTITUTION_ADMIN,
        },
    )
    assert res.status_code == 201


async def test_register_duplicate_active_user(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        REGISTER_URL, json={"email": researcher_user.email, "password": PASSWORD}
    )
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"]


async def test_register_unverified_resends_verification_code(
    client: AsyncClient, session: AsyncSession
) -> None:
    unverified: User = await make_user(
        session,
        email="unverified@stanford.edu",
        status=UserStatus.PENDING,
        is_verified=False,
    )
    res: Response = await client.post(
        REGISTER_URL, json={"email": unverified.email, "password": PASSWORD}
    )
    assert res.status_code == 201
    assert "unverified" in res.json()["message"].lower()


# Email verification
async def test_verify_email_success(
    client: AsyncClient, mock_verification_code: str
) -> None:
    # register first
    EMAIL_ADDRESS = "verifytest@mit.edu"
    res = await client.post(
        REGISTER_URL, json={"email": EMAIL_ADDRESS, "password": PASSWORD}
    )
    assert res.status_code == 201
    # verify with known verification code
    res: Response = await client.post(
        VERIFY_EMAIL_URL,
        json={"email": "verifytest@mit.edu", "code": KNOWN_VERIFICATION_CODE},
    )
    assert res.status_code == 200
    assert "verified" in res.json()["message"].lower()


async def test_verify_wrong_code(client: AsyncClient, session: AsyncSession) -> None:
    user: User = await make_user(
        session,
        email="wrongcode@harvard.edu",
        status=UserStatus.PENDING,
        is_verified=False,
    )
    res: Response = await client.post(
        VERIFY_EMAIL_URL, json={"email": user.email, "code": KNOWN_VERIFICATION_CODE}
    )
    assert res.status_code in (400, 404)


async def test_verify_already_verified(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        VERIFY_EMAIL_URL,
        json={"email": researcher_user.email, "code": KNOWN_VERIFICATION_CODE},
    )
    assert res.status_code == 400
    assert "already verified" in res.json()["detail"]


async def test_verify_banned_user_rejected(
    client: AsyncClient, session: AsyncSession
) -> None:
    banned: User = await make_user(
        session,
        email="banned@ox.ac.uk",
        status=UserStatus.BANNED,
        is_verified=False,
    )
    res: Response = await client.post(
        VERIFY_EMAIL_URL, json={"email": banned.email, "code": "000000"}
    )
    assert res.status_code == 403


# Email change flow
async def test_request_email_change_success(
    client: AsyncClient, researcher_user: User, mock_verification_code: str
) -> None:
    res: Response = await client.post(
        f"{AUTH_URL}/request-email-change",
        json={"new_email": "newemail@ox.ac.uk"},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 200
    assert "verification" in res.json()["message"].lower()


async def test_request_email_change_invalid_email(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        f"{AUTH_URL}/request-email-change",
        json={"new_email": "notanemail"},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 422


async def test_request_email_change_already_in_use(
    client: AsyncClient,
    researcher_user: User,
    session: AsyncSession,
    mock_verification_code: str,
) -> None:
    other: User = await make_user(session, email="taken@ox.ac.uk")
    res: Response = await client.post(
        f"{AUTH_URL}/request-email-change",
        json={"new_email": other.email},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 409


async def test_verify_email_change_success(
    client: AsyncClient, researcher_user: User, mock_verification_code: str
) -> None:
    await client.post(
        f"{AUTH_URL}/request-email-change",
        json={"new_email": "changed@ox.ac.uk"},
        headers=auth_headers(researcher_user),
    )
    res: Response = await client.post(
        f"{AUTH_URL}/verify-email-change",
        json={"email": researcher_user.email, "code": KNOWN_VERIFICATION_CODE},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 200
    assert "updated" in res.json()["message"].lower()


async def test_verify_email_change_not_pending(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        f"{AUTH_URL}/verify-email-change",
        json={"email": researcher_user.email, "code": KNOWN_VERIFICATION_CODE},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 400
    assert "no email change" in res.json()["detail"]


# Login
async def test_login_sends_verification_code(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        LOGIN_URL, json={"email": researcher_user.email, "password": PASSWORD}
    )
    assert res.status_code == 200
    assert "message" in res.json()


async def test_login_wrong_password(client: AsyncClient, researcher_user: User) -> None:
    res: Response = await client.post(
        LOGIN_URL, json={"email": researcher_user.email, "password": "WrongPass999"}
    )
    assert res.status_code == 401


async def test_login_pending_blocked(
    client: AsyncClient, session: AsyncSession
) -> None:
    pending: User = await make_user(
        session, email="pending@mit.edu", status=UserStatus.PENDING
    )
    res: Response = await client.post(
        LOGIN_URL, json={"email": pending.email, "password": PASSWORD}
    )
    assert res.status_code == 403
    assert "pending" in res.json()["detail"]


async def test_login_banned_blocked(client: AsyncClient, session: AsyncSession) -> None:
    banned: User = await make_user(
        session, email="banned2@mit.edu", status=UserStatus.BANNED
    )
    res: Response = await client.post(
        LOGIN_URL, json={"email": banned.email, "password": PASSWORD}
    )
    assert res.status_code == 403
    assert "banned" in res.json()["detail"]


async def test_login_unverified_blocked(
    client: AsyncClient, session: AsyncSession
) -> None:
    unverified: User = await make_user(
        session, email="notverified@cern.ch", is_verified=False
    )
    res: Response = await client.post(
        LOGIN_URL, json={"email": unverified.email, "password": PASSWORD}
    )
    assert res.status_code == 403
    assert "verified" in res.json()["detail"]


async def test_login_rejected_blocked(
    client: AsyncClient, session: AsyncSession
) -> None:
    rejected: User = await make_user(
        session, email="rejected@ox.ac.uk", status=UserStatus.REJECTED
    )
    res: Response = await client.post(
        LOGIN_URL, json={"email": rejected.email, "password": PASSWORD}
    )
    assert res.status_code == 403
    assert "rejected" in res.json()["detail"]


# Verify login verification code, returns tokens
async def test_verify_login_verification_code_returns_tokens(
    client: AsyncClient, researcher_user: User, mock_verification_code: str
) -> None:
    # trigger login to generate verification code record
    await client.post(
        LOGIN_URL, json={"email": researcher_user.email, "password": PASSWORD}
    )
    # verify with known verification code
    res: Response = await client.post(
        VERIFY_LOGIN_URL,
        json={"email": researcher_user.email, "code": KNOWN_VERIFICATION_CODE},
    )
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert "refresh_token" in res.json()
    assert res.json()["token_type"] == "bearer"


async def test_verify_login_wrong_verification_code(
    client: AsyncClient, researcher_user: User
) -> None:
    await client.post(
        LOGIN_URL, json={"email": researcher_user.email, "password": PASSWORD}
    )
    res: Response = await client.post(
        VERIFY_LOGIN_URL,
        json={"email": researcher_user.email, "code": "000000"},
    )
    assert res.status_code in (400, 404)


# Logout
async def test_logout_revokes_token(
    client: AsyncClient, researcher_user: User, mock_verification_code: str
) -> None:
    # complete login flow
    await client.post(
        LOGIN_URL, json={"email": researcher_user.email, "password": PASSWORD}
    )
    verify_res: Response = await client.post(
        VERIFY_LOGIN_URL,
        json={"email": researcher_user.email, "code": KNOWN_VERIFICATION_CODE},
    )
    assert verify_res.status_code == 200
    refresh_token = verify_res.json()["refresh_token"]
    access_token = verify_res.json()["access_token"]

    logout_res: Response = await client.post(
        "/api/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_res.status_code == 204

    # refresh with revoked token should fail
    refresh_res: Response = await client.post(
        "/api/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 401


# Missing fields
async def test_register_missing_password(client: AsyncClient) -> None:
    res: Response = await client.post(REGISTER_URL, json={"email": "user@mit.edu"})
    assert res.status_code == 422


async def test_register_missing_email(client: AsyncClient) -> None:
    res: Response = await client.post(REGISTER_URL, json={"password": "TestPass123"})
    assert res.status_code == 422


# Verify using invalid email format
async def test_verify_email_invalid_format(client: AsyncClient) -> None:
    res: Response = await client.post(
        VERIFY_EMAIL_URL, json={"email": "notanemail", "code": "123456"}
    )
    assert res.status_code == 422


# Login using non-existent email
async def test_login_nonexistent_email(client: AsyncClient) -> None:
    res: Response = await client.post(
        LOGIN_URL, json={"email": "ghost@mit.edu", "password": "TestPass123"}
    )
    assert res.status_code == 401


# Use access_token where refresh_token is expected
async def test_refresh_with_access_token_fails(
    client: AsyncClient, researcher_user, mock_verification_code: str
) -> None:
    await client.post(
        LOGIN_URL, json={"email": researcher_user.email, "password": "TestPass123"}
    )
    verify_res: Response = await client.post(
        VERIFY_LOGIN_URL,
        json={"email": researcher_user.email, "code": KNOWN_VERIFICATION_CODE},
    )
    access_token = verify_res.json()["access_token"]
    res: Response = await client.post(
        "/api/auth/refresh", json={"refresh_token": access_token}
    )
    assert res.status_code == 400
    assert "invalid" in res.json()["detail"]


# Verification code reuse
async def test_verify_login_verification_code_reuse_fails(
    client: AsyncClient, researcher_user, mock_verification_code: str
) -> None:
    await client.post(
        LOGIN_URL, json={"email": researcher_user.email, "password": "TestPass123"}
    )
    # first use succeeds
    await client.post(
        VERIFY_LOGIN_URL,
        json={"email": researcher_user.email, "code": KNOWN_VERIFICATION_CODE},
    )
    # second use code was deleted after first use
    res: Response = await client.post(
        VERIFY_LOGIN_URL,
        json={"email": researcher_user.email, "code": KNOWN_VERIFICATION_CODE},
    )
    assert res.status_code in (400, 404)
