# CLAUDE.md

このファイルは Claude Code（claude.ai/code）がこのプロジェクトで作業する際のガイダンスを提供する。**プロジェクト共通の指示はここに集約**し、コードベース固有の情報は `/project-setup` や `/init` で追記する。


---

## プロジェクト設定（このプロジェクトのプロファイル）

> `/project-setup` がこの表と `.claude/project-profile.json` を同時に埋める。手動で変える場合は両方を更新すること。
> スキル・エージェントはこの値（テストコマンド・デフォルトブランチ等）を、hook は `protectedGlobs` / `protectedBranches` / `checks` を参照して動作する。

| 項目 | 値 |
|------|----|
| プロジェクト名 | WBS ツール（wbs-tool） |
| 種別 | web |
| 言語 | TypeScript（フロントエンド）、Python（バックエンド） |
| パッケージマネージャ | npm（frontend）、uv（backend） |
| ビルド | `cd frontend && npm run build` |
| 開発サーバ | `cd frontend && npm run dev`（フロント: port 3000）、`cd backend && uv run uvicorn app.main:app --reload`（API: port 8000） |
| テスト | `(cd frontend && npm test -- --watchAll=false) && (cd backend && uv run pytest)` |
| Lint | `(cd frontend && npm run lint) && (cd backend && uv run ruff check .)` |
| フォーマット | `(cd frontend && npm run format) && (cd backend && uv run ruff format .)` |
| マイグレーション | `cd backend && uv run alembic upgrade head` |
| 結合テスト | （未設定） |
| カバレッジ | （未設定） |
| デプロイ | （未定） |
| VCS ホスト | github |
| デフォルトブランチ | `develop` |
| 保護ブランチ | `develop`, `main` |
| フロントエンドディレクトリ | `frontend` |

> 機械可読版（hook が読む）: `.claude/project-profile.json`
>
> （大規模・任意）複数フロントは `frontendDirs[]`、モノレポ/マルチサービスは `services[]` を `.claude/project-profile.json` で機械可読に宣言できる（単一キー動線＝`frontendDir`／`commands.*` は既定のまま。使い方は `.claude/rules/scale.md`）。

---

## 標準開発ワークフロー（Issue 駆動 + Worktree + TDD + Spec 駆動）

全作業は **Issue（= 仕様書）を起点**とし、Issue ごとに独立した git worktree を作成して TDD で実装する。

| 要素 | 規則ファイル |
|------|-------------|
| Git Flow / Worktree / Conventional Commits | `.claude/rules/git-workflow.md` |
| TDD（Red-Green-Refactor） | `.claude/rules/tdd.md` |
| テストレベル体系（結合・総合・受入・性能） | `.claude/rules/testing-strategy.md` |
| Spec 駆動開発（L1/L2/L3 Issue 型） | `.claude/rules/spec-driven.md` |
| すり合わせ規律（曖昧さ規律・論点ディスカッション・理解の照返し・設計オプション比較・AC ウォークスルー・未決事項管理） | `.claude/rules/alignment.md` |
| 生きた設計書（`docs/design/`）・ドキュメント体系 | `.claude/rules/design-doc.md` |
| コードレビュー観点・接頭辞 | `.claude/rules/code-review.md` |
| 運用（監視・障害対応・バックアップ/DR・データ移行・マニュアル・OSS ライセンス） | `.claude/rules/operations.md` |
| 大規模・スケール時の注意（モノレポ/マルチサービス・多数 Issue） | `.claude/rules/scale.md` |
| 命名規則（言語別） | `.claude/rules/naming-{java,js,py}.md` |

### ドキュメント体系（実装の実態を残す）

