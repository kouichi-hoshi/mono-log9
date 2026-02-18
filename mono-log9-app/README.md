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
