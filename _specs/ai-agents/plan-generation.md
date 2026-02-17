# Plan Generation Protocol

**Purpose:** How to produce schema-compliant, formally sound plans for M/L/XL tasks. Covers the generation process — not what fields exist (see [plan-schema.ts](../schemas/plan-schema.ts)), not when plans are required (see [effort-estimation.md](./effort-estimation.md)), but **how to construct a good plan**.

---

## Why This Document Exists

The plan schema defines ~50 fields. The effort estimation doc defines when formal plans are required. Neither explains **how to produce a plan that is operationally sound** — one where optional fields are populated when they should be, domain content is verified not invented, decisions respect authority boundaries, and the plan fits within output constraints.

This document closes that gap.

---

## Phase 1: Pre-Generation (Before Writing Any JSON)

### 1.0 Resolve Scope

**MANDATORY first step — before loading the schema.**

If the request uses scope-ambiguous language ("completion," "finish," "everything," "move forward," "bring to production"), the scope maps to multiple possible boundaries. You MUST resolve this before generating any plan.

**Required workflow:**

1. **Identify the scope boundaries.** What are the possible interpretations? List them with estimated plan sizes.
2. **STOP and present the options to the user.** Do not pick one silently.
3. **Resume only after the user confirms a specific scope.**

**For L/XL tasks:** Use the [Mental Model Protocol](./mental-model-protocol.md) instead — it handles scope resolution structurally via `targetState` and `openQuestions`. This section applies to M tasks where the mental model is optional.

**For tasks referencing existing plans:** The previous plan's scope is not automatically the new plan's scope. Ask: "Should this plan cover the same scope, a subset, or the remaining work?" See §1.2 for plan reconciliation.

**Why this matters:** Scope oscillation was the #1 observed failure mode in plan generation. The agent cycles through 3-4 scope definitions without converging, burns tokens without output, then picks one silently. Making scope resolution an explicit deliverable (even if it's just "confirm: do you mean X or Y?") prevents this.

### 1.1 Load the Schema

**Read `_specs/schemas/plan-schema.ts` into context before generating any plan.** If context is constrained, load at minimum:

- All field names and types for `PlanSchema`, `StepSchema`, `ActorSchema`
- All discriminated unions (`TemporalScope`, `Lifespan`, `Reversibility`)
- The `validateWellFormedness()` function's 13 checks

**Why:** The schema has ~50 fields. Reconstructing them from memory wastes tokens and introduces hallucination risk. Every token spent guessing a field name is a token not spent on plan quality.

### 1.2 Gather Domain Inputs

List every domain entity the plan will enumerate: adapters, services, endpoints, data sources, migration targets, modules, external APIs.

**Use `treemeta.sh` to verify what exists.** If the script is available in `_specs/scripts/`, use it to get a token-efficient inventory of the codebase before generating any plan:

```bash
# Full inventory: file paths + line counts, respecting .gitignore
_specs/scripts/treemeta.sh -g -l ./src

# Count files by extension (quick size check)
_specs/scripts/treemeta.sh -g --count -e ts,tsx ./src

# Recently modified files (find active areas)
_specs/scripts/treemeta.sh -g -l --sort modified -o desc --limit 30 ./src

# Paginate on large repos (avoid context flooding)
_specs/scripts/treemeta.sh -g -l --page 1 --per-page 50 ./src
```

If `treemeta.sh` is not available, fall back to `find` or `tree` for file enumeration, but prefer structured output that can be scanned without deep reading.

**Confidence gate (HARD RULE):**

> If the plan requires enumerating **more than 5 domain-specific entities** (data sources, service names, API endpoints, migration targets) that you **cannot verify from the codebase or provided context**, you MUST:
>
> 1. **STOP** plan generation
> 2. **List** what you know vs. what you're uncertain about
> 3. **ASK** the user to supply or confirm the list
> 4. **RESUME** only after receiving verified input
>
> **NEVER invent domain entity names from general knowledge.** Plausible-sounding names that don't correspond to real, accessible resources produce unimplementable plans.

> This gate applies **continuously during generation**, not just at the start. If during step detail filling you find yourself reasoning about domain entities (adapter names, service endpoints, data source URLs, layer assignments) that you haven't verified from `treemeta.sh` output, the codebase, or user input — **STOP and verify before continuing.** The gate is not a one-time check; it is an invariant across all generation phases.

**Examples of when to stop:**
- Plan needs 20 API connectors but you only see 3 in the codebase
- Plan references specific API endpoints at external services you haven't verified
- Plan names microservices that don't exist yet and haven't been specified by the user