| ドキュメント | 役割 | 更新タイミング |
|------------|------|--------------|
| `docs/要件定義書.md` | WHAT/WHY（初期合意）。「テスト方針」節＝テスト戦略の真実源（`.claude/rules/testing-strategy.md`）・「未決事項」節＝未決論点・デフォルト適用の可視化（`.claude/rules/alignment.md`） | `/project-setup`・要件が変わったら該当節を改訂し「変更履歴」節に追記（未決事項の解消手順は `.claude/rules/alignment.md`。乖離・必須節の欠落は `/project-resync` が点検） |
| Issue 本文の AC（`[x]`） | 実装の達成状況 | 実装完了時に同期（gh/glab） |
| `docs/design/` | HOW（最新の設計・構造。frontmatter 必須） | マージ毎（`commit-msg`／`pre-commit` の astro check／CI の三段で強制）。設計に影響する Issue は実装前に `status: draft` で先行更新（実装前設計） |
| `CHANGELOG.md` | 利用者向けの変更履歴 | マージ毎に `[Unreleased]`、リリースで確定（`/release-notes`） |
| `docs/用語集.md` | 業務用語（日本語）→ 英語識別子の対訳辞書（訳語のブレ防止・ローマ字禁止規律の受け皿） | `/project-setup` が初期生成・新しい業務概念を命名したら追記 |
| `docs/test/` | 総合テスト（システムテスト）・リリース後スモークの実行記録（例: `docs/test/release-vX.Y.Z-system-test.md`） | リリース毎（`/release-tasks` がタスク敷設） |
| `docs/操作マニュアル.md`・`docs/運用ガイド.md` | エンドユーザー向け操作手順／運用者向け手順（提供形態に応じて任意生成。`.claude/rules/operations.md`「マニュアル体系」） | 操作・運用に影響するリリースで更新（`/release-notes`・`/release-tasks` のチェックリストが確認） |

詳細は `.claude/rules/design-doc.md`。設計書 frontmatter のスキーマ（真実源）と公開サイトは `docs-site/`（Astro+Starlight）。`docs/` 全体は Pages へ自動デプロイされ、**公開範囲はリポジトリの可視性と独立**（private リポジトリ ≠ private サイト。注意の正は `docs-site/README.md`、公開可否の確認は `/project-setup` の「docs サイト有効化」ゲートと `.claude/rules/operations.md`）。

### 1 ステップずつの標準フロー

| ステップ | 主スキル・コマンド／エージェント | 補助（superpowers など） |
|---------|----------------------|--------------------------|
| 0. プロジェクト適合 | `/project-setup` | — |
| 1. Issue 起票（Spec 作成） | `/github-planning` または `/gitlab-planning`（起票前ゲートで**全 L2 Issue の AC ウォークスルー**＋未決事項の依存チェック＝`.claude/rules/alignment.md`） | `superpowers:writing-plans` |
| 2. Worktree 作成 | `/worktree-new` | `superpowers:using-git-worktrees` |
| 2.5 実装前設計（設計に影響する場合・人間承認） | 設計オプション比較を経て `docs/design/<領域>.md` を `status: draft` で先行作成/更新し `AskUserQuestion` で設計承認（比較・UI 2 案以上・no-op 照返しの作法は `.claude/rules/alignment.md`、draft 先行は `.claude/rules/design-doc.md`） | `superpowers:brainstorming`（設計探索） |
| 3. テスト先行（Red） | `test-writer` | `superpowers:test-driven-development` |
| 4. 実装（Green） | `feature-dev:feature-dev` | （UI 実装時・書く前に）`frontend-design:frontend-design`・`superpowers:subagent-driven-development`・（テスト失敗時）`superpowers:systematic-debugging` |
| 4.5 ビジュアル/UX 検証（Web/UI 変更時） | `frontend-reviewer`（スクショ取得→確認→`must:` 0 まで修正を反復） | `frontend-design:frontend-design`（改善提案） |
| 5. AC/DoD 同期 | 達成 AC（L2 Issue）と実装した L3 Task 本文の AC/DoD を gh/glab で `[x]` に反映 | — |
| 6. リファクタ（Refactor） | `code-simplifier:code-simplifier` | — |
| 7. ドキュメント更新 | `docs/design/`（設計書）＋ `CHANGELOG.md` の `[Unreleased]` を更新 | `.claude/rules/design-doc.md` |
| 8. コミット | `/git-commit` | `superpowers:verification-before-completion` |
| 9. レビュー | `code-reviewer` | `pr-review-toolkit:review-pr`・`superpowers:requesting-code-review` |
| 10. マージ | `/ship` | `superpowers:finishing-a-development-branch` |
| 11. クローズ（ファイナライズ） | `/github-finalize`・`/gitlab-finalize`（DoD 最終同期→クローズ前ゲート→明示クローズ） | — |
| 12. クリーンアップ | `/worktree-cleanup` | `/clean_gone` |

