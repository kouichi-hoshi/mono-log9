# mono-log9-app

メモ/ノート投稿アプリ（Next.js + TypeScript）。
ノートは TipTap JSON を保存形式とし、現在は Unit テストと Playwright UI テストで回帰を検知します。

## 前提

- Node.js 22+
- pnpm

## セットアップ

```bash
pnpm install
```

## 開発サーバー

```bash
pnpm dev
```

- アクセス: [http://127.0.0.1:3000](http://127.0.0.1:3000)

## 主要コマンド

```bash
pnpm lint
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
```

## Jest（Unit / 結合テスト）

```bash
# 通常実行（DB結合テストはスキップ）
pnpm jest

# DB結合テストを含めて全実行（DATABASE_URL 有効・DB起動が必要）
RUN_DB_INTEGRATION_TESTS=true pnpm jest
```

DB結合テストは `RUN_DB_INTEGRATION_TESTS=true` のときのみ実行されます。詳細は `../docs/test-cases/項番28_TipTapノート永続化_テストケース.md` を参照。

## Playwright UIモード

アプリディレクトリ（`mono-log9-app`）にいる場合:

```bash
pnpm run test:e2e:ui
```

リポジトリルートにいる場合:

```bash
pnpm -C mono-log9-app run test:e2e:ui
```

補足:
- E2E 実行時は `playwright.config.ts` の `webServer` 設定により、`USE_STUB_AUTH=true USE_STUB_POSTS=true` で `pnpm dev` が起動します。
