---
name: commit-command
description: Create git commits in this repo with a lint gate and Japanese commit message format. Use when the user asks to commit, create a commit message, or perform a git commit.
---

# Commit Command

## Quick Start

When the user asks to commit:
1. Check changes with `git status`, `git diff`, and `git diff --staged`.
2. Stage intended files (prefer `git add -p`, or `git add <paths>`).
3. Confirm no sensitive files are staged (see "Required Constraints").
4. Run lint (this repo): prefer `pnpm -C mono-log lint` (fallback: `npm --prefix mono-log run lint`). If it fails, fix issues and rerun.
5. Draft a Japanese commit message:
   - 1st line: short title (e.g. `UI: 認証モーダルの表示改善`)
   - blank line
   - bullet list of concrete changes (`- 変更点1`)
6. Show the title and bullets and ask for final confirmation (`y/n`).
7. If `y`, commit using a HEREDOC. If `n`, stop.

## Required Constraints

- Lint is mandatory: do not commit if lint fails.
- Never commit `.env` files or sensitive data. Follow `AGENTS.md` prohibitions.
- Respect existing commit style; prefer the Japanese title + bullet list format.
- Before committing, check staged paths and abort if suspicious:
  - `git diff --staged --name-only | rg -n '(^|/)(\\.env(\\..*)?|\\.env.*)$'` (fallback: `grep -nE '(^|/)(\\.env(\\..*)?|\\.env.*)$'`)

## Commit Message Template

Use this exact format:

```
<日本語タイトル>

- 変更点1
- 変更点2
```

## Commit Command Example

```
git commit -F - <<'EOF'
UI: 認証モーダルの表示改善

- ログインボタン押下時のモーダル表示遅延を解消
- キャンセル操作後にフォーカスを元の入力へ戻す処理を追加
EOF
```