> **起動方法の凡例**: `/name`・`plugin:name` のスキル/コマンドは **Skill ツール**で、エージェントは **Task ツール**（`subagent_type`）で起動する。ローカルの 4 エージェント（`test-writer`・`code-reviewer`・`security-reviewer`・`frontend-reviewer`＝`.claude/agents/` に実体）は bare 名で、**プラグイン提供のエージェント**（`code-simplifier:code-simplifier`・`feature-dev:code-explorer`）は名前空間付きで渡す（bare 名では `Agent type ... not found`・スラッシュでは起動しない）。`feature-dev:feature-dev`・`pr-review-toolkit:review-pr` は**コマンド**であり同名のエージェントは無い（Task で呼ばない）。bare `code-reviewer` はローカルエージェントを指す（プラグインの同名とは別物）。

`/project-setup`（適合フロー）と `/dev-tasks`（開発フロー ステップ 2.5〜12 ＝ **12 タスク**。worktree 未作成時のみ先頭にステップ 2 の worktree 作成 `/worktree-new` を加えて **13 タスク**）が各ステップを Task として自動生成し、`blockedBy` で直列化する（途中で飛ばさないため）。`/worktree-new` 自体は worktree/ブランチ作成のみを担う。

> **リリース工程（Milestone 完了後）**: リリース判定 → 総合テスト → 受入チェックリスト（UAT・該当時）→ リリースノート確定（`/release-notes` の実行を案内）→ release ブランチ・`main` 反映＋タグ → `develop` への戻しマージ → リリース後スモーク → マニュアル・ドキュメント最終確認、の **8 タスク**は `/release-tasks` が同様に直列敷設する（`/dev-tasks` の「クローズ＆ファイナライズ」が Milestone 完了時にリリースを提案する）。

### Worktree の命名規則

ブランチ `feature/42-add-login-page` → ディレクトリ `../feature-42-add-login-page`（スラッシュ→ハイフン・リポジトリの兄弟ディレクトリ）。派生元ブランチは「プロジェクト設定」の `defaultBranch`（既定 `develop`）。詳細は `.claude/rules/git-workflow.md`「git worktree 運用」節。

### 条件発火スキル/エージェント

