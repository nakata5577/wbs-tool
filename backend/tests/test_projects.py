"""Issue #11: プロジェクト CRUD API の結合テスト
Sub #29: GET /api/projects, POST /api/projects
Sub #30: PATCH /api/projects/{id}, DELETE /api/projects/{id}, 404
"""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.base import Base

TRANSPORT = ASGITransport(app=app)
BASE_URL = "http://test"

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestingSession = sessionmaker(bind=_engine)


def _override_get_db():
    db = _TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=_engine)
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=_engine)


# ── Sub #29: GET /api/projects ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_projects_returns_empty_list():
    """GET /api/projects — プロジェクトが 0 件のとき空リストを返す（200）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        response = await client.get("/api/projects")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_projects_returns_created_projects():
    """GET /api/projects — 作成済みプロジェクトが一覧で返る"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        await client.post("/api/projects", json={"name": "プロジェクト A"})
        await client.post("/api/projects", json={"name": "プロジェクト B"})
        response = await client.get("/api/projects")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert items[0]["name"] == "プロジェクト A"
    assert items[1]["name"] == "プロジェクト B"


@pytest.mark.asyncio
async def test_get_projects_excludes_soft_deleted():
    """GET /api/projects — 論理削除済みプロジェクトは一覧に含まれない"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        create_res = await client.post("/api/projects", json={"name": "削除予定"})
        project_id = create_res.json()["id"]
        await client.delete(f"/api/projects/{project_id}")
        response = await client.get("/api/projects")
    assert response.status_code == 200
    assert response.json() == []


# ── Sub #29: POST /api/projects ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_post_project_creates_project():
    """POST /api/projects — name のみでプロジェクトを作成し 201 で返す"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        response = await client.post("/api/projects", json={"name": "新規プロジェクト"})
    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["name"] == "新規プロジェクト"
    assert body["description"] is None
    assert body["is_deleted"] is False


@pytest.mark.asyncio
async def test_post_project_with_description():
    """POST /api/projects — description 付きでプロジェクトを作成できる"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        response = await client.post(
            "/api/projects",
            json={"name": "説明付き", "description": "詳細な説明"},
        )
    assert response.status_code == 201
    body = response.json()
    assert body["description"] == "詳細な説明"


# ── Sub #30: PATCH /api/projects/{id} ────────────────────────────────────────

@pytest.mark.asyncio
async def test_patch_project_updates_name():
    """PATCH /api/projects/{id} — name を部分更新できる（200）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        create_res = await client.post("/api/projects", json={"name": "旧名前"})
        project_id = create_res.json()["id"]
        response = await client.patch(
            f"/api/projects/{project_id}", json={"name": "新名前"}
        )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "新名前"
    assert body["is_deleted"] is False


@pytest.mark.asyncio
async def test_patch_project_updates_description():
    """PATCH /api/projects/{id} — description を部分更新できる（200）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        create_res = await client.post(
            "/api/projects", json={"name": "プロジェクト", "description": "旧説明"}
        )
        project_id = create_res.json()["id"]
        response = await client.patch(
            f"/api/projects/{project_id}", json={"description": "新説明"}
        )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "プロジェクト"
    assert body["description"] == "新説明"


@pytest.mark.asyncio
async def test_patch_project_not_found_returns_404():
    """PATCH /api/projects/{id} — 存在しない ID は 404"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        response = await client.patch("/api/projects/999", json={"name": "x"})
    assert response.status_code == 404


# ── Sub #30: DELETE /api/projects/{id} ───────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_project_returns_204():
    """DELETE /api/projects/{id} — 論理削除して 204 No Content を返す"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        create_res = await client.post("/api/projects", json={"name": "削除対象"})
        project_id = create_res.json()["id"]
        response = await client.delete(f"/api/projects/{project_id}")
    assert response.status_code == 204
    assert response.content == b""


@pytest.mark.asyncio
async def test_delete_project_not_found_returns_404():
    """DELETE /api/projects/{id} — 存在しない ID は 404"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        response = await client.delete("/api/projects/999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_already_deleted_project_returns_404():
    """DELETE /api/projects/{id} — 削除済みプロジェクトへの DELETE は 404"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        create_res = await client.post("/api/projects", json={"name": "二重削除"})
        project_id = create_res.json()["id"]
        await client.delete(f"/api/projects/{project_id}")
        response = await client.delete(f"/api/projects/{project_id}")
    assert response.status_code == 404
