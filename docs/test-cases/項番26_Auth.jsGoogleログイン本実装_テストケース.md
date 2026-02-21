---
title: 項番26 テストケース（Auth.js Googleログイン本実装）
created: 2026-02-20
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/manage/作業計画書.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/02.仕様書 機能.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/03.仕様書 環境変数 env.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/06.テキスト・コンテンツ定義.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/14.仕様書 Auth.js（Googleログイン）導入.md
---

# 項番26 テストケース

## 対象

- Auth.js（Google Provider）ログイン/ログアウトのUI連動
- ログイン時 callbackUrl のクエリ保持（`stubAuth` 除去）
- ログアウト成功時のキャッシュ破棄
- 401時の入力保持 + ログインモーダル誘導
- `USE_STUB_AUTH` / `NODE_ENV` による認証経路切替ガード

## 非対象

- ログアウト後の戻る/進む時のBFCache差異の厳密評価（項番32で実施）
- DB永続化/認可の詳細（項番27以降）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | Unit | callbackUrl生成（クエリ保持） | callbackUrl生成関数を単体呼び出し可能 | `view=note&favoriteNote&foo=bar` を入力し生成する | `view/favoriteNote/foo` が保持された `/?...` が返る |  |  |  |
| TC-002 | Unit | callbackUrl生成（`stubAuth`除去） | 同上 | `stubAuth=1&view=memo` を入力し生成する | `stubAuth` が除去され `/?view=memo` が返る |  |  |  |
| TC-003 | Unit | ログアウト時キャッシュ破棄 | キャッシュ破棄関数を単体呼び出し可能 | `posts` キャッシュと `mono-log:scroll:v1:*` を事前投入して実行 | 対象キャッシュ/保存値が削除される |  |  |  |
| TC-004 | 結合 | 未ログイン画面のGoogleログイン（Auth.js経路） | `USE_STUB_AUTH=false` 相当、`signIn` をモック可能 | 「ログイン」→「Googleでログイン」を押下 | `signIn("google", { callbackUrl })` が呼ばれ、失敗時はトースト+モーダルclose |  |  |  |
| TC-005 | 結合 | スタブ有効時の分岐維持 | `USE_STUB_AUTH=true` 相当 | 「Googleでログイン」を押下 | Auth.jsではなく `stubAuth=1` 付与経路を使う |  |  |  |
| TC-006 | 結合 | ログアウト成功 | ログイン中状態、`signOut` 成功モック | ユーザーメニューから「ログアウト」を押下 | `signOut({ callbackUrl: "/" })` 実行後に `/` へ戻り、未ログイン画面表示 |  |  |  |
| TC-007 | 結合 | ログアウト失敗 | `signOut` 失敗モック | 「ログアウト」を押下 | エラートースト表示、ログイン中画面を維持 |  |  |  |
| TC-008 | E2E | 実導線: ログイン後の状態保持 | Googleログインが可能な環境 | `/?view=note&favoriteNote` でログイン操作 | ログイン後も `view=note&favoriteNote` を保持し `stubAuth` は含まれない |  |  |  |
| TC-009 | E2E | 実導線: ログアウトで状態初期化 | ログイン済みで任意クエリ付与状態 | ログアウト操作を実行 | URLが `/` になり、ログイン中UIに戻らない |  |  |  |
| TC-010 | E2E | 実導線: 401→再ログイン | 401を返すテスト用モック環境を用意 | 入力後に保存操作して401発生→ログイン実行 | 入力保持 + ログインモーダル自動表示 + 再操作可能を確認 |  |  |  |
| TC-011 | Unit | callbackUrl生成（クエリ無し） | callbackUrl生成関数を単体呼び出し可能 | クエリ無しURLで生成する | `"/"` が返る |  |  |  |
| TC-012 | Unit | callbackUrl生成（同一オリジン制約） | 同上 | 外部オリジンURL相当の入力で生成する | 外部URLは採用せず、同一オリジン内のパス（`/` または `/?...`）へ正規化される |  |  |  |
| TC-013 | 結合 | スタブ禁止環境ガード | `NODE_ENV=test` または `production` 相当、`USE_STUB_AUTH=true` を設定可能 | 「Googleでログイン」を押下 | `stubAuth=1` 付与経路は使われず、Auth.js経路（`signIn`）が呼ばれる |  |  |  |
| TC-014 | 結合 | 401後にログインをキャンセル | 401でログインモーダルを自動表示できる | 401発生後、モーダルを閉じる（ログイン実行しない） | 入力保持のまま編集を継続できる。未ログイン状態のため再操作時は再度401扱いになる |  |  |  |
| TC-015 | 結合 | ログアウト時のスクロール保存破棄 | `sessionStorage` に `mono-log:scroll:v1:*` を投入可能 | ログアウト操作を実行する | `mono-log:scroll:v1:*` が削除される |  |  |  |
