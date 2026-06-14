from pydantic import BaseModel, Field, model_validator


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None

    @model_validator(mode="after")
    def at_least_one_field(self) -> "ProjectUpdate":
        if self.name is None and self.description is None:
            raise ValueError("name または description のいずれかを指定してください")
        return self


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_deleted: bool

    model_config = {"from_attributes": True}
