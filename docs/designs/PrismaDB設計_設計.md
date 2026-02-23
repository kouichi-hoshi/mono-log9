---
title: PrismaDB設計_設計
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/15.仕様書 PrismaDB設計.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/02.仕様書 機能.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/12.仕様書 投稿編集-本文形式.md
author:
  -
published:
created: 2026-02-23
description: 項番27向けのPrismaスキーマとRepository実装方針（投稿/認可/一覧取得）。
tags:
  - designs
  - db
  - prisma
  - posts
  - phase3
---

# 目的

- 項番27の実装で必要な `schema.prisma` の具体形を定義する
- 項番28/29で利用する Repository のクエリ戦略を先に固定する
- スタブ実装から実DB実装への置換時に、I/F契約を維持する

# 設計方針

- 現在のアプリ型（`PostRecord`）に合わせ、投稿主キーは `id` を採用する
- 主キーIDは UUID を採用する（Prisma: `@default(dbgenerated("gen_random_uuid()"))`）
- DBは不正状態を保存しないための最小制約を持つ
- 投稿一覧は keyset pagination 前提で設計する（`createdAt/id`、`trashedAt/id`）
- 認可境界はクエリ条件に埋め込み、後段フィルタに依存しない
- 複合インデックスは `docs/specs/15.仕様書 PrismaDB設計.md` の必須要件をそのまま実装する

# Prismaモデル（案）

```prisma
enum PostMode {
  memo
  note
}

enum PostStatus {
  active
  trashed
}

model User {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  googleSub  String   @unique
  email      String?
  name       String?
  image      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  posts      Post[]

  @@index([email])
}

model Post {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  authorId    String     @db.Uuid
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)

  mode        PostMode
  title       String?    @db.VarChar(100)
  content     Json
  contentText String     @db.Text
  favorite    Boolean    @default(false)
  status      PostStatus @default(active)

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  trashedAt   DateTime?

  @@index([authorId, status, mode, createdAt, id], map: "post_active_list_idx")
  @@index([authorId, status, mode, favorite, createdAt, id], map: "post_active_fav_list_idx")
  @@index([authorId, status, trashedAt, id], map: "post_trash_list_idx")
}
```

補足:

- `status` と `trashedAt` の整合は、SQL migration でDB `CHECK` 制約を必須追加する
- `title` はDBで `varchar(100)` に制約する
- `contentText` はDBで最大長制約を持たせず（text相当）、アプリケーション検証（memo<=280 / note<=25000）を正とする

`status` / `trashedAt` 制約SQL（PostgreSQL）:

```sql
ALTER TABLE "Post"
ADD CONSTRAINT post_status_trashed_at_check
CHECK (
  ("status" = 'active' AND "trashedAt" IS NULL) OR
  ("status" = 'trashed' AND "trashedAt" IS NOT NULL)
);
```

# Repository実装方針

## 1. 認可コンテキスト

- 投稿系 Server Action は `auth()` でセッションを確認し、未ログインは `UNAUTHORIZED` を返す
- Action 層で `googleSub` から `actorUserId` を解決してから Repository を呼び出す
- DB実装のRepositoryの書き込み/読み取りI/Fは `actorUserId` を必須引数で受ける
- すべての `where` に `authorId: actorUserId` を含める

実装イメージ（擬似コード）:

```ts
const session = await auth();
if (!session) throw new PostRepositoryError("UNAUTHORIZED", "ログインが必要です");
const actorUserId = await ensureActorUserFromSession(session);
const repo = createDbPostRepository({ actorUserId });
```

## 1-A. Auth.js連携時のUser upsert

- `googleSub`（Google `sub`）をキーとして `User` を upsert する
- 項番27の最小実装では、投稿系 Server Action 実行時に lazy upsert で同期してよい
- 将来 Auth.js のログイン成功イベントで同期する場合も、同一 upsert 契約を適用する
  - create: `googleSub`, `email`, `name`, `image`
  - update: `email`, `name`, `image`（値が取得できた項目のみ反映）
- 未取得項目は更新対象から除外し、既存値を維持する
- upsert結果の `User.id` をアプリ内の主体IDとして利用する

実装イメージ（擬似コード）:

```ts
const user = await prisma.user.upsert({
  where: { googleSub },
  create: { googleSub, email: profile.email ?? null, name: profile.name ?? null, image: profile.image ?? null },
  update: {
    ...(profile.email != null ? { email: profile.email } : {}),
    ...(profile.name != null ? { name: profile.name } : {}),
    ...(profile.image != null ? { image: profile.image } : {}),
  },
});
```

