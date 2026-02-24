---
title: スタブ投稿データ（USE_STUB_POSTS）_設計
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 機能.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 環境変数 env.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/テキスト・コンテンツ定義.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 URLクエリ状態管理.md
author:
  -
published:
created: 2026-02-16
description: フェーズ2で投稿機能を実装するための、開発用スタブ投稿データ層と切替ガードの詳細設計。
tags:
  - designs
  - posts
  - stub
  - phase2
---

# 目的

- フェーズ2で投稿機能（保存/更新/削除/絞り込み）の実装を進めるため、開発用スタブ投稿データ層の詳細設計を定義する
- `USE_STUB_POSTS` によるスタブ/本実装切替を `postRepository` に集約し、誤設定時の事故を防ぐ
- フェーズ3以降の実DB実装へ差し替えても、UI/Server Actions 側の呼び出し点を変えない

# スコープ

- 対象: 投稿データの取得・操作に関する「開発用スタブ」の有効条件、責務分離、I/F 契約
- 対象: `postRepository` の切替ポイント、一覧取得のページング契約、スタブデータの保持ルール
- 非対象: Auth.js 本実装、Prisma スキーマ詳細、本番DB運用（項番26以降で扱う）

# 環境変数と有効条件

`USE_STUB_POSTS` の扱いは `docs/specs/仕様書 環境変数 env.md` を正とする。

## 有効条件（必須）

- 投稿スタブが有効になるのは、以下をすべて満たす場合のみ
  - `NODE_ENV=development`
  - `USE_STUB_POSTS=true`

以下は常に無効とする。

- `NODE_ENV=test`
- `NODE_ENV=production`

## 実行マトリクス

| NODE_ENV | USE_STUB_POSTS | postRepository が使う実装 |
| --- | --- | --- |
| development | true | スタブ実装 |
| development | 未指定 / false | 本実装 |
| test | true / false / 未指定 | 本実装（スタブ禁止） |
| production | true / false / 未指定 | 本実装（スタブ禁止） |

※ 失敗時のエラーコード/返却方針は `# エラー/ガード` を正とする。

# 責務分離（接続点）

- UI: `postRepository` を直接参照しない
- Server Actions: 通信I/Fの入口として、`postRepository` を呼び出す
- `postRepository`: 環境変数に基づき、スタブ実装/本実装を切り替える唯一の接続点
- スタブ実装: 投稿データの開発用ロジックを持つ（一覧、絞り込み、投稿操作）
- 本実装: フェーズ3以降で Prisma/DB 実装へ置換

# スタブ投稿データモデル

スタブで扱う投稿は、以下の属性を最低限持つ。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `id` | string | 投稿ID |
| `mode` | `memo` \| `note` | 投稿モード |
| `title` | string \| undefined | ノートタイトル（任意） |
| `content` | string | 本文 |
| `favorite` | boolean | お気に入り状態 |
| `createdAt` | string | 作成日時（表示形式: `YYYY-MM-DD HH:mm`） |
| `trashedAt` | string \| undefined | ごみ箱に入れた日時 |

# `postRepository` I/F 契約（項番16で必須）

項番16では、以下のI/Fを実装可能な形で固定する。

| 関数 | 入力 | 出力 | 用途 |
| --- | --- | --- | --- |
| `listPosts` | `view`, `favoriteOnly`, `limit`, `cursor` | `items`, `nextCursor`, `hasNext` | 通常一覧/ごみ箱一覧取得 |
| `createPost` | `mode`, `title`, `content` | 作成後の投稿 | 投稿作成（項番18で利用） |
| `updatePost` | `postId`, `title`, `content` | 更新後の投稿 | 投稿更新（項番18で利用） |
| `setFavorite` | `postId`, `favorite` | 更新後の投稿 | お気に入り状態の設定（項番22で利用） |
| `moveToTrash` | `postId` | `void` | ごみ箱投入（項番19で利用） |
| `restoreFromTrash` | `postId` | `void` | ごみ箱復元（項番19で利用） |

