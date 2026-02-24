---
title: 仕様書 スタブ投稿データ（USE_STUB_POSTS）
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 機能.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 環境変数 env.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/テキスト・コンテンツ定義.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 URLクエリ状態管理.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/designs/スタブ投稿データ（USE_STUB_POSTS）_設計.md
author:
  -
published:
created: 2026-02-16
description: フェーズ2の開発で使用するスタブ投稿データの仕様。
tags:
  - specs
  - posts
  - stub
  - phase2
---

# 目的

- `USE_STUB_POSTS` による開発用投稿スタブの利用条件を定義する
- 投稿一覧/投稿操作の期待挙動を仕様として固定する
- 実装詳細は設計書に分離し、仕様変更と実装変更の責務を分ける

# スコープ

- 対象: スタブ投稿データの有効条件、投稿一覧の挙動、投稿操作の期待結果、エラー方針、受け入れ条件
- 非対象: Auth.js本実装、Prismaスキーマ設計、本番DB運用

# 前提（環境変数）

`USE_STUB_POSTS` の扱いは `docs/specs/仕様書 環境変数 env.md` を正とする。

# 機能仕様

## 有効条件

- スタブ投稿データを有効化できるのは `NODE_ENV=development` かつ `USE_STUB_POSTS=true` のときのみ
- `NODE_ENV=test/production` では `USE_STUB_POSTS` が指定されていても無効

## 投稿一覧

- 一覧は `view` と `favorite` 条件（`favoriteMemo` / `favoriteNote`）に従って取得される
- `view=trash` では favorite 条件を評価しない
- ページングは cursor 方式で、レスポンスは `items` / `hasNext` / `nextCursor` を返す
- `nextCursor` は終端時に `null` とする

## 投稿操作

対象操作:

- 投稿作成
- 投稿更新
- お気に入り状態の設定
- ごみ箱投入
- ごみ箱復元

期待挙動:

- `updatePost` / `setFavorite` / `moveToTrash` / `restoreFromTrash` は冪等
- 形式が正しいのに対象が存在しない場合は `404 (NOT_FOUND)`
- 入力不正は `400 (VALIDATION_ERROR)`

## エラー/ガード

- スタブ禁止環境でスタブ実装を利用しようとした場合は `403`
- `development` かつ `USE_STUB_POSTS=false` で本実装が未着手の場合は未対応エラー
- エラー表示文言は `docs/specs/テキスト・コンテンツ定義.md` に従う

## データ保持

- 項番16時点ではメモリ保持
- ブラウザリロード時に初期スタブデータへリセット
- 永続化（`localStorage` 等）は行わない

# 受け入れ条件（DoD）

- スタブ有効化条件/無効化条件が仕様どおりに動作する
- 一覧取得は `view` / favorite 条件を満たし、`view=trash` で favorite を評価しない
- cursor 方式で終端時 `nextCursor=null` を返す
- 不正 cursor は `400 (INVALID_CURSOR)` を返す
- 投稿操作の冪等性とエラー条件が仕様どおりである
- スタブデータはリロードで初期化される

# 詳細設計

実装I/F、エラー優先順位、状態遷移、cursorの実体などの詳細は、以下を正とする。

- `docs/designs/スタブ投稿データ（USE_STUB_POSTS）_設計.md`
