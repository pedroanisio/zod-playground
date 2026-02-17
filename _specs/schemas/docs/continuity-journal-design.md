# Continuity Journal Design

Companion design notes extracted from `continuity-journal.ts`.

## Principles

1. Capture why decisions were made, not only what changed.
2. Link sessions so context survives interruptions.
3. Record weighted observations and stop reasons for recurring-pattern detection.

## Architecture

- `ContinuityJournalSchema`
- `entries[]` of `ContinuityJournalEntrySchema`
- Entry components include:
  - `stopped_because` (discriminated union)
  - `files_of_interest`
  - `branch_state`
  - `next_steps`
  - `open_questions`
  - `environment`
  - `ai_handoff`

## Intended Outcome

The schema preserves high-value execution context so the next session can resume with minimal reconstruction overhead.
