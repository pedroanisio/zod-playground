// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// ADR Schema
// ─────────────────────────────────────────────────────────────────────────
//
import { z } from "zod/v4";

// ─────────────────────────────────────────────
// ADR (Architecture Decision Record)
// ─────────────────────────────────────────────
//
// Unified module: Zod v4 validation + JSONL serialization.
// Merges grid-editor and iande-builder ADR contracts.

// ── Primitives ──────────────────────────────

/**
 * Canonical ADR lifecycle statuses as a const tuple.
 *
 * @remarks
 * Exported for iteration, mapping, and use in UI dropdowns.
 * The corresponding Zod schema is {@link ADRStatusSchema}.
 */
export const ADR_STATUSES = [
  "proposed",
  "approved",
  "rejected",
  "deferred",
  "suspended",
  "deprecated",
  "superseded",
] as const;

/**
 * Zod schema for ADR identifiers.
 *
 * @remarks
 * Must match the pattern `ADR-###` (e.g. `ADR-018`).
 */
export const ADRIdSchema = z
  .string()
  .regex(/^ADR-\d{3}$/, {
    error: "ADR id must match ADR-### (e.g. ADR-018)",
  });

/**
 * Zod schema for ISO 8601 date strings (`YYYY-MM-DD`).
 *
 * @remarks
 * Lexical string comparison is valid for this format, which is
 * relied upon by the {@link ADRRecordSchema} `updatedAt >= createdAt`
 * refinement.
 */
export const ADRDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    error: "Date must use ISO format YYYY-MM-DD",
  });

/**
 * Zod schema for the ADR status enum.
 *
 * @see {@link ADR_STATUSES} for the underlying tuple.
 */
export const ADRStatusSchema = z.enum(ADR_STATUSES);

/** An ADR identifier string (e.g. `"ADR-018"`). */
export type ADRId = z.infer<typeof ADRIdSchema>;

/** An ISO 8601 date string (`"YYYY-MM-DD"`). */
export type ADRDate = z.infer<typeof ADRDateSchema>;

/** One of the canonical ADR lifecycle statuses. */
export type ADRStatus = z.infer<typeof ADRStatusSchema>;

// ── Single Record ───────────────────────────

/**
 * Zod schema for a single ADR record.
 *
 * @remarks
 * Core fields are strictly validated. Unknown extension fields are
 * allowed via `.catchall(z.unknown())` for forward compatibility.
 *
 * Cross-field refinements:
 *
 * - `updatedAt` must be on or after `createdAt`.
 *
 * - `supersededBy` is **required** when `status` is `"superseded"`
 *   and **forbidden** otherwise.
 */
export const ADRRecordSchema = z
  .object({
    id: ADRIdSchema,
    title: z.string().min(1),
    status: ADRStatusSchema,
    decision: z.string().min(1),
    rationale: z.string().min(1),
    createdAt: ADRDateSchema,
    updatedAt: ADRDateSchema,
    tags: z.array(z.string().min(1)).optional(),
    supersededBy: ADRIdSchema.optional(),
  })
  .catchall(z.unknown())
  .superRefine((value, ctx) => {
    // Lexical compare is valid for YYYY-MM-DD.
    if (value.updatedAt < value.createdAt) {
      ctx.addIssue({
        code: "custom",
        path: ["updatedAt"],
        message: "updatedAt must be on or after createdAt",
      });
    }

    if (value.status === "superseded" && !value.supersededBy) {
      ctx.addIssue({
        code: "custom",
        path: ["supersededBy"],
        message:
          "supersededBy is required when status is 'superseded'",
      });
    }

    if (value.status !== "superseded" && value.supersededBy) {
      ctx.addIssue({
        code: "custom",
        path: ["supersededBy"],
        message:
          "supersededBy must not be set unless status is 'superseded'",
      });
    }
  });

/** A validated ADR record. */
export type ADRRecord = z.infer<typeof ADRRecordSchema>;

// ── Record Collection ───────────────────────

/**
 * Zod schema for an array of ADR records.
 *
 * @remarks
 * Validates each element via {@link ADRRecordSchema} and additionally
 * ensures no duplicate `id` values exist within the collection.
 */
export const ADRRecordsSchema = z
  .array(ADRRecordSchema)
  .superRefine((records, ctx) => {
    const seen = new Map<string, number>();

    records.forEach((record, index) => {
      const firstIndex = seen.get(record.id);
      if (firstIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: [index, "id"],
          message: `Duplicate ADR id '${record.id}' (first seen at index ${firstIndex})`,
        });
        return;
      }
      seen.set(record.id, index);
    });
  });

