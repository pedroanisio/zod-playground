// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Zod AI Metadata
// ─────────────────────────────────────────────────────────────────────────
//
// Define a fluent metadata layer that teaches AI agents how to generate,
// update, and validate values for Zod schemas and compiled prompt outputs.

import { z } from "zod/v4";

// ─────────────────────────────────────────────────────────────────────────
// §1  TYPES — AI teaching metadata structures
// ─────────────────────────────────────────────────────────────────────────

/** How important is it that the agent gets this field right? */
export type Priority = "critical" | "high" | "medium" | "low" | "optional";

/** What kind of operation does a rule apply to? */
export type OpScope = "generate" | "update" | "validate" | "transform" | "all";

/** A single teaching rule for the agent. */
export interface AgentRule {
  /** The instruction text. */
  text: string;
  /** Which operation this rule applies to. */
  scope: OpScope;
  /** Optional condition under which the rule activates. */
  when?: string;
}

/** A positive or negative example. */
export interface AgentExample {
  value: unknown;
  label?: string;
  isAntipattern: boolean;
}

/** A relationship to another schema the agent should be aware of. */
export interface AgentRelation {
  targetSchemaId: string;
  kind: "depends_on" | "derived_from" | "mutually_exclusive" | "co_occurs" | "parent" | "child";
  description?: string;
}

/** Tool or function the agent can call when working with this field. */
export interface AgentToolHint {
  name: string;
  description: string;
  when?: string;
}

/** The full AI teaching metadata for a single schema node. */
export interface AITeachingMeta {
  /** Human-readable semantic purpose of this field. */
  instruct?: string;

  /** Rules the agent should follow. */
  rules: AgentRule[];

  /** Positive examples and antipatterns. */
  examples: AgentExample[];

  /** How important correctness is for this field. */
  priority?: Priority;

  /** Relationships to other schemas. */
  relations: AgentRelation[];

  /** Tools the agent can use for this field. */
  toolHints: AgentToolHint[];

  /** Domain-specific semantic type (beyond the Zod type).
   *  e.g. "email", "currency_usd", "slug", "cron_expression" */
  semantic?: string;

  /** Default strategy the agent should use when the field is absent.
   *  e.g. "infer_from_context", "ask_user", "use_default", "skip" */
  whenMissing?: "infer_from_context" | "ask_user" | "use_default" | "skip";

  /** Natural-language description of valid value boundaries
   *  that supplements (but doesn't replace) Zod's own checks. */
  boundary?: string;

  /** Free-form key-value hints for domain-specific agent behaviour. */
  hints: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────
// §2  REGISTRY — storage for AI metadata
// ─────────────────────────────────────────────────────────────────────────

/**
 * Custom registry for AI teaching metadata.
 * Uses WeakMap for memory safety and a Set for iteration support.
 */
class AIRegistry {
  private map = new WeakMap<z.ZodType, AITeachingMeta>();
  private schemas = new Set<z.ZodType>();

  add(schema: z.ZodType, meta: AITeachingMeta): void {
    this.map.set(schema, meta);
    this.schemas.add(schema);
  }

  get(schema: z.ZodType): AITeachingMeta | undefined {
    return this.map.get(schema);
  }

  *entries(): Generator<[z.ZodType, AITeachingMeta]> {
    for (const schema of this.schemas) {
      const meta = this.map.get(schema);
      if (meta) yield [schema, meta];
    }
  }
}

/** Define the aiRegistry value. */
export const aiRegistry = new AIRegistry();

// ─────────────────────────────────────────────────────────────────────────
// §3  BUILDER — fluent API for teaching schemas
// ─────────────────────────────────────────────────────────────────────────

/**
 * Fluent builder returned by `ai(schema)`.
 * Every method mutates the metadata in the registry and returns `this`
 * for chaining.
 */
class AIMetaBuilder<S extends z.ZodType> {
  private schema: S;
  private meta: AITeachingMeta;

  constructor(schema: S) {
    this.schema = schema;

    // Initialise or retrieve existing meta
    const existing = aiRegistry.get(schema);
    this.meta = existing ?? {
      rules: [],
      examples: [],
      relations: [],
      toolHints: [],
      hints: {},
    };

    // Ensure it's registered (idempotent)
    if (!existing) {
      aiRegistry.add(schema, this.meta);
    }
  }

  // ─── Core teaching ───

  /** Describe the semantic purpose of this field to the agent. */
  instruct(text: string): this {
    this.meta.instruct = text;
    return this;
  }

  /** Add a generation-time rule. */
  generate(text: string, when?: string): this {
    this.meta.rules.push({ text, scope: "generate", when });
    return this;
  }

  /** Add an update/mutation rule. */
  update(text: string, when?: string): this {
    this.meta.rules.push({ text, scope: "update", when });
    return this;
  }

