---
title: 仕様書 Auth.js（Googleログイン）導入
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/manage/作業計画書.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/要件定義書.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 機能.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 環境変数 env.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/テキスト・コンテンツ定義.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 URLクエリ状態管理.md
author:
  -
published:
created: 2026-02-20
description: 項番26（Auth.js Googleログイン本実装）で実装判断がぶれないための最小仕様を固定する。
tags:
  - specs
  - auth
  - phase3
---

# 目的

- 項番26で必要な認証仕様を最小範囲で固定し、実装の手戻りを防ぐ
- ログイン/ログアウトUI連動、callbackUrl、スタブ共存、401再ログイン導線の判断基準を統一する
- テスト観点を先に固定し、TDDで着手できる状態にする

# スコープ

対象:

- Auth.js（Google Provider）によるログイン/ログアウト
- OAuth成功時の `callbackUrl` 決定ルール
- ログアウト成功時のクライアントキャッシュ破棄ルール
- `USE_STUB_AUTH` と本実装の共存条件
- 項番26の最小受け入れ条件

非対象:

- ログアウト後の戻る/進む時のBFCache表示差異など、ブラウザ依存の厳密挙動
- DB永続化/認可の詳細（項番27以降）
- 本番相当の総合E2E拡張（項番32）

# 仕様

## 1. ログイン成功後の遷移（callbackUrl）

- ログイン開始時は、現在URLを基準に `callbackUrl` を生成する
- `callbackUrl` には現在のクエリを保持する
  - 保持対象の例: `view` / `favoriteMemo` / `favoriteNote` / `noteComposer` / 未知クエリ
- `stubAuth` は必ず除去する
- `callbackUrl` は同一オリジンのパス（`/` または `/?...`）のみを許可する
- Auth.js（Google）経路でログイン開始する際は、毎回アカウント選択画面を表示するため `prompt=select_account` を付与する

補足:

- 401発生後の再ログイン導線でも同じ `callbackUrl` ルールを適用する
- 401発生後の再ログイン導線でも `prompt=select_account` 付与ルールを適用する

## 2. ログアウト

- ログアウト操作は Auth.js の `signOut` を使用する
- `signOut` の遷移先は `callbackUrl="/"` に固定する
- ログアウト成功時は、未ログイン画面へ切り替える前にクライアントキャッシュを破棄する
  - 投稿一覧キャッシュ（TanStack Query の `posts` 系キャッシュ）
  - スクロール保存値（`sessionStorage` の `mono-log:scroll:v1:` プレフィックス）
- ログアウト失敗時はエラートーストを表示し、ログイン中画面を維持する

## 3. `USE_STUB_AUTH` との共存

- 標準経路は Auth.js 本実装とする（`USE_STUB_AUTH` 未指定または `false`）
- `USE_STUB_AUTH=true` かつ `NODE_ENV=development` のときのみ、スタブ認証を許可する
- `NODE_ENV=test/production` では常にスタブ認証を無効化する
- ログインボタンの実行経路:
  - スタブ有効時: 既存の `stubAuth=1` 付与経路
  - スタブ無効時: Auth.js の `signIn("google", { callbackUrl }, { prompt: "select_account" })`

## 4. 401時の再ログイン導線

- ログイン必須操作で 401 を受けた場合:
  - トーストで「ログインが必要です」を表示する
  - 入力中データ（メモ/ノート）を保持したままログインモーダルを自動表示する
- 再ログイン成功後は、ユーザーが同じ操作を再実行できる状態を維持する

## 5. 項番32における実認証E2E運用

- 項番32（Playwright E2E）では、認証連携のテストを次の2系統に分離する
  - 自動化対象: 実DB + Auth.js 境界でのアプリ導線検証（作成/更新/401再ログイン/状態保持/ログアウト）
  - 手動スモーク対象: Google のアカウント選択/同意画面を実際に操作する外部依存導線
- Google画面操作を含むケースは `@oauth-manual` 等で分離し、CIデフォルト実行には含めない
- CIを導入する場合は、Google画面操作を除いた自動化対象をデフォルト実行とする

# 項番26の受け入れ条件（最小）

- Googleログイン成功で未ログイン画面からログイン中画面へ遷移する
- ログイン時、現在クエリは保持されるが `stubAuth` は除去される
- Auth.js経路のログイン開始時、`prompt=select_account` が常に付与される
- ログアウト成功で `/` に戻り、ログイン中画面が表示されない
- ログアウト成功時に `posts` キャッシュとスクロール保存値が破棄される
- 401発生時に入力保持 + ログインモーダル自動表示が成立する

# テスト

- 項番26のテストケース定義は `docs/test-cases/項番26_Auth.jsGoogleログイン本実装_テストケース.md` を正とする
