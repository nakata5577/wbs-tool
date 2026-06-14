from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskSortUpdate, TaskUpdate

router = APIRouter(tags=["tasks"])


def _get_active_project_or_404(project_id: int, db: Session) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.is_deleted.is_(False))
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _get_active_task_or_404(task_id: int, db: Session) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.is_deleted.is_(False)).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _collect_descendant_ids(task_id: int, db: Session) -> list[int]:
    children = (
        db.query(Task)
        .filter(Task.parent_id == task_id, Task.is_deleted.is_(False))
        .all()
    )
    descendant_ids: list[int] = []
    for child in children:
        descendant_ids.append(child.id)
        descendant_ids.extend(_collect_descendant_ids(child.id, db))
    return descendant_ids


@router.get("/api/projects/{project_id}/tasks", response_model=list[TaskResponse])
def list_tasks(project_id: int, db: Session = Depends(get_db)) -> list[Task]:
    _get_active_project_or_404(project_id, db)
    return (
        db.query(Task)
        .filter(Task.project_id == project_id, Task.is_deleted.is_(False))
        .order_by(Task.sort_order)
        .all()
    )


@router.post(
    "/api/projects/{project_id}/tasks",
    response_model=TaskResponse,
    status_code=201,
)
def create_task(
    project_id: int, body: TaskCreate, db: Session = Depends(get_db)
) -> Task:
    _get_active_project_or_404(project_id, db)

    if body.parent_id is not None:
        parent = (
            db.query(Task)
            .filter(
                Task.id == body.parent_id,
                Task.project_id == project_id,
                Task.is_deleted.is_(False),
            )
            .first()
        )
        if parent is None:
            raise HTTPException(status_code=400, detail="parent_id が無効です")

    sort_order = body.sort_order
    if sort_order is None:
        max_sort = (
            db.query(func.max(Task.sort_order))
            .filter(
                Task.project_id == project_id,
                Task.parent_id == body.parent_id,
                Task.is_deleted.is_(False),
            )
            .scalar()
        )
        sort_order = (max_sort + 1) if max_sort is not None else 0

    task = Task(
        project_id=project_id,
        parent_id=body.parent_id,
        name=body.name,
        description=body.description,
        assignee=body.assignee,
        start_date=body.start_date,
        end_date=body.end_date,
        progress=body.progress,
        status=body.status,
        sort_order=sort_order,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, body: TaskUpdate, db: Session = Depends(get_db)) -> Task:
    task = _get_active_task_or_404(task_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)) -> None:
    _get_active_task_or_404(task_id, db)
    ids_to_delete = [task_id, *_collect_descendant_ids(task_id, db)]
    db.query(Task).filter(Task.id.in_(ids_to_delete)).update(
        {"is_deleted": True}, synchronize_session=False
    )
    db.commit()


@router.patch("/api/tasks/{task_id}/sort", response_model=TaskResponse)
def update_task_sort(
    task_id: int, body: TaskSortUpdate, db: Session = Depends(get_db)
) -> Task:
    task = _get_active_task_or_404(task_id, db)
    task.sort_order = body.sort_order
    db.commit()
    db.refresh(task)
    return task
