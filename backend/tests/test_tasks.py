"""Issue #13: WBS タスク CRUD API の結合テスト
Sub #33: GET /api/projects/{id}/tasks, POST /api/projects/{id}/tasks
Sub #34: PATCH /api/tasks/{id}, DELETE /api/tasks/{id}, PATCH /api/tasks/{id}/sort
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
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=_engine)
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=_engine)


async def _create_project(client: AsyncClient, name: str = "テストプロジェクト") -> int:
    """テスト用プロジェクトを作成して id を返す"""
    res = await client.post("/api/projects", json={"name": name})
    return res.json()["id"]


# ── Sub #33: GET /api/projects/{id}/tasks ─────────────────────────────────────


@pytest.mark.asyncio
async def test_get_tasks_returns_empty_list():
    """GET /api/projects/{id}/tasks — タスクが 0 件のとき空リストを返す（200）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        # when
        response = await client.get(f"/api/projects/{project_id}/tasks")
    # then
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_tasks_returns_tasks_sorted_by_sort_order():
    """GET /api/projects/{id}/tasks — タスクが sort_order 昇順で返る"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "タスクC", "sort_order": 3},
        )
        await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "タスクA", "sort_order": 1},
        )
        await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "タスクB", "sort_order": 2},
        )
        # when
        response = await client.get(f"/api/projects/{project_id}/tasks")
    # then
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 3
    assert [item["name"] for item in items] == ["タスクA", "タスクB", "タスクC"]


@pytest.mark.asyncio
async def test_get_tasks_excludes_soft_deleted():
    """GET /api/projects/{id}/tasks — is_deleted=True のタスクは一覧に含まれない"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        create_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "削除予定タスク"},
        )
        task_id = create_res.json()["id"]
        await client.delete(f"/api/tasks/{task_id}")
        # when
        response = await client.get(f"/api/projects/{project_id}/tasks")
    # then
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_tasks_not_found_project_returns_404():
    """GET /api/projects/{id}/tasks — 存在しないプロジェクト ID は 404"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given / when
        response = await client.get("/api/projects/999/tasks")
    # then
    assert response.status_code == 404


# ── Sub #33: POST /api/projects/{id}/tasks ────────────────────────────────────


@pytest.mark.asyncio
async def test_post_task_creates_task_with_201():
    """POST /api/projects/{id}/tasks — name 指定でタスクを作成し 201 で返す"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        # when
        response = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "新規タスク"},
        )
    # then
    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int) and body["id"] > 0
    assert body["name"] == "新規タスク"
    assert body["project_id"] == project_id
    assert body["is_deleted"] is False
    assert body["progress"] == 0
    assert body["status"] == "未着手"


@pytest.mark.asyncio
async def test_post_task_without_sort_order_appends_to_end():
    """POST /api/projects/{id}/tasks — sort_order 未指定のとき同一親の max+1 になる"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "タスク1", "sort_order": 1},
        )
        await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "タスク2", "sort_order": 2},
        )
        # when — sort_order を指定しない
        response = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "タスク3（末尾）"},
        )
    # then
    assert response.status_code == 201
    body = response.json()
    assert body["sort_order"] == 3


@pytest.mark.asyncio
async def test_post_task_with_parent_id():
    """POST /api/projects/{id}/tasks — parent_id 付きで子タスクを作成できる"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        parent_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "親タスク"},
        )
        parent_id = parent_res.json()["id"]
        # when
        response = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "子タスク", "parent_id": parent_id},
        )
    # then
    assert response.status_code == 201
    body = response.json()
    assert body["parent_id"] == parent_id
    assert body["project_id"] == project_id


@pytest.mark.asyncio
async def test_post_task_not_found_project_returns_404():
    """POST /api/projects/{id}/tasks — 存在しないプロジェクトへのタスク作成は 404"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given / when
        response = await client.post(
            "/api/projects/999/tasks",
            json={"name": "タスク"},
        )
    # then
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_post_task_with_cross_project_parent_id_returns_400():
    """POST /api/projects/{id}/tasks — 別プロジェクトの parent_id は 400"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_a_id = await _create_project(client, "プロジェクトA")
        project_b_id = await _create_project(client, "プロジェクトB")
        task_in_b = await client.post(
            f"/api/projects/{project_b_id}/tasks",
            json={"name": "プロジェクトBのタスク"},
        )
        task_b_id = task_in_b.json()["id"]
        # when — プロジェクトAのタスクに別プロジェクトBのタスクを親に指定
        response = await client.post(
            f"/api/projects/{project_a_id}/tasks",
            json={"name": "不正タスク", "parent_id": task_b_id},
        )
    # then
    assert response.status_code == 400


