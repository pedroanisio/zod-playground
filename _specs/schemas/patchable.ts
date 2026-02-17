// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Patchable Plugin
// ─────────────────────────────────────────────────────────────────────────
//
// Define patch derivation and application utilities for Zod object schemas,
// including nested array operations, diff computation, and transactions.

import { z } from "zod/v4";

// ─────────────────────────────────────────────
// § 1  TYPES
// ─────────────────────────────────────────────

/** A single change record */
export type DiffEntry = {
  path: string;
  previous: unknown;
  current: unknown;
};

/** Result of applying a patch */
export interface PatchResult<T> {
  data: T;
  diff: DiffEntry[];
  changed: boolean;
}

// ─────────────────────────────────────────────
// § 1b  BATCH TYPES
// ─────────────────────────────────────────────

/** One entry in a batch — a labeled patch */
export interface BatchEntry {
  /** Optional label for tracing / error reporting */
  label?: string;
  /** The raw patch payload */
  patch: unknown;
}

/** Result of one patch within a batch */
export type BatchEntryResult<T> =
  | { success: true; index: number; label?: string; result: PatchResult<T> }
  | { success: false; index: number; label?: string; error: z.ZodError | Error };

/** Full batch result */
export interface BatchResult<T> {
  /** The final entity after all successful patches (or pre-rollback snapshot) */
  data: T;
  /** Per-patch results in order */
  entries: BatchEntryResult<T>[];
  /** Aggregated diff from original → final */
  diff: DiffEntry[];
  /** Whether anything changed at all */
  changed: boolean;
  /** Whether every patch succeeded */
  allSucceeded: boolean;
  /** Whether a rollback was triggered */
  rolledBack: boolean;
}

/** Options controlling batch behavior */
export interface BatchOptions {
  /**
   * `"transaction"` — all-or-nothing: if any patch fails, rollback to original.
   * `"sequential"`  — apply as many as possible, skip failures, keep going.
   * `"stop"`        — apply in order, stop at first failure, keep partial result.
   *
   * @default "transaction"
   */
  strategy?: "transaction" | "sequential" | "stop";
}

/** One step in a cross-entity transaction */
export interface TransactionStep<T = any> {
  /** The patchable instance for this entity type */
  patchable: Patchable<any>;
  /** The current entity value */
  current: T;
  /** The patch(es) to apply — single patch or batch array */
  patches: unknown | BatchEntry[];
  /** Optional label for error reporting */
  label?: string;
}

/** Result of one step in a cross-entity transaction */
export type TransactionStepResult<T = any> =
  | { success: true; label?: string; result: PatchResult<T> | BatchResult<T> }
  | { success: false; label?: string; error: z.ZodError | Error };

/** Full cross-entity transaction result */
export interface TransactionResult {
  /** Per-step results in order */
  steps: TransactionStepResult[];
  /** Whether every step succeeded */
  allSucceeded: boolean;
  /** Whether a rollback was triggered (all results are pre-patch originals) */
  rolledBack: boolean;
}

/** Configuration for the patchable plugin */
export interface PatchableConfig<TShape extends z.ZodRawShape> {
  /**
   * Fields that can never be patched.
   * They are stripped from the patch schema entirely.
   * @example ["id", "created_at", "created_by"]
   */
  immutable?: (keyof TShape)[];

  /**
   * Array fields whose items have an `id` and should use
   * array-patch-ops (add/remove/update/move/replace).
   *
   * Auto-detected if omitted: any field that is a ZodArray
   * wrapping a ZodObject whose shape includes `id`.
   */
  identifiedArrays?: (keyof TShape)[];

  /**
   * Array fields that should be replaced wholesale on patch
   * (no per-item ops). Useful for simple value arrays like tags.
   * Auto-detected if omitted: arrays of non-objects.
   */
  replaceArrays?: (keyof TShape)[];

  /**
   * Custom per-field patch schemas. Overrides the auto-derived one.
   * Use this for discriminated unions or other complex fields.
   */
  fieldOverrides?: Partial<Record<keyof TShape, z.ZodType>>;