| 状況 | スキル/エージェント |
|------|--------------------|
| バグ・テスト失敗時 | `superpowers:systematic-debugging` |
| メモリリーク・高メモリ使用の調査時（Web/ブラウザで再現するもの） | `chrome-devtools-mcp` の `memory-leak-debugging`（ブラウザのページを操作して `take_heapsnapshot` で取得→`memlab` で解析。生 `.heapsnapshot` は直接読まない。ブラウザを介さない純 Node サーバのヒープは別途取得が要る） |
| 新機能の設計前 | `superpowers:brainstorming` |
| 既存コードへ機能追加する Issue の Spec を書く前（AC・スコープを実装の現状に接地させる） | `feature-dev:code-explorer`（実行経路・抽象を辿り読むべき主要ファイルを返す読み取り専用探索。起動は上記凡例＝Task の名前空間付き） |
| 不慣れ／更新の速い外部ライブラリの API を使う・最新ドキュメントが要るとき | `context7`（`resolve-library-id`→`query-docs` で当該バージョンのドキュメント・コード例を取得） |
| 独立タスクが 2 つ以上 | `superpowers:dispatching-parallel-agents` |
| セキュリティ確認（API・認証変更時） | `security-reviewer` |
| UI/フロント実装・変更時 | **実装前（必須）**: `frontend-design:frontend-design`（Skill ツール）でデザイン指針（タイポグラフィ・配色・モーション・レイアウト）を読み込んでから書く ／ **実装後**: `frontend-reviewer`（ビジュアル・a11y・レスポンシブ確認。`playwright`/`chrome-devtools-mcp`。改善提案には `frontend-design:frontend-design` も使う） |
| Lint 新規導入 | `/setup-js`・`/setup-python` |
| リリース準備時（Milestone 完了・リリース作業の開始） | `/release-tasks`（リリース工程の 8 タスクを敷設＝内訳は上記「リリース工程」注記。CHANGELOG 確定・リリースノート生成だけなら `/release-notes` を直接実行） |
| セッションで判明した知見（隠れたコマンド・落とし穴・効いた手順）を CLAUDE.md に残したい時 | `/revise-claude-md`（このセッションの学びを CLAUDE.md に追記。improver の定期保守とは別＝その場の発見を取りこぼさない） |
| 完了基準が明確で自動検証（テスト/Lint）がある反復・無人タスク | `ralph-loop:ralph-loop`（**必ず `--max-iterations` を主たる安全網にする**＝無限ループ防止。`--completion-promise` は完了フレーズの exact 一致による補助的な早期終了で、単独では無限ループを止められない。停止は `/cancel-ralph`。`/dev-tasks` 内の自律はビルトインの `/goal` を使い、人間ゲート（マージ/片付け）を挟む工程では Stop フックが exit を阻むため ralph を被せない） |
| 同じ是正・指摘を繰り返している（同種のミスを再発防止したい） | `/hookify`（会話を分析し warn/block する恒久フックを生成。`remember` の受動的「記憶」に対し tool-use 時に強制する） |
| Claude Code 設定の最適化（初回） | `/project-setup`（recommender・improver を内包＝「カスタムエージェント一覧」下の注記） |
| スタックが大きく変わった後の再同期 | `/project-resync`（recommender・improver・プロファイルを現行スタックへ再同期） |
| コンテキストを clear／終了する前（次セッションへ引き継ぐ） | `/remember`（次に何をするかのハンドオフを `.remember/remember.md` に記録。継続メモリの自動保存とは別の、明示的な引き継ぎ） |

---

## カスタムスキル一覧（`.claude/skills/`）

| スキル | 発火ワード例 |
|--------|------------|
| `/project-setup` | 「セットアップして」「プロジェクトを初期化して」「このテンプレを適用して」 |
| `/project-resync` | 「再同期して」「設定を見直して」「自動化を再評価して」「スタックが変わったので設定を更新して」 |
| `/worktree-new` | 「worktree を作って」「新しいブランチを作って」 |
| `/dev-tasks` | 「Issue #42 の作業を始めて」「開発タスクを敷いて」「作業フローを立てて」「TDD の作業計画を立てて」 |
| `/worktree-status` | 「worktree の状態を確認して」 |
| `/worktree-cleanup` | 「worktree を掃除して」「後片付けして」 |
| `/git-commit` | 「コミットして」「コミットメッセージを作って」 |
| `/ship` | 「main に反映して」「マージして」 |
| `/pr-description` | 「PR を作って」「PR 説明文を作って」 |
| `/review-diff` | 「差分をレビューして」「変更をチェックして」「この diff を見て」 |
| `/release-notes` | 「リリースノートを作って」「CHANGELOG を生成して」 |
| `/release-tasks` | 「リリースして」「リリース準備して」「リリース作業を始めて」「リリースタスクを敷いて」 |
| `/github-planning` | 「GitHub に起票して」「Issue を起票して」 |
| `/github-finalize` | 「GitHub の Issue をクローズして」「ファイナライズして」 |
| `/gitlab-planning` | 「GitLab に起票して」「Milestone/Issue を作成して」 |
| `/gitlab-finalize` | 「GitLab の Issue をクローズして」「ファイナライズして」 |
| `/setup-js` | 「ESLint を入れて」「Lint を設定して」 |
| `/setup-python` | 「Ruff を設定して」「Lint を入れて」 |
| `/claude-code-docs` | 「Claude Code の使い方を調べて」 |
| `/openapi-sync` | 「型定義を同期して」「openapi sync して」「APIの型を更新して」 |