補足:

- 詳細な型名は実装側で定義してよいが、入出力の意味は本表を満たすこと
- `view=trash` のとき、`favoriteOnly` は無視する（`docs/specs/仕様書 URLクエリ状態管理` と整合）

## 書き込み系I/F契約

### 共通エラー優先順位

書き込み系I/F（`createPost` / `updatePost` / `setFavorite` / `moveToTrash` / `restoreFromTrash`）は、次の順で判定する。

1. 403（環境ガード違反: test/production でスタブ実装を選択しようとした場合のみ）
2. 未対応エラー（本実装未着手）
3. 400（入力不正）
4. 404（対象不存在）

### createPost

- 冪等性: 非冪等（同一入力でも毎回新規投稿）
- 400: `mode` 不正 / 本文空（空白のみ） / 文字数超過（`VALIDATION_ERROR`）
- 404: なし（対象指定がないため）
- `trashedAt`: 初期値 `undefined`

### updatePost

- 冪等性: 冪等（更新内容が同一なら no-op 成功）
- 400: `postId` 形式不正 / 本文空（空白のみ） / 文字数超過（`VALIDATION_ERROR`）
- 404: 対象投稿が存在しない場合（`NOT_FOUND`）
- `trashedAt`: 更新しない

### setFavorite

- 冪等性: 冪等（同じ `favorite` 指定を再送しても状態不変）
- 400: `postId` 形式不正 / `favorite` が boolean でない（`VALIDATION_ERROR`）
- 404: 対象投稿が存在しない場合（`NOT_FOUND`）
- `trashedAt`: 更新しない

### moveToTrash

- 冪等性: 冪等（すでに trashed なら no-op 成功）
- 400: `postId` 形式不正（`VALIDATION_ERROR`）
- 404: 対象投稿が存在しない場合（`NOT_FOUND`）
- `trashedAt`:
  - `active -> trashed`: 実行時刻を設定
  - `trashed -> trashed`（no-op）: 既存値を維持

### restoreFromTrash

- 冪等性: 冪等（すでに active なら no-op 成功）
- 400: `postId` 形式不正（`VALIDATION_ERROR`）
- 404: 対象投稿が存在しない場合（`NOT_FOUND`）
- `trashedAt`:
  - `trashed -> active`: `undefined` に戻す
  - `active -> active`（no-op）: `undefined` を維持

補足:

- 文字数上限は既存仕様（memo=280, note=25000）を適用する
- 404 は「形式は正しいが、対象が存在しない」場合にのみ返す

# 一覧取得ルール（スタブ実装）

- 並び順
  - 通常一覧（`view=memo|note`）: `createdAt DESC, postId DESC`
  - ごみ箱一覧（`view=trash`）: `trashedAt DESC, postId DESC`
- ページング
  - 初期 `limit=10`
  - 原則: `cursor` は次ページ取得のための opaque token（文字列）として扱う
  - 項番16（スタブ実装）: token の実体として `postId` を採用する
- 絞り込み
  - `view=memo` では `favoriteMemo` に対応する `favoriteOnly` を評価
  - `view=note` では `favoriteNote` に対応する `favoriteOnly` を評価
  - `view=trash` では favorite を評価しない

## ページング返却契約

`listPosts` のレスポンスは、`items` / `hasNext` / `nextCursor` の3キーを常に返す。

| ケース | `hasNext` | `nextCursor` | `items` |
| --- | --- | --- | --- |
| 次ページあり | `true` | `string`（opaque token） | `1..limit` |
| 終端ページ | `false` | `null` | `0..limit` |

整合ルール:

- `hasNext=true` のとき、`nextCursor` は必ず `string`
- `hasNext=false` のとき、`nextCursor` は必ず `null`
- 上記に反するレスポンスは不正とみなす

## cursor 入力バリデーション

本節では `cursor` を token として定義する。項番16の判定は `cursor=postId` として行う。

