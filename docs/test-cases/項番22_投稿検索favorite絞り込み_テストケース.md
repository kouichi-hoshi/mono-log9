---
title: 項番22 テストケース（投稿検索 favorite絞り込み）
created: 2026-02-19
source:
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/manage/作業計画書.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/01.要件定義書.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/02.仕様書 機能.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/09.仕様書 URLクエリ状態管理.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/10.仕様書 スタブ投稿データ（USE_STUB_POSTS）.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/11.仕様書 投稿一覧取得-キャッシュ-ページング.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/designs/投稿一覧取得-キャッシュ-ページング_設計.md
  - /Users/kouichi/project/my_project/mono-log/mono-log9/docs/specs/06.テキスト・コンテンツ定義.md
---

# 項番22 テストケース

## 対象

- favorite絞り込みON/OFF時のURLクエリ遷移（`favoriteMemo` / `favoriteNote`）
- 一覧条件（`view` + `favoriteOnly`）単位の取得・キャッシュ復元
- favorite絞り込み切替時の取得方針（未取得条件のみ初回取得、取得済み条件は即時復元）
- `setFavorite` 実行時のキャッシュ整合（同一`view`の関連キー `favoriteOnly=true/false`）
- `view=trash` でfavorite条件を評価しない挙動

## 非対象

- hasEdits離脱確認そのものの仕様妥当性（項番21で検証）
- ノートモーダル履歴連動（項番22-A）
- ごみ箱の一括完全削除（項番23）