## カスタムエージェント一覧（`.claude/agents/`）

| エージェント | 用途 |
|------------|------|
| `code-reviewer` | feature/fix の変更を汎用観点 + プロジェクト固有チェック（任意追記）でレビュー |
| `test-writer` | プロジェクトのテスト規約に従ってユニットテストを生成 |
| `security-reviewer` | API・認証まわりのセキュリティ審査（OWASP 観点） |
| `frontend-reviewer` | UI 変更のデザイン/UX/アクセシビリティ/レスポンシブを審査（スクショ確認。`frontendDir` 設定時） |

> スタック固有のエージェント・スキルは固定の実例を同梱しない。`/project-setup`（`claude-code-setup:claude-automation-recommender`・`claude-md-management:claude-md-improver`）でプロジェクトに合わせて生成・追記する。

---

## Hooks（自動実行）

`.claude/settings.json` がフックスクリプト（`.claude/hooks/*.py`）を呼ぶ（python3 が必要）。**ローマ字識別子の検知と completed 時リマインダーは profile 非依存で常時有効**。`protectedGlobs`／`checks` は設定するまで no-op。`protectedBranches` は出荷時 `develop`/`main` が入っており、それらのブランチ上での直接編集（`.claude/` 配下・`CLAUDE.md` を除く）を警告する。

| フック | タイミング | 内容 |
|--------|-----------|------|
| `pre_edit.py` | PreToolUse（Edit/MultiEdit/Write） | `protectedGlobs` 一致をブロック（自動生成物保護）／`protectedBranches` への直接編集を警告 |
| `post_edit.py` | PostToolUse（Edit/MultiEdit/Write） | ローマ字識別子の検知（常時）／`checks` 定義の言語別チェック（型チェック・コンパイル等）を実行 |
| `pre_task_update.py` | PreToolUse（TaskUpdate） | タスクを `completed` にする瞬間に「【完了条件】/DoD の証拠（コマンド出力・差分・URL 等）を会話で提示したか」のリマインダーを注入（非ブロック・常時有効。`.claude/rules/alignment.md` の大原則の機械的な歯止め） |
| `check_hooks_setup.py` | SessionStart | 設定不備の警告（非ブロック）: ① `core.hooksPath` が `.githooks` 未設定（＝git ネイティブフックが無効） ② `kind=web` なのに `frontendDir` が空（＝ビジュアル/UX 検証が全段沈黙。`"none"`＝UI なしの明示では出ない。hooksPath 設定済みでも独立に出る）。いずれも `name` 設定済みプロジェクトのみ（git 管理外・name 空では沈黙、①は `commitMessage.enabled:false` でも沈黙） |

言語別チェックを足すには `.claude/project-profile.json` の `checks` に追記する：

```json
{ "match": "**/*.ts", "command": "npx tsc --noEmit", "cwdFromRoot": true, "timeout": 60 }
```

### git ネイティブフック（`.githooks/commit-msg`・`pre-commit`）

上記は Claude Code フック（`.claude/settings.json` 経由）だが、コミット規律は **git ネイティブの 2 フック**で強制する。`git config core.hooksPath .githooks` を設定すると有効になる（`/project-setup` が初回コミット後に設定する）：

- **`commit-msg`**: Conventional Commits 形式（`<type>(<scope>): …`・scope 必須）と body 必須を検証して不適合コミットを**拒否**し、ブランチ名のチケット番号から `Refs #N` を自動補完する（`.claude/project-profile.json` の `commitMessage` で調整＝キー一覧と詳細は `.claude/rules/git-workflow.md` の「コミットメッセージ」節）。あわせて**生きた設計書チェック**も行い、`feat`/`fix` コミットで `docs/design/` 配下が未更新かつ body に `Design: none` が無ければ**拒否**する（`designDoc` で調整）。
- **`pre-commit`**: `docs/design/` を編集したコミットで `docs-site`（Astro+Starlight）の `astro check` を実行し、設計書 frontmatter のスキーマ不適合を**拒否**する（`docsSite` で調整。`commit-msg`＝「更新したか」に対する相補ガード＝「構造が正しいか」。`docs-site/node_modules` 未導入の worktree はフックが `npm ci` を案内する）。