  /**
   * Nested patchable configs for identified-array items.
   * Lets you control immutable/array behavior recursively.
   *
   * @example { sections: { immutable: ["id"], identifiedArrays: ["blocks"] } }
   */
  nested?: Partial<
    Record<keyof TShape, PatchableConfig<any>>
  >;

  /**
   * Dot-path to a human-readable field used as a secondary key
   * for resolving symbolic IDs in array patch ops.
   *
   * When set, patch ops can use either a UUID or the value of this
   * field as the `id`. The engine auto-detects which by checking
   * whether the value matches UUID format.
   *
   * @example "slug"           // sections resolved by section.slug
   * @example "content.anchor" // blocks resolved by block.content.anchor
   */
  resolveBy?: string;
}

// ─────────────────────────────────────────────
// § 2  ARRAY PATCH OPS — generic schema builder
// ─────────────────────────────────────────────

const UUIDField = z.string();

function buildArrayPatchOpsSchema<
  TItem extends z.ZodType,
  TPatch extends z.ZodType,
>(itemSchema: TItem, patchSchema: TPatch) {
  return z.array(
    z.discriminatedUnion("op", [
      z.object({
        op: z.literal("add"),
        item: itemSchema,
        before_id: UUIDField.optional(),
      }),
      z.object({
        op: z.literal("remove"),
        id: UUIDField,
      }),
      z.object({
        op: z.literal("update"),
        id: UUIDField,
        patch: patchSchema,
      }),
      z.object({
        op: z.literal("move"),
        id: UUIDField,
        to_order: z.number().int().nonnegative().optional(),
        before_id: UUIDField.optional(),
      }),
      z.object({
        op: z.literal("replace"),
        items: z.array(itemSchema),
      }),
    ]),
  );
}

// ─────────────────────────────────────────────
// § 3  SCHEMA INTROSPECTION HELPERS
// ─────────────────────────────────────────────

/** Unwrap ZodOptional / ZodDefault / ZodNullable to get the core type */
function unwrap(schema: z.ZodType): z.ZodType {
  if (schema instanceof z.ZodOptional) return unwrap(schema.unwrap() as z.ZodType);
  if (schema instanceof z.ZodDefault) return unwrap(schema.removeDefault() as z.ZodType);
  if (schema instanceof z.ZodNullable) return unwrap(schema.unwrap() as z.ZodType);
  return schema;
}

/** Check if a schema is an array of objects that have an `id` field */
function isIdentifiedArray(schema: z.ZodType): boolean {
  const core = unwrap(schema);
  if (!(core instanceof z.ZodArray)) return false;
  const element = unwrap(core.element as z.ZodType);
  if (!(element instanceof z.ZodObject)) return false;
  return "id" in (element as z.ZodObject<any>).shape;
}

/** Check if a schema is a simple array (not of identified objects) */
function isSimpleArray(schema: z.ZodType): boolean {
  const core = unwrap(schema);
  if (!(core instanceof z.ZodArray)) return false;
  return !isIdentifiedArray(schema);
}

/** Get the array element schema */
function getArrayElement(schema: z.ZodType): z.ZodType {
  const core = unwrap(schema);
  return (core as z.ZodArray<any>).element;
}

/** Check if a field can be nullable */
function isNullable(schema: z.ZodType): boolean {
  if (schema instanceof z.ZodNullable) return true;
  if (schema instanceof z.ZodOptional) return isNullable(schema.unwrap() as z.ZodType);
  if (schema instanceof z.ZodDefault) return isNullable(schema.removeDefault() as z.ZodType);
  return false;
}

// ─────────────────────────────────────────────
// § 4  DEEP PARTIAL SCHEMA DERIVATION
// ─────────────────────────────────────────────

/**
 * Derive a deep-partial patch schema from any ZodObject.
 * - Object fields → recursively deep-partial, then optional
 * - Discriminated unions → kept as-is but optional (replace variant)
 * - Arrays → optional (replace semantics)
 * - Scalars → optional
 * - Nullable fields → optional + nullable
 *
 * @param schema - Source object schema to transform.
 * @returns Deep-partial schema suitable for patch payloads.
 */
