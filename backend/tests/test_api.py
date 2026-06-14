"""Sub #28: FastAPI 初期設定（CORS・ヘルスチェック・グローバル例外ハンドラー）"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

TRANSPORT = ASGITransport(app=app)
BASE_URL = "http://test"


@pytest.mark.asyncio
async def test_health_returns_ok():
    """GET /health — {"status": "ok"} が返る（200）"""
    # given: FastAPI アプリ起動済み
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # when
        response = await client.get("/health")
    # then
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_unknown_route_returns_404():
    """GET /api/nonexistent — 存在しないルートは 404"""
    # given: FastAPI アプリ起動済み
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # when
        response = await client.get("/api/nonexistent")
    # then
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_invalid_project_body_returns_422():
    """POST /api/projects with invalid body — バリデーションエラーは 422"""
    # given: FastAPI アプリ起動済み
    async with AsyncClient(transport=TRANSPORT, base_url=BASE_URL) as client:
        # when: 不正なボディ（必須フィールドなし）で POST
        response = await client.post("/api/projects", json={"wrong_field": 123})
    # then: 422 Unprocessable Entity
    assert response.status_code == 422
