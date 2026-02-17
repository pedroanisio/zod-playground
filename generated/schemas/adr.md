# Schema Module: adr

Source: `_specs/schemas/adr.ts`

**Overview:** Unified module: Zod v4 validation + JSONL serialization. Merges grid-editor and iande-builder ADR contracts.



## Exported Symbols

### ADR_STATUSES (const)

**Source:** `_specs/schemas/adr.ts:25`

**Summary:** Canonical ADR lifecycle statuses as a const tuple.

#### TSDoc Tags

##### @remarks

Exported for iteration, mapping, and use in UI dropdowns.
The corresponding Zod schema is {@link ADRStatusSchema}.

---

### ADRDate (type)

**Source:** `_specs/schemas/adr.ts:72`

**Summary:** An ISO 8601 date string (`"YYYY-MM-DD"`).

---

### ADRDateSchema (const)

**Source:** `_specs/schemas/adr.ts:55`

**Summary:** Zod schema for ISO 8601 date strings (`YYYY-MM-DD`).

#### TSDoc Tags

##### @remarks

Lexical string comparison is valid for this format, which is
relied upon by the {@link ADRRecordSchema} `updatedAt >= createdAt`
refinement.

---

### ADRId (type)

**Source:** `_specs/schemas/adr.ts:69`

**Summary:** An ADR identifier string (e.g. `"ADR-018"`).

---

### ADRIdSchema (const)

**Source:** `_specs/schemas/adr.ts:41`

**Summary:** Zod schema for ADR identifiers.

#### TSDoc Tags

##### @remarks

Must match the pattern `ADR-###` (e.g. `ADR-018`).

---

### ADRInput (type)

**Source:** `_specs/schemas/adr.ts:381`

**Summary:** Union of all accepted input shapes for {@link parseADR}.

#### TSDoc Tags

##### @remarks

| Type | Interpretation |
|------|----------------|
| `string` | JSON array (starts with `[`) or JSONL |
| `unknown[]` | Pre-parsed array of records |
| `Record<string, unknown>` | Single pre-parsed record |

---

### ADRJsonl (type)

**Source:** `_specs/schemas/adr.ts:225`

**Summary:** The output type of {@link ADRJsonlSchema} (alias for {@link ADRRecords}).

---

### ADRJsonlSchema (const)

**Source:** `_specs/schemas/adr.ts:179`

**Summary:** Zod schema that transforms a raw JSONL string into {@link ADRRecords}.

#### TSDoc Tags

##### @remarks

Each non-empty line is parsed as JSON individually. Parse errors
include 1-based line numbers for diagnostics. After JSON parsing,
the resulting array is validated through {@link ADRRecordsSchema}.

---

### ADRRecord (type)

**Source:** `_specs/schemas/adr.ts:136`

**Summary:** A validated ADR record.

---

### ADRRecords (type)

**Source:** `_specs/schemas/adr.ts:167`

**Summary:** A validated array of ADR records with unique IDs.

---

### ADRRecordSchema (const)

**Source:** `_specs/schemas/adr.ts:93`

**Summary:** Zod schema for a single ADR record.

#### TSDoc Tags

##### @remarks

Core fields are strictly validated. Unknown extension fields are
allowed via `.catchall(z.unknown())` for forward compatibility.
Cross-field refinements:
- `updatedAt` must be on or after `createdAt`.
- `supersededBy` is **required** when `status` is `"superseded"`
and **forbidden** otherwise.

---

### ADRRecordsSchema (const)

**Source:** `_specs/schemas/adr.ts:147`

**Summary:** Zod schema for an array of ADR records.

#### TSDoc Tags

##### @remarks

Validates each element via {@link ADRRecordSchema} and additionally
ensures no duplicate `id` values exist within the collection.

---

### ADRStatus (type)

**Source:** `_specs/schemas/adr.ts:75`

**Summary:** One of the canonical ADR lifecycle statuses.

---

### ADRStatusSchema (const)

**Source:** `_specs/schemas/adr.ts:66`

**Summary:** Zod schema for the ADR status enum.

#### TSDoc Tags

##### @see

{@link ADR_STATUSES} for the underlying tuple.

---

### parseADR (function)

**Source:** `_specs/schemas/adr.ts:405`

**Summary:** Detect input shape and parse accordingly.

#### TSDoc Tags

##### @remarks

Shape detection heuristic:
- **`string`** — if the trimmed value starts with `[`, it is treated
as a JSON array; otherwise as JSONL. A single-line JSON object is
valid JSONL and handled naturally.
- **`Array`** — validated directly as {@link ADRRecords}.
- **Plain object** — wrapped in a one-element array and validated
as {@link ADRRecords}. The return value is always an array for
uniform downstream handling.

##### @param

input - A string (JSON array or JSONL), a pre-parsed array,
or a single pre-parsed record.

##### @returns

A validated {@link ADRRecords} array.

##### @throws

{@link z.ZodError} If validation fails.

##### @throws