## 2. 一覧取得（`listPosts`）

- `limit` は未指定時 `10`、許容範囲 `1..50` とする
- `limit` が範囲外の場合は `VALIDATION_ERROR`

通常一覧（memo/note）:

- `where`
  - `authorId = actorUserId`
  - `status = active`
  - `mode = view`
  - `favoriteOnly=true` のとき `favorite = true`
- `orderBy`
  - `createdAt: "desc"`
  - `id: "desc"`

ごみ箱一覧（trash）:

- `where`
  - `authorId = actorUserId`
  - `status = trashed`
- `favoriteOnly` は無視
- `orderBy`
  - `trashedAt: "desc"`
  - `id: "desc"`

cursor仕様:

- keyset の安定性確保のため、`createdAt/id` または `trashedAt/id` の複合キーで次ページ判定する
- 既存I/Fの `cursor: string` は `base64url(JSON)` 形式のopaque tokenを採用する
  - payload: `{ "v": 1, "t": "<ISO8601 UTC>", "id": "<uuid>" }`
- デコード不能/不正cursorは `INVALID_CURSOR` を返す
- cursor は `none | v1` のみ受け入れる（legacy `id` 単体形式は受け入れない）
- `nextCursor` は常に新形式（`base64url(JSON)`）で返す

## 2-A. 入出力フォーマット（互換要件）

- DB上の `Post.id` は UUID とする（`gen_random_uuid()`）
- `postId` 入力はスタブ実装/DB実装ともに UUID 以外を許容しない（`VALIDATION_ERROR`）
- `createdAt` / `trashedAt` はDBでは `timestamp with time zone` で保持する
- `PostRecord` 返却値は既存UI互換のため `YYYY-MM-DD HH:mm` 形式文字列（JST）へ整形して返す
- cursor payload の `t` は ISO 8601 UTC を使用する

## 3. 作成・更新

- `createPost`
  - Action層で検証済みDTO（`mode/title/content/contentText`）を受け取る
  - `status=active`, `trashedAt=NULL`, `favorite=false` で作成
- `updatePost`
  - `where: { id, authorId }` で対象を限定
  - 対象なしは `NOT_FOUND`
  - `mode` は既存値を維持（モード変更しない）

## 4. ごみ箱操作

- `moveToTrash`
  - `where: { id, authorId }` で対象特定
  - `active -> trashed` のみ更新、`trashed` は no-op
- `restoreFromTrash`
  - `where: { id, authorId }` で対象特定
  - `trashed -> active` のみ更新、`active` は no-op

## 5. 完全削除

- `deleteTrashPosts(postIds)`
  - `where: { id: { in: postIds }, authorId, status: trashed }`
  - 対象のみ物理削除し、削除できたIDを返す
- `emptyTrash()`
  - `where: { authorId, status: trashed }` を全件削除

# エラー変換ルール

- Prisma例外は `PostRepositoryError` へ正規化する
- 代表マッピング
  - レコードなし: `NOT_FOUND`
  - 制約違反/型不整合: `VALIDATION_ERROR`
  - 想定外: `INTERNAL_ERROR`
- Action層では未ログインを入力検証より優先し、`UNAUTHORIZED` を先に返す

# テスト設計（結合優先）

## 先行で追加する結合テスト

- User分離
  - userAの投稿がuserBに見えない/操作できない
- User同期
  - 同一 `googleSub` で再ログイン時に新規ユーザーが増えず、`email` / `name` / `image` が更新される
- 一覧順序
  - 通常: `createdAt DESC, id DESC`
  - ごみ箱: `trashedAt DESC, id DESC`
- cursor契約
  - legacy `id` 単体cursorは `INVALID_CURSOR`
  - `v1` cursorで取得継続でき、返却 `nextCursor` は新形式になる
- favorite絞り込み
  - `favoriteOnly=true` でfavorite投稿のみ返る
- 状態遷移
  - trash/restore が冪等に動作する
- 制約
  - `status` と `trashedAt` の不整合データが保存されない

## 契約維持テスト

- 既存 `postRepository` I/F（`listPosts/createPost/updatePost/...`）に対し、stub実装とDB実装で同一テストセットを実行できる構造にする

# 非スコープ（本設計では確定しない）

- 全文検索インデックス（GIN等）
- Auth.js Adapter公式テーブル群の採用有無

# 実装メモ

- 項番27ではまず `schema.prisma`、migrationファイル作成、DB Repositoryの最小実装まで進める
- migration実行は別タスクとして明示許可のもとで行う
