---
title: "TSDoc Voice Guide"
date: 2025-02-15
disclaimer: >
  No information within this document should be taken for granted.
  Any statement or premise not backed by a real logical definition
  or verifiable reference may be invalid, erroneous, or a hallucination.
  Verify all claims independently before relying on them.
---

# TSDoc Voice Guide

Unified documentation style for schema and utility modules.

## 1. File Header

Plain `//` comment. No `/** */`, no `@module`, no `@version`, no `@license`.

Rationale: `@module` is only meaningful to TypeDoc/API Extractor at the
package entry point. `@version` and `@license` duplicate `package.json`.
A plain comment avoids tools misattaching the block to the first export.

### Structure

```ts
// Copyright (c) <owner>. Licensed under <license>.

// ─────────────────────────────────────────────
// <Module Name>
// ─────────────────────────────────────────────
//
// <1–3 sentences: what this module does and why it exists.>
//
// If this module implements or operationalizes an external
// specification, name and link it once here. Individual field
// comments then use short refs like [FM §2.3] without
// re-explaining the entire spec.
```

### Rules

- **Max 15 lines** (excluding copyright). If you need more, it
  belongs in a companion `.md` file, not in source.
- No workflow diagrams, no mapping tables, no agent protocols
  inside the header. Those are documentation, not code comments.
- The header orients a reader who opened the file cold. It does
  not teach them the domain.

### Before (plan-schema.ts, 135 lines)

```ts
/**
 * Plan Schema v0.3.0 — Grounded in "A Formal Constraint Model for
 * Multi-Actor Software Development Systems" (v0.3.0)
 *
 * Every field in this schema maps to a named definition ...
 * [... 130 more lines including constraint taxonomy,
 *  debt formulas, agent execution protocol, known limits ...]
 *
 * @module plan-schema
 * @version 0.3.0
 * @license MIT
 */
```

### After

```ts
// Copyright (c) <owner>. Licensed under MIT.

// ─────────────────────────────────────────────
// Plan Schema
// ─────────────────────────────────────────────
//
// Operational schema for multi-actor execution plans.
// Implements "A Formal Constraint Model for Multi-Actor
// Software Development Systems" v0.3.0.
//
// Field comments use [FM §X.Y], [Def N.M], [Ax N.M],
// [Prop N.M] to cross-reference the formal model.
// See docs/formal-model.md for the full specification
// and agent execution protocol.
```

## 2. Section Dividers

Keep the `§ N` convention. Include a short **purpose clause** after
the em dash — this is what makes section dividers `grep`-friendly and
skimmable. Move multi-line **design rationale** into the TSDoc of the
schema constant that immediately follows.

Purpose tells the reader *what's here*. Rationale tells them *why it's
here*. Only purpose belongs in the divider.

```ts
// ── § 5  Entity Inventory — domain entities the plan references ──
```

Not:

```ts
// ─────────────────────────────────────────────
// § 5  ENTITY INVENTORY  —  Domain entities the plan will reference
//
// This is the confidence gate (plan-generation.md §1.2) materialized.
// Every domain entity the plan will name is listed here, partitioned
// by verification status. The human sees exactly what's verified
// and what's not.
// ─────────────────────────────────────────────
```