**Examples of when to proceed:**
- Plan references files visible in the project tree
- Plan uses library names from package.json
- User explicitly provided the entity list

#### When Generating From an Existing Plan

If the user references a previous plan as input (e.g., "compare with the original plan," "update the plan," "continue from where we left off"), the previous plan is **context, not a source of truth**.

The previous plan may contain:

- Domain entities that were hallucinated in its own generation
- Scope that has since changed
- Assumptions that the codebase has invalidated
- Steps that have already been completed

**Required workflow:**

1. **Inventory the codebase first** (`treemeta.sh` / source inspection)
2. **Load the previous plan**
3. **For every entity the previous plan references**, verify it exists in the codebase or is explicitly specified by the user
4. **Entities that exist only in the previous plan:** flag as "unverified — carried from prior plan" in the `risks` section
5. **Build the new plan from the codebase inventory**, using the previous plan for scope guidance only

The confidence gate above applies to entities from previous plans with the same force as it applies to entities from general knowledge. A previous plan is a previous agent's output — not user input, not codebase reality.

### 1.3 Resolve Decisions Before Planning

Identify all technology, vendor, architecture, and design choices the plan depends on. For each decision:

1. **If a prior ADR exists** → cite it in the `decisions` array with `decidedBy` set to whoever authored the ADR
2. **If the codebase already uses this choice** → record as existing constraint, `decidedBy` set to the original author
3. **If neither** → the decision is open. You MUST either:
   - Set `decidedBy` to a human/operator actor, **OR**
   - Set `decidedBy` to the agent **AND** add a `stopCondition` on the affected step requiring operator approval before execution

**Authority rule (HARD RULE):**

> Decisions involving **external vendors**, **recurring API costs**, **infrastructure commitments**, or **irreversible architectural choices** MUST have `decidedBy` set to a human-level actor. An agent may propose and document alternatives, but cannot self-authorize these categories.

This is an instantiation of authority conservation: no actor may unilaterally expand its own scope.

### 1.4 Estimate Output Size

Before generating, estimate the plan's size:

```
estimated_lines = (step_count × 60) + 200
```

Where 60 lines/step covers fileChanges, verification, blastRadius, and metadata; 200 covers global sections (metadata, baseline, scope, actors, execution order, risks, decisions, acceptance criteria).

| Estimated lines | Strategy |
|---|---|
| ≤ 400 | Single-pass generation |
| 401–800 | Single-pass with compression (see §2.3) |
| > 800 | Multi-pass generation (see §2.4) |

---

## Phase 2: Generation

### 2.1 Skeleton First

**Generation sequence (HARD RULE):**

> Plans estimated at **>400 lines** MUST be generated in two passes. Writing the full plan in a single pass without intermediate validation is prohibited — it produces the same failure mode as temporal batching (quality degrades, errors compound undetected).
>
> **Pass 1 — Skeleton:** Generate metadata through step stubs (IDs, titles, sizes, deps, zones). **Validate the skeleton** before proceeding.
>
> **Pass 2 — Fill:** Step details in dependency order. Validate incrementally.
>
> "I can write it all in one tool call" is not an exemption. The passes exist to create a **validation checkpoint**, not to manage output length. A single tool call that writes skeleton, validates, then fills is two passes. A single tool call that writes everything without validating the skeleton first is one pass — and is prohibited for >400-line plans.

**Pass 1 — Structure:**
- `metadata` (complete)
- `problem` (complete)
- `baseline` (complete)
- `resources` (complete)
- `scope` (complete)
- `actors` (complete)
- `concurrency` (complete)
- `verificationEconomics` (complete, see §2.2)
- `steps` — **IDs, titles, sizes, dependsOn, scopeZones ONLY**
- `executionOrder` (complete — you have IDs and deps)
- `risks` (complete)
- `decisions` (complete — resolved in Phase 1)
- `acceptanceCriteria` (complete)
- `mergeStrategy` (complete)
- `futureWork` (complete)

**Pass 2 — Step details:** Fill each step in dependency order:
- `fileChanges` (see §2.3 for XL policy)
- `verification`
- `blastRadius`
- `reversibility`
- `commitTemplate`
- `validationBudget`
- Conditional fields (see §2.5)

### 2.2 Verification Economics Calibration

The schema requires `bwVerify`, `bwDecl`, `bwReview`. These must reflect realistic human verification capacity, not arbitrary numbers.

**Default calibration (use unless the user provides project-specific values):**