export function deriveDeepPartial(schema: z.ZodObject<any>): z.ZodObject<any> {
  const shape: Record<string, z.ZodType> = {};

  for (const [key, rawField] of Object.entries(schema.shape)) {
    const field = rawField as z.ZodType;
    const core = unwrap(field);
    const nullable = isNullable(field);

    if (core instanceof z.ZodObject) {
      const partial = deriveDeepPartial(core);
      shape[key] = nullable ? partial.optional().nullable() : partial.optional();
    } else {
      shape[key] = nullable ? core.optional().nullable() : core.optional();
    }
  }

  return z.object(shape);
}

// ─────────────────────────────────────────────
// § 5  DEEP MERGE
// ─────────────────────────────────────────────

/**
 * RFC 7396-style deep merge.
 * - `undefined` → skip
 * - `null`      → set to null
 * - object+object → recurse
 * - everything else → replace
 *
 * @param target - Base object.
 * @param patch - Partial patch object to merge.
 * @returns Merged object preserving recursive semantics.
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  patch: Record<string, any>,
): T {
  const result = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value === null) {
      (result as any)[key] = null;
      continue;
    }
    const targetVal = (target as any)[key];
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof targetVal === "object" &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      (result as any)[key] = deepMerge(targetVal, value);
    } else {
      (result as any)[key] = value;
    }
  }
  return result;
}

// ─────────────────────────────────────────────
// § 6  ARRAY OPS APPLICATOR
// ─────────────────────────────────────────────

type Identified = { id: string; order?: number; [k: string]: any };

type ArrayOp =
  | { op: "add"; item: any; before_id?: string }
  | { op: "remove"; id: string }
  | { op: "update"; id: string; patch: any }
  | { op: "move"; id: string; to_order?: number; before_id?: string }
  | { op: "replace"; items: any[] };

// ── Symbolic ID resolution ──────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read a dot-path value from an object (e.g. "content.anchor" → obj.content.anchor) */
function getByPath(obj: Record<string, any>, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Build a resolver function for an identified array.
 * If `resolveBy` is set, non-UUID ids are looked up against
 * the given dot-path field on each item in the current array.
 */
function buildResolver(
  resolveBy: string | undefined,
): (rawId: string, items: Identified[]) => string {
  if (!resolveBy) return (id) => id;
  return (rawId, items) => {
    if (UUID_RE.test(rawId)) return rawId;
    const match = items.find((i) => getByPath(i, resolveBy) === rawId);
    if (!match) {
      throw new Error(
        `Cannot resolve "${rawId}" via "${resolveBy}" — no matching item found`,
      );
    }
    return match.id;
  };
}

/**
 * Apply ordered array patch operations to an identified collection.
 *
 * @param current - Current array snapshot.
 * @param ops - Ordered array operations to apply.
 * @param patchFn - Item patch function used for update operations.
 * @param resolve - Resolver that maps symbolic IDs to concrete IDs.
 * @returns Updated and re-indexed array.
 */
export function applyArrayOps<T extends Identified>(
  current: T[],
  ops: ArrayOp[],
  patchFn: (item: T, patch: Record<string, any>) => T,
  resolve: (rawId: string, items: T[]) => string = (id) => id,
): T[] {
  let items = [...current];

  for (const op of ops) {
    switch (op.op) {
      case "add": {
        if (op.before_id) {
          const rid = resolve(op.before_id, items);
          const idx = items.findIndex((i) => i.id === rid);
          idx === -1 ? items.push(op.item) : items.splice(idx, 0, op.item);
        } else {
          items.push(op.item);
        }
        break;
      }
      case "remove": {
        const rid = resolve(op.id, items);
        items = items.filter((i) => i.id !== rid);
        break;
      }
      case "update": {
        const rid = resolve(op.id, items);
        items = items.map((i) =>
          i.id === rid ? patchFn(i, op.patch) : i,
        );
        break;
      }
      case "move": {
        const rid = resolve(op.id, items);
        const idx = items.findIndex((i) => i.id === rid);
        if (idx === -1) break;
        const [moved] = items.splice(idx, 1);
        if (!moved) break;
        if (op.before_id) {
          const brid = resolve(op.before_id, items);
          const tgt = items.findIndex((i) => i.id === brid);
          tgt === -1 ? items.push(moved) : items.splice(tgt, 0, moved);
        } else if (op.to_order !== undefined) {
          items.splice(Math.min(op.to_order, items.length), 0, moved);
        } else {
          items.push(moved);
        }
        break;
      }
      case "replace":
        items = op.items;
        break;
    }
  }

  // Re-index `order` if items have it
  return items.map((item, idx) =>
    "order" in item ? { ...item, order: idx } : item,
  );
}

// ─────────────────────────────────────────────
// § 7  DIFF ENGINE
// ─────────────────────────────────────────────

/**
 * Compute field-level diffs between two object trees.
 *
 * @param original - Original object state.
 * @param updated - Updated object state.
 * @param prefix - Optional path prefix for recursive traversal.
 * @returns Flat list of changed paths with before/after values.
 */
export function computeDiff(
  original: Record<string, any>,
  updated: Record<string, any>,
  prefix = "",
): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const keys = new Set([...Object.keys(original), ...Object.keys(updated)]);
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const a = original[key];
    const b = updated[key];
    if (
      typeof a === "object" && a !== null && !Array.isArray(a) &&
      typeof b === "object" && b !== null && !Array.isArray(b)
    ) {
      diffs.push(...computeDiff(a, b, path));
    } else if (JSON.stringify(a) !== JSON.stringify(b)) {
      diffs.push({ path, previous: a, current: b });
    }
  }
  return diffs;
}

