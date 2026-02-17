// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────────
// Mental Model Schema
// ─────────────────────────────────────────────────────────────────────────────
//
// Define a pre-plan schema that captures baseline state, target state, gaps,
// assumptions, and open questions before generating a formal execution plan.

import * as z from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// § 0  PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

const GitSha = z.string().regex(/^[0-9a-f]{7,40}$/, "Valid git SHA");
const Timestamp = z.string().datetime({ offset: true });

// ─────────────────────────────────────────────────────────────────────────────
// § 1  IDENTITY
// ─────────────────────────────────────────────────────────────────────────────

const ModelIdentity = z.object({
  modelId: z.string().min(1),
  createdAt: Timestamp,
  authorId: z.string().min(1),

  /**
   * What triggered this mental model. Captures the original request
   * so the human can evaluate whether the model addresses it.
   */
  taskDescription: z.string().min(1),

  /**
   * Documents the agent inspected to build this model.
   * Enables the human to judge: "did you look at the right things?"
   */
  sourcesConsulted: z.array(z.object({
    path: z.string().min(1),
    description: z.string().min(1),
    /** "codebase" = verified from files. "reference" = read but not
     *  treated as source of truth. "user-provided" = explicit input. */
    trustLevel: z.enum(["codebase", "reference", "user-provided"]),
  })).min(1),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 2  BASELINE STATE  —  "What exists?"
//
// Built from codebase inspection. This is the agent's understanding of
// current reality — not what a reference document says should exist.
// ─────────────────────────────────────────────────────────────────────────────

const BaselineState = z.object({
  snapshot: GitSha,

  /**
   * Quantitative measurements taken from the codebase.
   * These become the plan's baseline.metrics.
   */
  metrics: z.array(z.object({
    name: z.string().min(1),
    value: z.number(),
    unit: z.string().min(1),
    measuredBy: z.string().min(1).describe("Command or method used to measure"),
  })).default([]),

  /**
   * Prose summary of what exists. The agent's "I looked at the codebase
   * and here's what I found" statement. Should be concrete enough that
   * the human can verify it against their own understanding.
   */
  summary: z.string().min(1),

  /**
   * Specific capabilities that exist and are working.
   * Prevents the plan from re-building things that are already done.
   */
  existingCapabilities: z.array(z.string().min(1)).min(1),

  /**
   * Known problems in the current state. These may or may not be
   * in scope for the plan — that's a decision for the human.
   */
  knownIssues: z.array(z.string().min(1)).default([]),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 3  TARGET STATE  —  "What does 'done' mean?"
//
// The agent's interpretation of the user's intent. This is the most
// important section for human review — if the target is wrong,
// everything downstream is wrong.
// ─────────────────────────────────────────────────────────────────────────────

const TargetState = z.object({
  /**
   * One-sentence description of the end state.
   * Must be explicit enough to confirm whether it matches requested intent.
   */
  definition: z.string().min(1),

  /**
   * Concrete, measurable criteria for "done."
   * These become the plan's acceptanceCriteria.
   */
  successCriteria: z.array(z.string().min(1)).min(1),

  /**
   * Where the target state definition came from.
   * "user-explicit" = user stated it directly.
   * "inferred-from-reference" = derived from a reference document.
   * "inferred-from-codebase" = derived from TODOs, gaps, patterns.
   */
  derivation: z.enum([
    "user-explicit",
    "inferred-from-reference",
    "inferred-from-codebase",
    "composite",
  ]),

  /**
   * If derivation is not "user-explicit", explain the inference chain.
   * The human needs to see WHY the agent thinks this is the target.
   */
  derivationRationale: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 4  DELTA  —  "What's the gap?"
//
// The difference between baseline and target, organized into work streams.
// Each work stream becomes one or more plan steps.
// ─────────────────────────────────────────────────────────────────────────────

const WorkStream = z.object({
  id: z.string().min(1),
  title: z.string().min(1),

  /**
   * What this work stream delivers. Should be concrete enough to
   * verify ("11 scraper adapters" not "improve scraping").
   */
  deliverable: z.string().min(1),

  /**
   * T-shirt size for the entire work stream.
   * A work stream may become multiple plan steps.
   */
  estimatedSize: z.enum(["XS", "S", "M", "L", "XL"]),

  /**
   * Other work stream IDs this depends on.
   */
  dependsOn: z.array(z.string().min(1)).default([]),

  /**
   * Files/modules this work stream will create or modify.
   * Not exhaustive — just enough for the human to judge scope.
   * Full file lists go in the plan.
   */
  touchesAreas: z.array(z.string().min(1)).default([]),

  /**
   * Why this work stream is necessary to reach the target state.
   * If it's not obviously needed, the human might cut it.
   */
  rationale: z.string().optional(),
});

const Delta = z.object({
  /**
   * High-level summary of the gap: "15 adapters exist, 51 needed,
   * delta is 36 adapters plus supporting infrastructure."
   */
  summary: z.string().min(1),

  /**
   * The work streams that close the gap.
   * Each becomes one or more PlanSchema steps.
   */
  workStreams: z.array(WorkStream).min(1),

  /**
   * Things the agent considered including but chose to exclude,
   * with rationale so scope boundaries stay reviewable.
   */
  excludedFromScope: z.array(z.object({
    item: z.string().min(1),
    reason: z.string().min(1),
  })).default([]),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 5  ENTITY INVENTORY  —  Domain entities the plan will reference
//
// This is the confidence gate (plan-generation.md §1.2) materialized.
// Every domain entity the plan will name is listed here, partitioned
// by verification status. The human sees exactly what's verified
// and what's not.
// ─────────────────────────────────────────────────────────────────────────────

const EntityInventory = z.object({
  /**
   * Entities confirmed from the codebase via treemeta, source inspection,
   * or file reads. These are safe to reference in the plan.
   */
  verified: z.array(z.object({
    name: z.string().min(1),
    kind: z.string().min(1).describe("adapter, service, file, endpoint, etc."),
    verifiedFrom: z.string().min(1).describe("File path or command that confirmed existence"),
  })).default([]),

  /**
   * Entities from reference documents or general knowledge that the
   * agent has NOT verified from the codebase. These are the hallucination
   * risk zone. The human must either:
   * (a) confirm them, moving them to verified, or
   * (b) remove them from scope.
   */
  unverified: z.array(z.object({
    name: z.string().min(1),
    kind: z.string().min(1),
    source: z.string().min(1).describe("Where the agent learned about this entity"),
    /** What happens if this entity doesn't actually exist. */
    impactIfMissing: z.string().min(1),
  })).default([]),

  /**
   * Entities that the reference documents mention but the agent
   * actively determined do NOT exist in the codebase. Flagged
   * so the human knows the delta is intentional, not an oversight.
   */
  confirmedAbsent: z.array(z.object({
    name: z.string().min(1),
    kind: z.string().min(1),
    expectedLocation: z.string().min(1),
    checkedVia: z.string().min(1).describe("Command or path used to confirm absence"),
  })).default([]),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 6  ASSUMPTIONS  —  "What am I assuming?"
//
// Things the agent believes to be true but hasn't proven. Each
// assumption is a potential failure point. The human reviews and
// either confirms, corrects, or flags for investigation.
// ─────────────────────────────────────────────────────────────────────────────

const Assumption = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),

  /**
   * What goes wrong if this assumption is false.
   * Helps the human prioritize which assumptions to verify.
   */
  ifWrong: z.string().min(1),

  /**
   * How confident the agent is.
   * "high" = strong evidence from codebase.
   * "medium" = inferred from patterns or reference docs.
   * "low" = guess or convention-based.
   */
  confidence: z.enum(["high", "medium", "low"]),

  /**
   * How to verify this assumption if needed.
   */
  verificationHint: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 7  OPEN QUESTIONS  —  "What do I need from you?"
//
// Things the agent cannot resolve on its own. These MUST be answered
// before plan generation. A mental model with open questions is
// explicitly incomplete — that's the point.
// ─────────────────────────────────────────────────────────────────────────────

const OpenQuestion = z.object({
  id: z.string().min(1),
  question: z.string().min(1),

  /**
   * Why the agent can't answer this itself.
   */
  context: z.string().min(1),

  /**
   * What the agent would do for each possible answer.
   * Shows downstream impact for each candidate answer.
   */
  options: z.array(z.object({
    answer: z.string().min(1),
    implication: z.string().min(1),
  })).min(2),

  /**
   * Which work streams are blocked until this is answered.
   */
  blocksWorkStreams: z.array(z.string().min(1)).default([]),

  /**
   * If the agent has a recommended answer, state it.
   * The human can accept or override.
   */
  agentRecommendation: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 8  OPEN DECISIONS  —  Decisions requiring human authority
//
// Distinct from open questions: these are choices where the agent
// knows the options and tradeoffs, but lacks authority to decide.
// Maps to plan-generation.md §1.3 (decision authority).
// ─────────────────────────────────────────────────────────────────────────────

const OpenDecision = z.object({
  id: z.string().min(1),
  title: z.string().min(1),

  /**
   * Why this needs human authority (vendor cost, irreversible, etc.)
   */
  reason: z.enum([
    "external-vendor-cost",
    "irreversible-architecture",
    "infrastructure-commitment",
    "scope-expansion",
    "security-implications",
    "other",
  ]),

  options: z.array(z.object({
    option: z.string().min(1),
    tradeoff: z.string().min(1),
  })).min(2),

  /**
   * Which work streams are affected by this decision.
   */
  affectsWorkStreams: z.array(z.string().min(1)).default([]),

  agentRecommendation: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 9  CONSTRAINTS  —  Non-negotiable requirements
//
// Things that must remain true throughout execution.
// These become the plan's intent projections and verification gates.
// ─────────────────────────────────────────────────────────────────────────────

const Constraint = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  /** How to check this constraint. */
  verificationCommand: z.string().optional(),
  /** "invariant" = must hold after every step.
   *  "milestone" = must hold at a specific point. */
  kind: z.enum(["invariant", "milestone"]),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 10  PROPOSED PHASES  —  How the delta maps to execution
//
// If the delta is too large for a single plan, the agent proposes
// how to split it. Each phase becomes a separate PlanSchema instance.
// The human confirms the phasing before the agent generates any plan.
// ─────────────────────────────────────────────────────────────────────────────

const ProposedPhase = z.object({
  phaseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  /** Which work stream IDs belong to this phase. */
  workStreamIds: z.array(z.string().min(1)).min(1),
  /** IDs of phases that must complete before this one starts. */
  dependsOnPhases: z.array(z.string().min(1)).default([]),
  /** Estimated plan size if this phase were its own PlanSchema. */
  estimatedPlanLines: z.number().int().positive().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// § 11  MENTAL MODEL (root schema)
// ─────────────────────────────────────────────────────────────────────────────

/** Define the MentalModelSchema validation schema. */
export const MentalModelSchema = z.object({
  schemaVersion: z.literal("0.1.0"),
  identity: ModelIdentity,
  baseline: BaselineState,
  targetState: TargetState,
  delta: Delta,
  entities: EntityInventory,
  assumptions: z.array(Assumption).default([]),
  openQuestions: z.array(OpenQuestion).default([]),
  openDecisions: z.array(OpenDecision).default([]),
  constraints: z.array(Constraint).default([]),

  /**
   * Present only when the delta is too large for a single plan.
   * If absent, the entire delta becomes one PlanSchema.
   * If present, the human confirms phasing before plan generation.
   */
  proposedPhases: z.array(ProposedPhase).optional(),

  /**
   * Agent's confidence that this mental model correctly represents
   * the task. If low, the agent should explain why in openQuestions.
   */
  overallConfidence: z.enum(["high", "medium", "low"]),

  /**
   * Freeform notes the agent wants the human to see during review.
   * Use for anything that doesn't fit the structured fields above.
   */
  reviewNotes: z.string().optional(),
});

/** Represent MentalModel values inferred from the schema layer. */
export type MentalModel = z.infer<typeof MentalModelSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// § 12  VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/** Define the MentalModelValidationResult interface contract. */
export interface MentalModelValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  readiness: "ready-for-plan" | "needs-human-input" | "needs-investigation";
}

/**
 * Validate a mental model's internal consistency and readiness.
 *
 * A mental model is "ready-for-plan" only when:
 * - No open questions remain
 * - No open decisions remain
 * - No unverified entities exist
 * - Overall confidence is "high"
 *
 * This is intentionally strict. The whole point is to force resolution
 * BEFORE plan generation, not during.
 *
 * @param model - Mental model document to validate.
 * @returns Validation result with structural errors, readiness warnings, and status.
 */
export function validateMentalModel(
  model: MentalModel,
): MentalModelValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── Structural checks ──

  // Work stream dependency integrity
  const wsIds = new Set(model.delta.workStreams.map((ws) => ws.id));
  for (const ws of model.delta.workStreams) {
    for (const dep of ws.dependsOn) {
      if (!wsIds.has(dep)) {
        errors.push(
          `Work stream "${ws.id}" depends on unknown work stream "${dep}"`,
        );
      }
    }
  }

  // Work stream DAG acyclicity
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const wsMap = new Map(model.delta.workStreams.map((ws) => [ws.id, ws]));

  function hasCycle(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    inStack.add(id);
    const ws = wsMap.get(id);
    if (ws) {
      for (const dep of ws.dependsOn) {
        if (hasCycle(dep)) return true;
      }
    }
    inStack.delete(id);
    return false;
  }

  for (const ws of model.delta.workStreams) {
    visited.clear();
    inStack.clear();
    if (hasCycle(ws.id)) {
      errors.push(`Cycle detected involving work stream "${ws.id}"`);
      break;
    }
  }

  // Phase work stream references
  if (model.proposedPhases) {
    for (const phase of model.proposedPhases) {
      for (const wsId of phase.workStreamIds) {
        if (!wsIds.has(wsId)) {
          errors.push(
            `Phase "${phase.phaseId}" references unknown work stream "${wsId}"`,
          );
        }
      }
      for (const dep of phase.dependsOnPhases) {
        const phaseIds = new Set(model.proposedPhases.map((p) => p.phaseId));
        if (!phaseIds.has(dep)) {
          errors.push(
            `Phase "${phase.phaseId}" depends on unknown phase "${dep}"`,
          );
        }
      }
    }

    // Every work stream should belong to exactly one phase
    const assignedWs = new Set<string>();
    for (const phase of model.proposedPhases) {
      for (const wsId of phase.workStreamIds) {
        if (assignedWs.has(wsId)) {
          errors.push(`Work stream "${wsId}" assigned to multiple phases`);
        }
        assignedWs.add(wsId);
      }
    }
    for (const ws of model.delta.workStreams) {
      if (!assignedWs.has(ws.id)) {
        warnings.push(`Work stream "${ws.id}" not assigned to any phase`);
      }
    }
  }

  // ── Readiness checks ──

  if (model.openQuestions.length > 0) {
    warnings.push(
      `${model.openQuestions.length} open question(s) must be resolved before plan generation`,
    );
  }

  if (model.openDecisions.length > 0) {
    warnings.push(
      `${model.openDecisions.length} open decision(s) require human authority`,
    );
  }

  if (model.entities.unverified.length > 0) {
    warnings.push(
      `${model.entities.unverified.length} unverified entity/entities — must be confirmed or removed`,
    );
  }

  if (model.overallConfidence !== "high") {
    warnings.push(
      `Agent confidence is "${model.overallConfidence}" — review carefully`,
    );
  }

  // Assumptions with low confidence
  const lowConfAssumptions = model.assumptions.filter(
    (a) => a.confidence === "low",
  );
  if (lowConfAssumptions.length > 0) {
    warnings.push(
      `${lowConfAssumptions.length} low-confidence assumption(s) — consider verifying`,
    );
  }

  // ── Derive target state consistency ──

  if (
    model.targetState.derivation !== "user-explicit" &&
    !model.targetState.derivationRationale
  ) {
    warnings.push(
      "Target state was inferred but derivationRationale is missing — " +
        "human cannot evaluate the inference without it",
    );
  }

  // ── Compute readiness ──

  let readiness: MentalModelValidationResult["readiness"];
  if (errors.length > 0) {
    readiness = "needs-investigation";
  } else if (
    model.openQuestions.length > 0 ||
    model.openDecisions.length > 0 ||
    model.entities.unverified.length > 0
  ) {
    readiness = "needs-human-input";
  } else if (model.overallConfidence !== "high") {
    readiness = "needs-human-input";
  } else {
    readiness = "ready-for-plan";
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    readiness,
  };
}
