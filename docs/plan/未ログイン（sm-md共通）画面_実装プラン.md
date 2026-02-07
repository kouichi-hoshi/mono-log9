---
title: 未ログイン（sm/md共通）画面 実装プラン
created: 2026-02-07
source:
  - Miro: 未ログイン（sm/md共通）, ヘッダー, フッター（ログイン中・未ログイン共通）, Link, モーダル
  - docs/specs/05.仕様書 UI.md
  - docs/specs/06.テキスト・コンテンツ定義.md
  - docs/specs/02.仕様書 機能.md
  - docs/tech-stack/tech-stack.md
notes:
  - 余白は「適度に見やすい」標準スケールで実装し、Miroの微調整は後工程で最小差分にする
---

# 未ログイン（sm/md共通）画面 実装プラン

## ゴール/スコープ

- 対象: Next.js App Router アプリ `mono-log9-app` の `/`（未ログイン画面）
- 実装するもの（フェーズ1 UIのみ）
  - `docs/specs/05.仕様書 UI.md` の未ログイン構造: `header` / `main`（`article`=ウェルカム）/ `footer`
  - `docs/specs/06.テキスト・コンテンツ定義.md` のウェルカム文言・Link要件を、そのままUIに反映
  - Miroフレーム（未ログイン（sm/md共通）/ Link / ヘッダー / フッター / モーダル）の構成に沿って部品を配置
  - ログイン導線: 「ログイン」ボタン→ログインモーダル（認証処理はスタブ）
  - 余白: “適度に見やすい”標準値（Tailwind spacing）で実装し、Miroの細部は後で微調整できる状態にする

## 正の情報（参照元）

- 未ログインのHTML構造: [docs/specs/05.仕様書 UI.md](../specs/05.%E4%BB%95%E6%A7%98%E6%9B%B8%20UI.md)
- 文言/Link要件/通知文言: [docs/specs/06.テキスト・コンテンツ定義.md](../specs/06.%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%83%BB%E3%82%B3%E3%83%B3%E3%83%86%E3%83%B3%E3%83%84%E5%AE%9A%E7%BE%A9.md)
- ログインボタン/モーダルの挙動（UI範囲）: [docs/specs/02.仕様書 機能.md](../specs/02.%E4%BB%95%E6%A7%98%E6%9B%B8%20%E6%A9%9F%E8%83%BD.md)
- UIスタック: [docs/tech-stack/tech-stack.md](../tech-stack/tech-stack.md)
- Miroフレーム:
  - `未ログイン（sm/md共通）`
  - `ヘッダー`（アプリタイトル）
  - `フッター（ログイン中・未ログイン共通）`（コピーライト）
  - `Link`（Git/X/お問い合わせの3つの導線）
  - `モーダル`（ログインモーダルの構成要素）

## 実装方針（構造）

- 画面コンポーネントを分割して、フェーズ2以降の「ログイン後は header/footer 非表示」へ拡張しやすくする。
- 例（提案）:
  - `mono-log9-app/app/page.tsx`: `UnauthScreen` を描画（現状のテンプレ置換）
  - `mono-log9-app/components/unauth/UnauthScreen.tsx`: 画面合成
  - `mono-log9-app/components/unauth/UnauthHeader.tsx`: ヘッダー（タイトルは **Mono Log**）
  - `mono-log9-app/components/unauth/UnauthFooter.tsx`: フッター（コピーライト表示）
  - `mono-log9-app/components/unauth/WelcomeContent.tsx`: `docs/specs/06` の本文表示
  - `mono-log9-app/components/unauth/LinkCluster.tsx`: GitHub/X/お問い合わせ
  - `mono-log9-app/components/auth/LoginDialog.tsx`: ログインモーダル（shadcn/ui `Dialog`）

## 実装方針（UIライブラリ）

- `shadcn/ui` を導入し、最低限以下を使えるようにする（作業計画書 #1 に一致）
  - `button`, `dialog`, `sonner`
- アイコンは `docs/specs/06` の指示に合わせ **`lucide-react`** を採用（`aria-label` 付与、テキストラベル無し）。

## 余白（“適度に見やすい”のデフォルト値）

- 全体コンテナ: `mx-auto w-full max-w-xl px-4 sm:px-6`
- 縦余白: `py-10 sm:py-14`、セクション間は `gap-8`/`space-y-8`
- ボタンのタップ領域: 高さ44px以上（例: `h-11`）
- まずはこの標準値で実装し、Miroの最終調整は後工程で差分最小にする。

## 実装手順（コマンド/設定）

- `mono-log9-app/` で作業
- 依存導入（案）
  - `shadcn/ui` 初期化（`components.json`/`lib/utils` 等）
  - `shadcn/ui` の `button`/`dialog`/`sonner` 追加
  - `lucide-react` を追加（既存 `lucide` は互換性確認後に整理）
- `Toaster` をルートに設置（`sonner`）

## 画面要素（未ログイン）

- `header`
  - 中央にアプリタイトル（Miro: 「アプリタイトル」）→ 表示文言は **Mono Log**
- `main > article`
  - `docs/specs/06` の「ウェルカムメッセージ」ブロックをそのまま表示
  - `Link` セクション
    - 見出し要素は `sr-only`
    - GitHub/X はアイコンのみ（`aria-label` 必須）
    - 「お問い合わせ」は **ボタン**（アイコンのみ + `aria-label`）
  - 「ログイン」ボタン（押下でログインモーダルを開く）
- `footer`
  - コピーライト文言（Miro: 「コピーライト」プレースホルダ）

## ログインモーダル（UIスタブ）

- 構成（Miro `モーダル` フレーム & `docs/specs/02`）
  - タイトル: 「ログイン」
  - 閉じる（×）
  - CTA: 「Googleでログイン」（`docs/specs/06` に合わせる）
- スタブ動作
  - 押下で「失敗/キャンセル」を模擬し、トースト文言は `docs/specs/06` のエラー文言を使用
  - モーダルは閉じる

## 完了条件（Definition of Done）

- `/` を開くと未ログイン画面が表示され、`header/main(article)/footer` の構造になっている
- ウェルカム文言が `docs/specs/06` と一致している
- Link群が要件通り（アイコンのみ、`aria-label`、お問い合わせはボタン、見出しは `sr-only`）
- 「ログイン」ボタン→モーダルが開閉できる
- 「Googleでログイン」押下でトーストが表示され、モーダルが閉じる（スタブ）
- sm と md 以上で破綻なく読める（余白は標準スケールでOK）

## 動作確認（手動）

- `pnpm dev` で `/` を確認
- レスポンシブ確認: 幅375px相当 / md以上
- a11y確認（目視）
  - アイコンリンクに `aria-label`
  - フォーカス移動でボタン/リンクが操作できる

