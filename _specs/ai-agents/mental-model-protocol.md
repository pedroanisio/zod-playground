# Mental Model Protocol

**Purpose:** How to produce a reviewable mental model before committing to a formal plan. The mental model makes the agent's understanding of scope, entities, and assumptions explicit so the human can verify it at 1/10th the cost of reviewing a full plan.

Creates shared state between AI agents and humans
Save to: `_data/mental-models/mental-model.<timestamp>.json` (timestamp via `date -Ins`)
Symlink: `_data/mental-models/mental-model.latest.json` → most recent file
Not a plan—verification checkpoint only

---

## When to Produce a Mental Model

**MANDATORY** before generating a PlanSchema when ANY of these conditions hold:

- Task complexity is **L or XL**
- The request references an **existing plan or architecture document** (plan reconciliation)
- The request uses **scope-ambiguous language** ("completion," "finish," "everything," "move forward")
- The codebase has **more than 20 files** in the affected scope zones
- The agent estimates the plan will exceed **400 lines**

**SKIP** the mental model (proceed directly to plan generation) when:

- Task complexity is **XS or S** with unambiguous scope
- The user has already provided a confirmed, itemized scope
- The task is a single-step change (bug fix, config update)

When in doubt, produce the mental model. It costs 80–200 lines. A wrong plan costs 800–1500 lines plus the reasoning tokens that produced it.

---

## Phase 1: Build the Model

### 1.1 Inspect the Codebase First

Before reading any reference documents, inventory the codebase:

```bash
# What exists? Get a file inventory
_specs/scripts/treemeta.sh -g -l -e ts,tsx --limit 100 ./src

# How big is it?
_specs/scripts/treemeta.sh -g --count ./src

# What's the test state?
npm test -- --coverage 2>&1 | tail -10

# What's the git state?
git rev-parse --short HEAD
```

This builds the `baseline` section. The codebase is the source of truth — reference documents are consulted second, evaluated against what the codebase actually shows.

### 1.2 Read Reference Documents

If the user pointed to reference documents (old plans, architecture docs, appendices), read them now. For each entity or claim in the reference:

