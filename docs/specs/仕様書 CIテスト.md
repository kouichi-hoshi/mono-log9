---
title: 仕様書 CIテスト
source:
author:
  -
published:
created: 2026-02-28
description:
tags:
---
# 目的

- テスト実行のルールを統一し、PR前後および定期実行で回帰を早期検知する。
- 個人開発でも「実行忘れ」「環境差」「main混入」を防ぐ。

# 適用範囲

- 対象リポジトリ: `mono-log9-app`
- 対象テスト: Jest（Unit/Integration）、Playwright（E2E）
- 適用トリガー: `pull_request`, `push`（`main`）, `schedule`（nightly）

# 実行前提条件

- CIジョブは「公開リポジトリ」かつ「標準 GitHub-hosted runner」を利用する場合のみ実行対象とする。
- 非公開リポジトリの場合は、同一ワークフロー定義でジョブを `skip` する。
- 実装時は GitHub Actions の条件式（例: `github.event.repository.private == false`）で制御する。

# テスト種別と標準コマンド

本仕様での標準コマンド名は以下を正とする（実装はフェーズ6で追加/整備する）。

| 種別          | 目的                                 | 標準コマンド                  |
| ----------- | ---------------------------------- | ----------------------- |
| Unit        | 関数/モジュール単位の仕様保証                    | `pnpm test:unit`        |
| Integration | 画面・Server Action・Repository境界の統合保証 | `pnpm test:integration` |
| E2E Smoke   | 主要導線の短時間回帰検知                       | `pnpm test:e2e:smoke`   |
| E2E Full    | 広範囲の回帰検知（定期）                       | `pnpm test:e2e:full`    |

# CI実行フロー

## 1. PR（作成/更新）

- 実行対象: `test:unit` + `test:integration` + `test:e2e:smoke`
- 目的: マージ前の必須品質ゲート
- 条件: いずれか失敗した場合はマージ不可

## 2. mainへのpush（直push/直マージ含む）

- 実行対象: `test:unit` + `test:integration`
- 目的: main保護の回帰検知
- 補足: 実行時間と安定性を確認後、`test:e2e:smoke` の追加を検討する

## 3. nightly定期実行

- 実行対象: `test:e2e:full`
- 目的: PRで省略した範囲の定期検証
- 実行時刻: JST基準で毎日1回（時刻はワークフロー定義で固定）

# Required checks（必須ステータスチェック）

`main` ブランチのマージ条件として、以下ジョブを Required checks に設定する。

- `ci / unit`
- `ci / integration`
- `ci / e2e-smoke`

ジョブ名は Branch protection 設定と一致させるため、変更時は本仕様と設定を同時更新する。

# 証跡と保管

- PR/main実行: GitHub Actions のジョブログを証跡とする
- nightly実行: Playwright の HTML レポートと trace を artifact 保存する
- 保存期間: 14日を標準とする（運用で変更した場合は本仕様を更新）

# 失敗時運用

- PR失敗: 修正して同PRで再実行し、成功後にマージする
- main失敗: 次作業の前に失敗原因を解消し、再実行成功を確認する
- nightly失敗: 翌営業日までに原因分類（flaky/実装不具合/環境要因）し、再発防止方針を記録する

# 実DB読み書きテストの安全方針（本番DB誤削除対策）

## 1. なぜ既定で無効にするか

- DB読み書きテストは、誤接続時に本番/検証データを破壊するリスクがある。
- CIは自動反復されるため、1回の設定ミスが大きな被害につながる。
- このため、実DBへの書き込みを伴うテストは「明示的に許可されたときだけ実行」を原則とする。

## 2. 現在の安全対策（実装済み）

- 実DBテストは実行フラグを明示しない限り開始しない。
  - Jest DB統合: `RUN_DB_INTEGRATION_TESTS=true`
  - Playwright real E2E: `RUN_REAL_E2E=true`
- 書き込み許可の二重確認を要求する。
  - `ALLOW_DB_WRITE_FOR_TESTS=true`
- 接続先を allowlist で制限する。
  - `TEST_DB_HOST_ALLOWLIST`
  - `TEST_DB_NAME_ALLOWLIST`
- 条件不一致時は fail-fast でテスト開始前に停止する（実行中断ではなく開始前停止）。

## 3. 実DB読み書きテストを許可する基準

以下をすべて満たす場合のみ、実DB読み書きテストを許可する。

1. 接続先が本番と物理/論理で分離された「テスト専用DB」である。
2. `TEST_DB_HOST_ALLOWLIST` と `TEST_DB_NAME_ALLOWLIST` に本番値が含まれていない。
3. 実行者が「誤設定時の影響」と「復旧手順」を把握している。
4. 失敗時に即停止できる運用（ジョブ停止、キー無効化、接続遮断手順）が準備されている。
5. 仕様書 `docs/specs/仕様書 環境変数 env.md` の安全ガード条件を満たしている。

上記を満たすまで、実DB読み書きテストは CI デフォルト対象に含めない。

# 非対象

- Google OAuth の画面操作を含むシナリオは CI のデフォルト対象外（手動確認枠）
- 実DB書き込みを伴う E2E を CI デフォルトに含めない（安全ガード前提のため）

# 関連仕様

- `docs/specs/仕様書 機能.md`
- `docs/specs/仕様書 環境変数 env.md`
- `docs/specs/仕様書 Auth.js（Googleログイン）導入.md`
- `docs/test-cases/項番32_Playwright E2E主要フロー_テストケース.md`
