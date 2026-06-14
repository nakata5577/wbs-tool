from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IdMixin, SoftDeleteMixin, TimestampMixin


class Project(IdMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
