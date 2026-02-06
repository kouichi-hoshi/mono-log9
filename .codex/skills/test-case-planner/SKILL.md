---
name: test-case-planner
description: Design test cases (unit, integration/結合, and E2E) and output a writable Markdown table with IDs (TC-xxx) and columns for level, perspective, prerequisites, steps, expected result, actual result (Pass/Fail), notes, and evidence. Use when asked to create test cases, test plans, test matrices, acceptance criteria, or coverage checklists from specs/design docs or existing code—without implementing tests.
---

# Test Case Planner

## Goal

- Create runnable, reviewable test cases.
- Output as a Markdown file that humans can fill (Pass/Fail, notes, evidence).
- Cover Unit / 結合（Integration） / E2E in one consistent format.

## Output format (fixed)

Use this exact column set:

`ID / レベル(Unit|結合|E2E) / 観点 / 前提 / 手順 / 期待結果 / 実績(Pass/Fail) / メモ / 証跡`

Rules:
- `ID`: `TC-001`… sequential within the document
- `レベル`: one of `Unit`, `結合`, `E2E`
- `実績`: leave blank for humans to fill (`Pass` / `Fail` / `-`)
- `メモ`: observations while running
- `証跡`: link/reference to proof (screenshot/video/logs/CI run URL)

## Workflow

### 1) Confirm the test target

- Feature/screen/API/job name
- In-scope behaviors
- Out-of-scope (explicitly)

### 2) Extract perspectives (観点)

Minimum:
- Happy path
- One edge/boundary case
- One failure mode (validation/auth/dependency)

See checklist: `references/test-case-perspectives.md`.

### 3) Decide the level per case

- `Unit`: single function/module/component; mock boundaries
- `結合`: multiple modules wired together; may include real DB/services *if the repo’s integration tests do so*
- `E2E`: user flow; verify observable behavior end-to-end

### 4) Write runnable steps

- Make steps short and unambiguous.
- Put setup in `前提`, actions in `手順`.
- Include exact inputs and expected outputs.

### 5) Output a Markdown file

Generate a sheet skeleton:

```bash
python3 skills/test-case-planner/scripts/new_test_case_sheet.py docs/test-cases/<feature>.md --title "<Feature title>"
```

Then fill rows with concrete cases and keep IDs stable.

## What to output in a task

- A Markdown file containing the table (and optional sections grouped by feature area).
- If asked, map cases back to requirement/spec IDs (as text in `観点` or `メモ`).

## Resources

- Template generator: `scripts/new_test_case_sheet.py`
- Perspectives checklist: `references/test-case-perspectives.md`
