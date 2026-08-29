from app.models import User
from httpx import AsyncClient, Response
from tests.conftest import auth_headers

INST_URL = "/api/institutions"

VALID_INST: dict[str, str] = {
    "name": "Oxford University",
    "country": "UK",
    "city": "Oxford",
    "type": "university",
}


async def test_create_institution_as_admin(
    client: AsyncClient, admin_user: User
) -> None:
    res: Response = await client.post(
        f"{INST_URL}/", json=VALID_INST, headers=auth_headers(admin_user)
    )
    assert res.status_code == 201
    assert res.json()["name"] == VALID_INST["name"]


async def test_create_institution_as_researcher_forbidden(
    client: AsyncClient, researcher_user: User
) -> None:
    res: Response = await client.post(
        f"{INST_URL}/", json=VALID_INST, headers=auth_headers(researcher_user)
    )
    assert res.status_code == 403


async def test_create_duplicate_institution_rejected(
    client: AsyncClient, admin_user: User
) -> None:
    await client.post(f"{INST_URL}/", json=VALID_INST, headers=auth_headers(admin_user))
    res: Response = await client.post(
        f"{INST_URL}/", json=VALID_INST, headers=auth_headers(admin_user)
    )
    assert res.status_code == 409


async def test_get_all_institutions_public(client: AsyncClient) -> None:
    res: Response = await client.get(f"{INST_URL}/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


async def test_get_institution_not_found(client: AsyncClient) -> None:
    res: Response = await client.get(f"{INST_URL}/99999")
    assert res.status_code == 404


async def test_update_institution_as_admin(
    client: AsyncClient, admin_user: User
) -> None:
    create_res: Response = await client.post(
        f"{INST_URL}/", json=VALID_INST, headers=auth_headers(admin_user)
    )
    inst_id = create_res.json()["institution_id"]
    res: Response = await client.patch(
        f"{INST_URL}/{inst_id}",
        json={"city": "London"},
        headers=auth_headers(admin_user),
    )
    assert res.status_code == 200
    assert res.json()["city"] == "London"


async def test_delete_institution_as_admin(
    client: AsyncClient, admin_user: User
) -> None:
    create_res: Response = await client.post(
        f"{INST_URL}/", json=VALID_INST, headers=auth_headers(admin_user)
    )
    inst_id = create_res.json()["institution_id"]
    res: Response = await client.delete(
        f"{INST_URL}/{inst_id}", headers=auth_headers(admin_user)
    )
    assert res.status_code == 204
