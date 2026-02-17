// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Continuity Journal Schema
// ─────────────────────────────────────────────────────────────────────────
//
// Define structured journal entries that preserve session context, decisions,
// blockers, and handoff data across coding sessions.
// See docs/_specs/schemas/docs/continuity-journal-design.md for design details.

import { z } from "zod/v4";
import { UUIDSchema } from "./common";

// ─────────────────────────────────────────────────────────────────────────
// §1  PRIMITIVES — shared value types
// ─────────────────────────────────────────────────────────────────────────

/** Define the HHMMSchema validation schema. */
export const HHMMSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM in 24-hour format");

/** Define the DurationMinutesSchema validation schema. */
export const DurationMinutesSchema = z
  .number()
  .int()
  .positive();

/** Define the IntensitySchema validation schema. */
export const IntensitySchema = z.enum([
  "minor",
  "moderate",
  "significant",
  "major",
]);

/** Represent Intensity values inferred from the schema layer. */
export type Intensity = z.infer<typeof IntensitySchema>;

// ─────────────────────────────────────────────────────────────────────────
// §2  FILE REFERENCES
// ─────────────────────────────────────────────────────────────────────────

/** Define the FileReferenceSchema validation schema. */
export const FileReferenceSchema = z.object({
  path: z.string(),                                // Relative from project root
  status: z.enum([
    "added",
    "modified",
    "deleted",
    "renamed",
    "reviewed",
  ]).default("modified"),
  previous_path: z.string().optional(),            // Original path if status is "renamed"
  summary: z.string(),
  lines_of_interest: z
    .array(
      z.object({
        range: z.string().regex(/^\d+(-\d+)?$/),   // "42" or "42-78"
        note: z.string(),
      })
    )
    .optional(),
  importance: z.enum([
    "critical",
    "relevant",
    "peripheral",
  ]).default("relevant"),
});

/** Represent FileReference values inferred from the schema layer. */
export type FileReference = z.infer<typeof FileReferenceSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §3  OPEN QUESTIONS
// ─────────────────────────────────────────────────────────────────────────

/** Define the OpenQuestionSchema validation schema. */
export const OpenQuestionSchema = z.object({
  id: UUIDSchema.optional(),                       // Stable ID for cross-session tracking
  question: z.string(),
  domain: z.enum([
    "architecture",
    "implementation",
    "performance",
    "ux",
    "requirements",
    "ops",
    "testing",
    "other",
  ]).optional(),
  context: z.string().optional(),                  // Why this matters or what it blocks
  leaning_toward: z.string().optional(),           // Current gut feeling or tentative answer
  tried_so_far: z.array(z.string()).optional(),    // Approaches already attempted
  resolved_in_session: z.string().optional(),      // If answered, capture resolution here
});

/** Represent OpenQuestion values inferred from the schema layer. */
export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §4  BRANCH STATE
// ─────────────────────────────────────────────────────────────────────────

/** Define the BranchStateSchema validation schema. */
export const BranchStateSchema = z.object({
  name: z.string(),
  base_branch: z.string().optional(),              // "main", "develop", etc.
  has_uncommitted_changes: z.boolean(),
  uncommitted_file_count: z.number().int().nonnegative().optional(),
  last_commit_hash: z
    .string()
    .regex(/^[a-f0-9]{7,40}$/)
    .optional(),                                   // Short or full SHA of HEAD
  last_commit_message: z.string().optional(),
  ahead_behind: z
    .object({
      ahead: z.number().int().nonnegative(),
      behind: z.number().int().nonnegative(),
    })
    .optional(),
});

/** Represent BranchState values inferred from the schema layer. */
export type BranchState = z.infer<typeof BranchStateSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §5  STOP REASON — discriminated union
// ─────────────────────────────────────────────────────────────────────────

/** Variant for when progress is blocked by an external dependency */
export const BlockedStopReasonSchema = z.object({
  type: z.literal("blocked"),
  blocked_by: z.string(),                          // What is blocking progress
  can_unblock_self: z.boolean(),                   // Resolvable without external help?
});