  /** Add a validation-time rule (beyond what Zod enforces). */
  validate(text: string, when?: string): this {
    this.meta.rules.push({ text, scope: "validate", when });
    return this;
  }

  /** Add a transformation rule. */
  transform(text: string, when?: string): this {
    this.meta.rules.push({ text, scope: "transform", when });
    return this;
  }

  /** Add a rule that applies to all operations. */
  always(text: string, when?: string): this {
    this.meta.rules.push({ text, scope: "all", when });
    return this;
  }

  // ─── Examples ───

  /** Provide one or more positive examples. */
  example(...values: unknown[]): this {
    for (const v of values) {
      // Validate examples against the schema
      const result = this.schema.safeParse(v);
      if (!result.success) {
        console.warn(`AI example doesn't match schema: ${JSON.stringify(v)}`);
      }
      this.meta.examples.push({ value: v, isAntipattern: false });
    }
    return this;
  }

  /** Provide a labeled positive example. */
  exampleLabeled(label: string, value: unknown): this {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      console.warn(`AI example doesn't match schema: ${JSON.stringify(value)} (${label})`);
    }
    this.meta.examples.push({ value, label, isAntipattern: false });
    return this;
  }

  /** Provide one or more values the agent should NEVER produce. */
  antipattern(...values: unknown[]): this {
    for (const v of values) {
      // Antipatterns should fail validation
      const result = this.schema.safeParse(v);
      if (result.success) {
        console.warn(`AI antipattern actually passes validation: ${JSON.stringify(v)}`);
      }
      this.meta.examples.push({ value: v, isAntipattern: true });
    }
    return this;
  }

  /** Labeled antipattern with explanation. */
  antipatternLabeled(label: string, value: unknown): this {
    const result = this.schema.safeParse(value);
    if (result.success) {
      console.warn(`AI antipattern actually passes validation: ${JSON.stringify(value)} (${label})`);
    }
    this.meta.examples.push({ value, label, isAntipattern: true });
    return this;
  }

  // ─── Classification ───

  /** How critical is correctness for this field? */
  priority(level: Priority): this {
    this.meta.priority = level;
    return this;
  }

  /** Domain-specific semantic type label. */
  semantic(type: string): this {
    this.meta.semantic = type;
    return this;
  }

  /** What should the agent do when this value is missing? */
  whenMissing(strategy: AITeachingMeta["whenMissing"]): this {
    this.meta.whenMissing = strategy;
    return this;
  }

  /** Natural-language boundary description. */
  boundary(description: string): this {
    this.meta.boundary = description;
    return this;
  }

  // ─── Relations ───

  /** Declare a relationship to another schema. */
  relatesTo(
    targetSchemaId: string,
    kind: AgentRelation["kind"],
    description?: string
  ): this {
    this.meta.relations.push({ targetSchemaId, kind, description });
    return this;
  }

  /** Shorthand: this field depends on another. */
  dependsOn(targetSchemaId: string, description?: string): this {
    return this.relatesTo(targetSchemaId, "depends_on", description);
  }

  /** Shorthand: this field is derived from another. */
  derivedFrom(targetSchemaId: string, description?: string): this {
    return this.relatesTo(targetSchemaId, "derived_from", description);
  }

  // ─── Tool hints ───

  /** Suggest a tool the agent can call when working with this field. */
  useTool(name: string, description: string, when?: string): this {
    this.meta.toolHints.push({ name, description, when });
    return this;
  }

  // ─── Free-form hints ───

  /** Attach an arbitrary key-value hint. */
  hint(key: string, value: unknown): this {
    this.meta.hints[key] = value;
    return this;
  }

  // ─── Terminal ───

  /** Return the underlying schema (useful if you want to keep chaining Zod). */
  done(): S {
    return this.schema;
  }

