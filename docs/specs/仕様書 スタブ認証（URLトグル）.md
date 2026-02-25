---
title: 仕様書 スタブ認証（URLトグル）
source:
author:
  -
published:
created: 2026-02-08
description: フェーズ1（UI先行）での未ログイン/ログイン中UI切替を、開発用のURLトグルで代用するための仕様。
tags:
  - specs
  - auth
  - stub
  - ui
---

# 目的

Auth.js 本実装（認証・セッション取得）を行う前に、未ログイン画面からログイン中画面への **表示切替** を可能にし、UI実装を先行できるようにする。

# スコープ

- 対象: `mono-log9-app` の `/` における「未ログインUI」↔「ログイン中UI」の **表示切替**
- 本仕様は **開発用** のみを対象とする

# 用語

- **スタブ認証**: 本物のOAuth/セッションの代わりに、開発用のルールで「ログイン中」とみなす仕組み
- **URLトグル**: URL クエリの有無/値で状態を切り替えること

# 前提（環境変数）

`USE_STUB_AUTH` の扱いは `docs/specs/仕様書 環境変数 env.md` を正とする。

# 仕様

## 有効条件（必須）

スタブ認証（URLトグル）が有効なのは、以下をすべて満たす場合のみ:

- `USE_STUB_AUTH=true`
- `NODE_ENV=development`

以下の場合は **常に無効** とする:

- `NODE_ENV=test`
- `NODE_ENV=production`

## 状態判定（URLトグル）

- クエリ `stubAuth=1` の場合、スタブ認証が有効条件を満たしていれば **ログイン中** とみなす
- それ以外は **未ログイン** とみなす

### 無効時の扱い

スタブ認証が無効な場合は、URLに `stubAuth=1` が含まれていても **無視** する（表示切替の根拠にしてはならない）。

## 画面の期待結果

- 未ログインの場合: 未ログイン画面（ウェルカム/導線）が表示される
- ログイン中の場合: ログイン中画面（フェーズ1ではレイアウト骨格でよい）が表示される

## ログイン操作（スタブ）

未ログイン画面で「Googleでログイン」を押下したとき:

- スタブ成功の場合: `stubAuth=1` を URL に付与し、ログイン中画面へ切り替わる
- スタブ失敗/キャンセルの場合: エラートーストを表示し、ログイン中画面へは切り替えない（文言は `docs/specs/テキスト・コンテンツ定義.md` を正とする）

## ログアウト操作（スタブ）

ログイン中画面で「ログアウト」を押下したとき:

- URL パラメータを全削除して `/` に戻し、未ログイン画面へ切り替わる

## クエリの保持（必須）

- ログイン時（`stubAuth=1` の付与）: 既存の URL クエリ（例: `view/favoriteMemo/favoriteNote` 等）は **保持** する
- ログアウト時: 未ログイン画面へ戻すため URL パラメータは全削除する（`/` へ遷移）

## Auth Route / authAdapter ガード（項番30）

### 目的

`USE_STUB_AUTH` の誤設定により test/production でスタブ導線が有効化される事故を防止する。

### ガード条件

以下をすべて満たす場合は、認証系スタブ導線を禁止する。

- `NODE_ENV` が `test` または `production`
- `USE_STUB_AUTH=true`

### 必須挙動

- Auth Route Handler（`/api/auth/[...nextauth]`）は `403 FORBIDDEN` を返す。
- `authAdapter` 相当の認証入口（Auth.js 初期化境界）でも同条件を検知し、同一 `code/message` の `FORBIDDEN` 契約で失敗させる（HTTPレスポンスJSONは要求しない）。
- 上記条件を満たさない場合、通常の Auth.js 挙動を妨げない。

### エラー契約

#### Route Handler（HTTP境界）

- HTTP: `403`
- Body(JSON):
  - `error.code`: `FORBIDDEN`
  - `error.message`: `stub auth is disabled in this environment`

#### authAdapter 相当入口（非HTTP境界）

- `FORBIDDEN` 契約で失敗させる（`code/message` は Route Handler と同一）
- JSONレスポンス形式は要求しない

### ログ方針

- 誤設定検知時はサーバーログに warning を1回以上出力する。
- ログには機密情報を含めない（環境名・判定結果・対象エンドポイントのみ）。

# 非スコープ

- Auth.js による実認証・セッション取得
- API/Repository の認可（401/403 等）
- DBや永続層を伴う認証状態の保持

# 受け入れ条件（DoD）

- `/` で未ログイン画面が表示される
- `/?stubAuth=1` かつスタブ認証が有効条件を満たす場合に、ログイン中画面が表示される
- `NODE_ENV=test/production` では `stubAuth=1` があってもログイン中画面にならない
- ログイン時の `stubAuth` 付与で他クエリが失われない
- ログアウト時は URL パラメータが全削除され `/` へ戻る
- `NODE_ENV=test/production` かつ `USE_STUB_AUTH=true` で `/api/auth/[...nextauth]` が `403` を返す
- `403` 応答の JSON 形式が契約どおりである
- `NODE_ENV=test/production` かつ `USE_STUB_AUTH=true` で `authAdapter` 相当入口が `FORBIDDEN` 契約で失敗する
