---
title: 項番32 テストケース（Playwright E2E主要フロー）
created: 2026-02-25
source:
  - docs/manage/作業計画書.md
  - docs/manage/項番32_残タスク.md
  - docs/specs/仕様書 機能.md
  - docs/specs/仕様書 Auth.js（Googleログイン）導入.md
  - docs/specs/仕様書 環境変数 env.md
---

# 項番32 テストケース

## 対象

- Playwright による主要フロー総合シナリオ（stub）
- 実DB + Auth.js 境界のE2E（real project、Google画面操作を除く）
- ログアウト後の戻る/進む・BFCache観点（Chromium自動 + 必要時に他ブラウザ追加）
- 実DBテストの安全ガード（fail-fast）

## 非対象

- Google OAuth 画面遷移（アカウント選択/同意画面）の自動化
- CI定期実行設定（項番32完了条件の必須外）

## 完了判定（項番32）

- 必須TC（TC-001〜TC-010）が実装済みかつ Pass
- Google OAuth 画面操作は通常ブラウザ手動スモークとして運用ルールが明記されている
- 実DB E2Eは安全ガード条件を満たさない場合に開始前停止する

## 実行前チェック（実DB E2E）

- `RUN_REAL_E2E=true`
- `ALLOW_DB_WRITE_FOR_TESTS=true`
- `TEST_DB_HOST_ALLOWLIST` を設定済み
- `TEST_DB_NAME_ALLOWLIST` を設定済み
- `DATABASE_URL` が許可リストに一致するテストDBを指している

## 実行コマンド例

`mono-log9-app` で実行:

```bash
# 既存stub E2E
pnpm test:e2e

# 実DB E2E（real project, Google画面操作を除く）
RUN_REAL_E2E=true \
ALLOW_DB_WRITE_FOR_TESTS=true \
TEST_DB_HOST_ALLOWLIST=localhost,127.0.0.1 \
TEST_DB_NAME_ALLOWLIST=mono_log9_test,mono_log9_e2e_test \
pnpm test:e2e:real
```

## テストケース一覧

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | E2E | stub総合フロー | `USE_STUB_AUTH=true`, `USE_STUB_POSTS=true` | ログイン→作成/編集→favorite→ごみ箱→復元→完全削除 | 主要フローが一連で成立する | Pass | `major-flow.stub.spec.ts` で確認済み | `mono-log9-app/e2e/major-flow.stub.spec.ts` |
| TC-002 | E2E | ログアウト後戻る/進む（must） | ログイン済み | ログアウト後に戻る/進む操作 | 認可境界が破られず、ログイン中操作は不可 | Pass | `logout-history-bfcache.spec.ts` で確認済み | `mono-log9-app/e2e/logout-history-bfcache.spec.ts` |
| TC-003 | E2E | BFCache観測（Chromium） | Chromiumで実行可能 | ログアウト後に戻る/進む操作 | must条件を満たし、navigation type を記録できる | Pass | Firefox/WebKit は必要時追加 | `mono-log9-app/e2e/logout-history-bfcache.spec.ts` |
| TC-004 | E2E | 実DBガード: RUN_REAL_E2E不足 | real実行を想定 | `RUN_REAL_E2E` なしで real setup を起動 | 開始前に fail-fast 停止 | Pass | `testDatabaseGuard` の runner flag 不足ケースで fail-fast を確認 | `pnpm exec jest lib/db/__tests__/testDatabaseGuard.test.ts --runInBand` |
| TC-005 | E2E | 実DBガード: ALLOW不足 | `RUN_REAL_E2E=true` | `ALLOW_DB_WRITE_FOR_TESTS` なしで real setup を起動 | 開始前に fail-fast 停止 | Pass | `Error: [test-db-guard] ALLOW_DB_WRITE_FOR_TESTS=true is required.` を確認 | `mono-log9-app/e2e/setup/ensure-safe-test-db.ts` |
| TC-006 | E2E | 実DBガード: host不許可 | `RUN_REAL_E2E=true` ほか設定済み | 許可外hostを `DATABASE_URL` に設定して起動 | 開始前に fail-fast 停止 | Pass | `testDatabaseGuard` の host allowlist 不一致ケースで fail-fast を確認 | `pnpm exec jest lib/db/__tests__/testDatabaseGuard.test.ts --runInBand` |
| TC-007 | E2E | 実DBガード: dbName不許可 | `RUN_REAL_E2E=true` ほか設定済み | 許可外dbNameを `DATABASE_URL` に設定して起動 | 開始前に fail-fast 停止 | Pass | `testDatabaseGuard` の dbName allowlist 不一致ケースで fail-fast を確認 | `pnpm exec jest lib/db/__tests__/testDatabaseGuard.test.ts --runInBand` |
| TC-008 | E2E | 実DBガード: current_database不一致 | DB接続可能 | URL dbName と current_database() を不一致にして起動 | 開始前に fail-fast 停止 | Pass | `testDatabaseGuard` の current_database 不一致ケースで fail-fast を確認 | `pnpm exec jest lib/db/__tests__/testDatabaseGuard.test.ts --runInBand` |
| TC-009 | E2E | 実DB realスモーク（非ログイン） | 実DBガード条件を満たす | 未ログイン画面表示を確認 | Auth.js未ログイン画面が表示される | Pass | `major-flow.real.spec.ts` の smoke ケースで確認 | `mono-log9-app/e2e/major-flow.real.spec.ts` |
| TC-010 | 手動 | Google OAuthログイン導線 | OAuth設定済み | 通常ブラウザでログイン→戻り→ログアウト | ログイン/戻り/ログアウト導線が成立する | Pass | Playwright対象外。手動確認で成立を確認 | 手動確認（2026-02-26） |