| Field | Default | Meaning | Derivation |
|---|---|---|---|
| `unit` | `"checks-per-hour"` | — | — |
| `bwVerify` | 10 | Total verification actions per hour | Based on 200-400 LOC/hr optimal review rate |
| `bwDecl` | 3 | Constraint declaration actions per hour | ~30% of bw spent on specifying what to check |
| `bwReview` | 7 | Output review actions per hour | ~70% of bw spent on reviewing agent output |
| `bwEmitResidual` | 5 | Agent output needing human review per hour | Assumes ~50% automated coverage via tests/CI |

**Constraint:** `bwDecl + bwReview ≤ bwVerify` (enforced by schema validator)

**Constraint:** `bwEmitResidual ≤ bwReview` (enforced by schema validator)

If `bwEmitResidual > bwReview`, the plan is **not verification-viable**: constraint debt will accumulate regardless of diligence. Either enrich the intent projection (add more automated checks to reduce residual), reduce plan scope, or flag this to the user.

**Intent projections:** For each intent constraint, populate:
- `temporalScope`: prefer `all-steps` for invariants (typecheck, test pass), `single-step` for milestone checks
- `modality`: choose from `mathematical | structural | visual | textual | hybrid` based on what the predicate actually checks
- `gradingKind`: `boolean` for pass/fail checks, `graded` for threshold-based checks
- `predicateRef`: an **executable command or verifiable assertion**, not vague prose
- `declarationCost`: nonzero estimate of human effort to define this constraint (default 1 if unknown)

### 2.3 File Enumeration Policy for XL Steps

XL steps often involve batch creation (N adapters, N migrations, N endpoints). Enumerating every file (source + test + fixture) can produce 3N+ entries, bloating the plan.

**Policy:**

| Content type | Enumerate explicitly? |
|---|---|
| Source files (the deliverables) | YES — list every one |
| Shared/modified files | YES — list every one |
| Test files | List 2–3 examples, add a `notes` field: "Each source file has a corresponding test file following the pattern `src/__tests__/{name}.test.ts`" |
| Fixture/data files | List 1–2 examples, add a `notes` field describing the pattern |

This keeps XL steps under ~30 fileChanges while preserving traceability. The description field should state the total count: "15 connector source files, each with a corresponding test and fixture (45 files total)."

### 2.4 Multi-Pass Generation for Large Plans

When estimated size exceeds 800 lines:

1. Generate the skeleton (Pass 1 from §2.1) as a complete, valid plan with minimal step bodies
2. Validate the skeleton: referential integrity, DAG, execution order
3. Fill steps in dependency order, validating after each batch
4. If the complete plan still exceeds the output budget, split into **sequential phase plans** with explicit handoff:
   - Each phase plan is a complete `PlanSchema` instance in its own file
   - Phase plans are numbered sequentially (e.g., `plan-phase-1.json`, `plan-phase-2.json`)
   - Each phase plan's `metadata.description` states its phase index and the total phase count
   - The earlier phase's final step includes a `handoffTemplate` defining the artifacts and state the next phase depends on
   - **Do NOT use `metadata.supersedes` for this.** `supersedes` means "replaces" (Plan v2 obsoletes Plan v1). Phase plans do not replace each other — phase-2 *depends on* phase-1 completing. These are different relationships. There is currently no schema field for cross-plan phase dependencies; use `handoffTemplate` content and naming conventions to express the sequencing.

### 2.5 Conditional Field Requirements

These fields are optional in the schema but **required by this protocol** when conditions are met:

| Condition | Required field | Minimum content |
|---|---|---|
| Step size **M or larger** | `stopConditions` | At least 1 condition. `blindSpotRisk: "unknown"` is acceptable as a starting point. |
| Step size **M or larger** | `resourceRequirements.simultaneousResources` | List resource IDs from the `resources` registry that must be in context simultaneously during execution. |
| Plan has **session-bounded agents** | `handoffTemplate` on natural phase boundaries | Populate after each XL step, after each major phase, or wherever a session break is likely. Include `estimatedCompressionLoss` (0.3 is a reasonable default for complex steps). |
| Step size **L or larger** | At least 1 `verification` entry with `verifiedBy: "human"` | Domain-level review that automated tests cannot provide (correct data source URLs, appropriate architectural choices, domain-valid entity names). |
| **Any step** with irreversible mutations | `reversibility.kind: "irreversible"` with `approvalRequired: "operator"` | Gates execution on human approval. |

**Rationale by constraint:**
- `stopConditions` → Constraint VIII (Trust/Authority): SAC false-negative risk requires explicit stop signals
- `resourceRequirements` → Constraint I (Context Capacity): enables thrashing detection
- `handoffTemplate` → Constraint II (Temporal Fragility): prevents session mortality information loss
- `verifiedBy: "human"` → Constraint VII (Error Propagation): automated tests cannot catch domain errors
- `reversibility` gating → Constraint VII (Error Propagation): irreversible actions need human approval

