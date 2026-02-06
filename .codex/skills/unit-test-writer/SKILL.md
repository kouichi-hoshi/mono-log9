---
name: unit-test-writer
description: Create, extend, and stabilize unit tests using TDD (Red→Green→Refactor). Use when asked to add unit tests, fix failing/flaky tests, increase coverage, or design test cases for functions/modules/components—especially in JS/TS repos using Jest or Vitest and React Testing Library. Includes a workflow, mocking guidance, and a script to detect the repo’s test stack and suggested test command.
---

# Unit Test Writer

## Goal

- Implement unit tests that are small, deterministic, and easy to maintain.
- Prefer TDD: Red → Green → Refactor.
- Keep tests hermetic: no real DB, network, filesystem, or time dependencies unless explicitly requested.

## Workflow (use this order)

### 0) Detect the test stack (optional but recommended)

Run:

```bash
python3 skills/unit-test-writer/scripts/detect_test_stack.py .
```

Use the output to decide:
- test runner (`jest` / `vitest` / `pytest` / `go test` / `cargo test`)
- the most likely “run a single test file” command
- where tests usually live in the repo

### 1) Define scope (入口/出口)

Write down:
- The unit under test (function/module/component) and the public behavior to assert
- Inputs and outputs (including thrown errors / returned Result types)
- Dependencies to fake (DB/client, network client, clock, random, adapters)

### 2) Choose the test level and seam

- Unit test: mock at the “boundary” (adapter/repository/client), not deep internals.
- If the only seam is missing, introduce one *minimally* (dependency injection or wrapper module) before adding a lot of mocks.

### 3) Write tests first (Red)

Minimum set:
- happy path
- one edge case
- one failure mode (validation/error handling)

Add more only if they cover a new branch/meaningful invariant.

### 4) Make it pass (Green)

- Prefer explicit assertions over snapshots.
- Keep test data small; use builders/helpers when repeated.

### 5) Refactor

- Remove duplication (helpers, factories)
- Improve names (test titles describe behavior)
- Stabilize time/async (fake timers or injected clock)

## React Testing Library (if applicable)

- Query by accessibility first: `getByRole`, `getByLabelText`, `getByText`
- Use `userEvent` for interactions; `await` UI updates
- Avoid `data-testid` unless there is no accessible alternative
- Prefer behavior assertions (what user sees) over implementation assertions

## Jest/Vitest hygiene

- Reset state between tests (`afterEach` cleanup, `clearMocks`)
- Control time/randomness (fake timers or dependency injection)
- Avoid shared mutable fixtures across tests

## What to output

- Added/updated test files
- Any required small refactor to make the unit testable
- Exact command(s) to run the relevant tests (single file and full suite)

## References

- Patterns/checklists: `references/unit-test-patterns.md`
- Stack detection helper: `scripts/detect_test_stack.py`
