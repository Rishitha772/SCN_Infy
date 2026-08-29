from app.models import Researcher, User
from httpx import AsyncClient, Response
from sqlalchemy.ext.asyncio import AsyncSession
from tests.conftest import auth_headers, make_researcher, make_user

PUB_URL = "/api/publications"

VALID_PUB: dict[str, str] = {
    "title": "Attention Is All You Need",
    "publication_type": "journal",
    "status": "draft",
}


async def test_get_all_publications_public(client: AsyncClient) -> None:
    res: Response = await client.get(f"{PUB_URL}/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


async def test_create_publication_success(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    res: Response = await client.post(
        f"{PUB_URL}/", json=VALID_PUB, headers=auth_headers(researcher_user)
    )
    assert res.status_code == 201
    assert res.json()["title"] == VALID_PUB["title"]
    assert res.json()["status"] == "draft"


async def test_create_publication_no_researcher_profile(
    client: AsyncClient, session: AsyncSession
) -> None:
    user: User = await make_user(session)
    res: Response = await client.post(
        f"{PUB_URL}/", json=VALID_PUB, headers=auth_headers(user)
    )
    assert res.status_code == 404
    assert "researcher profile" in res.json()["detail"]


async def test_create_publication_duplicate_doi(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    payload: dict[str, str] = {**VALID_PUB, "doi": "10.1234/unique"}
    await client.post(
        f"{PUB_URL}/", json=payload, headers=auth_headers(researcher_user)
    )
    res: Response = await client.post(
        f"{PUB_URL}/", json=payload, headers=auth_headers(researcher_user)
    )
    assert res.status_code == 409


async def test_get_publication_not_found(client: AsyncClient) -> None:
    res: Response = await client.get(f"{PUB_URL}/99999")
    assert res.status_code == 404


async def test_get_my_publications(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    await client.post(
        f"{PUB_URL}/", json=VALID_PUB, headers=auth_headers(researcher_user)
    )
    res: Response = await client.get(
        f"{PUB_URL}/my", headers=auth_headers(researcher_user)
    )
    assert res.status_code == 200
    assert len(res.json()) >= 1


async def test_update_publication_status(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    create_res: Response = await client.post(
        f"{PUB_URL}/", json=VALID_PUB, headers=auth_headers(researcher_user)
    )
    pub_id = create_res.json()["publication_id"]
    res: Response = await client.patch(
        f"{PUB_URL}/{pub_id}",
        json={"status": "submitted"},
        headers=auth_headers(researcher_user),
    )
    assert res.status_code == 200
    assert res.json()["status"] == "submitted"


async def test_update_publication_no_author_rejected(
    client: AsyncClient,
    researcher_user: User,
    researcher: Researcher,
    session: AsyncSession,
) -> None:
    create_res: Response = await client.post(
        f"{PUB_URL}/", json=VALID_PUB, headers=auth_headers(researcher_user)
    )
    pub_id = create_res.json()["publication_id"]
    other_user: User = await make_user(session)
    await make_researcher(session, other_user)
    res: Response = await client.patch(
        f"{PUB_URL}/{pub_id}",
        json={"status": "published"},
        headers=auth_headers(other_user),
    )
    assert res.status_code == 403


async def test_delete_publication(
    client: AsyncClient, researcher_user: User, researcher: Researcher
) -> None:
    create_res: Response = await client.post(
        f"{PUB_URL}/", json=VALID_PUB, headers=auth_headers(researcher_user)
    )
    pub_id = create_res.json()["publication_id"]
    res: Response = await client.delete(
        f"{PUB_URL}/{pub_id}", headers=auth_headers(researcher_user)
    )
    assert res.status_code == 204


async def test_delete_publication_no_author_rejected(
    client: AsyncClient,
    researcher_user: User,
    researcher: Researcher,
    session: AsyncSession,
) -> None:
    create_res: Response = await client.post(
        f"{PUB_URL}/", json=VALID_PUB, headers=auth_headers(researcher_user)
    )
    pub_id = create_res.json()["publication_id"]
    other_user: User = await make_user(session)
    await make_researcher(session, other_user)
    res: Response = await client.delete(
        f"{PUB_URL}/{pub_id}", headers=auth_headers(other_user)
    )
    assert res.status_code == 403