---

## Phase 3: Validation (Before Emitting)

### 3.1 Structural Self-Check

Before outputting the plan JSON, verify:

- [ ] All step IDs in `executionOrder.sequence` exist in `steps`
- [ ] All `dependsOn` targets exist as step IDs
- [ ] All `assignedTo` values reference registered actors
- [ ] All `scopeZones` reference declared scope zones
- [ ] Actor authorized zones contain all zones referenced by their assigned steps
- [ ] `bwDecl + bwReview ≤ bwVerify`
- [ ] `bwEmitResidual ≤ bwReview` (if present)
- [ ] No cycles in dependency graph
- [ ] `metadata.snapshotRef == baseline.snapshotRef`
- [ ] Parallelizable groups contain no intra-group dependencies

> **Note:** The schema validator checks dependency-based conflicts only, not file-level conflicts. If two steps in a parallelizable group modify the same file, add a `risks` entry noting the potential merge conflict even if the validator passes. Prefer sequential ordering for steps that share modified files.

### 3.2 Semantic Self-Check

- [ ] **Size ↔ file count consistency:** Each step's T-shirt size matches its fileChanges count per the T-shirt table (XS=1, S=2-3, M=4-8, L=10-20, XL=20+). If mismatch, either adjust the size or justify in `notes`.
- [ ] **Detection adequacy:** Every L/XL step has at least one `verifiedBy: "human"` check
- [ ] **Decision authority:** No decision involving external vendors, recurring costs, or irreversible infrastructure has `decidedBy` set to an agent actor without a corresponding stopCondition
- [ ] **Domain confidence:** No step references domain entities (data sources, APIs, services) that weren't verified from `treemeta.sh` output, the codebase, or supplied by the user
- [ ] **Conditional fields populated:** M+ steps have stopConditions and resourceRequirements; session-bounded plans have handoffTemplates at phase boundaries
- [ ] **Output fits budget:** Plan JSON is within token/line limits

### 3.3 When Validation Fails

If structural self-check fails: fix before emitting. These are objective errors.

If semantic self-check fails: you have three options:
1. **Fix** the issue (resize step, add missing field, change decidedBy)
2. **Flag** the issue explicitly in the plan output with a risk entry
3. **Stop** and ask the user for input (preferred for domain confidence failures)

**NEVER emit a plan that fails structural self-check.** Semantic issues may be flagged, but structural errors are blocking.

---

## Anti-Patterns in Plan Generation

| Anti-pattern | Why it's bad | Correct approach |
|---|---|---|
| Generating the full plan in one pass without estimation | Token overflow, truncated output | Estimate size first, use multi-pass if needed |
| Writing >400-line plan without skeleton validation checkpoint | Errors compound undetected, same failure mode as temporal batching | Generate skeleton, validate it, then fill step details |
| Inventing domain entity names | Unimplementable plan | Stop and ask when enumeration exceeds verified knowledge |
| Agent self-authorizing vendor decisions | Violates authority conservation | Set decidedBy to human or add approval stopCondition |
| 100% automated verification on all steps | Domain errors undetectable | Add human verification for L/XL steps |
| Empty stopConditions on all steps | SAC framework disabled | Populate for M+ steps; "unknown" blindSpotRisk is acceptable |
| Empty resourceRequirements | Thrashing detection disabled | List simultaneous resources for M+ steps |
| No handoffTemplate anywhere | Session mortality unaddressed | Add at phase boundaries for session-bounded agents |
| XL step with every test file enumerated | Plan bloat, token waste | List source files; describe test pattern in notes |
| XL step with zero test files listed | TDD claim without evidence | List 2-3 example test files with pattern note |
| Uncalibrated verification economics | Numbers are meaningless | Use default calibration table or justify custom values |

---

## Relationship to Other Documents

- **[Effort Estimation](./effort-estimation.md)** — Defines WHEN formal plans are required (M+ complexity). This document defines HOW to generate them.
- **[Plan Schema](../schemas/plan-schema.ts)** — Defines WHAT fields exist. This document defines WHICH fields to populate and WHAT values to use.
- **[Confidence Thresholds](./confidence-thresholds.md)** — Defines when to ask vs. proceed generally. This document adds a specific domain-enumeration confidence gate for plan generation.
- **[No Batching](./no-batching.md)** — Prohibits splitting deliverables. This document's multi-pass strategy generates one complete plan across passes, not multiple partial plans.
- **[Context Management](./context-management.md)** — Defines context priorities. This document adds: load the schema before generating a plan.

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
