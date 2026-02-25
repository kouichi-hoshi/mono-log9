---
title: 項番31 テストケース（Jest単体/結合テスト基盤と主要ケース）
created: 2026-02-25
source:
  - docs/manage/作業計画書.md
  - docs/specs/仕様書 機能.md
  - docs/specs/仕様書 投稿編集・離脱確認.md
  - docs/specs/仕様書 URLクエリ状態管理.md
  - docs/specs/仕様書 投稿編集-本文形式.md
  - docs/specs/仕様書 PrismaDB設計.md
---

# 項番31 テストケース

## 対象

- Jest による単体/結合テスト実行基盤（設定・実行方法・対象範囲）
- 投稿バリデーション（入力不正時の `VALIDATION_ERROR`）
- hasEdits 判定（変更あり/なし、トリム差分）
- URL クエリ状態管理（`view` / `favoriteMemo` / `favoriteNote` / `noteComposer`）
- favorite 絞り込み（クエリ連動、キャッシュ整合）
- 権限/エラー（`UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `INTERNAL_ERROR`）

## 非対象

- Playwright E2E 全体シナリオ（項番32）
- CWV 計測・性能目標の達成確認（項番33）
- Prisma マイグレーション手順そのもの

## 完了判定（項番31）

- 本ファイルの必須 TC（TC-001〜TC-015）が実装済みかつ Pass である
- `mono-log9-app/jest.config.mjs` と `mono-log9-app/jest.setup.ts` が維持され、Jest 実行が可能である
- 主要観点（バリデーション / hasEdits / URL状態 / favorite絞り込み / 権限・エラー）に対する回帰テストが存在する

## 実行コマンド例

`mono-log9-app` ディレクトリで実行:

```bash
# 単体/結合テスト（DB結合を除く）
pnpm exec jest

# DB結合を含めて実行する場合
RUN_DB_INTEGRATION_TESTS=true pnpm exec jest
```

## 実行結果（2026-02-25）

- 実行コマンド: `pnpm exec jest lib/posts/__tests__/inputValidation.test.ts lib/posts/__tests__/hasEdits.test.ts lib/__tests__/authedQueryState.test.ts components/authed/__tests__/AuthedScreen.test.tsx app/actions/__tests__/postActions.test.ts --runInBand`
- 結果: 5 Suites passed / 5 total、107 Tests passed / 107 total、失敗 0、警告 0
- 実行時間: 5.42s

## テスト実装ファイル（トレーサビリティ）

| ファイル | テスト区分 | 主な観点 |
|---|---|---|
| `lib/posts/__tests__/inputValidation.test.ts` | Unit | 投稿バリデーション |
| `lib/posts/__tests__/hasEdits.test.ts` | Unit | hasEdits 判定 |
| `lib/__tests__/authedQueryState.test.ts` | Unit | URLクエリ状態管理 |
| `components/authed/__tests__/AuthedScreen.test.tsx` | 結合 | favorite絞り込み、URL連動、破棄確認連携 |
| `app/actions/__tests__/postActions.test.ts` | Unit/結合 | 権限/エラー契約、バリデーション優先順位 |

## テストケース一覧

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | Unit | list limit 正常値 | Jest 実行可能 | `normalizeListLimit(1/10/50)` を呼ぶ | 各値をそのまま返す | Pass | 項番31回帰実行で確認 | `lib/posts/__tests__/inputValidation.test.ts` |
| TC-002 | Unit | list limit 異常値 | 同上 | `normalizeListLimit(0/51/1.5)` を呼ぶ | `VALIDATION_ERROR` 相当の検証エラーになる | Pass | 項番31回帰実行で確認 | `lib/posts/__tests__/inputValidation.test.ts` |
| TC-003 | Unit | postId 形式バリデーション | 同上 | mode 別に不正 postId で検証関数を呼ぶ | 不正値が拒否される | Pass | 項番31回帰実行で確認 | `lib/posts/__tests__/inputValidation.test.ts` |
| TC-004 | Unit | hasEdits: 変更なし | 同上 | 初期値と同一入力で `isMemoDirty` / `isNoteDirty` を呼ぶ | `false` を返す | Pass | 項番31回帰実行で確認 | `lib/posts/__tests__/hasEdits.test.ts` |
| TC-005 | Unit | hasEdits: 実質差分あり | 同上 | 本文やタイトルを変更して `isMemoDirty` / `isNoteDirty` を呼ぶ | `true` を返す | Pass | 項番31回帰実行で確認 | `lib/posts/__tests__/hasEdits.test.ts` |
| TC-006 | Unit | hasEdits: trim-only 差分 | 同上 | 前後空白のみ変えたタイトルで `isNoteDirty` を呼ぶ | `false` を返す | Pass | 項番31回帰実行で確認 | `lib/posts/__tests__/hasEdits.test.ts` |
| TC-007 | Unit | URL正規化: 空クエリ | 同上 | `normalizeAuthedQuery("")` を呼ぶ | `view=memo` に正規化される | Pass | 項番31回帰実行で確認 | `lib/__tests__/authedQueryState.test.ts` |
| TC-008 | Unit | URL正規化: favorite 重複/不正値 | 同上 | `favoriteNote` 重複を含むクエリを正規化する | 重複が解消され正規形になる | Pass | 項番31回帰実行で確認 | `lib/__tests__/authedQueryState.test.ts` |
| TC-009 | Unit | URL更新: view 切替 | 同上 | `buildQueryForViewChange` を呼ぶ | 既存キーを保ちつつ `view` のみ更新される | Pass | 項番31回帰実行で確認 | `lib/__tests__/authedQueryState.test.ts` |
| TC-010 | Unit | URL更新: favorite トグル | 同上 | `buildQueryForFavoriteToggle` を呼ぶ | view に応じた favorite キーが更新される | Pass | 項番31回帰実行で確認 | `lib/__tests__/authedQueryState.test.ts` |
| TC-011 | 結合 | favorite 絞り込みで不要再取得を抑制 | React Query テスト環境 | favorite on/off を取得済み条件で切替 | 不要な再 fetch を行わずキャッシュ復元する | Pass | 項番31回帰実行で確認 | `components/authed/__tests__/AuthedScreen.test.tsx` |
| TC-012 | 結合 | favorite 更新時のキャッシュ同期 | 同上 | 投稿のお気に入り状態を切替 | on/off 両条件のキャッシュ整合が保たれる | Pass | 項番31回帰実行で確認 | `components/authed/__tests__/AuthedScreen.test.tsx` |
| TC-013 | Unit/結合 | 401 優先（DBモード） | 未ログイン相当の session | `postActions` の create/list などを呼ぶ | `UNAUTHORIZED` が優先して返る | Pass | 項番31回帰実行で確認 | `app/actions/__tests__/postActions.test.ts` |
| TC-014 | Unit/結合 | 入力不正時 `VALIDATION_ERROR` | 入力不正 payload | `postActions` の create/update/list を呼ぶ | `VALIDATION_ERROR` を返す | Pass | 項番31回帰実行で確認 | `app/actions/__tests__/postActions.test.ts` |
| TC-015 | Unit/結合 | 想定外例外時 `INTERNAL_ERROR` | repository が未知例外を投げる | `postActions` を呼ぶ | `INTERNAL_ERROR` を返し状態維持前提を守る | Pass | 項番31回帰実行で確認 | `app/actions/__tests__/postActions.test.ts` |
