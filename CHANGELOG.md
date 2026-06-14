# Changelog

このプロジェクトのすべての変更点はこのファイルに記録する。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に従い、
バージョン管理は [Semantic Versioning](https://semver.org/lang/ja/) に準拠する。

## [Unreleased]

### Added
- バックエンド基盤: SQLAlchemy 2.x モデル定義（Project/Task/Milestone/Comment/Notification）と Alembic 初期マイグレーション (#10)
- FastAPI 初期設定: CORS・`GET /health`・グローバル例外ハンドラー（404/422 はFastAPIデフォルト）(#10)
- プロジェクト CRUD API: `GET /api/projects`・`POST /api/projects`・`PATCH /api/projects/{id}`・`DELETE /api/projects/{id}`（論理削除）(#11)
- プロジェクト一覧・作成画面: カードグリッド一覧（3列/1列レスポンシブ）・クライアント側検索・新規作成モーダル (#12)
