---
title: 02. 設定-環境変数-PWA（設計書V2）
source:
author:
  -
published:
created: 2026-01-30
description:
tags:
---

本ファイルは設計書V1（アーカイブ済み）から、設定・環境変数・PWA/manifest に関する章を分割したもの。

## この章で決めること

- env ファイル構成（local/test/stg/prd）
- 環境変数のキー設計と用途（Auth.js/DB/スタブ切替）
- PWA/manifest の実装設計（キー、icons、初期方針）

## この章の守備範囲

- 「どの環境変数が必要か」「何に使うか」を扱う（値そのものは扱わない）
- 認証フローやDBモデルの詳細は扱わない

## 関連ドキュメント（参照先）

- 認証/認可: `docs/03.v2/20_認証-認可-スタブ.md`
- UI基盤（PWAの色の前提など）: `docs/03.v2/03_UI基盤.md`

# 設定
## envファイル構成

| 種類  | ローカル開発     | ローカルテスト   | STG    | PRD    |
| --- | ---------- | --------- | ------ | ------ |
| env | .env.local | .env.test | Vercel | Vercel |

## 環境変数設計

| key                  | stg/prod（Vercel env） | local（.env.local） | 備考                                                              |
| -------------------- | ---------------------- | ------------------- | --------------------------------------------------------------- |
| DATABASE_URL         | Neonのpooling           | ローカルDBのURL      |                                                                 |
| DATABASE_DIRECT_URL  | Neonのpooling無し       | ローカルDBのURL（通常 `DATABASE_URL` と同値でOK） |                                                                 |
| AUTH_SECRET          | 本番用の値              | local用の値           | [公式のコマンドで生成する](https://authjs.dev/guides/environment-variables) |
| AUTH_URL             | VercelのURL（stg/prod） | `http://localhost:3000` | Auth.js が参照するベースURL（リダイレクト/コールバックURLの基準）。Auth.js v5 前提。 |
| GOOGLE_CLIENT_ID     | GoogleCloudから取得     | スタブ（開発中）      |                                                                 |
| GOOGLE_CLIENT_SECRET | GoogleCloudから取得     | スタブ（開発中）      |                                                                 |
| USE_STUB_AUTH        | 未設定（無効）           | `true` の場合のみ有効 | 開発専用。未指定/`false` は無効。`NODE_ENV=test/production` では常に無効（Route Handler / `authAdapter` は 403） |
| USE_STUB_POSTS       | 未設定（無効）           | `true` の場合のみ有効 | 開発専用。未指定/`false` は無効。`NODE_ENV=test/production` では常に無効（`postRepository` 側で切替/ガード） |

---


# PWA / manifest

## スマートフォンのホーム画面追加（PWA / manifest）

- `manifest.json`（または Next.js の Metadata Route により同等の manifest を生成）を実装する
- キー設計
  - `name` / `short_name`: アプリ名（例: Mono Log）
  - `id` / `start_url` / `scope`: SPA の起点（**未ログインでも開ける URL**）。本プロジェクトでは未ログイン時に URL パラメータを全削除する方針のため `/` を起点候補とする（ログイン中は canonical 化により `/?mode=memo` へ寄せる）
  - `display`: `standalone`
  - `theme_color` / `background_color`: 「カラースキーム」の採用値を使用する
  - `icons`: 192/512 に加え `purpose: "maskable"` を含む（Android で重要）
- アイコン成果物（格納場所・命名）
  - 置き場所: `public/icons/`
  - ファイル
    - `mono-log-192.png`（192x192）
    - `mono-log-512.png`（512x512）
    - `mono-log-192-maskable.png`（192x192 / maskable）
    - `mono-log-512-maskable.png`（512x512 / maskable）
  - manifest の `icons[]` は上記ファイルを参照し、maskable は `purpose: "maskable"` を指定する
- 初期リリース方針
  - オフライン対応は要件に含めず、Service Worker の導入は将来検討とする（導入する場合は運用/キャッシュ戦略を別途設計する）


---