The purpose clause ("domain entities the plan references") survives
in the one-liner. The rationale ("confidence gate, partitioned by
verification status") belongs in the TSDoc block of
`EntityInventorySchema`, not in a floating comment that no tool
can associate with a symbol.

## 3. Schema Constants (Zod Objects)

Every exported schema gets a `/** */` block with:

1. **Summary** — one sentence, what it validates.
2. **`@remarks`** (if needed) — cross-field refinements, invariants,
   forward-compatibility notes. Domain rationale goes here, not in
   section dividers.

Internal (non-exported) schemas: summary line only. Use `@remarks`
only if the schema has non-obvious refinements.

### Voice

- **Self-sufficient.** A reader with no access to external documents
  must understand what the schema validates. Formal-model refs
  (`[Def 3.3]`) supplement but do not replace an explanation.
- **Imperative, not conversational.** "Must match `ADR-###`" not
  "Should be something like ADR-018."
- **No audience coaching.** "Required when `status` is `superseded`"
  not "The human should check whether this is right."
- **Preserve domain constraints; rewrite voice.** If a comment
  contains a real invariant disguised in soft language, rewrite the
  voice — don't delete the semantics. Coaching tells the reader
  *how to think*; a constraint tells them *what must hold*.

### Before (mental-model-schema.ts)

```ts
/**
 * What this work stream delivers. Should be concrete enough to
 * verify ("11 scraper adapters" not "improve scraping").
 */
deliverable: z.string().min(1),
```

### After

```ts
/**
 * Verifiable deliverable of this work stream. Must name a
 * countable artifact or measurable outcome.
 */
deliverable: z.string().min(1),
```

The original had a real constraint ("concrete enough to verify")
dressed in soft voice. The fix rewrites the voice ("Must name a
countable artifact…") without losing the domain invariant.
Audience coaching ("the human should…") is what gets deleted;
constraints get restated imperatively.

### Before (plan-schema.ts)

```ts
/** [Def 3.2.1] Must be ≥ authority of requestedBy.
 *  Cannot self-authorize. */
authorizedBy: ActorId,
```

### After

```ts
/**
 * Actor who authorized this version transition.
 * Must have authority ≥ `requestedBy`. Self-authorization
 * is forbidden [Def 3.2, Ax 2.4].
 */
authorizedBy: ActorId,
```

The semantic meaning ("actor who authorized") now comes first.
The formal ref supports but doesn't replace it.

## 4. Inline Field Comments

For simple, self-explanatory fields: no comment.

```ts
title: z.string().min(1),
createdAt: ADRDateSchema,
```

For fields with constraints, enums, or non-obvious semantics:
single-line or short multi-line `/** */`.

```ts
/** Other work stream IDs this depends on. */
dependsOn: z.array(z.string().min(1)).default([]),
```

For enum values that need explanation, use a compact block:

```ts
/**
 * `"codebase"` — verified from files.
 * `"reference"` — read but not treated as source of truth.
 * `"user-provided"` — explicit human input.
 */
trustLevel: z.enum(["codebase", "reference", "user-provided"]),
```

Not the inline-comment-inside-TSDoc style:

```ts
/** "codebase" = verified from files. "reference" = read but not
 *  treated as source of truth. "user-provided" = explicit input. */
```

### Enum scoping: definition site vs. usage site

When an enum is extracted into a standalone schema constant that may
be reused across fields, document the members **at the definition
site** — the schema constant — and reference it at usage sites with
`{@link}`.

```ts
/**
 * Level of trust assigned to an information source.
 *
 * `"codebase"` — verified from source files.
 * `"reference"` — read but not treated as source of truth.
 * `"user-provided"` — explicit human input.
 */
export const TrustLevelSchema = z.enum([
  "codebase",
  "reference",
  "user-provided",
]);

// ...later, in a field:

/** Trust level of this entity. See {@link TrustLevelSchema}. */
trustLevel: TrustLevelSchema,
```

This avoids duplicating member descriptions across every field that
uses the enum. If the enum is inline (not a standalone constant),
document the members at the field as shown above.

## 5. Functions

All exported functions get:

1. **Summary** — what it does (imperative mood).
2. **`@param`** — for each parameter, with a `-` separator.
3. **`@returns`** — what comes back.
4. **`@throws`** — each exception type on its own tag
   (use `{@link}` for the type).

Internal functions: summary only. Add `@param` only if
the signature is ambiguous.

### Voice

- **Verb-first summary.** "Parse and validate..." not
  "This function parses and validates..."
- **Describe failure modes explicitly.** "Throws `ZodError` if
  any record fails validation" not "May throw."
- **No `@remarks` on simple wrappers.** If the function is
  `return SomeSchema.parse(input)`, the schema's own TSDoc
  carries the semantics.

### When `@remarks` earns its place on a function

Use `@remarks` when:

- The function has a detection heuristic (like `parseADR`'s
  `[`-prefix sniffing).
- The function wraps errors into a different type than expected.
- The function has a non-obvious performance characteristic.

### Before (missing `@throws`)

```ts
/**
 * Validates a mental model against the schema.
 * @param input - Raw mental model data.
 * @returns The validated mental model.
 */
export function validateMentalModel(input: unknown): MentalModel {
  return MentalModelSchema.parse(input);
}
```

### After

```ts
/**
 * Parse and validate raw data as a mental model.
 *
 * @param input - Unvalidated mental model data.
 * @returns A validated {@link MentalModel}.
 * @throws {@link ZodError} If `input` fails schema validation.
 */
export function validateMentalModel(input: unknown): MentalModel {
  return MentalModelSchema.parse(input);
}
```

Note: `{@link ZodError}` requires the symbol to be importable in
scope. If the error type is from a third-party package, ensure
the import exists or fall back to backtick notation:
`` @throws `ZodError` from `zod` ``.

## 6. Types

Exported types inferred from schemas (`z.infer<typeof ...>`):
one-line `/** */` with a **role-oriented label**, not a restatement
of the schema's summary.

The schema documents *what the data is and what constraints hold*.
The type documents *what role this type plays in the system*.

```ts
// Schema summary: "Operational schema for ADR records with
//                  lifecycle and supersession tracking."

/** Validated ADR record, inferred from {@link ADRRecordSchema}. */
export type ADRRecord = z.infer<typeof ADRRecordSchema>;
```

Not:

```ts
/** An ADR record with lifecycle and supersession tracking. */
export type ADRRecord = z.infer<typeof ADRRecordSchema>;
```

The second version nearly duplicates the schema's summary. The
`{@link}` lets the reader navigate to the schema for full details.
When the schema summary is already one sentence, a role label
avoids pointless paraphrasing while still giving IDE hover
something useful.

## 7. Formal-Model Cross-References

When a field or function implements a named construct from an
external specification:

1. Write the self-sufficient explanation first.
2. Append the reference in brackets at the end.

```ts
/**
 * Estimated size in tokens when loaded into context.
 * Used for capacity feasibility checks and thrashing
 * detection [Def 3.3/A1, Prop 2.8].
 */
estimatedTokens: TokenCount,
```

Never write a comment that is *only* a formal ref:

```ts
// Bad — opaque without the paper
/** [Def 2.13] */
reproducibility: ReproducibilityContext.optional(),

// Good — stands alone, ref adds traceability
/** Full reproducibility context for AI actors [Def 2.13]. */
reproducibility: ReproducibilityContext.optional(),
```

## 8. What Does NOT Belong in TSDoc

| Content | Where it goes |
|---|---|
| Workflow diagrams | `docs/*.md` or README |
| Agent execution protocols (MUST/SHOULD/MUST NOT) | `docs/agent-protocol.md` |
| Mapping tables (MentalModel field → PlanSchema field) | `docs/architecture.md` |
| Design rationale longer than 3 lines | ADR record |
| Examples with expected output | `@example` block in TSDoc (keep ≤ 10 lines) |
| Guidance for human reviewers | Contributor guide or agent prompt |

## 9. Checklist

Before committing, each file should pass:

1. [ ] File header is `//` comment, ≤ 15 lines.
2. [ ] No `@module`, `@version`, `@license`, `@author` in source.
3. [ ] Every exported schema/function/type has a `/** */` block.
4. [ ] Every `/** */` summary is one sentence, imperative mood.
5. [ ] `@remarks` present only when there are cross-field
       refinements, non-obvious invariants, or heuristics.
6. [ ] `@param` / `@returns` / `@throws` on every exported function.
7. [ ] Formal-model refs supplement, never replace, explanations.
8. [ ] No audience coaching ("the human should...", "lets the
       human see...") in field comments.
9. [ ] Domain constraints preserved (rewritten in imperative voice,
       not deleted).
10. [ ] No design documents embedded in file headers.
11. [ ] Internal schemas have at most a summary line.
12. [ ] Reusable enums documented at definition site, not duplicated
        at each usage.
13. [ ] Section dividers include purpose clause after em dash.
14. [ ] `@deprecated` present on any symbol scheduled for removal,
        with `{@link}` to its replacement.
15. [ ] `@example` blocks are ≤ 10 lines and include at least one
        valid input case.
16. [ ] TSDoc and `ai()` metadata do not contradict each other
        (see §13).

## 10. `@example` Blocks

### When to write one — functions

Write an `@example` on a function when any of these hold:

- The function signature is ambiguous (e.g., overloaded, accepts
  `unknown`, or has non-obvious defaults).
- The accepted format isn't obvious from the type alone (e.g.,
  `"ADR-018"`, ISO 8601 strings, slug patterns).
- There is a common mistake you've seen in actual usage or
  encountered during testing.

Don't write an `@example` for trivial wrappers or schemas whose
fields are all self-explanatory primitives.

### When to write one — schemas

Write an `@example` on a schema constant when:

- The schema uses `.refine()` or `.superRefine()` with cross-field
  validation that isn't obvious from reading individual field docs.
- The schema uses `.transform()` that reshapes the output type.
- Field interactions produce a non-obvious valid shape (e.g.,
  computed fields, conditional optionality).

The `@example` on a schema shows a **valid object literal** that
passes parsing. This is the "what does a well-formed instance
actually look like?" answer that field-by-field docs can't give.

```ts
/**
 * Friction point with computed severity score.
 *
 * @remarks
 * `friction_score` must equal `severity × addressability`.
 * The refinement rejects mismatches.
 *
 * @example
 * ```ts
 * FrictionPointSchema.parse({
 *   description: "No integration tests for auth flow",
 *   severity: 3,
 *   addressability: 4,
 *   friction_score: 12,  // 3 × 4
 * });
 * ```
 */
export const FrictionPointSchema = z.object({ ... }).refine(...);
```

### When to use `@example` vs. `ai().example()`

Both exist; they serve different audiences:

- **`@example`** — for humans reading source or generated docs.
  Shows the shape with realistic data. One per symbol, ≤ 10 lines.
- **`ai().example()`** — for LLM pipelines at generation time.
  May include multiple examples tuned for generation quality
  (edge cases, boundary values, common error patterns). May be
  more verbose or numerous than what's appropriate in TSDoc.

If you write an `@example` for a schema, the `ai().example()` calls
should not contradict it, but they may add more cases.

### Format

Use runnable TypeScript. The reader should be able to copy-paste
it into a test file.

```ts
/**
 * Parse a raw ADR identifier string.
 *
 * @example
 * ```ts
 * parseADRId("ADR-018");  // => "ADR-018"
 * parseADRId("adr-018");  // => throws ZodError
 * ```
 *
 * @param raw - String to validate as an ADR identifier.
 * @returns The validated ADR identifier.
 * @throws {@link ZodError} If `raw` does not match `ADR-###`.
 */
```

### Rules

- **≤ 10 lines** inside the fenced block.
- **Show at least one valid input.** Invalid inputs are optional
  but valuable when the rejection criterion is non-obvious.
- **No prose inside the example.** Use `// => result` or
  `// => throws` inline comments, not explanatory paragraphs.
- **One example block per symbol.** If you need more, the
  function's interface may be doing too much (or the schema
  should be decomposed).

## 11. `@deprecated`

When a schema, type, or function is scheduled for removal:

1. Add `@deprecated` with the removal target and `{@link}` to the
   replacement.
2. Keep the existing TSDoc intact — consumers need the docs until
   they migrate.

```ts
/**
 * Validated ADR record with legacy status values.
 *
 * @deprecated Since v0.4.0. Use {@link ADRRecordV2Schema} instead.
 *   Scheduled for removal in v1.0.0.
 */
export const ADRRecordSchema = z.object({ ... });
```

### Rules

- **Always name the replacement.** A `@deprecated` without a
  migration path is useless.
- **Include the version** when deprecation was introduced.
- **Don't delete the original TSDoc.** The deprecation notice
  supplements; it doesn't replace the summary and `@remarks`.
- For deprecated *fields* inside a schema that is itself still
  active, use a field-level comment:

```ts
/**
 * @deprecated Since v0.4.0. Superseded by `trustLevel`.
 */
confidence: z.number().optional(),
```

### Enum member deprecation

Zod's `z.enum()` has no per-member deprecation mechanism, so
the deprecation notice goes on the **enum schema constant** with
the specific member called out. If the enum is inline, put it on
the field.

```ts
/**
 * Status of a work stream.
 *
 * @remarks
 * Value `"blocked"` is deprecated since v0.3.0 — use
 * `"waiting-on-dependency"` instead. `"blocked"` will be
 * removed in v1.0.0.
 */
export const WorkStreamStatusSchema = z.enum([
  "active",
  "completed",
  "blocked",              // deprecated — see @remarks
  "waiting-on-dependency",
]);
```

Place a trailing `// deprecated` inline comment on the member
literal so it's visible during code review even without reading
the full TSDoc block. The authoritative deprecation notice remains
in `@remarks` with version and replacement.

## 12. `@defaultValue`

### Position

Zod's `.default()` is self-documenting in source. TSDoc
`@defaultValue` adds value only when the default is not visible
in the immediate call chain — typically because the default is
computed, imported from a constant, or set in a `.transform()`.

### When to use it

```ts
// .default([]) is visible — no @defaultValue needed
dependsOn: z.array(z.string()).default([]),

// Default imported from config — @defaultValue helps
/**
 * Maximum token budget for this actor's context window.
 * @defaultValue {@link DEFAULT_TOKEN_BUDGET} (currently 128_000)
 */
maxTokens: z.number().default(DEFAULT_TOKEN_BUDGET),
```

### When to skip it

If the `.default()` call contains a literal value (`[]`, `0`,
`false`, `"pending"`), the code is the documentation. Adding
`@defaultValue` would just create a sync burden with no
information gain.

### `.transform()` implicit defaults

A `.transform()` can introduce defaults that are invisible in the
schema chain — for instance, normalizing `undefined` to a fallback
value inside the transform body. This is the case where
`@defaultValue` is **most needed**, because there's no `.default()`
call for a reader to find.

```ts
/**
 * Actor priority weight.
 *
 * @remarks
 * When the input is `undefined` or `null`, the transform
 * normalizes to the system default.
 *
 * @defaultValue `1.0` (applied inside `.transform()`)
 */
priority: z.number().nullable().transform((v) => v ?? 1.0),
```

The parenthetical `(applied inside .transform())` signals to the
reader that the default won't appear in a `.default()` call — they
need to read the transform body to verify.

## 13. `ai()` Layer Interaction

This codebase has two parallel documentation systems:

- **TSDoc** → for humans, IDEs, and generated API docs.
- **`ai()` metadata** (`instruct()`, `example()`, `boundary()`,
  etc.) → for LLM pipelines via `compilePrompt()` /
  `compileRegistry()`.

### Authority

**TSDoc is the source of truth for what a symbol *is*.**
`ai()` metadata is the source of truth for **how an LLM agent
should *produce or consume* values** for that symbol.

When they appear to conflict, the TSDoc definition wins on
semantics ("this field is an ISO 8601 date"), and the `ai()`
instruction wins on generation strategy ("prefer `YYYY-MM-DD`
over `YYYY-MM-DDTHH:mm:ssZ` unless time is material").

### Duplication policy

`ai().instruct()` **may repeat or paraphrase** the TSDoc summary
when the LLM needs the information at generation time. This is
intentional duplication, not an inconsistency — the two audiences
are different and the information may not reach the LLM through
TSDoc alone.

However, if the TSDoc summary changes, the corresponding `ai()`
instruction must be reviewed. The guide does not mandate
mechanical sync (the phrasing will differ by design), but the
**semantic content must not contradict**.

### What goes where

| Content | TSDoc | `ai()` |
|---|---|---|
| What the field/type *is* | ✓ (authoritative) | May paraphrase |
| Format constraints (`ADR-###`) | ✓ | `instruct()` if LLM generates this field |
| Valid/invalid examples | `@example` (human) | `example()` / `antipattern()` (LLM) |
| Generation strategy or heuristic | ✗ | `instruct()`, `generate()` |
| Cross-field dependencies | `@remarks` | `boundary()`, `relation()` |
| Deprecation notices | `@deprecated` | `instruct("DEPRECATED: use X instead")` |
| When-missing fallback | ✗ | `whenMissing()` |
| Tool routing hints | ✗ | `toolHint()` |
| Priority for partial generation | ✗ | `priority()` |

### Sync responsibility

The person who modifies a schema field owns the sync. The
checklist (§9, item 16) encodes this: before committing, verify
that TSDoc and `ai()` metadata for the changed field do not
contradict.

### Failure mode

A stale `ai().instruct()` won't cause a build failure or a test
failure. It will silently produce degraded LLM output — the worst
kind of bug because nothing alerts you. Three mitigations, in
order of effort:

**1. Proximity convention (zero cost, adopt now).** Place `ai()`
calls in the same file, directly after the schema constant they
annotate. When a field changes, the `ai()` block is on screen
during the edit — drift becomes visually obvious during review.

```ts
export const MentalModelSchema = z.object({
  deliverable: z.string().min(1),
  // ...
});

// ai() metadata — keep adjacent for sync visibility
ai(MentalModelSchema)
  .instruct("deliverable", "Must name a countable artifact…");
```

**2. PR review checkpoint (low cost).** Add a standing review
comment template or CI check that flags PRs touching `*.schema.ts`
files: "Schema changed — verify `ai()` metadata is still
consistent (see tsdoc-voice.md §13)."

**3. Grep-based CI warning (moderate cost).** A script that
extracts field names from modified schema files and checks whether
a corresponding `ai().instruct()` or `ai().example()` exists for
the same field path. This won't catch semantic drift, but it will
catch orphaned `ai()` calls referencing deleted or renamed fields.

```bash
# Example: find ai() calls referencing fields not in the schema
grep -oP '\.instruct\(\s*"(\w+)"' src/schemas/*.ts \
  | sort -u > /tmp/ai-fields.txt
# Compare against actual schema field names...
```

There is no automated tool for full semantic comparison today.
If one is built, it should compare the *semantic content* (not the
wording) of TSDoc summaries against `ai().instruct()` strings for
the same schema path.