- **Exists in codebase** → add to `entities.verified`
- **Not in codebase, but the plan will create it** → add to `entities.confirmedAbsent` (it's a deliverable, not a hallucination)
- **Not in codebase, status unclear** → add to `entities.unverified`

**CRITICAL:** The reference document's trust level is `"reference"`, not `"codebase"`. A previous plan is a previous agent's output. An architecture doc is a human's intent. Neither is current reality.

### 1.3 Formulate the Target State

Write the target state definition as one sentence. Then check:

- Did the user state this explicitly? → `derivation: "user-explicit"`
- Did you infer it from a reference doc? → `derivation: "inferred-from-reference"` + write `derivationRationale`
- Did you infer it from codebase gaps? → `derivation: "inferred-from-codebase"` + write `derivationRationale`

If the derivation is not user-explicit, **this is the #1 thing the human needs to verify.** Make `derivationRationale` clear and specific.

### 1.4 Identify the Delta

The delta = target state − baseline state. Organize it into work streams where each work stream is a coherent unit of work that delivers a specific capability.

**Work stream sizing guideline:**

| Work stream size | Expected plan steps | Lines per step |
|---|---|---|
| XS | 1 | ~30 |
| S | 1–2 | ~40 |
| M | 2–4 | ~60 |
| L | 4–8 | ~60 |
| XL | 8–16 | ~60 |

Use this to estimate whether the delta fits in a single plan or needs phasing.

### 1.5 Partition Entities

For every domain entity (adapter, service, endpoint, data source, API) the plan will reference:

1. **Can you confirm it exists from the codebase?** → `verified` (include the file path or command)
2. **Does a reference doc mention it but you can't find it in the codebase?** → `unverified`
3. **Did you look for it and confirm it's NOT there?** → `confirmedAbsent`

The `unverified` list is the human review hotspot. Every item on it is either:
- Something the human confirms (moves to verified)
- Something the human says "that doesn't exist" (remove from scope)
- Something that needs to be built (moves to confirmedAbsent as a deliverable)

### 1.6 Surface Assumptions and Questions

For anything you're not sure about, be explicit:

- **Assumption:** "I believe X because Y" → add to `assumptions` with confidence level
- **Question:** "I can't determine X, and the answer changes the plan" → add to `openQuestions` with options
- **Decision:** "X requires human authority because it involves vendor cost / irreversible architecture" → add to `openDecisions`

**The mental model is allowed to be incomplete.** That's the point. Open questions and unverified entities are features, not bugs — they're the things that would have been silently wrong in a plan.

### 1.7 Propose Phases (if needed)

Estimate total plan size: `sum(work_stream_steps × 60) + 200`.

If the estimated plan exceeds **800 lines**, propose phases. Each phase should be:
- A complete PlanSchema instance (not a partial plan)
- Independently executable (given its dependencies)
- Small enough to fit in a single plan generation pass

---

## Phase 2: Present for Review

Generate the mental model as JSON, validate it with `validateMentalModel()`, and present it to the human.

**The presentation should be concise.** The human needs to review this in under 5 minutes. The JSON is the authoritative artifact, but you can add a brief prose summary highlighting:

1. **Target state** — is this what you want?
2. **Unverified entities** — do these exist?
3. **Open questions** — I need answers to proceed
4. **Open decisions** — these need your authority
5. **Proposed phases** — does this splitting make sense?

**Do NOT generate a plan yet.** The mental model is a checkpoint. Wait for human confirmation.

---

## Phase 3: Incorporate Feedback

The human will respond with one of:

### "Looks good, proceed"
→ All open questions implicitly resolved (agent uses its recommendation)
→ All unverified entities implicitly confirmed
→ Proceed to plan generation using the confirmed mental model as input

### Specific corrections
→ Update the mental model
→ Re-validate
→ If new questions arise from the corrections, present them
→ Proceed to plan generation when the model is stable

### "Wrong scope" / redirect
→ Rebuild the mental model with the corrected scope
→ Present again for review

### Partial confirmation
→ "Phase 1 looks right, but I'm not sure about Phase 2"
→ Generate plan for confirmed phase(s) only
→ Revisit unconfirmed phases later

---

## Phase 4: Generate Plan from Confirmed Model

Once the mental model has `readiness: "ready-for-plan"`:

1. Load `plan-schema.ts` into context
2. Map confirmed mental model to PlanSchema:

| Mental model | PlanSchema |
|---|---|
| `baseline.snapshot` | `metadata.snapshotRef`, `baseline.snapshotRef` |
| `baseline.metrics` | `baseline.metrics` |
| `baseline.knownIssues` | `baseline.knownIssues` |
| `targetState.successCriteria` | `acceptanceCriteria` |
| `targetState.definition` | `problem.successOutcome` |
| `delta.workStreams` | `steps` (expand each work stream into concrete steps) |
| `entities.verified` | `resources` |
| `assumptions` (confirmed) | `decisions` |
| `constraints` | `verificationEconomics.intentProjection` |
| `proposedPhases` (if phased) | Separate PlanSchema instances |

3. Follow `plan-generation.md` §2–§3 for the actual generation (skeleton-first, conditional fields, self-checks)

The mental model doesn't replace the plan generation protocol — it replaces the pre-generation checklist (§1.0–§1.4) with a reviewable, structured artifact.

---

## Relationship to Other Documents

- **[Plan Generation Protocol](./plan-generation.md)** — The mental model replaces §1.0–§1.4 for L/XL tasks. §2–§3 (generation and validation) still apply.
- **[Plan Schema](../schemas/plan-schema.ts)** — The mental model feeds INTO the plan. It is not a simplified plan.
- **[Mental Model Schema](../schemas/mental-model-schema.ts)** — The Zod schema for the mental model JSON.
- **[Confidence Thresholds](./confidence-thresholds.md)** — The mental model materializes the confidence assessment as a reviewable artifact.
- **[Effort Estimation](./effort-estimation.md)** — Work stream sizing in the mental model uses the same T-shirt scale.

---

## Anti-Patterns

| Anti-pattern | Why it's bad | Correct approach |
|---|---|---|
| Skipping the mental model for L/XL tasks | Errors discovered at plan stage cost 10x more | Always produce for L/XL |
| Generating the plan alongside the mental model | Defeats the purpose of the checkpoint | Present model, wait for confirmation, then generate |
| Listing 50+ entities as "verified" without commands | Unverifiable claim | Include the treemeta/grep command or file path for each |
| Empty openQuestions when scope is ambiguous | Hiding uncertainty from the human | Surface every uncertainty as a question with options |
| Treating a reference document as trustLevel "codebase" | Previous plans may contain hallucinated entities | Reference docs are always trustLevel "reference" |
| Mental model exceeding 300 lines | Too complex to review in 5 minutes | Compress; if scope is that large, it needs phasing |

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
