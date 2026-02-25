---
title: 仕様書 環境変数 env
source:
author:
  - 
published:
created: 2026-02-07
description:
tags:
---
# 設定
## envファイル構成

| 種類  | ローカル開発     | ローカルテスト   | STG    | PRD    |
| --- | ---------- | --------- | ------ | ------ |
| env | .env.local | .env.test | Vercel | Vercel |
## miro MCP 用
- .env.miro

## 環境変数設計

| key                  | stg/prod（Vercel env） | local（.env.local）                    | 備考                                                                                          |
| -------------------- | -------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| DATABASE_URL         | Neonのpooling         | ローカルDBのURL                           |                                                                                             |
| DATABASE_DIRECT_URL  | Neonのpooling無し       | ローカルDBのURL（通常 `DATABASE_URL` と同値でOK） |                                                                                             |
| AUTH_SECRET          | 本番用の値                | local用の値                             | [公式のコマンドで生成する](https://authjs.dev/guides/environment-variables)                             |
| AUTH_URL             | VercelのURL（stg/prod） | `http://localhost:3000`              | Auth.js が参照するベースURL（リダイレクト/コールバックURLの基準）。Auth.js v5 前提。                                     |
| GOOGLE_CLIENT_ID     | GoogleCloudから取得      | GoogleCloudから取得（ローカル開発用OAuthクライアント）       | 項番26以降はローカルでも実値を設定して Auth.js のGoogleログインを検証する                                              |
| GOOGLE_CLIENT_SECRET | GoogleCloudから取得      | GoogleCloudから取得（ローカル開発用OAuthクライアント）       | 項番26以降はローカルでも実値を設定して Auth.js のGoogleログインを検証する                                              |
| USE_STUB_AUTH        | 未設定（無効）              | `true` の場合のみ有効                       | 開発専用。未指定/`false` は無効。`NODE_ENV=test/production` では常に無効。さらに `NODE_ENV=test/production` かつ `USE_STUB_AUTH=true` の誤設定時は、Auth Route Handler（`/api/auth/[...nextauth]`）で `403 FORBIDDEN`（JSON: `{ "error": { "code": "FORBIDDEN", "message": "stub auth is disabled in this environment" } }`）を返す。`authAdapter` 相当の入口（`auth.ts`）では同一 `code/message` の `FORBIDDEN` 契約で失敗させる（HTTPレスポンスJSONは要求しない） |
| USE_STUB_POSTS       | 未設定（無効）              | `true` の場合のみ有効                       | 開発専用。未指定/`false` は無効。`NODE_ENV=test/production` では常に無効（`postRepository` 側で切替/ガード）           |
| RUN_DB_INTEGRATION_TESTS | 未使用            | Jest 実行時に `true` で DB 結合テストを有効化 | テスト専用。未設定時は `dbPostRepository.integration.test.ts` / `postActions.db-contract.test.ts` をスキップ。DB 未起動でもスイート成功。有効化時は `DATABASE_URL` と DB 起動が前提 |

## 項番26時点の運用補足

- Auth.js のGoogleログイン本実装時は、`USE_STUB_AUTH` を未指定または `false` とし、実認証経路を標準とする
- `USE_STUB_AUTH=true` は開発時のUI検証補助としてのみ許可し、`NODE_ENV=test/production` では常に無効とする
