from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class IdMixin:
    """サロゲート主キー（自動採番の id）を提供する。"""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)


class TimestampMixin:
    """作成・更新日時を提供する。server_default で DB 側の現在時刻を採用する。"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )


class SoftDeleteMixin:
    """論理削除フラグ（is_deleted）を提供する。"""

    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
