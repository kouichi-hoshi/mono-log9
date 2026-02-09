---
title: ログイン中（sm-md）画面 実装プラン
created: 2026-02-08
source:
  - Miro: ログイン中（sm）, ログイン中(md)
  - docs/manage/作業計画書.md
  - docs/specs/05.仕様書 UI.md
notes:
  - 本プランはフェーズ1（UIのみ）で、ごみ箱（#14/#15）は別タスクとして除外する
---

## 目的

- ログイン中（スタブ認証）時に表示される `AuthedScreen`（`mono-log9-app/components/authed/AuthedScreen.tsx`）を、Miro「ログイン中（sm）」「ログイン中(md)」フレームの配置に寄せて **UIのみ** で作る。
- `docs/specs/05.仕様書 UI.md` の「ログイン済み: main に article が2つ（コンテナ1/2）」に合わせ、sm/md のレイアウト差分を Tailwind で担保する。
- ごみ箱（作業計画書 #14/#15）は本タスクから除外する（画面・導線・操作ともに着手しない）。

## 前提（現状確認）

- ルーティングは `/`（`mono-log9-app/app/page.tsx`）で `stubAuth=1` を検出すると `AuthedScreen` を描画している。
- スタブ認証の URL 付与/削除は `mono-log9-app/lib/stubAuth.ts` に集約済み。
- shadcn/ui は `button`/`dialog`/`sonner` まで導入済みで、ログイン中UIには `popover`/`skeleton`/`checkbox`/`alert(-dialog)` などが追加で必要になる。

## 実装方針（UI構造）

- `AuthedScreen` の骨格を **header/main(article×2)/footer** に整理（ログイン中は header/footer は `hidden` 扱いでもDOMは維持）。
- **main**: `article` を2つ配置し、これをコンテナ1/2に対応させる。
  - sm: 1カラム。コンテナ1を画面下部固定、コンテナ2をスクロール（コンテナ1の高さ分だけコンテナ2に下余白を確保）。
  - md+: 2カラム。コンテナ1（左）を固定（sticky）にし、コンテナ2（右）をスクロール。

## UIコンポーネント分割（提案）

- `mono-log9-app/components/authed/AuthedScreen.tsx`: 画面合成とレイアウト。
- `mono-log9-app/components/authed/Container1.tsx`: サービスロゴ、モード切替、ユーザーUI、投稿検索、投稿エディタを含める（sm: 下部固定領域、md+: 左固定サイドバー）。
- `mono-log9-app/components/authed/Container2.tsx`: 投稿一覧（カードの繰り返し）。
- `mono-log9-app/components/authed/UserMenu.tsx`: ユーザーアイコン+ポップオーバー（ログアウト導線はスタブ）。
- `mono-log9-app/components/authed/ModeToggle.tsx`: メモ/ノート切替（スタブ）。
- `mono-log9-app/components/authed/PostEditor.tsx`: 投稿エディタUI（スタブ）。
- `mono-log9-app/components/authed/PostSearch.tsx`: 検索/絞り込みUI（スタブ）。
- `mono-log9-app/components/authed/PostCard.tsx`: 投稿カードUI（スタブ）。
- `mono-log9-app/components/authed/LoadingStates.tsx`: skeleton/空表示（#16）。

## スタブ挙動（統一ルール）

- 状態は原則ローカル state（URL状態管理 #17 は別フェーズ）。
- 主要ボタン/トグルは「見た目は変わるが保存/検索/更新しない」＋ `sonner` のトーストで「未実装」を通知。
- ダミーデータは `mono-log9-app/components/authed/stubs.ts` に固定配列として切り出し、`AuthedScreen` はそれを注入してカード/検索UIに流し込む（疎結合）。

## Definition of Done（本タスク）

- sm と md+ でレイアウトが Miro の意図（sm: 下固定コンテナ1、md+: 左固定/右スクロール）に沿って見える。
- 作業計画書 #5-#13/#16 の UI が「操作できる形（スタブ）」で揃う。
- ごみ箱UI（#14/#15）は表示・導線を追加しない。

## 手動確認（開発者）

- `pnpm dev` で `/` を開き、`stubAuth=1` でログイン中画面になること。
- 幅375相当と md+ の両方で、コンテナ1/2の配置とスクロール/固定が破綻しないこと。
- 主要操作（保存/検索/スター/編集/削除など）がトーストで反応すること。

