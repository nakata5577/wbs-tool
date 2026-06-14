from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IdMixin


class Notification(IdMixin, Base):
    __tablename__ = "notifications"

    # 通知は追記専用（更新・論理削除なし）。created_at のみで
    # TimestampMixin / SoftDeleteMixin は持たない。
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id"), nullable=False, index=True
    )
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
