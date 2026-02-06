---
name: miro-frame-fetch
description: Fetch Miro board frame data via the local mcp-miro server and a .env.miro file in mono-log9. Use when a user asks to connect to Miro, list frames, or retrieve items inside a specific frame for summary/table output.
---

# Miro Frame Fetch

## Overview

Use the local Miro MCP server setup to read board frames and their items, then summarize results for the user.

## Workflow

### 0) Declare skill usage in chat (required)

Before using this skill, declare in chat (one line) that you are using it and why.

Example:
- `Skill: miro-frame-fetch を使用します（理由: Miroボードのフレーム一覧/指定フレーム内アイテムを取得するため）`

### 1) Preconditions

- Miro MCP server location: `/Users/kouichi/mcp-servers/mcp-miro`
- Env file location: `/Users/kouichi/project/my_project/mono-log/mono-log9/.env.miro`
- `.env.miro` must contain:
  - `MIRO_OAUTH_TOKEN`
  - `MIRO_BOARD_ID`

If any value is missing, ask the user to set it before proceeding. Do not print the token in output.

### 2) List frames

Use the script to list frames:

```bash
node "/Users/kouichi/project/my_project/mono-log/mono-log9/.codex/skills/miro-frame-fetch/scripts/miro_fetch.mjs" \
  --env "/Users/kouichi/project/my_project/mono-log/mono-log9/.env.miro" \
  --list-frames
```

Summarize the result as a table: frame title, count, and key notes if needed.

### 3) Fetch items inside a frame

If the user specifies a frame name (e.g., "投稿エディタ"), fetch items:

```bash
node "/Users/kouichi/project/my_project/mono-log/mono-log9/.codex/skills/miro-frame-fetch/scripts/miro_fetch.mjs" \
  --env "/Users/kouichi/project/my_project/mono-log/mono-log9/.env.miro" \
  --frame-title "投稿エディタ"
```

Then summarize items in a simple table:
- type (shape/text/etc.)
- text/content (if present)
- size (width/height)
- position (x/y)

### 4) Output expectations

Keep output concise and redact secrets. Provide a short explanation for each frame if asked.

## Resources

### scripts/
- `miro_fetch.mjs`: list frames or fetch items in a target frame using `.env.miro`.
