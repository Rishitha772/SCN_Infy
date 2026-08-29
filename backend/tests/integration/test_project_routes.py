from app.models import Researcher, User
from httpx import AsyncClient, Response
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import auth_headers, make_researcher, make_user

PROJECT_URL = "/api/projects"

VALID_PROJECT: dict[str, str] = {
    "name": "NLP Research Project",
    "description": "Researching neural language models",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
}


# Create
async def test_create_project_success(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    res: Response = await client.post(
        f"{PROJECT_URL}/", json=VALID_PROJECT, headers=auth_headers(researcher_user)
    )
    assert res.status_code == 201
    assert res.json()["name"] == VALID_PROJECT["name"]
    assert res.json()["status"] == "active"


async def test_create_project_without_researcher_profile(
    client: AsyncClient, session: AsyncSession
) -> None:
    user: User = await make_user(session)
    res: Response = await client.post(
        f"{PROJECT_URL}/", json=VALID_PROJECT, headers=auth_headers(user)
    )
    assert res.status_code == 404
    assert "researcher profile" in res.json()["detail"]


async def test_create_project_end_before_start(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    res: Response = await client.post(
        f"{PROJECT_URL}/",
        json={**VALID_PROJECT, "start_date": "2024-12-31", "end_date": "2024-01-01"},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 422


async def test_create_project_with_co_researchers(
    client: AsyncClient,
    researcher_user: User,
    researcher: Researcher,
    session: AsyncSession,
) -> None:
    other_user: User = await make_user(session)
    other_researcher: Researcher = await make_researcher(session, other_user)
    res: Response = await client.post(
        f"{PROJECT_URL}/",
        json={**VALID_PROJECT, "researcher_ids": [other_researcher.researcher_id]},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 201


async def test_create_project_unauthenticated(client: AsyncClient) -> None:
    res: Response = await client.post(f"{PROJECT_URL}/", json=VALID_PROJECT)
    assert res.status_code in (401, 403)


# Read
async def test_get_all_projects_public(client: AsyncClient) -> None:
    res: Response = await client.get(f"{PROJECT_URL}/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


async def test_get_project_not_found(client: AsyncClient) -> None:
    res: Response = await client.get(f"{PROJECT_URL}/99999")
    assert res.status_code == 404


async def test_get_my_projects(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    await client.post(
        f"{PROJECT_URL}/", json=VALID_PROJECT, headers=auth_headers(researcher_user)
    )
    res: Response = await client.get(
        f"{PROJECT_URL}/my", headers=auth_headers(researcher_user)
    )
    assert res.status_code == 200
    assert len(res.json()) >= 1


# Update
async def test_update_project_status(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    create_res: Response = await client.post(
        f"{PROJECT_URL}/", json=VALID_PROJECT, headers=auth_headers(researcher_user)
    )
    project_id = create_res.json()["project_id"]
    res: Response = await client.patch(
        f"{PROJECT_URL}/{project_id}",
        json={"status": "completed"},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 200
    assert res.json()["status"] == "completed"


async def test_update_project_non_member_rejected(
    client: AsyncClient,
    researcher_user: User,
    researcher: Researcher,
    session: AsyncSession,
) -> None:
    create_res: Response = await client.post(
        f"{PROJECT_URL}/", json=VALID_PROJECT, headers=auth_headers(researcher_user)
    )
    project_id = create_res.json()["project_id"]
    other_user: User = await make_user(session)
    await make_researcher(session, other_user)
    res: Response = await client.patch(
        f"{PROJECT_URL}/{project_id}",
        json={"status": "cancelled"},
        headers=auth_headers(other_user),
    )
    assert res.status_code == 403


# Delete
async def test_delete_project_as_pi(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    create_res: Response = await client.post(
        f"{PROJECT_URL}/", json=VALID_PROJECT, headers=auth_headers(researcher_user)
    )
    project_id = create_res.json()["project_id"]
    res: Response = await client.delete(
        f"{PROJECT_URL}/{project_id}", headers=auth_headers(researcher_user)
    )
    assert res.status_code == 204


async def test_delete_project_non_pi_rejected(
    client: AsyncClient,
    researcher_user: User,
    researcher: Researcher,
    session: AsyncSession,
) -> None:
    create_res: Response = await client.post(
        f"{PROJECT_URL}/",
        json={**VALID_PROJECT, "researcher_ids": []},
        headers=auth_headers(researcher_user),
    )
    project_id = create_res.json()["project_id"]

    other_user: User = await make_user(session)
    other_researcher: Researcher = await make_researcher(session, other_user)

    # add other as member via new project with them included
    res: Response = await client.delete(
        f"{PROJECT_URL}/{project_id}", headers=auth_headers(other_user)
    )
    assert res.status_code == 403


async def test_delete_nonexistent_project(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    res: Response = await client.delete(
        f"{PROJECT_URL}/99999", headers=auth_headers(researcher_user)
    )
    assert res.status_code in (403, 404)
