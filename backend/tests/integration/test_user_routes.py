from app.core.constants import UserStatus
from app.models import User
from httpx import AsyncClient, Response
from sqlalchemy.ext.asyncio.session import AsyncSession
from tests.conftest import auth_headers, make_user

USER_URL = "/api/users"


# Pending users
async def test_get_pending_users_as_admin(
    client: AsyncClient, admin_user: User, session: AsyncSession
) -> None:
    await make_user(session, email="pending1@mit.edu", status=UserStatus.PENDING)
    res: Response = await client.get(
        f"{USER_URL}/pending", headers=auth_headers(admin_user)
    )
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert all(u["status"] == "pending" for u in res.json())


async def test_get_pending_users_as_researcher_forbidden(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.get(
        f"{USER_URL}/pending", headers=auth_headers(researcher_user)
    )
    assert res.status_code == 403


# Approve
async def test_approve_pending_user(
    client: AsyncClient, admin_user: User, session: AsyncSession
) -> None:
    pending: User = await make_user(
        session, email="toapprove@mit.edu", status=UserStatus.PENDING
    )
    res: Response = await client.patch(
        f"{USER_URL}/{pending.user_id}/approve", headers=auth_headers(admin_user)
    )
    assert res.status_code == 200
    assert res.json()["status"] == UserStatus.ACTIVE


async def test_approve_active_user_rejected(
    client: AsyncClient, admin_user: User, researcher_user: User
) -> None:
    res: Response = await client.patch(
        f"{USER_URL}/{researcher_user.user_id}/approve",
        headers=auth_headers(admin_user),
    )
    assert res.status_code == 409


# Reject
async def test_reject_pending_user(
    client: AsyncClient, admin_user: User, session: AsyncSession
) -> None:
    pending: User = await make_user(
        session, email="toreject@mit.edu", status=UserStatus.PENDING
    )
    res: Response = await client.patch(
        f"{USER_URL}/{pending.user_id}/reject", headers=auth_headers(admin_user)
    )
    assert res.status_code == 200
    assert res.json()["status"] == UserStatus.REJECTED


# Ban
async def test_ban_user(
    client: AsyncClient, admin_user: User, researcher_user: User
) -> None:
    res: Response = await client.patch(
        f"{USER_URL}/{researcher_user.user_id}/ban", headers=auth_headers(admin_user)
    )
    assert res.status_code == 200
    assert res.json()["status"] == UserStatus.BANNED


async def test_ban_already_banned_rejected(
    client: AsyncClient, admin_user: User, session: AsyncSession
) -> None:
    banned: User = await make_user(
        session, email="alreadybanned@mit.edu", status=UserStatus.BANNED
    )
    res: Response = await client.patch(
        f"{USER_URL}/{banned.user_id}/ban", headers=auth_headers(admin_user)
    )
    assert res.status_code == 409


# Role change
async def test_admin_changes_role(
    client: AsyncClient, admin_user: User, researcher_user: User
) -> None:
    res: Response = await client.patch(
        f"{USER_URL}/{researcher_user.user_id}/role",
        json={"role": "reviewer"},
        headers=auth_headers(admin_user),
    )
    assert res.status_code == 200
    assert res.json()["role"] == "reviewer"


async def test_user_requests_role_change(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        f"{USER_URL}/me/request-role-change",
        json={"requested_role": "reviewer"},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 200
    assert "submitted" in res.json()["message"]


async def test_user_cannot_request_system_admin(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        f"{USER_URL}/me/request-role-change",
        json={"requested_role": "system_admin"},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 422


# Role change approval
async def test_approve_role_change_request(
    client: AsyncClient, admin_user: User, researcher_user: User
) -> None:
    await client.post(
        f"{USER_URL}/me/request-role-change",
        json={"requested_role": "reviewer"},
        headers=auth_headers(researcher_user),
    )
    res: Response = await client.patch(
        f"{USER_URL}/{researcher_user.user_id}/approve-role-change",
        headers=auth_headers(admin_user),
    )
    assert res.status_code == 200
    assert res.json()["role"] == "reviewer"


async def test_approve_role_change_no_request(
    client: AsyncClient, admin_user: User, researcher_user: User
) -> None:
    res: Response = await client.patch(
        f"{USER_URL}/{researcher_user.user_id}/approve-role-change",
        headers=auth_headers(admin_user),
    )
    assert res.status_code == 400
    assert "no role change" in res.json()["detail"]


async def test_role_change_same_role_rejected(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        f"{USER_URL}/me/request-role-change",
        json={"requested_role": "researcher"},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 400


# Non-existent user
async def test_approve_nonexistent_user(client: AsyncClient, admin_user: User) -> None:
    res: Response = await client.patch(
        f"{USER_URL}/99999/approve", headers=auth_headers(admin_user)
    )
    assert res.status_code == 404


async def test_ban_nonexistent_user(client: AsyncClient, admin_user: User) -> None:
    res: Response = await client.patch(
        f"{USER_URL}/99999/ban", headers=auth_headers(admin_user)
    )
    assert res.status_code == 404
