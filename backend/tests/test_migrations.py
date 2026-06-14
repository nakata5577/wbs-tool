"""Sub #27: SQLAlchemy モデル定義・Alembic 初期マイグレーション"""

import os
import subprocess
from pathlib import Path

from sqlalchemy import create_engine, inspect

BACKEND_DIR = Path(__file__).parent.parent


def test_sqlalchemy_models_define_5_tables():
    """SQLAlchemy Base.metadata — 5テーブルの定義が存在する"""
    # given: app.models が実装されている
    # when: Base.metadata を参照する
    from app.models import Base  # noqa: PLC0415

    table_names = set(Base.metadata.tables.keys())

    # then: 5テーブルが定義されている
    expected = {"projects", "tasks", "milestones", "comments", "notifications"}
    assert expected == table_names, f"Missing tables: {expected - table_names}"


def test_alembic_creates_5_tables_in_fresh_db(tmp_path):
    """alembic upgrade head — 空の SQLite に5テーブルを作成する"""
    # given: マイグレーション未適用の SQLite DB
    db_url = f"sqlite:///{tmp_path}/migration_test.db"

    # when: alembic upgrade head を実行
    result = subprocess.run(
        ["uv", "run", "alembic", "upgrade", "head"],
        env={**os.environ, "DATABASE_URL": db_url},
        capture_output=True,
        text=True,
        cwd=str(BACKEND_DIR),
    )
    assert result.returncode == 0, f"alembic upgrade head failed:\n{result.stderr}"

    # then: 5テーブルが存在する
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    expected = {"projects", "tasks", "milestones", "comments", "notifications"}
    assert expected.issubset(tables), f"Missing tables: {expected - tables}"
