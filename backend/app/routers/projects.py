from fastapi import APIRouter

from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(body: ProjectCreate) -> ProjectResponse:
    # DB 未接続のスタブ（Green フェーズ用）。永続化は後続 Issue で実装する。
    return ProjectResponse(
        id=1, name=body.name, description=body.description, is_deleted=False
    )
