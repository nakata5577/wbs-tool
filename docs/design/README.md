---
title: 設計書
---

# 設計書（docs/design/）

WBS・マイルストーン管理ツール の設計ドキュメント。**いま実装がどうなっているか（最新の設計・構造）**を記録する。

> 更新規律: `feat`/`fix` の実装時に該当領域を同時更新する（`commit-msg` フックが未更新を拒否）。詳細は `.claude/rules/design-doc.md`。

## 領域一覧

| ファイル | 領域 | ステータス | 最終更新 |
|--------|------|----------|---------|
| [architecture.md](./architecture.md) | システム全体構成 | draft | 2026-06-14 |
| [data-model.md](./data-model.md) | データモデル（SQLite） | draft | 2026-06-14 |
| [api.md](./api.md) | REST API 設計 | draft | 2026-06-14 |
| [ui.md](./ui.md) | UI/画面設計 | draft | 2026-06-14 |
| [cross-cutting.md](./cross-cutting.md) | 横断的関心事 | draft | 2026-06-14 |

## frontmatter テンプレート（各領域ファイルに必須）

```yaml
---
title: <領域名> 設計
area: <領域キー>          # 例: api / data-model / ui / architecture
status: active            # active | deprecated | draft
relatedIssues: []         # 関連 Issue 番号（number[]。無ければ []）
updated: 2026-06-14       # 最終更新日（YYYY-MM-DD）
kind: ui                  # 任意: ui | api | data | architecture | operations | other
---
```

## 本文節テンプレート

```
## 責務（このユニットは何をするか）
## 構成要素（主要コンポーネント／モジュール）
## データフロー・主要シーケンス
## データモデル（DB を持つ領域のみ・必須）
## 外部依存・インターフェース
## 横断的関心事（任意）
## 主要な設計判断
## UI/画面設計（web/フロント領域のみ・必須）
```

索引はこのファイル（`README.md`）のみ。領域の追加・削除時に更新する。