  /** Return the raw metadata object. */
  getMeta(): Readonly<AITeachingMeta> {
    return this.meta;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// §4  ENTRY POINT — main API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Start teaching an AI agent about a schema.
 *
 * ```ts
 * ai(mySchema)
 *   .instruct("User's display name")
 *   .generate("Use title case")
 *   .example("Alice Johnson")
 *   .antipattern("ALICE", "a.")
 *   .priority("high");
 * ```
 *
 * @param schema - Zod schema to annotate with AI metadata.
 * @returns Fluent metadata builder bound to `schema`.
 */
export function ai<S extends z.ZodType>(schema: S): AIMetaBuilder<S> {
  return new AIMetaBuilder(schema);
}

// ─────────────────────────────────────────────────────────────────────────
// §5  COMPILER — prompt generation
// ─────────────────────────────────────────────────────────────────────────

/** Compiled field instruction for prompt injection. */
export interface CompiledField {
  path: string;
  zodType: string;
  instruct?: string;
  semantic?: string;
  priority?: Priority;
  whenMissing?: string;
  boundary?: string;
  rules: { text: string; scope: OpScope; when?: string }[];
  goodExamples: { value: unknown; label?: string }[];
  badExamples: { value: unknown; label?: string }[];
  relations: AgentRelation[];
  toolHints: AgentToolHint[];
  hints: Record<string, unknown>;
}

/** Full compiled output for a schema tree. */
export interface CompiledPrompt {
  /** Structured data for programmatic consumption. */
  fields: CompiledField[];
  /** Ready-to-use prompt text for an LLM system message. */
  text: string;
}

/**
 * Walk a Zod object schema and collect all AI teaching metadata
 * into a structured format and a ready-to-use prompt string.
 *
 * @param schema - Root schema to compile.
 * @param options - Optional scope and priority filters.
 * @returns Structured compiled fields and prompt text.
 */
export function compilePrompt(
  schema: z.ZodType,
  options?: {
    /** Filter rules to a specific operation scope. */
    scope?: OpScope;
    /** Only include fields at or above this priority. */
    minPriority?: Priority;
    /** Prefix for field paths (used in recursion). */
    _pathPrefix?: string;
  }
): CompiledPrompt {
  const scope = options?.scope ?? "all";
  const minPriority = options?.minPriority;
  const prefix = options?._pathPrefix ?? "";

  const priorityOrder: Priority[] = ["critical", "high", "medium", "low", "optional"];
  const minIdx = minPriority ? priorityOrder.indexOf(minPriority) : priorityOrder.length - 1;

  const fields: CompiledField[] = [];

  // Try to extract shape from object schemas
  const shape = extractShape(schema);

  if (shape) {
    for (const [key, fieldSchema] of Object.entries(shape)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const meta = aiRegistry.get(fieldSchema as z.ZodType);

      if (meta) {
        // Priority filter
        if (meta.priority) {
          const idx = priorityOrder.indexOf(meta.priority);
          if (idx > minIdx) continue;
        }

        // Scope filter
        const filteredRules = meta.rules.filter(
          (r) => scope === "all" || r.scope === "all" || r.scope === scope
        );

        fields.push({
          path,
          zodType: getZodTypeName(fieldSchema as z.ZodType),
          instruct: meta.instruct,
          semantic: meta.semantic,
          priority: meta.priority,
          whenMissing: meta.whenMissing,
          boundary: meta.boundary,
          rules: filteredRules,
          goodExamples: meta.examples
            .filter((e) => !e.isAntipattern)
            .map(({ value, label }) => ({ value, label })),
          badExamples: meta.examples
            .filter((e) => e.isAntipattern)
            .map(({ value, label }) => ({ value, label })),
          relations: meta.relations,
          toolHints: meta.toolHints,
          hints: meta.hints,
        });
      }

      // Recurse into nested objects
      const nestedShape = extractShape(fieldSchema as z.ZodType);
      if (nestedShape) {
        const nested = compilePrompt(fieldSchema as z.ZodType, {
          ...options,
          _pathPrefix: path,
        });
        fields.push(...nested.fields);
      }
    }
  } else if (!prefix) {
    // Top-level non-object schema
    const meta = aiRegistry.get(schema);
    if (meta) {
      fields.push({
        path: "(root)",
        zodType: getZodTypeName(schema),
        instruct: meta.instruct,
        semantic: meta.semantic,
        priority: meta.priority,
        whenMissing: meta.whenMissing,
        boundary: meta.boundary,
        rules: meta.rules.filter(
          (r) => scope === "all" || r.scope === "all" || r.scope === scope
        ),
        goodExamples: meta.examples.filter((e) => !e.isAntipattern).map(({ value, label }) => ({ value, label })),
        badExamples: meta.examples.filter((e) => e.isAntipattern).map(({ value, label }) => ({ value, label })),
        relations: meta.relations,
        toolHints: meta.toolHints,
        hints: meta.hints,
      });
    }
  }

  return { fields, text: renderPrompt(fields) };
}

/**
 * Compile ALL schemas in the AI registry into a single prompt.
 * Useful when you want to dump everything the agent needs to know.
 *
 * @param options - Optional scope and priority filters.
 * @returns Compiled prompt output for the full registry.
 */
export function compileRegistry(options?: {
  scope?: OpScope;
  minPriority?: Priority;
}): CompiledPrompt {
  const fields: CompiledField[] = [];

  for (const [schema, meta] of aiRegistry.entries()) {
    const globalMeta = (schema as any).meta?.() as { id?: string; title?: string } | undefined;
    const id = globalMeta?.id ?? globalMeta?.title ?? "(anonymous)";

    const compiled = compileSingleMeta(id, meta, getZodTypeName(schema), options?.scope);
    if (compiled) fields.push(compiled);
  }

  return { fields, text: renderPrompt(fields) };
}

// ─────────────────────────────────────────────────────────────────────────
// §6  HELPERS — utility functions
// ─────────────────────────────────────────────────────────────────────────

function extractShape(schema: z.ZodType): Record<string, unknown> | null {
  try {
    if ("shape" in schema && typeof schema.shape === "object" && schema.shape !== null) {
      return schema.shape as Record<string, unknown>;
    }
  } catch {}
  return null;
}

function getZodTypeName(schema: z.ZodType): string {
  // Zod v4 stores type info in _def
  try {
    const def = (schema as any)._def;
    if (def?.typeName) return def.typeName.replace("Zod", "");
    if (def?.type) return def.type;
  } catch {}
  return "unknown";
}

function compileSingleMeta(
  path: string,
  meta: AITeachingMeta,
  zodType: string,
  scope?: OpScope
): CompiledField | null {
  const s = scope ?? "all";
  return {
    path,
    zodType,
    instruct: meta.instruct,
    semantic: meta.semantic,
    priority: meta.priority,
    whenMissing: meta.whenMissing,
    boundary: meta.boundary,
    rules: meta.rules.filter((r) => s === "all" || r.scope === "all" || r.scope === s),
    goodExamples: meta.examples.filter((e) => !e.isAntipattern).map(({ value, label }) => ({ value, label })),
    badExamples: meta.examples.filter((e) => e.isAntipattern).map(({ value, label }) => ({ value, label })),
    relations: meta.relations,
    toolHints: meta.toolHints,
    hints: meta.hints,
  };
}

function renderPrompt(fields: CompiledField[]): string {
  if (fields.length === 0) return "No AI teaching metadata found for this schema.";

  const lines: string[] = [];

  lines.push("# Schema Generation & Operation Guide");
  lines.push("");

  // Group by priority
  const grouped = new Map<string, CompiledField[]>();
  for (const f of fields) {
    const p = f.priority ?? "medium";
    if (!grouped.has(p)) grouped.set(p, []);
    grouped.get(p)!.push(f);
  }

  const order: Priority[] = ["critical", "high", "medium", "low", "optional"];

  for (const priority of order) {
    const group = grouped.get(priority);
    if (!group?.length) continue;

    lines.push(`## ${priority.toUpperCase()} priority fields`);
    lines.push("");

    for (const f of group) {
      lines.push(`### \`${f.path}\` (${f.zodType}${f.semantic ? ` — ${f.semantic}` : ""})`);

      if (f.instruct) {
        lines.push(f.instruct);
      }

      if (f.boundary) {
        lines.push(`Boundaries: ${f.boundary}`);
      }

      if (f.whenMissing) {
        lines.push(`When missing: ${f.whenMissing.replace(/_/g, " ")}`);
      }

      if (f.rules.length > 0) {
        lines.push("");
        lines.push("Rules:");
        for (const r of f.rules) {
          const cond = r.when ? ` (when: ${r.when})` : "";
          const tag = r.scope !== "all" ? `[${r.scope}] ` : "";
          lines.push(`- ${tag}${r.text}${cond}`);
        }
      }

      if (f.goodExamples.length > 0) {
        lines.push("");
        lines.push("Good examples:");
        for (const e of f.goodExamples) {
          const lbl = e.label ? ` (${e.label})` : "";
          lines.push(`  ✓ ${JSON.stringify(e.value)}${lbl}`);
        }
      }

      if (f.badExamples.length > 0) {
        lines.push("");
        lines.push("NEVER produce:");
        for (const e of f.badExamples) {
          const lbl = e.label ? ` (${e.label})` : "";
          lines.push(`  ✗ ${JSON.stringify(e.value)}${lbl}`);
        }
      }

      if (f.relations.length > 0) {
        lines.push("");
        lines.push("Relations:");
        for (const r of f.relations) {
          const desc = r.description ? ` — ${r.description}` : "";
          lines.push(`- ${r.kind.replace(/_/g, " ")} → ${r.targetSchemaId}${desc}`);
        }
      }

      if (f.toolHints.length > 0) {
        lines.push("");
        lines.push("Available tools:");
        for (const t of f.toolHints) {
          const cond = t.when ? ` (when: ${t.when})` : "";
          lines.push(`- ${t.name}: ${t.description}${cond}`);
        }
      }

      if (Object.keys(f.hints).length > 0) {
        lines.push("");
        lines.push("Additional hints:");
        for (const [k, v] of Object.entries(f.hints)) {
          lines.push(`- ${k}: ${JSON.stringify(v)}`);
        }
      }

      lines.push("");
    }
  }

  return lines.join("\n");
}
