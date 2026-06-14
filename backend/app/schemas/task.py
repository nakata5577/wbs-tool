from datetime import date

from pydantic import BaseModel, Field, model_validator


class TaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    assignee: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    progress: int = Field(0, ge=0, le=100)
    status: str = "未着手"
    sort_order: int | None = None
    parent_id: int | None = None


class TaskUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    assignee: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    progress: int | None = Field(None, ge=0, le=100)
    status: str | None = None

    @model_validator(mode="after")
    def at_least_one_field(self) -> "TaskUpdate":
        if all(value is None for value in self.__dict__.values()):
            raise ValueError("少なくとも1つのフィールドを指定してください")
        return self


class TaskSortUpdate(BaseModel):
    sort_order: int


class TaskResponse(BaseModel):
    id: int
    project_id: int
    parent_id: int | None
    name: str
    description: str | None
    assignee: str | None
    start_date: date | None
    end_date: date | None
    progress: int
    status: str
    sort_order: int
    is_deleted: bool

    model_config = {"from_attributes": True}