// ═══════════════════════════════════════════════════════════════
// § 8  THE PLUGIN
// ═══════════════════════════════════════════════════════════════

/** Define the Patchable interface contract. */
export interface Patchable<
  TSchema extends z.ZodObject<any>,
  TFull = z.infer<TSchema>,
> {
  /** The original full entity schema */
  readonly fullSchema: TSchema;

  /** The auto-derived patch schema */
  readonly patchSchema: z.ZodType;

  /** Validate + apply a patch → new entity + diff. Throws on invalid. */
  apply(current: TFull, rawPatch: unknown): PatchResult<TFull>;

  /** Non-throwing variant of apply */
  safeApply(
    current: TFull,
    rawPatch: unknown,
  ):
    | { success: true; result: PatchResult<TFull> }
    | { success: false; error: z.ZodError | Error };

  /** Validate patch shape only (no apply) */
  validate(rawPatch: unknown): z.ZodSafeParseResult<unknown>;

  /** Compute diff between two full entities */
  diff(a: TFull, b: TFull): DiffEntry[];

  /**
   * Apply multiple patches sequentially to a single entity.
   * Throws on first failure unless strategy is "sequential".
   */
  batch(
    current: TFull,
    patches: BatchEntry[],
    options?: BatchOptions,
  ): BatchResult<TFull>;

  /**
   * Non-throwing variant of batch.
   */
  safeBatch(
    current: TFull,
    patches: BatchEntry[],
    options?: BatchOptions,
  ):
    | { success: true; result: BatchResult<TFull> }
    | { success: false; error: Error };
}

