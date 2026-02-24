---
title: 項番28 テストケース（TipTapノート永続化 DB/API接続）
created: 2026-02-24
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/manage/作業計画書.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/02.仕様書 機能.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/12.仕様書 投稿編集-本文形式.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/15.仕様書 PrismaDB設計.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/designs/投稿編集-本文形式_設計.md
---

# 項番28 テストケース

## 対象

- `toSanitizableHtml`（content→HTML変換）の専用ユニットテスト
- 実DB経由の content/contentText ラウンドトリップ検証
- updatePost 時の contentText 再導出の DB 経由検証
- Prisma Json 型で保存→取得した content が TipTap `generateHTML()` に渡せる構造を維持するか
- 境界値（文字数上限、空本文、heading level 正規化）
- 認可境界（他ユーザー投稿の秘匿）
- `postActions`（DBモード）の create/update/list 正常系契約
- 表示経路（PostCard）での `content` 優先描画と `contentText` フォールバック

## 非対象

- 項番27で既にカバーされたテスト（cursor, limit検証, Prisma例外変換, 一覧順, 冪等性, deleteTrashPosts制約）
- `sanitizeRichHtml`（既にテスト済み）
- フルE2E拡張（項番32）
- 本番監視/性能計測（項番33）

## DB接続方針

- 開発用 `DATABASE_URL` をそのまま使用
- テスト専用 googleSub（`test-sub-28-a`, `test-sub-28-b`）でユーザーを隔離
- `beforeEach` で当該ユーザーの投稿を全削除、`afterAll` でユーザー削除

## 結合テストの実行

DB結合テスト（`dbPostRepository.integration.test.ts`, `postActions.db-contract.test.ts`）は `RUN_DB_INTEGRATION_TESTS=true` を設定した場合のみ実行されます。未設定時は `describe.skip` でスキップされ、DB未起動環境でもテストスイート全体は成功します。

**実行コマンド例**（`mono-log9-app` ディレクトリで）:

```bash
# 全テスト（DB結合含む）。DATABASE_URL が有効でDBが起動していること
RUN_DB_INTEGRATION_TESTS=true npx jest

# DB結合テストのみ
RUN_DB_INTEGRATION_TESTS=true npx jest dbPostRepository.integration.test.ts postActions.db-contract.test.ts
```

前提: `DATABASE_URL` が設定され、PostgreSQL が起動していること。

## テスト実装ファイル

| ファイル | テスト区分 | TC範囲 |
|---------|----------|--------|
| `lib/posts/__tests__/contentHtml.test.ts` | Unit | TC-001〜TC-010 |
| `lib/posts/repositories/__tests__/dbPostRepository.integration.test.ts` | 結合 | TC-011〜TC-035, TC-041〜TC-043 |
| `app/actions/__tests__/postActions.db-contract.test.ts` | 結合 | TC-036〜TC-040 |
| `components/authed/__tests__/PostCard.test.tsx` | Unit | TC-044〜TC-046 |

## A. toSanitizableHtml ユニットテスト

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | Unit | paragraph の content → HTML 生成 | `toSanitizableHtml` を直接呼び出し可能 | `{type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"本文"}]}]}` を渡す | `<p>本文</p>` を含む HTML 文字列を返す |  |  |  |
| TC-002 | Unit | heading H2/H3/H4 → HTML 生成 | 同上 | level 2, 3, 4 それぞれの heading を持つ content を渡す | `<h2>`, `<h3>`, `<h4>` タグを含む HTML を返す |  |  |  |
| TC-003 | Unit | blockquote → HTML 生成 | 同上 | blockquote > paragraph の content を渡す | `<blockquote>` タグを含む HTML を返す |  |  |  |
| TC-004 | Unit | bulletList/orderedList → HTML 生成 | 同上 | bulletList > listItem > paragraph、orderedList > listItem > paragraph の content を渡す | `<ul><li>`, `<ol><li>` タグを含む HTML を返す |  |  |  |
| TC-005 | Unit | bold マーク → HTML 生成 | 同上 | `marks:[{type:"bold"}]` 付き text を含む paragraph を渡す | `<strong>` タグを含む HTML を返す |  |  |  |
| TC-006 | Unit | link マーク → HTML 生成 | 同上 | `marks:[{type:"link",attrs:{href:"https://example.com"}}]` 付き text を渡す | `<a href="https://example.com">` を含む HTML を返す |  |  |  |
| TC-007 | Unit | hardBreak → HTML 生成 | 同上 | paragraph 内に text + hardBreak + text の content を渡す | `<br>` に相当する要素を含む HTML を返す |  |  |  |
| TC-008 | Unit | 空 paragraph → HTML 生成 | 同上 | `{type:"doc",content:[{type:"paragraph"}]}` (content 省略) を渡す | null を返さず、空段落の HTML を返す |  |  |  |
| TC-009 | Unit | 複合リッチコンテンツ → 全タグ含む HTML | 同上 | heading + paragraph(bold+link) + blockquote + bulletList + orderedList を含む content を渡す | 全ノード/マークが対応する HTML タグに変換される |  |  |  |
| TC-010 | Unit | 不正 content → null | 同上 | `{type:"unknown"}` や `null` など壊れた構造を渡す | null を返す（例外を投げない） |  |  |  |

