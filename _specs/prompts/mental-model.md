Create or update a mental model for this codebase following the mental model protocol.

**Storage conventions:**
- Directory: `_data/mental-models/`
- Filename: `mental-model.<timestamp>.json` where `<timestamp>` is generated via `date -Ins` (ISO 8601 with nanosecond precision, e.g. `mental-model.2026-02-17T15:44:36,123456789-03:00.json`)
- Symlink: after writing the timestamped file, create or update a symlink:
  ```bash
  ln -sf "mental-model.<timestamp>.json" _data/mental-models/mental-model.latest.json
  ```
- The symlink `mental-model.latest.json` always points to the most recent mental model and is the canonical path consumed by downstream prompts (e.g. `create-plan.md`)

**Steps:**
1. Follow `_specs/ai-agents/mental-model-protocol.md`
2. Generate valid JSON output (no code fences) conforming to `_specs/schemas/mental-model-schema.ts`
3. Save to `_data/mental-models/mental-model.$(date -Ins).json`
4. Update the `mental-model.latest.json` symlink
