---
name: miro-frame-fetch
description: mono-log9 のローカル mcp-miro サーバーと .env.miro を使って Miro ボードのフレームデータを取得する。Miro に接続する、フレーム一覧を取得する、または特定フレーム内のアイテムを取得して要約・表形式で出力する依頼時に使用する。
---

# Miro Frame Fetch

## 概要

ローカルの Miro MCP サーバー構成を使ってボードのフレームとそのアイテムを読み取り、結果をユーザー向けに要約する。

## ワークフロー

### 0) チャットでスキル使用を宣言する（必須）

このスキルを使う前に、チャットで1行、使用するスキルと理由を宣言する。

例:
- `Skill: miro-frame-fetch を使用します（理由: Miroボードのフレーム一覧/指定フレーム内アイテムを取得するため）`

### 1) 前提条件

- Miro MCP サーバー場所: `/Users/kouichi/mcp-servers/mcp-miro`
- 環境変数: `$ROOT/.env.miro`（`ROOT` はプロジェクトルート。以下同じ）

### 2) フレーム一覧の取得

次のスクリプトでフレーム一覧を取得する（`ROOT` はプロジェクトルートの絶対パス）:

```bash
ROOT="/Users/kouichi/project/my_project/mono-log/mono-log9"
bash -lc "source \"$ROOT/.env.miro\" && node \"$ROOT/.codex/skills/miro-frame-fetch/scripts/miro_fetch.mjs\" --list-frames"
```

結果を表形式で要約する: フレーム名、件数、必要に応じて備考。

### 3) フレーム内アイテムの取得

ユーザーがフレーム名（例: 「投稿エディタ」）を指定した場合、そのフレーム内のアイテムを取得する:

```bash
ROOT="/Users/kouichi/project/my_project/mono-log/mono-log9"
bash -lc "source \"$ROOT/.env.miro\" && node \"$ROOT/.codex/skills/miro-frame-fetch/scripts/miro_fetch.mjs\" --frame-title \"投稿エディタ\""
```

続いてアイテムを簡易な表で要約する:
- タイプ（shape/text など）
- テキスト/コンテンツ（あれば）

### 4) 出力の期待

出力は簡潔にし、秘密情報は伏せる。フレームごとの短い説明は、求められた場合に提供する。

## リソース

### scripts/
- `miro_fetch.mjs`: `process.env`（`MIRO_OAUTH_TOKEN`、`MIRO_BOARD_ID`）を使ってフレーム一覧の取得、または対象フレーム内アイテムの取得を行う。
