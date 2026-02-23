---
title: 項番27 テストケース（Prisma/DB設計）
created: 2026-02-23
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/manage/作業計画書.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/02.仕様書 機能.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/03.仕様書 環境変数 env.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/11.仕様書 投稿一覧取得-キャッシュ-ページング.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/12.仕様書 投稿編集-本文形式.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/14.仕様書 Auth.js（Googleログイン）導入.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/15.仕様書 PrismaDB設計.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/designs/PrismaDB設計_設計.md
---

# 項番27 テストケース

## 対象

- Prismaスキーマ（`User`/`Post`、制約、index）
- DB Repository（一覧/作成/更新/お気に入り/ごみ箱/削除）
- Action層の認証連携（`UNAUTHORIZED`）
- cursor（新形式 + 旧cursor互換）
- `limit` 検証（`1..50`）

## 非対象

- migrationの適用運用（作成は対象、適用手順は別タスク）
- フルE2E拡張（項番32）
- 本番監視/性能計測（項番33）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | Unit | `limit` 下限/上限の正常値 | 入力検証関数を単体呼び出し可能 | `limit=1,10,50` を与える | いずれも受理される |  |  |  |
| TC-002 | Unit | `limit` 異常値（0以下） | 同上 | `limit=0,-1` を与える | `VALIDATION_ERROR` |  |  |  |
| TC-003 | Unit | `limit` 異常値（上限超過） | 同上 | `limit=51,100` を与える | `VALIDATION_ERROR` |  |  |  |
| TC-004 | Unit | `limit` 異常値（非整数） | 同上 | `limit=1.5,NaN` を与える | `VALIDATION_ERROR` |  |  |  |
| TC-005 | Unit | DBモード `postId` 検証 | DBモード判定可能 | UUIDと `post-001` をそれぞれ入力 | UUIDは受理、`post-001` は `VALIDATION_ERROR` |  |  |  |
| TC-006 | Unit | stubモード `postId` 互換 | stubモード判定可能 | `post-001`/`trash-001` を入力 | 互換IDが受理される |  |  |  |
| TC-007 | Unit | cursor 新形式デコード | cursorヘルパー呼び出し可能 | `base64url({\"v\":1,\"t\":\"...\",\"id\":\"uuid\"})` をデコード | `v/t/id` を正しく復元 |  |  |  |
| TC-008 | Unit | cursor 不正トークン | 同上 | 空文字・壊れたbase64・必須キー欠落を入力 | `INVALID_CURSOR` |  |  |  |
| TC-009 | Unit | 日時整形（UTC固定） | 日時整形関数呼び出し可能 | 固定UTC時刻を整形 | `YYYY-MM-DD HH:mm`（UTC）で返る |  |  |  |
| TC-010 | Unit | Prisma例外→業務エラー変換 | エラー変換関数呼び出し可能 | P2002/P2025/未知例外を入力 | `VALIDATION_ERROR`/`NOT_FOUND`/`INTERNAL_ERROR` に変換 |  |  |  |
| TC-011 | 結合 | 未ログイン時ガード | `USE_STUB_POSTS=false`、セッションなし | `listPostsAction` 実行 | `UNAUTHORIZED` を返す |  |  |  |
| TC-012 | 結合 | `googleSub` 初回同期（create） | テストDB初期化済み、同subのUserなし | 認証済みで投稿系Action実行 | `User` が新規作成され `authorId` に使われる |  |  |  |
| TC-013 | 結合 | `googleSub` 再同期（update） | 同subの既存Userあり | email/name/image 変更で再実行 | 同一User再利用 + 取得値のみ更新（未取得項目は保持） |  |  |  |
| TC-014 | 結合 | 一覧順（通常） | userAにmemo/note投稿を複数投入 | `view=memo` で一覧取得 | `createdAt DESC, id DESC` 順 |  |  |  |
| TC-015 | 結合 | 一覧順（ごみ箱） | userAにtrashed投稿を複数投入 | `view=trash` で一覧取得 | `trashedAt DESC, id DESC` 順 |  |  |  |
| TC-016 | 結合 | `favoriteOnly` フィルタ | favorite true/false投稿を準備 | `favoriteOnly=true/false` で取得 | true時はfavoriteのみ、false時は全件 |  |  |  |
| TC-017 | 結合 | 旧cursor互換受理 | 旧 `id` cursorを作れる状態 | 旧cursorで次ページ取得 | 取得継続でき、`nextCursor` は新形式で返る |  |  |  |
| TC-018 | 結合 | 新cursor継続 | 新形式cursorで2ページ以上ある | 1ページ目→`nextCursor` で2ページ目取得 | 重複/欠落なく取得できる |  |  |  |
| TC-019 | 結合 | 他ユーザー投稿の秘匿 | userA/userBの投稿を作成 | userBでuserA投稿を更新/削除/復元 | すべて `NOT_FOUND` |  |  |  |
| TC-020 | 結合 | `moveToTrash` 冪等 | active投稿あり | 連続2回 `moveToTrash` | 2回目はno-op、失敗しない |  |  |  |
| TC-021 | 結合 | `restoreFromTrash` 冪等 | trashed投稿あり | 連続2回 `restoreFromTrash` | 2回目はno-op、失敗しない |  |  |  |
| TC-022 | 結合 | `deleteTrashPosts` 制約 | trashed/active混在、複数ユーザーあり | 対象ID群で削除実行 | 自分のtrashedのみ削除、不正混在時 `NOT_FOUND` |  |  |  |
| TC-023 | 結合 | `emptyTrash` 範囲 | 複数ユーザーにtrashedあり | userAで `emptyTrash` 実行 | userA分のみ削除、deletedCountが一致 |  |  |  |
| TC-024 | 結合 | リポジトリ切替 | `USE_STUB_POSTS=true/false` 切替可能 | 同一Actionを両設定で実行 | trueはstub、falseはDB経路に分岐 |  |  |  |
| TC-025 | E2E | DB経路で投稿作成〜表示 | ローカルPostgreSQL、Auth.jsログイン可能 | ログイン→作成→一覧確認 | 作成投稿が一覧に反映される |  |  |  |
| TC-026 | E2E | 401時の再ログイン導線維持 | 401再現可能なテスト設定 | 入力→保存で401→再ログイン | 下書き保持 + ログインモーダル表示 + 再実行可能 |  |  |  |