## B. content/contentText ラウンドトリップ（DB統合テスト）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-011 | 結合 | memo: プレーンテキスト保存→取得 | テストDB初期化済み、テスト用 User あり | 1. `createDocFromPlainText("メモ本文")` で content 生成 2. `createPost({mode:"memo",content,contentText})` で保存 3. `listPosts({view:"memo"})` で取得 | `content` が `toEqual` で元と一致、`contentText` が `"メモ本文"` |  |  |  |
| TC-012 | 結合 | note: heading + paragraph 保存→取得 | 同上 | heading(level:2) + paragraph(text) の content で createPost(mode:"note") → listPosts(view:"note") | `content` の構造（type, attrs, content 配列）が完全に元と一致 |  |  |  |
| TC-013 | 結合 | note: 全ノード・マーク保存→取得 | 同上 | heading + bold + link + blockquote + bulletList + orderedList を含む content で保存→取得 | 全ノードとマーク（bold, link attrs 含む）が保持される |  |  |  |
| TC-014 | 結合 | note: hardBreak 含む content 保存→取得 | 同上 | paragraph 内に text + hardBreak + text を含む content で保存→取得 | hardBreak ノードが content 内に保持される |  |  |  |
| TC-015 | 結合 | memo: contentText 1行化の DB 経由検証 | 同上 | heading + paragraph（複数行）の content で memo createPost → 取得 | `contentText` が改行なし・スペース区切りの1行文字列 |  |  |  |
| TC-016 | 結合 | note: contentText 改行保持の DB 経由検証 | 同上 | heading + paragraph（複数行）の content で note createPost → 取得 | `contentText` に改行（`\n`）が保持される |  |  |  |
| TC-017 | 結合 | note: title 保存→取得 | 同上 | `title:"  タイトル  "` 付き note を createPost → 取得 | `title` が trim 後の `"タイトル"` で取得される |  |  |  |
| TC-018 | 結合 | memo: title なし → undefined | 同上 | title を渡さない memo を createPost → 取得 | `title` が `undefined` |  |  |  |

## C. updatePost contentText 再導出（DB統合テスト）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-019 | 結合 | memo: updatePost で contentText 再導出 | memo 投稿が DB に存在 | 1. memo createPost("最初") 2. updatePost で content を "更新後" に変更 3. listPosts で取得 | `contentText` が `"更新後"` に更新されている |  |  |  |
| TC-020 | 結合 | note: updatePost で contentText 再導出 | note 投稿が DB に存在 | 1. note createPost(heading + paragraph) 2. updatePost で content を heading + blockquote に変更 3. listPosts で取得 | `contentText` が新しい content から導出された値に更新される |  |  |  |
| TC-021 | 結合 | note: updatePost で title 更新 | note 投稿(title あり)が DB に存在 | 1. note createPost(title:"旧タイトル") 2. updatePost(title:"新タイトル", content) 3. 取得 | `title` が `"新タイトル"` |  |  |  |
| TC-022 | 結合 | note: updatePost で title を空文字 → undefined 化 | note 投稿(title あり)が DB に存在 | 1. note createPost(title:"タイトル") 2. updatePost(title:"  ", content) 3. 取得 | `title` が `undefined`（DB 上 null） |  |  |  |

## D. Prisma Json 型 → generateHTML 互換性（DB統合テスト）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-023 | 結合 | DB 取得 content → toSanitizableHtml で HTML を返す | リッチ note 投稿が DB に存在 | 1. heading + bold + link の content で createPost 2. listPosts で取得 3. 取得した `content` を `toSanitizableHtml()` に渡す | null でない HTML 文字列を返す |  |  |  |
| TC-024 | 結合 | DB 取得 content → HTML に全タグ含まれる | 同上 | TC-023 の結果 HTML を検証 | `<h2>`, `<strong>`, `<a href="...">` を含む |  |  |  |
| TC-025 | 結合 | blockquote/list 含む content → DB → HTML 変換 | blockquote + bulletList + orderedList を含む note が DB に存在 | 保存→取得→toSanitizableHtml | `<blockquote>`, `<ul>`, `<ol>` を含む HTML を返す |  |  |  |
| TC-026 | 結合 | DB 取得 content → assertValidPostContent で再検証通過 | リッチ note 投稿が DB に存在 | 保存→取得→assertValidPostContent(取得 content) | 例外を投げない |  |  |  |