/**
 * ┌─────────────────────────────────────────────────────────┐
 * │  patchable(schema, config?) → Patchable<TSchema>        │
 * │                                                         │
 * │  Wraps any Zod v4 object schema with:                   │
 * │   • Auto-derived deep-partial patch schema              │
 * │   • Array patch ops for identified collections          │
 * │   • Recursive nested patching                           │
 * │   • Validated apply + diff                              │
 * └─────────────────────────────────────────────────────────┘
 *
 * @example
 * ```ts
 * import { patchable } from "./patchable";
 * import { ContentSchema } from "./content";
 * import { PresentationSchema } from "./presentation";
 *
 * const PatchableContent = patchable(ContentSchema, {
 *   immutable: ["id", "created_at", "created_by"],
 *   nested: {
 *     sections: {
 *       immutable: ["id"],
 *       identifiedArrays: ["blocks"],
 *       nested: {
 *         blocks: { immutable: ["id"] },
 *       },
 *     },
 *   },
 * });
 *
 * const PatchablePresentation = patchable(PresentationSchema, {
 *   immutable: ["id", "created_at", "created_by"],
 *   nested: {
 *     slides: {
 *       immutable: ["id"],
 *       identifiedArrays: ["slot_bindings", "decorations"],
 *     },
 *   },
 * });
 *
 * // Apply a targeted patch
 * const result = PatchableContent.apply(existingContent, {
 *   title: "Updated Title",
 *   sections: [
 *     { op: "update", id: "sec-1", patch: {
 *       title: "Renamed Section",
 *       blocks: [
 *         { op: "update", id: "blk-1", patch: { content: { type: "text", alignment: "center" } } },
 *         { op: "add", item: newBlock },
 *         { op: "move", id: "blk-3", before_id: "blk-1" },
 *       ],
 *     }},
 *     { op: "remove", id: "sec-old" },
 *   ],
 * });
 *
 * console.log(result.diff);     // what changed
 * console.log(result.changed);  // boolean
 * console.log(result.data);     // fully validated new entity
 * ```
 *
 * @param schema - Source Zod object schema.
 * @param config - Patch behavior configuration.
 * @returns Patchable wrapper exposing patch validation and apply helpers.
 */
