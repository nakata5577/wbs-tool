@AGENTS.md

## フロントエンド固有の注意

### shadcn/ui
- `components/ui/` は `npx shadcn add <component>` で自動生成。**直接編集しない**（次回 add で上書きされる）。
- カスタマイズは `components/` 直下に独自コンポーネントを作り、`components/ui/` からインポートして拡張する。

### Storybook
- `npm run storybook`（port 6006）でコンポーネントカタログを確認。
- 新コンポーネントを追加したら `stories/<Component>.stories.ts` も作成する（状態別カタログ必須）。

### テスト
- `npm test` で Jest + RTL を実行。単独実行: `npm test -- --testPathPatterns="<パターン>"`
- `components/ui/` のテストは不要（shadcn/ui が保証）。自作コンポーネントのみ対象。

### ESLint の jsx-a11y
- `eslint-config-next` が jsx-a11y を内包するため `eslint-plugin-jsx-a11y` を `jsxA11y.flatConfigs.recommended` で再登録すると `Cannot redefine plugin` エラーになる。`eslint.config.mjs` では追加しない。