## E. 境界値・エッジケース（DB統合テスト）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-027 | 結合 | memo 280文字ちょうど → 正常保存・取得 | テストDB初期化済み | 280文字の plain text で memo createPost → 取得 | 正常に保存・取得でき、contentText が 280 文字 |  |  |  |
| TC-028 | 結合 | memo 281文字 → VALIDATION_ERROR | 同上 | 281文字の plain text で memo createPost | `VALIDATION_ERROR` |  |  |  |
| TC-029 | 結合 | note 25000文字ちょうど → 正常保存・取得 | 同上 | 25000文字の content で note createPost → 取得 | 正常に保存・取得 |  |  |  |
| TC-030 | 結合 | note 25001文字 → VALIDATION_ERROR | 同上 | 25001文字の content で note createPost | `VALIDATION_ERROR` |  |  |  |
| TC-031 | 結合 | 空本文 → VALIDATION_ERROR | 同上 | 空の paragraph のみの content で createPost | `VALIDATION_ERROR`（メッセージ: 「内容を入力してください」） |  |  |  |
| TC-032 | 結合 | heading level が string "2" → 数値 2 に正規化して保存 | 同上 | `attrs:{level:"2"}` の heading で createPost → 取得 | content 内の heading の level が数値 `2` で保存されている |  |  |  |
| TC-033 | 結合 | title 101文字 → VALIDATION_ERROR | 同上 | 101文字の title で note createPost | `VALIDATION_ERROR` |  |  |  |

## F. 認可境界（DB統合テスト）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-034 | 結合 | 他ユーザー投稿を updatePost → NOT_FOUND | userA と userB の投稿が DB に存在 | userB のリポジトリで userA の postId を指定して updatePost | `NOT_FOUND` |  |  |  |
| TC-035 | 結合 | 他ユーザー投稿は listPosts に表示されない | userA と userB の投稿が DB に存在 | userA で listPosts → userB の投稿が含まれないことを確認 | userA 自身の投稿のみ返る |  |  |  |

## G. API層契約（postActions / DBモード）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-036 | 結合 | createPostAction（note）正常系 | `USE_STUB_POSTS=false`、`auth()` と `ensureActorUserFromSession()` が有効 | 1. `createPostAction({mode:"note",title,content})` 実行 2. レスポンス確認 | `ok=true`、戻り値に `content` とサーバー導出 `contentText` を含む |  |  |  |
| TC-037 | 結合 | updatePostAction（note）正常系 | DB に既存 note が存在、`USE_STUB_POSTS=false` | 1. `updatePostAction({postId,title,content})` 実行 2. 更新結果確認 | `ok=true`、更新後 `content` と再導出 `contentText` が返る |  |  |  |
| TC-038 | 結合 | listPostsAction（view=note）正常系 | DB に note 投稿が存在、`USE_STUB_POSTS=false` | `listPostsAction({view:"note",favoriteOnly:false,limit:10})` 実行 | `ok=true`、`items[*]` が `content`/`contentText` を含む |  |  |  |
| TC-039 | 結合 | createPostAction はクライアント入力 `contentText` を採用しない | `USE_STUB_POSTS=false`、テストで `as unknown as CreatePostInput` を使用可能 | `contentText:"改ざん値"` を余分フィールドで渡して create 実行 | 保存・返却 `contentText` は `content` からの導出値（改ざん値にならない） |  |  |  |
| TC-040 | 結合 | updatePostAction はクライアント入力 `contentText` を受理しない | DB に既存 note が存在、`USE_STUB_POSTS=false` | `contentText:"改ざん値"` を余分フィールドで渡して update 実行 | 返却 `contentText` は更新後 `content` から再導出した値 |  |  |  |

## H. updatePost 境界値（DB統合）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-041 | 結合 | memo 更新 281文字 → VALIDATION_ERROR | DB に既存 memo が存在 | 281文字 content で `updatePost` 実行 | `VALIDATION_ERROR` |  |  |  |
| TC-042 | 結合 | note 更新 25001文字 → VALIDATION_ERROR | DB に既存 note が存在 | 25001文字 content で `updatePost` 実行 | `VALIDATION_ERROR` |  |  |  |
| TC-043 | 結合 | updatePost 空本文 → VALIDATION_ERROR | DB に既存 memo/note が存在 | 空 paragraph のみ content で `updatePost` 実行 | `VALIDATION_ERROR`（「内容を入力してください」） |  |  |  |

## I. 表示経路契約（PostCard）

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-044 | Unit | note 表示は `content` 由来HTMLを優先 | `PostCard` を描画可能 | 有効な note `content` + `contentText` で描画 | `.md-content` が描画され、HTML要素（`h2` 等）が表示される |  |  |  |
| TC-045 | Unit | `content` 変換失敗時に `contentText` フォールバック | 同上 | 不正/非対応 `content` + `contentText` で描画 | `.md-content` は出ず `contentText` が表示される |  |  |  |
| TC-046 | Unit | fail-closed: HTML不可かつ `contentText` 空は空表示 | 同上 | HTML変換不可 `content` + 空 `contentText` で描画 | 実行時例外なし、本文表示は空（危険なHTML挿入なし） |  |  |  |