設計書規律と設定キーの詳細は `.claude/rules/design-doc.md`。リモートでも `design-doc-check` CI と Pages ビルド（スキーマ＝ビルド成功条件）が二重ガードする（下記「同梱 CI」）。

> **`core.hooksPath` はクローンに継承されない**（git config のため）。チームで共有するプロジェクトでは各自が clone 後に `git config core.hooksPath .githooks` を再実行する。

フックと並ぶガードレールとして、`.claude/settings.json` の **permissions** も出荷時に設定済み：マージ等の不可逆操作（`gh pr merge`・`glab mr merge`・release/リポジトリ削除・secret/variable 操作・`git reset --hard`・`git clean -f`）は **`ask`（確認制）**で人間ゲート（push＝最終承認・マージ承認）を機械的に裏付ける。秘密ファイル（`.env`・`.env.*`・`**/secrets/**`・`*.pem`/`*.key`/`id_rsa*`/`id_ed25519*` の鍵類）は **`Read` ツールでの読み取りを deny** している（force push・`rm -rf` 系も deny）。なお ask は gh/glab の専用サブコマンドを捕捉する best-effort であり（`gh api` 直叩きは対象外）、Read の deny は Read ツールに効く（Bash 経由の読み取りは確認制と `security-guidance` プラグインが補完する）。`.env.example` も deny に含まれるため、設定例の確認は利用者が提示するか確認制の Bash で行う。

`.claude/settings.json`・hooks・permissions を Claude に変更させる場合は **auto mode をオフ**にすること（auto mode では `.claude/` 配下の書き込みがブロックされる）。

### 同梱 CI（GitHub Actions／GitLab CI）

ガードレールはローカルのフックだけでなくリモート（CI）でも守る。同梱 CI は次の 6 つ：

| CI | 役割 | 既定の状態 |
|----|------|-----------|
| `design-doc-check` | 設計書規律（feat/fix の PR/MR で `docs/design/` 更新を要求）。要件定義書の必須節チェック（`requirements-doc-check`・警告のみ）と `kind: ui` 設計書の「UI/画面設計」節チェック（`ui-section-check`）のジョブも同居 | 有効 |
| `secret-scan`（GitHub: `.github/workflows/secret-scan.yml`／GitLab: `.gitlab/ci/secret-scan.yml`） | 秘密情報（API キー・トークン等）のコミット混入を gitleaks で検出（スキャン範囲・誤検知の逃がし・多段ガードの正は `.claude/rules/operations.md`「秘密情報の管理」） | 有効（検出のみ fail。gitleaks 取得失敗等の環境問題は警告して成功） |
| `docs-deploy`（GitHub）／`pages`（GitLab） | `docs/` の Pages 公開＋設計書スキーマ検証（ビルド成功条件） | 有効 |
| `app-test` | アプリのテスト/Lint/ビルド（profile の `commands` を実行）＋ feat/fix の PR/MR にテストの追加・更新を必須化（`test-required` ジョブ。逃がしは PR/MR 本文の `Test: none` 行か `test:none` ラベル） | `commands` が空のうちは安全に no-op |
| `release-deploy`（GitHub: `release-deploy.yml`／GitLab: `.gitlab/ci/deploy.yml`） | タグ push（`v*`）起点のデプロイ雛形（build→deploy→smoke。デプロイ先依存の中身はコメント雛形） | `commands.deploy` が空のうちは no-op |
| Dependabot（`.github/dependabot.yml`・GitHub のみ） | 依存更新の自動 PR（実効エントリは `docs-site`（npm）と同梱 CI（github-actions）。スタック分はコメント例から有効化。GitLab は Renovate／Dependency Scanning を案内） | `docs-site`・github-actions が有効 |

`app-test`／`release-deploy` は **`/project-setup` が `commands` 確定時に有効化**する（言語セットアップのコメント雛形を整える。不要なら削除する——GitLab はルート `.gitlab-ci.yml` の該当 `include` 行も外す）。

---

