---
title: スタブ認証（URLトグル） 設計
created: 2026-02-08
source:
  - docs/specs/07.仕様書 スタブ認証（URLトグル）.md
  - docs/specs/03.仕様書 環境変数 env.md
  - docs/manage/作業計画書.md
tags:
  - designs
  - auth
  - stub
  - nextjs
  - app-router
---

# 目的

フェーズ1（UI先行）で、未ログインUIとログイン中UIを切り替えるための「スタブ認証（URLトグル）」の実装方針を定める。後続フェーズで `USE_STUB_AUTH` によるスタブ/本番切替（Auth.js）へ移行しやすい構造を維持する。

# 方針（重要）

- **dev-only** のデバッグスイッチとして `stubAuth=1` を扱う（仕様外のURL状態を恒久化しない）
- 判定/ガードは **1箇所に集約** し、UIコンポーネントに散らさない
- `NODE_ENV=test/production` では **必ず無効**（事故防止）
- `stubAuth` 操作で `mode/view/favorite` などの他クエリを **破壊しない**

# 想定ファイル配置（案）

`mono-log9-app/` 配下:

- `lib/env.ts`
  - `USE_STUB_AUTH` と `NODE_ENV` の解釈を集約
- `lib/stubAuth.ts`
  - `searchParams` から `isStubAuthed` を判定する関数
- `app/page.tsx`
  - 未ログイン/ログイン中の表示切替（分岐点）
- `components/auth/LoginDialog.tsx`
  - スタブログイン成功時に `stubAuth=1` を付与して遷移（失敗時はトースト）
- （ログイン中画面）
  - `components/authed/AuthedScreen.tsx`（仮）: レイアウト骨格（sm/md）

# envガード（案）

`lib/env.ts` に以下のような値を用意し、ここ以外で直接 `process.env.USE_STUB_AUTH` を参照しない。

- `useStubAuth`: boolean
  - `NODE_ENV` が `test/production` のときは常に `false`
  - `development` のときのみ `USE_STUB_AUTH === "true"` を許可

※ `USE_STUB_AUTH=true` が `test/production` で指定されても無効化する。必要なら「誤設定検知で例外」も検討する。

# 認証状態判定（URLトグル）

- 入力: `searchParams`（`app/page.tsx` の `searchParams` など）
- 出力: boolean（ログイン中とみなすか）

判定は次の論理:

- `useStubAuth === true` のときのみ `stubAuth=1` をログイン中とみなす
- それ以外は常に false（後続フェーズで Auth.js の session 判定へ置換）

# 画面切替（分岐点）

`app/page.tsx` を「切替の唯一の入口」にする。

- `isAuthed`（スタブ判定）:
  - true → `AuthedScreen`
  - false → `UnauthScreen`

後続フェーズで Auth.js を導入したら、`isAuthed` の実装を

- stub（`useStubAuth` true）: `stubAuth=1`
- 本番（`useStubAuth` false）: session取得結果

へ置換する（UIコンポーネント側の変更を最小化する）。

# URL更新（ログイン/ログアウト）

クエリの保持要件があるため、次の方針を守る:

- 既存の `searchParams` をコピーして編集する
- ログイン: `stubAuth=1` を set
- ログアウト: `stubAuth` を delete
- `mode/view/favorite` 等の他パラメータは保持する

（実装例: `new URLSearchParams(searchParams)` のような形で編集）

# UIスタブの挙動（LoginDialog）

フェーズ1の `LoginDialog` は以下を満たす:

- 「ログイン」ボタンでモーダルを開く
- 「Googleでログイン」押下:
  - 成功スタブ: `stubAuth=1` を付与して画面切替
  - 失敗/キャンセル: `docs/specs/06` の文言でトースト表示し、モーダルを閉じる

※ 成功/失敗の切替方法は、最初は固定（成功のみ等）でもよい。テスト目的でトグルできるようにする場合も、あくまで dev-only に閉じ込める。

# セキュリティ/事故防止

- `stubAuth` は dev-only。`NODE_ENV=test/production` では無効化されるため、URLに残っても表示切替は起きない
- `USE_STUB_AUTH` を参照する箇所を集約し、ガード漏れを防ぐ

# 動作確認（手動）

- `USE_STUB_AUTH=true`（development）
  - `/` は未ログイン画面
  - `/?stubAuth=1` でログイン中画面
  - ログイン操作で `stubAuth=1` が付与される（他クエリは保持）
  - ログアウト操作で `stubAuth` が削除される（他クエリは保持）
- `USE_STUB_AUTH` 未指定 or `false`
  - `/?stubAuth=1` でも未ログイン画面のまま
- `NODE_ENV=test/production`
  - `USE_STUB_AUTH=true` 相当の設定があっても `/?stubAuth=1` は無効

