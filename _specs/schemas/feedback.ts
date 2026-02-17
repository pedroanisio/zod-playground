import { z } from "zod";

// ─────────────────────────────────────────────
// Feedback Entity Schema
// ─────────────────────────────────────────────
//
// Structured feedback records with provenance, claims,
// and independent dispositions. Implements the channel
// message model from the constraint paper (§2.5).
//
// Feedback items are decomposed claims, each receiving
// its own disposition. See the constraint paper §2.1
// for actor projection and §4.8 for verification cost.
//
// Schema version: 0.6.0 (proposed)

// ── § 0  Primitives — shared base types ──

const SemVer = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Must be valid semver (MAJOR.MINOR.PATCH)");

const DateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

// ── § 1  Enums — feedback classification vocabulary ──

/**
 * Verdict on a single feedback item.
 *
 * `"pending"` — received, not yet evaluated.
 * `"accepted"` — sound; produces a concrete change.
 * `"partially_accepted"` — some claims sound, others not; each accounted for.
 * `"refuted"` — not sound; objections stated.
 * `"deferred"` — may be sound, not actionable in current version.
 */
const FeedbackDisposition = z.enum([
  "pending",
  "accepted",
  "partially_accepted",
  "refuted",
  "deferred",
]);

/**
 * Entity type targeted by a feedback item.
 *
 * `"framework"` — meta-level feedback on the model itself.
 */
const FeedbackTargetType = z.enum([
  "intent",
  "transition",
  "decision",
  "tension",
  "manifest",
  "origin_record",
  "schema",
  "spec",
  "framework",
]);

/**
 * Channel through which feedback arrived [FM §2.5].
 *
 * `"conversation"` — high bandwidth, rarely captured in artifacts.
 * `"document_review"` — structured, preserved, but delayed.
 * `"pr_review"` — code-proximate, narrow scope.
 * `"issue"` — async, potentially decontextualized.
 * `"ci_output"` — automated, no tacit knowledge.
 * `"external_review"` — formal, high authority, low frequency.
 * `"adversarial"` — deliberately stress-testing; highest signal density.
 */
const FeedbackChannel = z.enum([
  "conversation",
  "document_review",
  "pr_review",
  "issue",
  "ci_output",
  "external_review",
  "adversarial",
]);

/**
 * Source's relationship to the framework, determining observable projection.
 *
 * `"domain_expert"` — deep domain knowledge, may lack framework context.
 * `"framework_author"` — full framework context, may lack domain distance.
 * `"framework_adopter"` — practical experience, adoption-surface feedback.
 * `"external_reviewer"` — independent assessment, limited projection by design.
 * `"automated_system"` — deterministic, zero tacit knowledge.
 */
const SourceAuthority = z.enum([
  "domain_expert",
  "framework_author",
  "framework_adopter",
  "external_reviewer",
  "automated_system",
]);

/**
 * Action type taken in response to accepted feedback.
 *
 * `"intent_transition"` — triggered a version bump on an intent.
 * `"tension_created"` — surfaced a new tension.
 * `"tension_updated"` — modified an existing tension's resolution.
 * `"fc_updated"` — changed a falsifiable claim's status or wording.
 * `"fm_added"` — added a new failure mode.
 * `"fm_updated"` — refined an existing failure mode.
 * `"schema_change"` — modified the data model.
 * `"spec_change"` — modified specification prose.
 * `"validator_added"` — added a new structural validator.
 * `"validator_modified"` — changed an existing validator.
 * `"constraint_added"` — added an operating constraint [FM §2].
 * `"ontology_change"` — added or modified an entity type.
 * `"no_action_needed"` — accepted as true but no change required.
 */
const FeedbackActionType = z.enum([
  "intent_transition",
  "tension_created",
  "tension_updated",
  "fc_updated",
  "fm_added",
  "fm_updated",
  "schema_change",
  "spec_change",
  "validator_added",
  "validator_modified",
  "constraint_added",
  "ontology_change",
  "no_action_needed",
]);

// ── § 2  Sub-schemas — provenance, targets, actions, items ──

/**
 * Provenance record capturing the source, channel, and observable projection of feedback.
 *
 * @remarks
 * Models the actor projection [Def 2.1]: every claim is conditioned on
 * the source's observable state ŝ_a(t), not the full system state S(t).
 * The projection fields enable evaluation of whether claims were
 * well-founded given what the source observed.
 */