## 有効なプラグイン（`.claude/settings.json`）

ワークフロー統合系（`superpowers`・`feature-dev`・`pr-review-toolkit`・`code-review`・`commit-commands`・`code-simplifier`）、コードインテリジェンス（`serena`・各種 LSP・`context7`）、ブラウザ/フロント（`playwright`・`chrome-devtools-mcp`・`frontend-design`＝**UI を書き始める前に必ず読み込む生成系スキル**。使い方の正は上記「条件発火スキル/エージェント」表）、運用補助（`ralph-loop`・`hookify`・`remember`・`skill-creator`・`claude-code-setup`・`claude-md-management`・`security-guidance`）が有効。

- **`playwright` / `chrome-devtools-mcp` の用途分担**: スクリーンショット取得・ブラウザ操作（E2E）は `playwright` を既定とし、`chrome-devtools-mcp` は性能トレース（LCP 分解の `debug-optimize-lcp`）・ヒープスナップショット等の DevTools 機能に使う（両方有効なため、どちらでも撮れるスクショで迷わないための既定）。
- **`serena`**: コーディング開始前に `initial_instructions` を呼ぶ（操作マニュアルのロード）。大規模コードベースの調査・影響範囲確認には、ファイル全読みより `get_symbols_overview`／`find_symbol`／`find_referencing_symbols` を優先する（言語サーバ駆動の意味的ナビゲーション）。
- **`context7`**: 記憶で API を書かず、不慣れ／更新の速い外部ライブラリは使う前に最新ドキュメントを取得して確認する（取得手順は上記「条件発火スキル/エージェント」表）。
- **`remember`**: フック（SessionStart/PostToolUse）で継続メモリが自動稼働する（結線不要）。明示的なハンドオフは `/remember`（使いどころは上記「条件発火スキル/エージェント」表）。既定はローカル（`.remember/` は gitignore 済み）で、チームでハンドオフを共有するなら `.gitignore` から外す。

### MCP サーバー（`.mcp.json`）

`.mcp.json` に `chrome-devtools`（ブラウザ操作・Web プロジェクト向け）を同梱している。`.claude/settings.json` の `enabledMcpjsonServers` に `chrome-devtools` を入れてあるため**既定で承認済み**（起動のたびに承認プロンプトは出ない）。MCP サーバーを追加した場合は、同じく `enabledMcpjsonServers` に名前を足すか、初回の承認プロンプトで許可する。Web を扱わないプロジェクトでは `.mcp.json` の当該エントリと `enabledMcpjsonServers` から削除してよい。

> **バージョン固定**: 同梱エントリは `chrome-devtools-mcp@1.2.0` に固定している（`@latest` に戻さない＝未審査の最新版がセッション起動のたびに無確認で実行される）。npx 直指定の MCP サーバーは Dependabot の走査対象外のため、更新は `/project-resync` の依存点検などの節目に意図的な作業として書き換える（手順の正は `.github/dependabot.yml` の注記）。

---

## コーディング規約（言語非依存の基本）

詳細は `.claude/rules/naming-{java,js,py}.md`。主要ルール（命名は hook がローマ字変数名を検知する）：