{@link SyntaxError} If a string input contains invalid JSON.

---

### parseADRJsonArray (function)

**Source:** `_specs/schemas/adr.ts:305`

**Summary:** Parse and validate a JSON string containing an array of ADR records.

#### TSDoc Tags

##### @param

input - A JSON string whose top-level value is an array.

##### @returns

A validated {@link ADRRecords} array.

##### @throws

{@link SyntaxError} If `input` is not valid JSON.

##### @throws

{@link z.ZodError} If any record fails validation or IDs are duplicated.

---

### parseADRJsonl (function)

**Source:** `_specs/schemas/adr.ts:352`

**Summary:** Parse and validate a JSONL string (one JSON object per line).

#### TSDoc Tags

##### @param

input - A JSONL-formatted string. Empty lines are skipped.

##### @returns

A validated {@link ADRRecords} array.

##### @throws

{@link z.ZodError} If any line contains invalid JSON, any record
fails validation, or IDs are duplicated.

---

### parseADRRecord (function)

**Source:** `_specs/schemas/adr.ts:236`

**Summary:** Parse and validate a single ADR from a pre-parsed value.

#### TSDoc Tags

##### @param

input - An `unknown` value (typically the result of `JSON.parse`).

##### @returns

A validated {@link ADRRecord}.

##### @throws

{@link z.ZodError} If validation fails.

---

### parseADRRecordString (function)

**Source:** `_specs/schemas/adr.ts:261`

**Summary:** Parse and validate a single ADR from a raw JSON string.

#### TSDoc Tags

##### @param

input - A JSON string representing one ADR object.

##### @returns

A validated {@link ADRRecord}.

##### @throws

{@link SyntaxError} If `input` is not valid JSON.

##### @throws

{@link z.ZodError} If validation fails.

---

### safeParseADR (function)

**Source:** `_specs/schemas/adr.ts:439`

**Summary:** Safely detect input shape and parse accordingly.

#### TSDoc Tags

##### @remarks

All failure modes (JSON syntax errors, Zod validation errors) are
normalised into a {@link z.ZodError} on the `error` branch so
callers only need to handle one error type.

##### @param

input - A string (JSON array or JSONL), a pre-parsed array,
or a single pre-parsed record.

##### @returns

An object with `success: true` and `data: ADRRecords`, or
`success: false` and `error: z.ZodError`.

---

### safeParseADRJsonArray (function)

**Source:** `_specs/schemas/adr.ts:321`

**Summary:** Safely parse a JSON string containing an array of ADR records.

#### TSDoc Tags

##### @remarks

JSON syntax errors are wrapped in a {@link z.ZodError} for a
uniform return type.

##### @param

input - A JSON string whose top-level value is an array.

##### @returns

A Zod `SafeParseReturnType` containing either the validated
{@link ADRRecords} or a {@link z.ZodError}.

---

### safeParseADRJsonl (function)

**Source:** `_specs/schemas/adr.ts:363`

**Summary:** Safely parse a JSONL string.

#### TSDoc Tags

##### @param

input - A JSONL-formatted string. Empty lines are skipped.

##### @returns

A Zod `SafeParseReturnType` containing either the validated
{@link ADRRecords} or a {@link z.ZodError}.

---

### safeParseADRRecord (function)

**Source:** `_specs/schemas/adr.ts:247`

**Summary:** Safely parse a single ADR from a pre-parsed value.

#### TSDoc Tags

##### @param

input - An `unknown` value (typically the result of `JSON.parse`).

##### @returns

A Zod `SafeParseReturnType` containing either the validated
{@link ADRRecord} or a {@link z.ZodError}.

---

### safeParseADRRecordString (function)

**Source:** `_specs/schemas/adr.ts:276`

**Summary:** Safely parse a single ADR from a raw JSON string.

#### TSDoc Tags

##### @remarks

JSON syntax errors are wrapped in a {@link z.ZodError} so the
return type is uniform regardless of failure mode.

##### @param

input - A JSON string representing one ADR object.

##### @returns

A Zod `SafeParseReturnType` containing either the validated
{@link ADRRecord} or a {@link z.ZodError}.

---

### serializeADR (function)

**Source:** `_specs/schemas/adr.ts:474`

**Summary:** Serialize a single validated ADR record to a JSON string.

#### TSDoc Tags

##### @remarks

Accepts an already-validated {@link ADRRecord} — no re-validation is
performed. To validate-then-serialize from untrusted input, call
{@link parseADRRecord} first.

##### @param

record - A validated ADR record.

##### @returns

A single-line JSON string.

---

### serializeADRsToJsonl (function)

**Source:** `_specs/schemas/adr.ts:488`

**Summary:** Serialize an array of ADR records to JSONL format.

#### TSDoc Tags

##### @remarks

Output uses one JSON object per line with a trailing newline,
consistent with the JSONL specification.

##### @param

records - A validated array of ADR records.

##### @returns

A JSONL-formatted string.