/** Define the StopReasonSchema validation schema. */
export const StopReasonSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("tired"),
    hours_worked: DurationMinutesSchema.optional(),
  }),
  BlockedStopReasonSchema,
  z.object({
    type: z.literal("natural_breakpoint"),
    completed_milestone: z.string().optional(),
  }),
  z.object({
    type: z.literal("time_constraint"),
    had_more_to_do: z.boolean(),                   // Mid-task or clean stop?
  }),
  z.object({
    type: z.literal("context_switch"),
    switching_to: z.string().optional(),
  }),
  z.object({
    type: z.literal("other"),
    detail: z.string(),
  }),
]);

/** Represent StopReason values inferred from the schema layer. */
export type StopReason = z.infer<typeof StopReasonSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §6  NEXT STEPS
// ─────────────────────────────────────────────────────────────────────────

/** Define the NextStepSchema validation schema. */
export const NextStepSchema = z.object({
  id: z.string(),                                  // Short stable ID, e.g. "ns-1"
  description: z.string(),
  priority: z.enum(["do_first", "should_do", "nice_to_have"]),
  estimated_minutes: DurationMinutesSchema.optional(),
  depends_on: z.array(z.string()).optional(),      // IDs of prerequisite steps
  acceptance_criteria: z.string().optional(),      // How to know this step is done
  related_files: z.array(z.string()).optional(),   // File paths for quick navigation
});

/** Represent NextStep values inferred from the schema layer. */
export type NextStep = z.infer<typeof NextStepSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §7  ENVIRONMENT SNAPSHOT — reproducibility context
// ─────────────────────────────────────────────────────────────────────────

/** Define the EnvironmentSnapshotSchema validation schema. */
export const EnvironmentSnapshotSchema = z.object({
  runtime_versions: z
    .record(z.string(), z.string())
    .optional(),                                   // { node: "22.1.0", python: "3.12" }
  significant_dependency_changes: z
    .array(z.string())
    .optional(),                                   // Packages added/removed/upgraded
  env_vars_changed: z
    .array(z.string())
    .optional(),                                   // Names only (not values!)
  tooling_notes: z.string().optional(),            // IDE plugins, CLI tools, config changes
  services_running: z
    .array(z.string())
    .optional(),                                   // Docker containers, databases, etc.
});

/** Represent EnvironmentSnapshot values inferred from the schema layer. */
export type EnvironmentSnapshot = z.infer<typeof EnvironmentSnapshotSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §8  AI HANDOFF CONTEXT
// ─────────────────────────────────────────────────────────────────────────

/** Define the AIHandoffSchema validation schema. */
export const AIHandoffSchema = z.object({
  model_used: z.string().optional(),
  key_prompt_patterns: z
    .array(z.string())
    .optional(),                                   // Prompt strategies that worked well
  anti_patterns: z
    .array(z.string())
    .optional(),                                   // What to avoid next session
  context_window_notes: z.string().optional(),     // Files/docs to load next session
  ongoing_instructions: z.string().optional(),     // Standing instructions for the AI
});

/** Represent AIHandoff values inferred from the schema layer. */
export type AIHandoff = z.infer<typeof AIHandoffSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §9  WEIGHTED OBSERVATIONS — frustrations and wins with intensity
// ─────────────────────────────────────────────────────────────────────────

/** Define the WeightedObservationSchema validation schema. */
export const WeightedObservationSchema = z.object({
  description: z.string(),
  intensity: IntensitySchema,
  recurring: z.boolean().default(false),           // Has this come up before?
});

/** Represent WeightedObservation values inferred from the schema layer. */
export type WeightedObservation = z.infer<typeof WeightedObservationSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §10  JOURNAL ENTRY — main schema
// ─────────────────────────────────────────────────────────────────────────