- **推測で埋めない（すり合わせ規律）**: 仕様の曖昧さを検出したら、推測で埋めずに実装前に `AskUserQuestion` で確認する（曖昧さの定義と作法は `.claude/rules/alignment.md`）。
- **ローマ字変数名禁止**: `syouhin`, `torihiki`, `kanri`, `shori` などのローマ字識別子は使わない（英語名を使う）。
- **業務用語の英語名は `docs/用語集.md` の対訳に従う**（無ければ追記してから使う）: 同一概念に複数の英語名（訳語のブレ）を生まない。
- **ハンガリアン記法禁止**: `strName`, `iCount` など。
- **Boolean のゲッター**: `isEnabled()`（`getIsEnabled()` ではない）。
- **コミットは Conventional Commits**: `<type>(<scope>): <description>`（scope 必須）＋ body 必須（WHY と影響範囲）。`commit-msg` フックが検証する（`.claude/rules/git-workflow.md`）。
- **`feat`/`fix` には対応するテストを含める**（テストなしコミット禁止）。
- **UI 実装時の最低基準**: レスポンシブ（主要ブレークポイントで崩れない）・キーボード操作・コントラスト（WCAG AA）・空/ローディング/エラー状態を最低限満たす。**コンポーネントは状態別カタログ（既定 Storybook。非対応スタックは同等手段 or 設計書に opt-out 理由）を持つ**（カタログ未導入のプロジェクトは `/project-resync` のデザイン土台点検で導入する）、**UI 変更時はスクリーンショットを残す**（保存先は `docs/screenshots/`）。**書き始める前の `frontend-design:frontend-design` 読み込み（上記「条件発火スキル/エージェント」表）も必須。この最低基準は下限であって目標ではない（目指す方向は `docs/要件定義書.md` の「UI/UX 方針」節を参照）。**「テスト緑＝完了」ではない（見た目は `frontend-reviewer` が確認する）。詳細な UI 規約は `/project-setup` が生成・蓄積する。

---

## アーキテクチャ概要

### モノレポ構成

```
1-5-0/
├── frontend/   # Next.js 16 (App Router) + TypeScript + shadcn/ui
├── backend/    # FastAPI + Python + SQLite (SQLAlchemy + Alembic)
└── docs/       # 要件定義書・設計書・スクリーンショット
```

### フロントエンド（`frontend/`）

- **フレームワーク**: Next.js 16（App Router）、Turbopack（開発時）
- **スタイル**: Tailwind CSS v4 + shadcn/ui（`components/ui/`）
- **ルーティング**: `frontend/app/` 以下を App Router で管理（`page.tsx`/`layout.tsx`）
- **コンポーネント**: `frontend/components/ui/` に shadcn/ui 生成コンポーネントを置く
  - 自動生成ファイルのため直接編集しない（変更は `npx shadcn add` で再生成）
- **ユーティリティ**: `frontend/lib/utils.ts`（`cn()` 関数）
- **Lint/Format**: ESLint（`eslint.config.mjs`）+ Prettier（`.prettierrc`）
  - `eslint-config-next` が jsx-a11y を内包するため `eslint-plugin-jsx-a11y` の二重登録は不要
- **テスト**: Jest + React Testing Library（`__tests__/`、`jest.config.ts`）
- **コンポーネントカタログ**: Storybook（`stories/`、`npm run storybook`）

#### コンポーネント追加

```bash
cd frontend && npx shadcn add <component>   # shadcn/ui コンポーネントを追加
```

#### テスト単独実行

```bash
cd frontend && npm test -- --testPathPatterns="<パターン>"
```

### バックエンド（`backend/`）

- **フレームワーク**: FastAPI（`backend/app/main.py`）
- **DB**: SQLite（SQLAlchemy + Alembic。接続先は環境変数 `DATABASE_URL`）
- **パッケージ管理**: `uv`（`uv.lock` で固定）
- **Lint/Format**: Ruff（`pyproject.toml` で設定。`target-version = "py312"`）
- **テスト**: pytest（`backend/tests/`、`asyncio_mode = "auto"`）
- **CORS**: 開発中は `http://localhost:3000` を許可（`app/main.py`）

#### テスト単独実行

```bash
cd backend && uv run pytest tests/test_<file>.py -k "<テスト名>"
```

### 全体の起動手順（ローカル開発）

```bash
# ターミナル 1: フロントエンド
cd frontend && npm run dev          # http://localhost:3000

# ターミナル 2: バックエンド
cd backend && uv run uvicorn app.main:app --reload  # http://localhost:8000
```

### 認証・データ保護

社内ネットワーク限定のため認証なし。個人情報は扱わない（`docs/要件定義書.md` 参照）。

### 自動生成ファイル（編集禁止）

- `frontend/components/ui/` — shadcn/ui 生成コンポーネント（`npx shadcn add` で再生成）
- `frontend/next-env.d.ts` — Next.js 型定義
- `frontend/stories/` の Button.tsx / Header.tsx / Page.tsx — Storybook デモ（削除可）
