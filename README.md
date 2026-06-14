# WBS・マイルストーン管理ツール

エンジニア・PM が日常的に迷わず使える、**WBS・マイルストーン・ガントチャートを中核とした社内専用の開発管理 Web ツール**。チーム（10 人未満）向けに社内ネットワーク限定で提供し、WBS 作成・進捗管理・スケジュール可視化・コメント共有をシームレスに実現する。

---

## セットアップ

**フロントエンド（Next.js + TypeScript）**
```bash
cd frontend && npm install
```

**バックエンド（FastAPI + Python）**
```bash
cd backend && uv sync
```

**DB マイグレーション**
```bash
cd backend && uv run alembic upgrade head
```

## 開発コマンド

| コマンド | 内容 |
|---------|------|
| `cd frontend && npm run dev` | フロントエンド開発サーバー（port 3000） |
| `cd backend && uv run uvicorn app.main:app --reload` | バックエンド API（port 8000） |
| `(cd frontend && npm test -- --watchAll=false) && (cd backend && uv run pytest)` | テスト |
| `(cd frontend && npm run lint) && (cd backend && uv run ruff check .)` | Lint |
| `(cd frontend && npm run format) && (cd backend && uv run ruff format .)` | フォーマット |
| `cd frontend && npm run build` | ビルド |

## 開発ワークフロー

Issue 駆動 + Git Flow + git worktree + TDD（Red-Green-Refactor）+ Spec 駆動 + 多段レビュー + ビジュアル/UX 検証を採用。詳細は `CLAUDE.md`・`.claude/rules/` を参照。

## 前提

- [Claude Code CLI](https://claude.ai/code)
- Python 3（フックスクリプトの実行に必要）
- [GitHub CLI（gh）](https://cli.github.com/)

---

> このプロジェクトは Claude Code エージェント開発ワークフロー・テンプレート v1.5.0 から生成。
