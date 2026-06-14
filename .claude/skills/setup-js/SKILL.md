---
name: setup-js
description: JS/TS プロジェクトに ESLint・Prettier を新規セットアップするとき使用する。「ESLint を入れて」「Prettier を設定して」「JS/TS の Lint を設定して」が発火ワード。Python の Ruff 導入は /setup-python。既存設定の修正や特定の Lint エラー修正では使わない。
---

JavaScript/TypeScript プロジェクトに ESLint（Flat Config）+ Prettier を新規セットアップします。

## 手順

### 1. 対象ディレクトリを確認

`$ARGUMENTS` が指定された場合はそのディレクトリ、なければカレントディレクトリを対象にする。`package.json` の存在を確認する（なければ `npm init -y`）。

### 2. 依存関係のインストール

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-config-prettier prettier
```

> Vue を使う場合は `eslint-plugin-vue` も追加する。
> **フロント（React/JSX）を含む場合はアクセシビリティ Lint も入れる**: `npm install -D eslint-plugin-jsx-a11y`（React なら `eslint-plugin-react` も）。コントラスト以外の静的に検出可能な a11y 欠陥（ラベル欠落・不正な `role`・キーボード非対応）を Lint で早期に捕捉できる。

### 3. 設定ファイルを生成する

`eslint.config.js`（Flat Config）をプロジェクトルートに作成する：

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // フロント（JSX）を含む場合は a11y ルールを足す（要 eslint-plugin-jsx-a11y）:
  //   import jsxA11y from "eslint-plugin-jsx-a11y";
  //   jsxA11y.flatConfigs.recommended,
  prettier, // フォーマット系ルールを無効化（Prettier に委譲）
  {
    ignores: ["dist/**", "build/**", "node_modules/**", "**/*.min.js"],
  }
);
```

> **デザイン土台（任意・Web プロジェクト）**: デザインの一貫性を保つため、デザイントークン（色・余白・タイポの定義）／コンポーネントカタログ（Storybook 等）／デザインシステムの採否を検討する。具体ライブラリはスタック依存。詳細は `/project-setup` の Web 分岐で扱う。

`.prettierrc`：

```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

`.prettierignore`：

```
dist
build
node_modules
*.min.js
```

### 4. package.json にスクリプトを追加

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### 5. 動作確認

```bash
npm run lint
npm run format:check
```

### 6. プロファイルへ反映

CLAUDE.md「プロジェクト設定」と `.claude/project-profile.json` の `commands.lint`（`npm run lint`）・`commands.format`（`npm run format`）を更新する。
TypeScript を使う場合、`.claude/project-profile.json` の `checks` に型チェックを追加すると編集後に自動実行される：

```json
{ "match": "**/*.ts", "command": "npx tsc --noEmit", "cwdFromRoot": true, "timeout": 60 }
```

設定完了後、適用した内容と次のステップを報告する。
