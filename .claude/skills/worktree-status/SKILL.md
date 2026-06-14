---
name: worktree-status
description: アクティブな worktree の一覧と、それぞれの Issue の状態を確認するとき使用する。「worktreeの状態を確認して」「今何のIssueを作業中か教えて」「作業中のブランチを一覧して」が発火ワード。状態の確認のみ（読み取り専用）で、作業の着手・フロー敷設は /dev-tasks、worktree の作成は /worktree-new、削除は /worktree-cleanup を使う。
---

現在の git worktree 一覧と、対応する Issue の状態を表示します。
リモート URL からプラットフォーム（GitHub / GitLab）を自動判定します。

## 手順

### 1. worktree 一覧取得

```bash
git worktree list
```

### 2. プラットフォーム判定

```bash
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if echo "$REMOTE_URL" | grep -q "github.com"; then
  PLATFORM="github"
else
  PLATFORM="gitlab"
fi
```

### 3. Issue番号の抽出と状態確認

各 worktree のブランチ名からIssue番号を抽出する。

```bash
# ブランチ名のパターン: feature/42-xxx, fix/99-xxx など
git worktree list --porcelain | grep 'branch' | sed 's|branch refs/heads/||'
```

Issue番号が含まれるブランチごとに状態を確認：

**GitHub の場合:**
```bash
gh issue view <ISSUE_NUMBER> --json number,title,state \
  --jq '"#\(.number) [\(.state)] \(.title)"' 2>/dev/null
```

**GitLab の場合:**
```bash
glab issue view <ISSUE_NUMBER> --output json 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'#{d[\"iid\"]} [{d[\"state\"]}] {d[\"title\"]}')"
```

### 4. まとめて表示

以下の形式で一覧表示する：

```
worktree 状態サマリー
─────────────────────────────────────────────────────
ディレクトリ             ブランチ                   Issue 状態
../feature-42-login      feature/42-add-login-page  #42 [open] ログイン画面の追加
../fix-99-null-ptr       fix/99-fix-null-pointer    #99 [open] NullPointerException修正
~/work/develop           develop                    (デフォルトブランチ)
~/work/main              main                       (デフォルトブランチ)
─────────────────────────────────────────────────────
合計: 2件の作業中 Issue
```

Issue番号が取得できない（`develop`/`main` など）はスキップしてよい。

### 5. 推奨アクション

作業中 worktree が3件以上ある場合は以下を提示する：

```
作業中 worktree が多い場合は /worktree-cleanup でマージ済みのものを整理できます。
```