/** A validated array of ADR records with unique IDs. */
export type ADRRecords = z.infer<typeof ADRRecordsSchema>;

// ── JSONL Schema (string → ADRRecords) ──────

/**
 * Zod schema that transforms a raw JSONL string into {@link ADRRecords}.
 *
 * @remarks
 * Each non-empty line is parsed as JSON individually. Parse errors
 * include 1-based line numbers for diagnostics. After JSON parsing,
 * the resulting array is validated through {@link ADRRecordsSchema}.
 */
export const ADRJsonlSchema = z.string().transform((input, ctx) => {
  const lines = input.split(/\r?\n/);
  const parsed: unknown[] = [];
  const lineByIndex: number[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      parsed.push(JSON.parse(trimmed));
      lineByIndex.push(lineIndex + 1);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid JSON on line ${lineIndex + 1}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  });

  if (ctx.issues.length > 0) return z.NEVER;

  const checked = ADRRecordsSchema.safeParse(parsed);
  if (!checked.success) {
    for (const issue of checked.error.issues) {
      const [recordIndex, ...pathTail] = issue.path;
      const line =
        typeof recordIndex === "number"
          ? lineByIndex[recordIndex]
          : undefined;
      const location = line ? `line ${line}` : "records";
      ctx.addIssue({
        code: "custom",
        message: `${location}: ${issue.message}`,
        path: pathTail,
      });
    }
    return z.NEVER;
  }

  return checked.data;
});

/** The output type of {@link ADRJsonlSchema} (alias for {@link ADRRecords}). */
export type ADRJsonl = z.infer<typeof ADRJsonlSchema>;

// ── Parse (single record) ───────────────────

/**
 * Parse and validate a single ADR from a pre-parsed value.
 *
 * @param input - An `unknown` value (typically the result of `JSON.parse`).
 * @returns A validated {@link ADRRecord}.
 * @throws {@link z.ZodError} If validation fails.
 */
export function parseADRRecord(input: unknown): ADRRecord {
  return ADRRecordSchema.parse(input);
}

/**
 * Safely parse a single ADR from a pre-parsed value.
 *
 * @param input - An `unknown` value (typically the result of `JSON.parse`).
 * @returns A Zod `SafeParseReturnType` containing either the validated
 *          {@link ADRRecord} or a {@link z.ZodError}.
 */
export function safeParseADRRecord(
  input: unknown,
): z.SafeParseReturnType<unknown, ADRRecord> {
  return ADRRecordSchema.safeParse(input);
}

/**
 * Parse and validate a single ADR from a raw JSON string.
 *
 * @param input - A JSON string representing one ADR object.
 * @returns A validated {@link ADRRecord}.
 * @throws {@link SyntaxError} If `input` is not valid JSON.
 * @throws {@link z.ZodError} If validation fails.
 */
export function parseADRRecordString(input: string): ADRRecord {
  return ADRRecordSchema.parse(JSON.parse(input));
}

/**
 * Safely parse a single ADR from a raw JSON string.
 *
 * @remarks
 * JSON syntax errors are wrapped in a {@link z.ZodError} so the
 * return type is uniform regardless of failure mode.
 *
 * @param input - A JSON string representing one ADR object.
 * @returns A Zod `SafeParseReturnType` containing either the validated
 *          {@link ADRRecord} or a {@link z.ZodError}.
 */
export function safeParseADRRecordString(
  input: string,
): z.SafeParseReturnType<unknown, ADRRecord> {
  try {
    return ADRRecordSchema.safeParse(JSON.parse(input));
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]),
    } as z.SafeParseReturnType<unknown, ADRRecord>;
  }
}

// ── Parse (JSON array) ──────────────────────

/**
 * Parse and validate a JSON string containing an array of ADR records.
 *
 * @param input - A JSON string whose top-level value is an array.
 * @returns A validated {@link ADRRecords} array.
 * @throws {@link SyntaxError} If `input` is not valid JSON.
 * @throws {@link z.ZodError} If any record fails validation or IDs are duplicated.
 */
export function parseADRJsonArray(input: string): ADRRecords {
  const parsed: unknown = JSON.parse(input);
  return ADRRecordsSchema.parse(parsed);
}

/**
 * Safely parse a JSON string containing an array of ADR records.
 *
 * @remarks
 * JSON syntax errors are wrapped in a {@link z.ZodError} for a
 * uniform return type.
 *
 * @param input - A JSON string whose top-level value is an array.
 * @returns A Zod `SafeParseReturnType` containing either the validated
 *          {@link ADRRecords} or a {@link z.ZodError}.
 */
