from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IdMixin, SoftDeleteMixin, TimestampMixin


class Milestone(IdMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "milestones"

    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="未達成")