const FeedbackProvenance = z.object({
  source_id: z.string().min(1),
  source_authority: SourceAuthority,
  received: DateString,
  channel: FeedbackChannel,

  /** Artifacts, documents, or state the source had access to [Def 2.1]. */
  projection_included: z
    .array(z.string().min(1))
    .min(1)
    .describe("Artifacts, documents, or state the source had access to"),

  /** Known gaps in the source's observable state. Use `"unknown"` when gaps are not identifiable. */
  projection_excluded: z
    .array(z.string().min(1))
    .optional()
    .describe("Known gaps in the source's observable state"),

  artifact_ref: z
    .string()
    .optional()
    .describe("URL, document ID, or conversation ref for the raw feedback"),
});

/**
 * Single target of feedback: entity type, reference, version, and aspect.
 */
const FeedbackTarget = z.object({
  entity_type: FeedbackTargetType,
  entity_ref: z.string().min(1),
  entity_version: SemVer.optional(),
  aspect: z
    .string()
    .min(1)
    .optional()
    .describe("Specific field, section, or property targeted"),
});

/**
 * Concrete action taken in response to accepted or partially accepted feedback.
 */
const FeedbackAction = z.object({
  type: FeedbackActionType,
  ref: z.string().min(1).describe("Entity ID, transition ref, or commit SHA"),
  description: z.string().min(1),
});

/**
 * Single decomposed claim from feedback, receiving its own independent disposition.
 *
 * @remarks
 * Each item represents one assertion that could have a distinct disposition.
 * Claims with potentially different dispositions must be separate items.
 */
const FeedbackItem = z.object({
  id: z.string().regex(/^FBI-\d{2,}$/, "Must match FBI-NN pattern"),

  claim: z.string().min(1).describe("The assertion, suggestion, or criticism — stated precisely"),

  targets: z.array(FeedbackTarget).min(1),

  disposition: FeedbackDisposition,

  /**
   * Rationale for the disposition. Required for every non-pending state.
   * Must engage with the claim's substance, not merely acknowledge it.
   */
  rationale: z
    .string()
    .optional()
    .describe("Why this disposition — must engage with the claim's substance"),

  actions_taken: z
    .array(FeedbackAction)
    .optional()
    .describe("Concrete changes made in response (required when accepted)"),

  /** Objections must engage with the claim's content, not dismiss the source. */
  objections: z
    .array(z.string().min(1))
    .optional()
    .describe("Specific reasons the claim does not hold"),

  accepted_portion: z
    .string()
    .optional()
    .describe("What part of the claim is sound — stated precisely"),

  refuted_portion: z
    .string()
    .optional()
    .describe("What part of the claim does not hold — with objections"),

  defer_rationale: z
    .string()
    .optional()
    .describe("Why actionable later but not now"),

  defer_until: z
    .string()
    .optional()
    .describe("Version, condition, or date at which this should be revisited"),

  /**
   * False-negative channel this item addresses [FM §4.7].
   *
   * `"projection"` — evaluator couldn't see the relevant state.
   * `"specification"` — no predicate tested the violated property.
   * `"measurement"` — relevant dimension not observable by automation.
   * `"none"` — not a false-negative; new concern or preference.
   */
  false_negative_channel: z
    .enum([
      "projection",
      "specification",
      "measurement",
      "none",
    ])
    .optional(),
});

// ── § 3  Top-level — feedback record ──

/**
 * Structured feedback record decomposed into independently dispositioned claims.
 *
 * @remarks
 * Lifecycle: `received` → `processing` → `processed`. A record is
 * `"processed"` when every item has a non-pending disposition.
 * There is no "ignored" state.
 */
const Feedback = z.object({
  id: z.string().min(1),
  title: z.string().min(1).describe("Brief description of the feedback event"),
  date: DateString.describe("When the feedback was processed (not received — see provenance.received)"),

  provenance: FeedbackProvenance,

  items: z.array(FeedbackItem).min(1),

  processed_by: z.string().min(1).describe("Who evaluated the feedback — an actor ref"),
  processing_status: z.enum(["received", "processing", "processed"]),

  /** Estimated reviewer bandwidth consumed [FM §4.8]. */
  verification_cost: z
    .enum(["trivial", "low", "medium", "high", "extensive"])
    .optional()
    .describe("Estimated cost in reviewer bandwidth to process this feedback"),

  triggered_transitions: z
    .array(z.string().min(1))
    .optional()
    .describe("Transition refs created as a result of this feedback"),

  triggered_tensions: z
    .array(z.string().min(1))
    .optional()
    .describe("Tension refs created or updated as a result of this feedback"),

  /** Framework version at time of processing. Dispositions may differ under a later version. */
  framework_version_at_processing: SemVer.optional(),

  ext: z.record(z.string(), z.any()).optional(),
});