export function safeParseADRJsonArray(
  input: string,
): z.SafeParseReturnType<unknown, ADRRecords> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]),
    } as z.SafeParseReturnType<unknown, ADRRecords>;
  }
  return ADRRecordsSchema.safeParse(parsed);
}

// ── Parse (JSONL batch) ─────────────────────

/**
 * Parse and validate a JSONL string (one JSON object per line).
 *
 * @param input - A JSONL-formatted string. Empty lines are skipped.
 * @returns A validated {@link ADRRecords} array.
 * @throws {@link z.ZodError} If any line contains invalid JSON, any record
 *         fails validation, or IDs are duplicated.
 */
export function parseADRJsonl(input: string): ADRRecords {
  return ADRJsonlSchema.parse(input);
}

/**
 * Safely parse a JSONL string.
 *
 * @param input - A JSONL-formatted string. Empty lines are skipped.
 * @returns A Zod `SafeParseReturnType` containing either the validated
 *          {@link ADRRecords} or a {@link z.ZodError}.
 */
export function safeParseADRJsonl(
  input: string,
): z.SafeParseReturnType<string, ADRRecords> {
  return ADRJsonlSchema.safeParse(input);
}

// ── Polymorphic Parse ───────────────────────

/**
 * Union of all accepted input shapes for {@link parseADR}.
 *
 * @remarks
 * | Type | Interpretation |
 * |------|----------------|
 * | `string` | JSON array (starts with `[`) or JSONL |
 * | `unknown[]` | Pre-parsed array of records |
 * | `Record<string, unknown>` | Single pre-parsed record |
 */
export type ADRInput = string | unknown[] | Record<string, unknown>;

/**
 * Detect input shape and parse accordingly.
 *
 * @remarks
 * Shape detection heuristic:
 *
 * - **`string`** — if the trimmed value starts with `[`, it is treated
 *   as a JSON array; otherwise as JSONL. A single-line JSON object is
 *   valid JSONL and handled naturally.
 *
 * - **`Array`** — validated directly as {@link ADRRecords}.
 *
 * - **Plain object** — wrapped in a one-element array and validated
 *   as {@link ADRRecords}. The return value is always an array for
 *   uniform downstream handling.
 *
 * @param input - A string (JSON array or JSONL), a pre-parsed array,
 *                or a single pre-parsed record.
 * @returns A validated {@link ADRRecords} array.
 * @throws {@link z.ZodError} If validation fails.
 * @throws {@link SyntaxError} If a string input contains invalid JSON.
 */
export function parseADR(input: ADRInput): ADRRecords {
  if (typeof input === "string") {
    const trimmed = input.trim();

    // Heuristic: if it starts with '[', treat as JSON array.
    if (trimmed.startsWith("[")) {
      return parseADRJsonArray(input);
    }

    // Otherwise treat as JSONL (also handles single-line JSON objects).
    return parseADRJsonl(input);
  }

  if (Array.isArray(input)) {
    return ADRRecordsSchema.parse(input);
  }

  // Single pre-parsed record → wrap in array.
  return ADRRecordsSchema.parse([input]);
}

/**
 * Safely detect input shape and parse accordingly.
 *
 * @remarks
 * All failure modes (JSON syntax errors, Zod validation errors) are
 * normalised into a {@link z.ZodError} on the `error` branch so
 * callers only need to handle one error type.
 *
 * @param input - A string (JSON array or JSONL), a pre-parsed array,
 *                or a single pre-parsed record.
 * @returns An object with `success: true` and `data: ADRRecords`, or
 *          `success: false` and `error: z.ZodError`.
 */
export function safeParseADR(
  input: ADRInput,
): { success: true; data: ADRRecords } | { success: false; error: z.ZodError } {
  try {
    return { success: true, data: parseADR(input) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: error instanceof Error ? error.message : String(error),
        },
      ]),
    };
  }
}

// ── Serialize ───────────────────────────────

/**
 * Serialize a single validated ADR record to a JSON string.
 *
 * @remarks
 * Accepts an already-validated {@link ADRRecord} — no re-validation is
 * performed. To validate-then-serialize from untrusted input, call
 * {@link parseADRRecord} first.
 *
 * @param record - A validated ADR record.
 * @returns A single-line JSON string.
 */
export function serializeADR(record: ADRRecord): string {
  return JSON.stringify(record);
}

/**
 * Serialize an array of ADR records to JSONL format.
 *
 * @remarks
 * Output uses one JSON object per line with a trailing newline,
 * consistent with the JSONL specification.
 *
 * @param records - A validated array of ADR records.
 * @returns A JSONL-formatted string.
 */
export function serializeADRsToJsonl(records: ADRRecords): string {
  return `${records.map(serializeADR).join("\n")}\n`;
}