# ── Sub #34: PATCH /api/tasks/{id} ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_patch_task_updates_progress():
    """PATCH /api/tasks/{id} — progress を部分更新できる（200）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        create_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "進捗更新タスク"},
        )
        task_id = create_res.json()["id"]
        # when
        response = await client.patch(
            f"/api/tasks/{task_id}",
            json={"progress": 50},
        )
    # then
    assert response.status_code == 200
    body = response.json()
    assert body["progress"] == 50
    assert body["name"] == "進捗更新タスク"


@pytest.mark.asyncio
async def test_patch_task_updates_status():
    """PATCH /api/tasks/{id} — status を部分更新できる（200）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        create_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "ステータス更新タスク"},
        )
        task_id = create_res.json()["id"]
        # when
        response = await client.patch(
            f"/api/tasks/{task_id}",
            json={"status": "進行中"},
        )
    # then
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "進行中"
    assert body["name"] == "ステータス更新タスク"


@pytest.mark.asyncio
async def test_patch_task_clears_nullable_field():
    """PATCH /api/tasks/{id} — nullable フィールドを null 送信でクリアできる（200）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        create_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "担当者付きタスク", "assignee": "田中"},
        )
        task_id = create_res.json()["id"]
        # when — assignee を null で明示クリア
        response = await client.patch(
            f"/api/tasks/{task_id}",
            json={"assignee": None},
        )
    # then — 422 ではなく 200 が返り、assignee が null になる
    assert response.status_code == 200
    assert response.json()["assignee"] is None


@pytest.mark.asyncio
async def test_patch_task_empty_body_returns_422():
    """PATCH /api/tasks/{id} — 空ボディは 422"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        create_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "テストタスク"},
        )
        task_id = create_res.json()["id"]
        # when
        response = await client.patch(f"/api/tasks/{task_id}", json={})
    # then
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_task_not_found_returns_404():
    """PATCH /api/tasks/{id} — 存在しない ID は 404"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given / when
        response = await client.patch(
            "/api/tasks/999",
            json={"progress": 10},
        )
    # then
    assert response.status_code == 404


# ── Sub #34: DELETE /api/tasks/{id}（連鎖論理削除）──────────────────────────


@pytest.mark.asyncio
async def test_delete_task_returns_204():
    """DELETE /api/tasks/{id} — 論理削除して 204 No Content を返す"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        create_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "削除対象タスク"},
        )
        task_id = create_res.json()["id"]
        # when
        response = await client.delete(f"/api/tasks/{task_id}")
    # then
    assert response.status_code == 204
    assert response.content == b""


@pytest.mark.asyncio
async def test_delete_task_cascades_to_children():
    """DELETE /api/tasks/{id} — 子タスクも is_deleted=True になる（連鎖論理削除）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        parent_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "親タスク"},
        )
        parent_id = parent_res.json()["id"]
        child_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "子タスク", "parent_id": parent_id},
        )
        child_id = child_res.json()["id"]
        # when
        await client.delete(f"/api/tasks/{parent_id}")
        # then — 子タスクも論理削除されており GET 一覧に出ない
        response = await client.get(f"/api/projects/{project_id}/tasks")
    assert response.status_code == 200
    ids_in_list = [item["id"] for item in response.json()]
    assert child_id not in ids_in_list


@pytest.mark.asyncio
async def test_delete_task_cascades_to_grandchildren():
    """DELETE /api/tasks/{id} — 孫タスクも is_deleted=True になる（連鎖論理削除）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        parent_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "親タスク"},
        )
        parent_id = parent_res.json()["id"]
        child_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "子タスク", "parent_id": parent_id},
        )
        child_id = child_res.json()["id"]
        grandchild_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "孫タスク", "parent_id": child_id},
        )
        grandchild_id = grandchild_res.json()["id"]
        # when
        await client.delete(f"/api/tasks/{parent_id}")
        # then — 孫タスクも論理削除されており GET 一覧に出ない
        response = await client.get(f"/api/projects/{project_id}/tasks")
    assert response.status_code == 200
    ids_in_list = [item["id"] for item in response.json()]
    assert grandchild_id not in ids_in_list


@pytest.mark.asyncio
async def test_delete_task_not_found_returns_404():
    """DELETE /api/tasks/{id} — 存在しない ID は 404"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given / when
        response = await client.delete("/api/tasks/999")
    # then
    assert response.status_code == 404


# ── Sub #34: PATCH /api/tasks/{id}/sort ──────────────────────────────────────


@pytest.mark.asyncio
async def test_patch_sort_updates_sort_order():
    """PATCH /api/tasks/{id}/sort — sort_order が更新される（200）"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given
        project_id = await _create_project(client)
        create_res = await client.post(
            f"/api/projects/{project_id}/tasks",
            json={"name": "並び順変更タスク", "sort_order": 1},
        )
        task_id = create_res.json()["id"]
        # when
        response = await client.patch(
            f"/api/tasks/{task_id}/sort",
            json={"sort_order": 5},
        )
    # then
    assert response.status_code == 200
    body = response.json()
    assert body["sort_order"] == 5
    assert body["id"] == task_id


@pytest.mark.asyncio
async def test_patch_sort_not_found_returns_404():
    """PATCH /api/tasks/{id}/sort — 存在しない ID は 404"""
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # given / when
        response = await client.patch(
            "/api/tasks/999/sort",
            json={"sort_order": 1},
        )
    # then
    assert response.status_code == 404