// ── § 4  Refinements — cross-field validation ──

/**
 * Feedback record with processing completeness invariant enforced.
 *
 * @remarks
 * Rejects records where `processing_status` is `"processed"` but
 * any item still has a `"pending"` disposition.
 *
 * @example
 * ```ts
 * ProcessedFeedback.parse({
 *   id: "FB-001", title: "API review", date: "2025-01-15",
 *   processed_by: "actor-1", processing_status: "processed",
 *   provenance: { source_id: "r-1", source_authority: "external_reviewer",
 *     received: "2025-01-10", channel: "document_review",
 *     projection_included: ["README.md"] },
 *   items: [{ id: "FBI-01", claim: "Missing error handling",
 *     targets: [{ entity_type: "schema", entity_ref: "feedback" }],
 *     disposition: "accepted", rationale: "Valid: gap in coverage" }],
 * });
 * ```
 */
const ProcessedFeedback = Feedback.refine(
  (data) => {
    if (data.processing_status === "processed") {
      return data.items.every((item) => item.disposition !== "pending");
    }
    return true;
  },
  {
    message:
      'Feedback with processing_status "processed" must have no pending items — every claim requires a disposition',
    path: ["processing_status"],
  }
);

// ── § 5  Structural validators — integrity checks ──

interface FlawEntry {
  criterion: string;
  message: string;
}

/**
 * Validate that every non-pending item has a substantive rationale (≥20 chars).
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Array of flaw entries for items with missing or trivial rationale.
 */
function validateDispositionCompleteness(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  const errors: FlawEntry[] = [];

  for (const item of feedback.items) {
    if (item.disposition === "pending") continue;

    if (!item.rationale || item.rationale.trim().length < 20) {
      errors.push({
        criterion: "FB-RATIONALE",
        message: `${item.id}: disposition is "${item.disposition}" but rationale is missing or trivial (<20 chars) — processing requires substantive engagement`,
      });
    }
  }

  return errors;
}

/**
 * Validate that accepted and partially accepted items have at least one action recorded.
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Array of flaw entries for accepted items missing actions.
 */
