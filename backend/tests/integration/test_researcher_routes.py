from app.models import User
from httpx import AsyncClient, Response
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import auth_headers, make_user

RESEARCHER_URL = "/api/researchers"


async def test_get_nonexistent_researcher(client: AsyncClient) -> None:
    res: Response = await client.get(f"{RESEARCHER_URL}/99999")
    assert res.status_code == 404


async def test_create_researcher_without_auth(client: AsyncClient) -> None:
    res: Response = await client.post(f"{RESEARCHER_URL}/", json={"name": "Test"})
    assert res.status_code in (401, 403)


async def test_update_researcher_no_profile(
    client: AsyncClient, session: AsyncSession
) -> None:
    user: User = await make_user(session, email="noprofile2@mit.edu")
    res: Response = await client.patch(
        f"{RESEARCHER_URL}/me",
        json={"bio": "test"},
        headers=auth_headers(user),
    )
    assert res.status_code == 404
    assert "researcher profile" in res.json()["detail"]
