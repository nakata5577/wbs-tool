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
- WBS タスク CRUD API: `GET /api/projects/{id}/tasks`・`POST /api/projects/{id}/tasks`・`PATCH /api/tasks/{id}`・`DELETE /api/tasks/{id}`（子孫連鎖論理削除）・`PATCH /api/tasks/{id}/sort`（並び順変更）(#13)
- WBS エディタ基本機能: タスク追加・インライン編集・削除（子孫カスケード）・折りたたみ/展開・全展開/全折りたたみ・空状態表示（プロジェクトカードから `/projects/:id/wbs` へのリンク付き）(#14)
- WBS ドラッグ＆ドロップ: @dnd-kit によるタスク行の並び替え（sort_order）と階層変更（parent_id）。ドロップ先ゾーン（before/after/child）で位置と親子関係を決定し、楽観的更新＋API 失敗時ロールバック・`role=alert` エラー表示（`PATCH /api/tasks/{id}/move`）(#15)
- タスク詳細パネル: タスク名クリックで右サイドパネルを開き、担当者・開始日・終了日・進捗率・ステータスを編集して PATCH 保存。インライン編集を廃止し操作を集約。アクセシビリティ対応（role=dialog / aria-modal / フォーカストラップ / ESC キー / 自動フォーカス）(#16)