function validateAcceptanceActions(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  const errors: FlawEntry[] = [];

  for (const item of feedback.items) {
    if (item.disposition === "accepted" || item.disposition === "partially_accepted") {
      if (!item.actions_taken || item.actions_taken.length === 0) {
        // Exception: no_action_needed is valid when the claim is true
        // but the system already accounts for it.
        errors.push({
          criterion: "FB-ACTION",
          message: `${item.id}: disposition is "${item.disposition}" but no actions_taken recorded — what changed as a result?`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate that refuted items have substantive objections (≥20 chars each).
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Array of flaw entries for refuted items with missing or trivial objections.
 */
function validateRefutationObjections(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  const errors: FlawEntry[] = [];

  for (const item of feedback.items) {
    if (item.disposition === "refuted") {
      if (!item.objections || item.objections.length === 0) {
        errors.push({
          criterion: "FB-OBJECTION",
          message: `${item.id}: refuted without objections — refutation requires stated reasons`,
        });
      }

      for (const obj of item.objections || []) {
        if (obj.trim().length < 20) {
          errors.push({
            criterion: "FB-OBJECTION",
            message: `${item.id}: objection too brief (<20 chars) — engage with the claim's substance`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate that partially accepted items specify both accepted and refuted portions (≥10 chars each).
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Array of flaw entries for items with incomplete partial acceptance splits.
 */
function validatePartialAcceptance(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  const errors: FlawEntry[] = [];

  for (const item of feedback.items) {
    if (item.disposition === "partially_accepted") {
      if (!item.accepted_portion || item.accepted_portion.trim().length < 10) {
        errors.push({
          criterion: "FB-PARTIAL",
          message: `${item.id}: partially_accepted but accepted_portion is missing or trivial — state what part is sound`,
        });
      }
      if (!item.refuted_portion || item.refuted_portion.trim().length < 10) {
        errors.push({
          criterion: "FB-PARTIAL",
          message: `${item.id}: partially_accepted but refuted_portion is missing or trivial — state what part does not hold`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate that deferred items have a rationale and a revisit condition.
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Array of flaw entries for deferred items missing rationale or deadline.
 */
function validateDeferralConditions(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  const errors: FlawEntry[] = [];

  for (const item of feedback.items) {
    if (item.disposition === "deferred") {
      if (!item.defer_rationale || item.defer_rationale.trim().length < 10) {
        errors.push({
          criterion: "FB-DEFER",
          message: `${item.id}: deferred without rationale — why not now?`,
        });
      }
      if (!item.defer_until) {
        errors.push({
          criterion: "FB-DEFER",
          message: `${item.id}: deferred without defer_until — when should this be revisited?`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate that provenance includes projection and artifact reference.
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Array of flaw entries for incomplete provenance fields.
 */
function validateProvenanceCompleteness(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  const errors: FlawEntry[] = [];

  if (feedback.provenance.projection_included.length === 0) {
    errors.push({
      criterion: "FB-PROVENANCE",
      message: "provenance.projection_included is empty — what did the source have access to?",
    });
  }

  if (!feedback.provenance.artifact_ref) {
    errors.push({
      criterion: "FB-PROVENANCE",
      message: "provenance.artifact_ref is missing — the raw feedback should be referenceable",
    });
  }

  return errors;
}

/**
 * Validate that all item IDs within the feedback record are unique.
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Array of flaw entries for duplicate item IDs.
 */
function validateItemIdUniqueness(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  const errors: FlawEntry[] = [];
  const seen = new Set<string>();

  for (const item of feedback.items) {
    if (seen.has(item.id)) {
      errors.push({
        criterion: "FB-INTEGRITY",
        message: `Duplicate feedback item ID: ${item.id}`,
      });
    }
    seen.add(item.id);
  }

  return errors;
}

/**
 * Validate that triggered transitions and tensions are traceable to item actions.
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Array of flaw entries for unmatched triggered references.
 */
function validateTriggeredRefs(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  const errors: FlawEntry[] = [];

  const allActionRefs = new Set<string>();
  for (const item of feedback.items) {
    for (const action of item.actions_taken || []) {
      allActionRefs.add(action.ref);
    }
  }

  for (const ref of feedback.triggered_transitions || []) {
    if (!allActionRefs.has(ref)) {
      errors.push({
        criterion: "FB-TRACEABILITY",
        message: `triggered_transitions references "${ref}" which is not in any item's actions_taken`,
      });
    }
  }

  for (const ref of feedback.triggered_tensions || []) {
    if (!allActionRefs.has(ref)) {
      errors.push({
        criterion: "FB-TRACEABILITY",
        message: `triggered_tensions references "${ref}" which is not in any item's actions_taken`,
      });
    }
  }

  return errors;
}

/**
 * Run all feedback structural validators and aggregate results.
 *
 * @param feedback - Parsed feedback record to validate.
 * @returns Combined array of flaw entries from all validators.
 */
function validateFeedbackIntegrity(feedback: z.infer<typeof Feedback>): FlawEntry[] {
  return [
    ...validateDispositionCompleteness(feedback),
    ...validateAcceptanceActions(feedback),
    ...validateRefutationObjections(feedback),
    ...validatePartialAcceptance(feedback),
    ...validateDeferralConditions(feedback),
    ...validateProvenanceCompleteness(feedback),
    ...validateItemIdUniqueness(feedback),
    ...validateTriggeredRefs(feedback),
  ];
}

// ── § 6  Exports ──

export {
  // Enums
  FeedbackDisposition,
  FeedbackTargetType,
  FeedbackChannel,
  SourceAuthority,
  FeedbackActionType,

  // Sub-schemas
  FeedbackProvenance,
  FeedbackTarget,
  FeedbackAction,
  FeedbackItem,

  // Top-level
  Feedback,
  ProcessedFeedback,

  // Validators
  validateFeedbackIntegrity,
  validateDispositionCompleteness,
  validateAcceptanceActions,
  validateRefutationObjections,
  validatePartialAcceptance,
  validateDeferralConditions,
  validateProvenanceCompleteness,
  validateItemIdUniqueness,
  validateTriggeredRefs,
};