export function patchable<TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
  config: PatchableConfig<TShape> = {},
): Patchable<z.ZodObject<TShape>> {
  type TFull = z.infer<z.ZodObject<TShape>>;

  const immutableSet = new Set((config.immutable ?? []) as string[]);

  // ── Auto-detect field categories ───────────

  const identifiedArrayFields = new Set<string>(
    (config.identifiedArrays as string[]) ?? [],
  );
  const replaceArrayFields = new Set<string>(
    (config.replaceArrays as string[]) ?? [],
  );

  for (const [key, rawField] of Object.entries(schema.shape)) {
    if (immutableSet.has(key)) continue;
    if (identifiedArrayFields.has(key) || replaceArrayFields.has(key)) continue;

    const field = rawField as z.ZodType;
    if (isIdentifiedArray(field)) {
      identifiedArrayFields.add(key);
    } else if (isSimpleArray(field)) {
      replaceArrayFields.add(key);
    }
  }

  // ── Build the patch schema ─────────────────

  const patchShape: Record<string, z.ZodType> = {};

  for (const [key, rawField] of Object.entries(schema.shape)) {
    if (immutableSet.has(key)) continue;

    const field = rawField as z.ZodType;

    // Explicit override
    if (config.fieldOverrides && key in config.fieldOverrides) {
      patchShape[key] = (config.fieldOverrides as any)[key].optional();
      continue;
    }

    // Identified array → array patch ops
    if (identifiedArrayFields.has(key)) {
      const element = unwrap(getArrayElement(field));
      const nestedConfig = config.nested?.[key as keyof TShape];

      let itemPatchSchema: z.ZodType;
      if (element instanceof z.ZodObject) {
        if (nestedConfig) {
          const nestedPatchable = patchable(
            element as z.ZodObject<any>,
            nestedConfig as PatchableConfig<any>,
          );
          itemPatchSchema = nestedPatchable.patchSchema;
        } else {
          const itemPartial = deriveDeepPartial(element as z.ZodObject<any>);
          const { id, order, ...rest } = itemPartial.shape;
          itemPatchSchema = z.object(rest);
        }
      } else {
        itemPatchSchema = z.any();
      }

      patchShape[key] = buildArrayPatchOpsSchema(
        element,
        itemPatchSchema,
      ).optional();
      continue;
    }

    // Simple array → optional replace
    if (replaceArrayFields.has(key)) {
      const core = unwrap(field);
      patchShape[key] = isNullable(field)
        ? core.optional().nullable()
        : core.optional();
      continue;
    }

    // Nested object → deep partial
    const core = unwrap(field);
    if (core instanceof z.ZodObject) {
      const partial = deriveDeepPartial(core);
      patchShape[key] = isNullable(field)
        ? partial.optional().nullable()
        : partial.optional();
      continue;
    }

    // Discriminated union → replace wholesale
    if (core instanceof z.ZodDiscriminatedUnion) {
      patchShape[key] = isNullable(field)
        ? core.optional().nullable()
        : core.optional();
      continue;
    }

    // Scalar / everything else → optional
    patchShape[key] = isNullable(field)
      ? core.optional().nullable()
      : core.optional();
  }

  const patchSchema = z.object(patchShape);

  // ── Build nested patchable map + resolvers for apply ───

  const nestedPatchables = new Map<string, Patchable<any>>();
  const resolvers = new Map<
    string,
    (rawId: string, items: Identified[]) => string
  >();
  for (const key of identifiedArrayFields) {
    const field = (schema.shape as any)[key] as z.ZodType;
    const element = unwrap(getArrayElement(field));
    const nestedConfig = config.nested?.[key as keyof TShape] as
      | PatchableConfig<any>
      | undefined;

    // Build resolver from the nested config's resolveBy
    resolvers.set(key, buildResolver(nestedConfig?.resolveBy));

    if (element instanceof z.ZodObject) {
      nestedPatchables.set(
        key,
        patchable(element as z.ZodObject<any>, (nestedConfig ?? {}) as any),
      );
    }
  }

  // ── Apply ──────────────────────────────────

  function applyPatch(current: TFull, rawPatch: unknown): PatchResult<TFull> {
    // 1. Validate patch
    const patch = patchSchema.parse(rawPatch) as Record<string, any>;

    // 2. Separate array-op fields from scalar fields
    const scalarPatch: Record<string, any> = {};
    const arrayOpPatches: Record<string, ArrayOp[]> = {};

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (identifiedArrayFields.has(key) && Array.isArray(value)) {
        arrayOpPatches[key] = value;
      } else {
        scalarPatch[key] = value;
      }
    }

    // 3. Deep merge scalars
    let merged = deepMerge(current as Record<string, any>, scalarPatch);

    // 4. Apply array ops
    for (const [key, ops] of Object.entries(arrayOpPatches)) {
      const currentArray = (merged as any)[key] ?? [];
      const nestedP = nestedPatchables.get(key);
      const resolve = resolvers.get(key);

      (merged as any)[key] = applyArrayOps(
        currentArray,
        ops,
        (item, itemPatch) => {
          if (nestedP) {
            return nestedP.apply(item, itemPatch).data;
          }
          return deepMerge(item, itemPatch);
        },
        resolve,
      );
    }

    // 5. Validate full result
    const data = schema.parse(merged) as TFull;

    // 6. Diff
    const diff = computeDiff(
      current as Record<string, any>,
      data as Record<string, any>,
    );

    return { data, diff, changed: diff.length > 0 };
  }

  // ── Batch ────────────────────────────────

  function batchApply(
    current: TFull,
    patches: BatchEntry[],
    options: BatchOptions = {},
  ): BatchResult<TFull> {
    const strategy = options.strategy ?? "transaction";
    const original = current;
    let head = current;
    const entries: BatchEntryResult<TFull>[] = [];
    let aborted = false;

    for (let i = 0; i < patches.length; i++) {
      const entry = patches[i];
      if (!entry) continue;
      if (aborted) {
        entries.push({
          success: false,
          index: i,
          label: entry.label,
          error: new Error("Skipped — batch aborted by prior failure"),
        });
        continue;
      }

      try {
        const result = applyPatch(head, entry.patch);
        head = result.data;
        entries.push({ success: true, index: i, label: entry.label, result });
      } catch (e) {
        const error = e as z.ZodError | Error;
        entries.push({ success: false, index: i, label: entry.label, error });

        if (strategy === "transaction") {
          // Rollback: reset head, mark remaining as skipped
          head = original;
          aborted = true;
        } else if (strategy === "stop") {
          // Stop: keep partial result, mark remaining as skipped
          aborted = true;
        }
        // "sequential": swallow failure, continue with current head
      }
    }

    const rolledBack = strategy === "transaction" && entries.some((e) => !e.success);
    const finalData = rolledBack ? original : head;

    const diff = computeDiff(
      original as Record<string, any>,
      finalData as Record<string, any>,
    );

    return {
      data: finalData,
      entries,
      diff,
      changed: diff.length > 0,
      allSucceeded: entries.every((e) => e.success),
      rolledBack,
    };
  }

  // ── Return the plugin ──────────────────────

  return {
    fullSchema: schema,
    patchSchema: patchSchema as z.ZodType,

    apply: applyPatch,

    safeApply(current: TFull, rawPatch: unknown) {
      try {
        return { success: true as const, result: applyPatch(current, rawPatch) };
      } catch (e) {
        return { success: false as const, error: e as z.ZodError | Error };
      }
    },

    validate(rawPatch: unknown) {
      return patchSchema.safeParse(rawPatch);
    },

    diff(a: TFull, b: TFull) {
      return computeDiff(
        a as Record<string, any>,
        b as Record<string, any>,
      );
    },

    batch: batchApply,

    safeBatch(current: TFull, patches: BatchEntry[], options?: BatchOptions) {
      try {
        return { success: true as const, result: batchApply(current, patches, options) };
      } catch (e) {
        return { success: false as const, error: e as Error };
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// § 10  CROSS-ENTITY TRANSACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Apply patches across multiple different entities atomically.
 * If any step fails, ALL entities are rolled back to their originals.
 *
 * @example
 * ```ts
 * const result = transaction([
 *   {
 *     patchable: PatchableContent,
 *     current: existingContent,
 *     patches: { title: "Updated" },
 *     label: "content",
 *   },
 *   {
 *     patchable: PatchablePresentation,
 *     current: existingDeck,
 *     patches: [
 *       { label: "rename", patch: { title: "New Deck Title" } },
 *       { label: "reorder", patch: { slides: [{ op: "move", id: "s1", to_order: 0 }] } },
 *     ],
 *     label: "presentation",
 *   },
 * ]);
 *
 * if (result.allSucceeded) {
 *   const [contentResult, deckResult] = result.steps;
 *   // contentResult.result.data  → new Content
 *   // deckResult.result.data     → new Presentation
 * }
 * ```
 *
 * @param steps - Ordered cross-entity transaction steps.
 * @returns Transaction result with per-step outcomes and rollback status.
 */
export function transaction(steps: TransactionStep[]): TransactionResult {
  const results: TransactionStepResult[] = [];
  let failed = false;

  for (const step of steps) {
    if (failed) {
      results.push({
        success: false,
        label: step.label,
        error: new Error("Skipped — transaction aborted by prior step"),
      });
      continue;
    }

    try {
      let stepResult: PatchResult<any> | BatchResult<any>;

      if (Array.isArray(step.patches)) {
        // Batch mode: multiple patches on this entity
        stepResult = step.patchable.batch(
          step.current,
          step.patches as BatchEntry[],
          { strategy: "transaction" }, // inner batch is also transactional
        );
        // If the inner batch rolled back, treat this step as failed
        if ((stepResult as BatchResult<any>).rolledBack) {
          const firstError = (stepResult as BatchResult<any>).entries.find(
            (e) => !e.success,
          );
          throw (firstError as any)?.error ?? new Error("Inner batch failed");
        }
      } else {
        // Single patch
        stepResult = step.patchable.apply(step.current, step.patches);
      }

      results.push({ success: true, label: step.label, result: stepResult });
    } catch (e) {
      failed = true;
      results.push({
        success: false,
        label: step.label,
        error: e as z.ZodError | Error,
      });
    }
  }

  const allSucceeded = results.every((r) => r.success);

  // If any step failed, roll back ALL: replace results' data with originals
  if (!allSucceeded) {
    return {
      steps: results.map((r) => {
        if (r.success) {
          // Convert to failed with rollback notice
          return {
            success: false as const,
            label: r.label,
            error: new Error("Rolled back — another step in the transaction failed"),
          };
        }
        return r;
      }),
      allSucceeded: false,
      rolledBack: true,
    };
  }

  return { steps: results, allSucceeded: true, rolledBack: false };
}

// ═══════════════════════════════════════════════════════════════
// § 11  RE-EXPORTS
// ═══════════════════════════════════════════════════════════════

/** Re-export array operation union for external typing. */
export type { ArrayOp };