/** Define the ContinuityJournalEntrySchema validation schema. */
export const ContinuityJournalEntrySchema = z
  .object({
    id: UUIDSchema,
    previous_entry_id: UUIDSchema.optional(),      // Link to prior session's entry
    session_date: z.iso.date(),                    // YYYY-MM-DD
    started_at: HHMMSchema.optional(),
    ended_at: HHMMSchema.optional(),
    session_number: z.number().int().positive().optional(),
    project: z.string(),
    tags: z.array(z.string()).optional(),           // ["auth", "refactor", "bugfix"]

    // ─── Narrative ───
    work_summary: z.string(),
    stopped_because: StopReasonSchema,

    // ─── Mental Context ───
    /**
     * Capture current reasoning state at the stopping point.
     * Record enough detail to resume without re-deriving the same context.
     */
    current_train_of_thought: z.string(),
    /** How you currently understand the system/problem at a high level */
    mental_model_snapshot: z.string().optional(),
    key_decisions_made: z
      .array(
        z.object({
          decision: z.string(),
          reasoning: z.string(),
          alternatives: z.array(z.string()).optional(),
          reversible: z.boolean().default(true),
        })
      )
      .optional(),
    hypotheses: z
      .array(
        z.object({
          claim: z.string(),                       // "the memory leak is in the websocket handler"
          confidence: z.enum(["hunch", "likely", "fairly_certain"]).default("hunch"),
          how_to_verify: z.string().optional(),
        })
      )
      .optional(),

    // ─── Codebase State ───
    files_of_interest: z.array(FileReferenceSchema).optional(),
    branch_state: BranchStateSchema.optional(),
    failing_tests: z
      .array(
        z.object({
          name: z.string(),
          known_reason: z.string().optional(),
          introduced: z.enum(["this_session", "pre_existing"]).default("this_session"),
        })
      )
      .optional(),
    known_bugs: z
      .array(
        z.object({
          description: z.string(),
          severity: z.enum(["cosmetic", "degraded", "broken", "critical"]),
          reproducible: z.boolean().default(true),
          steps_to_reproduce: z.string().optional(),
        })
      )
      .optional(),
    environment: EnvironmentSnapshotSchema.optional(),

    // ─── Forward-Looking ───
    /**
     * Ordered list of what to do next session. The first item should be your
     * re-entry point. Use IDs and depends_on to express ordering constraints.
     */
    next_steps: z.array(NextStepSchema).min(1),
    re_entry_strategy: z.string().optional(),      // How to start the next session
    open_questions: z.array(OpenQuestionSchema).optional(),
    blockers: z
      .array(
        z.object({
          description: z.string(),
          owner: z.string().optional(),            // Who can unblock this
          since: z.iso.date().optional(),
          workaround: z.string().optional(),
        })
      )
      .optional(),

    // ─── Self-Awareness ───
    energy_level: z
      .enum(["high", "medium", "low", "running_on_fumes"])
      .optional(),
    focus_quality: z
      .enum(["deep_flow", "steady", "scattered", "distracted"])
      .optional(),
    frustration_points: z.array(WeightedObservationSchema).optional(),
    wins: z.array(WeightedObservationSchema).optional(),

    // ─── AI Handoff ───
    ai_handoff: AIHandoffSchema.optional(),
  })
  .refine(
    (entry) => {
      if (entry.started_at && entry.ended_at) {
        return entry.ended_at >= entry.started_at;
      }
      return true;
    },
    {
      message: "ended_at must be equal to or later than started_at",
      path: ["ended_at"],
    }
  );

/** Represent ContinuityJournalEntry values inferred from the schema layer. */
export type ContinuityJournalEntry = z.infer<
  typeof ContinuityJournalEntrySchema
>;

// ─────────────────────────────────────────────────────────────────────────
// §11  JOURNAL COLLECTION — validates a full journal file
// ─────────────────────────────────────────────────────────────────────────

/** Define the ContinuityJournalSchema validation schema. */
export const ContinuityJournalSchema = z.object({
  version: z.literal("2.0.0"),
  project: z.string(),
  entries: z.array(ContinuityJournalEntrySchema),
});

/** Represent ContinuityJournal values inferred from the schema layer. */
export type ContinuityJournal = z.infer<typeof ContinuityJournalSchema>;