| ID     | レベル(Unit\|結合\|E2E) | 観点                                 | 前提                                                                   | 手順                                                            | 期待結果                                                    | 実績(Pass/Fail) | メモ  | 証跡  |
| ------ | ------------------ | ---------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- | ------------- | --- | --- |
| TC-001 | Unit               | memo表示時のfavoriteトグルクエリ生成           | クエリ生成関数を単体呼び出し可能                                                     | `view=memo&stubAuth=1&favoriteNote` でfavoriteトグル関数を実行する       | `favoriteMemo` が付与され、`favoriteNote` と `stubAuth` が保持される |               |     |     |
| TC-002 | Unit               | note表示時のfavoriteトグルクエリ生成           | 同上                                                                   | `view=note&favoriteMemo&favoriteNote` でfavoriteトグル関数を実行する     | `favoriteNote` のみOFFになり、`favoriteMemo` は保持される           |               |     |     |
| TC-003 | Unit               | trash表示時はfavoriteトグルno-op          | 同上                                                                   | `view=trash&favoriteMemo` でfavoriteトグル関数を実行する                 | `changed=false` でURLは変化しない                              |               |     |     |
| TC-004 | Unit               | favoriteクエリの有無判定                   | クエリ正規化関数を単体呼び出し可能                                                    | `favoriteMemo` と `favoriteMemo=` をそれぞれ入力する                    | いずれもfavorite ONとして解釈される                                 |               |     |     |
| TC-005 | Unit               | 重複favoriteクエリの正規化                  | 同上                                                                   | `view=note&favoriteNote&favoriteNote=` を正規化する                 | favoriteキーが1つに正規化される                                    |               |     |     |
| TC-006 | Unit               | 一覧条件導出: trash時favorite固定           | 一覧条件正規化関数を単体呼び出し可能                                                   | `view=trash, favoriteOnly=true` を入力する                         | 導出結果の `favoriteOnly` が `false` になる                      |               |     |     |
| TC-007 | Unit               | queryKey分離（同一viewのfavorite差分）      | queryKey生成関数を単体呼び出し可能                                                | `view=memo,favoriteOnly=false/true` のキーを比較する                  | キーが一致せず、条件別に分離される                                       |               |     |     |
| TC-008 | Unit               | favorite更新時の関連キー整合                 | キャッシュ更新ヘルパーを単体呼び出し可能                                                 | 同一`view`の `favoriteOnly=false/true` キャッシュを用意してfavorite更新を適用する | 両キーの投稿状態が整合し、`favoriteOnly=true` 側は条件不一致投稿を含まない         |               |     |     |
| TC-009 | 結合                 | favorite ON初回切替（未取得条件）             | `view=memo&favoriteMemo` 未取得、`view=memo` は取得済み                       | favoriteボタンを押してONに切替える                                        | `favoriteOnly=true` 条件で初回取得が走り、取得完了後に絞り込み一覧が表示される       |               |     |     |
| TC-010 | 結合                 | favorite OFF初回切替（未取得条件）            | `view=note&favoriteNote` は取得済み、`view=note` 未取得                       | favoriteボタンを押してOFFに切替える                                       | `favoriteOnly=false` 条件で初回取得が走り、通常一覧が表示される              |               |     |     |
| TC-011 | 結合                 | 取得済み条件への切替で即時復元                    | `view=memo` と `view=memo&favoriteMemo` の両条件を取得済みにする                  | OFF→ON→OFF を連続で切替え、一覧取得呼び出し回数を確認する                            | 2回目以降の切替は即時復元され、切替操作自体で一覧取得呼び出し回数が増えない                  | Pass          | 2026-02-19実施 | `pnpm exec jest components/authed/__tests__/AuthedScreen.test.tsx lib/__tests__/authedQueryState.test.ts lib/posts/__tests__/queryKeys.test.ts --runInBand` |
| TC-012 | 結合                 | モード別favorite状態の保持                  | memo/note双方で一覧表示可能                                                   | memoでON後にnoteへ移動し、noteでもON後にmemoへ戻る                           | `favoriteMemo` と `favoriteNote` が独立保持され、戻ったモードの状態が復元される |               |     |     |
| TC-013 | 結合                 | trash時favorite非評価                  | `?view=trash&favoriteMemo` で表示可能                                     | trash表示時の一覧取得入力を確認する                                          | 一覧取得は `view=trash,favoriteOnly=false` で実行される            |               |     |     |
| TC-014 | 結合                 | 投稿スターON/OFF（非絞り込み表示）               | `view=memo,favoriteOnly=false` で投稿1件表示                               | 投稿カードのスターをON→OFFに切替える                                         | 投稿は一覧に残り、スター表示だけが更新される                                  |               |     |     |
| TC-015 | 結合                 | 投稿スターOFF（favoriteOnly=true）        | `view=note,favoriteOnly=true` でお気に入り投稿を表示                            | 表示中投稿のスターをOFFにする                                              | 該当投稿が一覧から即時除外される                                        |               |     |     |
| TC-016 | 結合                 | related key整合: OFF一覧でON化後にON一覧へ切替  | `view=memo,favoriteOnly=false` と `view=memo,favoriteOnly=true` を取得済み | OFF一覧で投稿Aをfavorite ONにしてからON一覧へ切替える                           | 追加再取得なしで投稿AがON一覧に反映される（整合済み）                            | Pass          | 2026-02-19実施 | `pnpm exec jest components/authed/__tests__/AuthedScreen.test.tsx lib/__tests__/authedQueryState.test.ts lib/posts/__tests__/queryKeys.test.ts --runInBand` |
| TC-017 | 結合                 | setFavorite失敗時の状態維持                | `setFavorite` を `NOT_FOUND` などで失敗モック可能                               | 投稿カードのスターを押下して失敗させる                                           | エラートーストを表示し、一覧状態・スター表示は変更しない                            |               |     |     |
| TC-018 | 結合                 | favorite切替時のhasEdits連携境界（継続）       | メモ編集中で `hasEdits=true` にできる                                          | favoriteボタン押下後、離脱確認で「編集を続ける」を選ぶ                               | URLは変更されず、入力中内容を維持する（項番21との境界確認）                        | Pass          | 2026-02-19実施 | `pnpm exec jest components/authed/__tests__/AuthedScreen.test.tsx lib/__tests__/authedQueryState.test.ts lib/posts/__tests__/queryKeys.test.ts --runInBand` |
| TC-019 | E2E                | 実導線: memoでfavorite絞り込みON/OFF       | `/?stubAuth=1&view=memo` で投稿表示可能                                     | favoriteボタンをON→OFFに切替える                                       | URLが `favoriteMemo` 付与/除去され、表示一覧が追従する                   | Pass          | 2026-02-19実施 | `pnpm exec playwright test e2e/favorite-filter.spec.ts` |
| TC-020 | E2E                | 実導線: モード別favorite状態保持 + 履歴復元       | memo/note双方で投稿表示可能                                                   | memoでON→note移動→noteでON→戻る/進むを実行する                             | 各履歴位置で `view` と対応favorite状態が復元される                       | Pass          | 2026-02-19実施 | `pnpm exec playwright test e2e/favorite-filter.spec.ts` |
| TC-021 | E2E                | 実導線: trash非評価と復帰時再評価               | memoでfavorite ON状態を作ってからtrashへ移動可能                                   | `view=trash` 表示後、memoへ戻る                                      | trashではfavorite条件非評価、memo復帰後は保持していたfavorite条件を再評価する     | Pass          | 2026-02-19実施 | `pnpm exec playwright test e2e/favorite-filter.spec.ts` |
| TC-022 | E2E                | 実導線: star更新と絞り込み整合                 | memo通常一覧とfavorite一覧を切替可能                                             | 通常一覧で投稿をfavorite ONにし、その後favorite ON一覧へ切替える                   | 投稿がfavorite ON一覧に表示され、表示の不整合やチラつきがない                    | Pass          | 2026-02-19実施 | `pnpm exec playwright test e2e/favorite-filter.spec.ts` |
| TC-023 | 結合                 | related key整合: ON一覧でOFF化後にOFF一覧へ切替 | `view=memo,favoriteOnly=false` と `view=memo,favoriteOnly=true` を取得済み | ON一覧で投稿Aをfavorite OFFにしてからOFF一覧へ切替える                          | 追加再取得なしで投稿AがOFF一覧に反映される（整合済み）                           | Pass          | 2026-02-19実施 | `pnpm exec jest components/authed/__tests__/AuthedScreen.test.tsx lib/__tests__/authedQueryState.test.ts lib/posts/__tests__/queryKeys.test.ts --runInBand` |
| TC-024 | 結合                 | お気に入りボタンUI状態（グレー/イエロー）             | `view=memo` で表示可能                                                    | favoriteボタンをOFF→ON→OFFに切替える                                   | `aria-pressed` と見た目（OFF=グレー、ON=イエロー）が切替に追従する            | Pass          | 2026-02-19実施 | `pnpm exec jest components/authed/__tests__/AuthedScreen.test.tsx lib/__tests__/authedQueryState.test.ts lib/posts/__tests__/queryKeys.test.ts --runInBand` |
| TC-025 | E2E                | trash表示時はお気に入りボタン非表示               | `/?stubAuth=1&view=trash` で表示可能                                      | trash画面のヘッダー領域を確認する                                           | お気に入りボタンが表示されない（favorite操作不可）                           | Pass          | 2026-02-19実施 | `pnpm exec playwright test e2e/favorite-filter.spec.ts` |
| TC-026 | 結合                 | favorite切替時のhasEdits連携境界（破棄）       | メモ編集中で `hasEdits=true` にできる                                          | favoriteボタン押下後、離脱確認で「破棄して続行」を選ぶ                               | 編集内容を破棄してfavorite切替が適用される                               | Pass          | 2026-02-19実施 | `pnpm exec jest components/authed/__tests__/AuthedScreen.test.tsx lib/__tests__/authedQueryState.test.ts lib/posts/__tests__/queryKeys.test.ts --runInBand` |
