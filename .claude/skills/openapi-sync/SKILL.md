---
name: openapi-sync
description: FastAPI の /openapi.json からフロントエンド向け TypeScript 型定義を生成する。バックエンド API を変更した後に実行して型ずれを防ぐ。「型定義を同期して」「openapi sync して」「APIの型を更新して」が発火ワード。
---

# openapi-sync

FastAPI の `/openapi.json` を取得し、`openapi-typescript` でフロントエンドの TypeScript 型定義を生成する。

## 手順

### 1. バックエンドが起動しているか確認

```bash
curl -s http://localhost:8000/health | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('status')=='ok' else 'NG')"
```

起動していなければ「先にバックエンドを起動してください: `cd backend && uv run uvicorn app.main:app --reload`」と案内して終了。

### 2. openapi-typescript のインストール確認

```bash
cd frontend && npx openapi-typescript --version 2>/dev/null || echo "not installed"
```

未インストールなら: `cd frontend && npm install -D openapi-typescript`

### 3. スキーマ取得 → 型定義生成

```bash
cd frontend && npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.d.ts
```

生成先: `frontend/src/types/api.d.ts`

### 4. 生成結果を確認して報告

```bash
head -20 frontend/src/types/api.d.ts
```

生成したパスと主要な型名（`components['schemas']` のキー）を報告する。

## 注意

- `frontend/src/types/api.d.ts` は自動生成ファイル。直接編集しない（次回 sync で上書きされる）。
- バックエンドの API を変更したら必ず実行する（`feat`/`fix` の PR/MR 前に確認）。
