---
title: F7-1 テストケース（hasEdits離脱確認 + URL遷移制御統合改善）
created: 2026-03-02
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/manage/作業計画書.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 投稿編集・離脱確認.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/仕様書 URLクエリ状態管理.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/memo/メモ：一時メモ.md
---

# F7-1 テストケース

## 対象

- hasEdits=true で URL 遷移要求が発生した際の保留制御
- 保留中に遷移先 UI を表示しないこと（ちらつき抑制）
- 保留解決時（継続/破棄）の pending 管理と確定クエリ更新

## 非対象

- hasEdits 判定ロジック自体の妥当性（項番21で検証済み）
- noteComposer の URL 仕様全体（項番22-Aで検証済み）
- 一覧キャッシュ・無限スクロール仕様全体（項番20で検証済み）
- 既存で担保済みの分岐（継続で維持、破棄で遷移、文言確認）

## 実装方針（既存テスト更新）

- F7-1では新規の大規模テストファイル追加は行わず、既存テストを更新して要件を担保する
- 更新対象（予定）
  - `mono-log9-app/components/authed/__tests__/AuthedScreen.test.tsx`
  - `mono-log9-app/e2e/has-edits.spec.ts`
- 既存で担保済みの分岐ケースは維持し、F7-1固有観点（保留中の遷移先UI非表示・pending/確定クエリ管理）を追記する

| ID | レベル(Unit\|結合\|E2E) | 観点 | 前提 | 手順 | 期待結果 | 実績(Pass/Fail) | メモ | 証跡 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | Unit | 保留開始時に確定クエリを維持 | `hasEdits=true` かつ URL 遷移要求を扱う関数を単体呼び出し可能 | 遷移要求（例: `view=note`→`view=memo`）を発火する | 保留アクションが記録され、画面参照クエリは遷移前（確定済み）を維持する |  |  |  |
| TC-002 | Unit | 保留中は遷移先状態を描画用に採用しない | 描画用クエリ決定ロジックを単体呼び出し可能 | 保留中の状態で現在 URL を遷移先へ変更した入力を与える | 描画判定は遷移先でなく確定済みクエリを返す |  |  |  |
| TC-003 | Unit | 「編集を続ける」で保留破棄 | 保留アクション管理を単体呼び出し可能 | 保留中に「編集を続ける」を実行する | 保留アクションが破棄され、確定済みクエリは変更されない |  |  |  |
| TC-004 | Unit | 「破棄して続行」で保留適用 | 保留アクション管理を単体呼び出し可能 | 保留中に「破棄して続行」を実行する | 保留アクションが適用され、確定済みクエリが遷移先へ更新される |  |  |  |
| TC-005 | 結合 | 戻る操作保留中に遷移先タブを表示しない | `view=note` 編集中（`hasEdits=true`）、戻る先が `view=memo` の履歴がある | ブラウザ戻るを実行し、離脱確認表示中のタブ状態を確認する | 離脱確認表示中は `note` 表示のままで、`memo` タブ/一覧は表示されない |  |  |  |
| TC-006 | 結合 | 進む操作保留中に遷移先タブを表示しない | `view=memo` 編集中（`hasEdits=true`）、進む先が `view=note` の履歴がある | ブラウザ進むを実行し、離脱確認表示中のタブ状態を確認する | 離脱確認表示中は `memo` 表示のままで、`note` タブ/一覧は表示されない |  |  |  |
| TC-007 | E2E | 実導線: 戻る保留中のちらつき抑止 | `/?stubAuth=1&view=note` でノート編集中（変更あり） | 戻る実行直後に UI を確認し、ダイアログ表示中の表示状態を確認する | ダイアログ表示中に `memo` 側 UI が一瞬も観測されない |  |  |  |