### 不正 cursor の定義

次のいずれかを満たす `cursor` は不正とみなす。

| No | 判定条件 | 例 |
| --- | --- | --- |
| 1 | `cursor` が空文字または空白のみ | `""`, `"   "` |
| 2 | 指定された `cursor` トークンに対応する投稿が存在しない | `post-999999`（項番16では未存在 `postId`） |
| 3 | `cursor` トークンに対応する投稿が、現在の `view` / `favoriteOnly` 条件集合に含まれない | `view=note` で `memo` 投稿由来のトークン（項番16では `postId`）を指定 |
| 4 | 取得途中のデータ更新で、`cursor` トークンが参照不能になった | 削除/復元直後に旧cursorを指定 |

### 入力ごとの挙動

| `cursor` 入力 | 挙動 |
| --- | --- |
| 未指定 | 先頭ページを返す |
| 有効な `cursor` トークン | 当該投稿の次位置から `limit` 件を返す |
| 不正 cursor（上表No.1-4） | `400 (INVALID_CURSOR)` で失敗 |

### エラーレスポンス契約

- 不正 cursor の場合は `items` を返さず、エラーオブジェクトのみ返す
- エラーコードは必ず `INVALID_CURSOR`

## レスポンス例

※以下の `nextCursor` 値は、項番16スタブ実装（`cursor=postId`）の例。

次ページあり:

```json
{
  "items": [{ "id": "post-011" }, { "id": "post-010" }],
  "hasNext": true,
  "nextCursor": "post-010"
}
```

終端ページ:

```json
{
  "items": [{ "id": "post-002" }],
  "hasNext": false,
  "nextCursor": null
}
```

不正cursor:

```json
{
  "error": {
    "code": "INVALID_CURSOR",
    "message": "cursor is invalid"
  }
}
```

# スタブデータの保持ルール

- 項番16時点ではメモリ保持（開発中の1セッション内）とする
- ブラウザリロード時は初期スタブデータへリセットされる
- `localStorage` 等への永続化は行わない（必要になった場合は別タスクで定義）

# エラー/ガード

- `NODE_ENV=test/production` では投稿スタブ実装を選択してはならない
- エラーの使い分けは以下の通り
  - 403: スタブ導線が禁止される環境（`NODE_ENV=test/production`）でスタブ実装を利用しようとした場合
  - 未対応エラー: `NODE_ENV=development` かつ `USE_STUB_POSTS=false` で、本実装が未着手の場合
- UI側は `docs/specs/テキスト・コンテンツ定義.md` のエラー通知文言を利用する
- 失敗時は入力中データ/画面状態を可能な限り維持する

# 非スコープ

- 認証スタブ（`stubAuth`）の仕様変更
- 認可（`authorId`）の本実装
- DBスキーマ作成、マイグレーション、実データ更新

# 受け入れ条件（DoD）

- `USE_STUB_POSTS=true` かつ `NODE_ENV=development` でのみ投稿スタブが有効になる
- `NODE_ENV=test/production` では `USE_STUB_POSTS=true` でも投稿スタブが無効になる
- UI/Server Actions から投稿取得・投稿操作は `postRepository` 経由で呼ばれる
- `listPosts` が `items/nextCursor/hasNext` を返し、`view=trash` では favorite を評価しない
- `listPosts` は終端時に `hasNext=false` かつ `nextCursor=null` を返す
- 不正 `cursor` は `400 (INVALID_CURSOR)` を返す
- 書き込み系I/Fは本仕様の共通エラー優先順位（403→未対応→400→404）に従う
- `updatePost` / `moveToTrash` / `restoreFromTrash` は冪等挙動（再実行時no-op成功）を満たす
- `setFavorite` は冪等（同じ入力を再送しても状態不変）を満たす
- `moveToTrash` / `restoreFromTrash` は `trashedAt` 更新規則に従う
- スタブデータはリロードで初期化される（永続化しない）
