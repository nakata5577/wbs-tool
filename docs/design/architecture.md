---
title: アーキテクチャ設計
area: architecture
status: draft
relatedIssues: []
updated: 2026-06-14
kind: architecture
---

# アーキテクチャ設計

## 責務

システム全体の構成・コンポーネント間の関係・デプロイ構成・非機能設計を記述する。他の設計領域の照合元となる。

## 構成要素

### システム概観

```mermaid
flowchart TB
    subgraph Client["クライアント（ブラウザ）"]
        FE["Next.js 15（App Router）\nTypeScript + shadcn/ui\nport: 3000"]
    end

    subgraph Server["サーバー"]
        BE["FastAPI\nPython 3.13\nSQLAlchemy 2.x + Alembic\nport: 8000"]
        DB[("SQLite\n./data/app.db")]
    end

    Client -- "HTTP/REST（JSON）" --> BE
    BE --> DB
```

### コンポーネント構成

```mermaid
flowchart LR
    subgraph Frontend["frontend/（Next.js）"]
        AppRouter["App Router\n(app/)"]
        Components["コンポーネント\n(src/components/)"]
        Hooks["カスタムフック\n(src/hooks/)"]
        Types["API型定義\n(src/types/api.d.ts)"]
        AppRouter --> Components
        Components --> Hooks
        Types --> Components
    end

    subgraph Backend["backend/（FastAPI）"]
        Routers["APIルーター\n(app/routers/)"]
        Models["SQLAlchemyモデル\n(app/models/)"]
        Schemas["Pydanticスキーマ\n(app/schemas/)"]
        DBFile[("SQLite\ndata/app.db")]
        Routers --> Models
        Routers --> Schemas
        Models --> DBFile
    end

    Frontend -- "HTTP/REST" --> Backend
    Backend -. "openapi-typescript" .-> Types
```

## データフロー・主要シーケンス

### タスク進捗更新

```mermaid
sequenceDiagram
    participant U as チームメンバー
    participant FE as Next.js
    participant BE as FastAPI
    participant DB as SQLite

    U->>FE: タスク詳細で進捗率を変更
    FE->>BE: PATCH /api/tasks/{id} { progress: 80 }
    BE->>DB: UPDATE tasks SET progress=80, updated_at=now
    DB-->>BE: OK
    BE->>DB: INSERT notifications (type=task_update)
    DB-->>BE: OK
    BE-->>FE: 200 { task: {...} }
    FE-->>U: 画面更新
```

### ガントチャート表示

```mermaid
sequenceDiagram
    participant U as チームメンバー
    participant FE as Next.js
    participant BE as FastAPI
    participant DB as SQLite

    U->>FE: ガントチャート画面を開く
    FE->>BE: GET /api/projects/{id}/tasks
    BE->>DB: SELECT tasks WHERE project_id=X ORDER BY sort_order
    DB-->>BE: タスク一覧
    BE-->>FE: 200 [{ task }...]
    FE->>BE: GET /api/projects/{id}/milestones
    BE->>DB: SELECT milestones WHERE project_id=X
    DB-->>BE: マイルストーン一覧
    BE-->>FE: 200 [{ milestone }...]
    FE-->>U: ガントチャートを描画
```

## 外部依存・インターフェース

| 依存 | バージョン | 役割 |
|------|---------|------|
| Next.js | 15 | フロントエンドフレームワーク（App Router） |
| TypeScript | 5.x | フロント言語 |
| shadcn/ui | 最新 | UI コンポーネントライブラリ（Radix UI ベース） |
| Tailwind CSS | v4 | CSS フレームワーク |
| FastAPI | 最新安定版 | バックエンド API フレームワーク |
| Python | 3.13 | バックエンド言語 |
| SQLAlchemy | 2.x | Python ORM |
| Alembic | 最新安定版 | DB マイグレーション管理 |
| SQLite | 3.x | データベース（`./data/app.db`） |

**API スキーマ**: FastAPI が `GET /openapi.json` を自動生成。フロントエンドの型定義（`src/types/api.d.ts`）は `/openapi-sync` スキルで同期する（手書き型定義との二重管理を避ける）。

## 非機能設計

### パフォーマンス目標

| 指標 | 目標値 | 計測条件 |
|------|-------|---------|
| 画面初期ロード | 3 秒以内 | 1,000 タスクのプロジェクト |
| 一般操作（保存・更新） | 1 秒以内 | 通常操作 |
| ガントチャート描画 | 2 秒以内 | 100 タスク以上 |
| 同時接続 | 10 人未満 | SQLite の書き込みロック考慮 |

### セキュリティ境界

- 認証なし（社内ネットワーク/VPN でアクセス制御）
- CORS: フロントエンドオリジンのみ許可（`localhost:3000` / 本番 URL）
- 入力バリデーション: フロント（React Hook Form + Zod）・バック（Pydantic）の二層

### 可用性・監視

- ヘルスチェック: `GET /health`（FastAPI 実装済み）
- ログ: FastAPI 標準ログ（標準出力、エラーレベル以上）
- バックアップ: SQLite ファイルの定期バックアップ（デプロイ先確定後に設計）

## 主要な設計判断

- **SQLite 採用**: 10 人未満の小規模社内ツールのため。サーバー不要・運用コスト最小。同時書き込みが問題になる規模になれば PostgreSQL へ移行検討。
- **認証なし**: 社内ネットワーク（VPN/LAN）でアクセス制御するため、アプリレベル認証を省略。担当者名はフリーテキスト入力。
- **OpenAPI スキーマ駆動**: FastAPI の `/openapi.json` を真実源とし、`openapi-typescript` でフロント型定義を自動生成。型の手書き二重管理を避ける。
- **Next.js App Router + FastAPI の分離**: フロント（SSR/RSC）とバック（REST API）を明確に分離し、バックを将来的に独立デプロイ可能な状態を保つ。
