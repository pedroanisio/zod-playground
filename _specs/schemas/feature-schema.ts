// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Feature Registry Schema
// ─────────────────────────────────────────────────────────────────────────
//
// Define feature records, supporting sub-schemas, and AI metadata bindings for
// feature discovery, lifecycle tracking, and registry serialization.

import { z } from "zod/v4";
import { UUIDSchema } from "./common";
import { ai } from "./zod-ai-meta";

// ─────────────────────────────────────────────────────────────────────────
// §1  ENUMS — controlled vocabularies
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureStatusSchema validation schema. */
export const FeatureStatusSchema = z.enum([
  "draft",
  "in_development",
  "feature_flagged",
  "ga",
  "deprecated",
  "removed",
]);

/** Represent FeatureStatus values inferred from the schema layer. */
export type FeatureStatus = z.infer<typeof FeatureStatusSchema>;

/** Define the DependencyTypeSchema validation schema. */
export const DependencyTypeSchema = z.enum(["required", "optional", "conflicts"]);

/** Represent DependencyType values inferred from the schema layer. */
export type DependencyType = z.infer<typeof DependencyTypeSchema>;

/** Define the HintTypeSchema validation schema. */
export const HintTypeSchema = z.enum(["class", "method", "regex"]);

/** Represent HintType values inferred from the schema layer. */
export type HintType = z.infer<typeof HintTypeSchema>;

/** Define the ConfigTypeSchema validation schema. */
export const ConfigTypeSchema = z.enum(["string", "number", "boolean", "json"]);

/** Represent ConfigType values inferred from the schema layer. */
export type ConfigType = z.infer<typeof ConfigTypeSchema>;

/** Define the EntitlementPlanSchema validation schema. */
export const EntitlementPlanSchema = z.enum(["free", "pro", "business", "enterprise"]);

/** Represent EntitlementPlan values inferred from the schema layer. */
export type EntitlementPlan = z.infer<typeof EntitlementPlanSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §2  HINTS — matchers that confirm a file belongs to a feature
// ─────────────────────────────────────────────────────────────────────────

/**
 * A hint is a probe that runs against a file's content to confirm
 * the file is genuinely linked to the feature (not just co-located).
 *
 *  - class:  look for a class declaration by name
 *  - method: look for a method/function declaration by name
 *  - regex:  arbitrary pattern match (stored as string, compiled at runtime)
 */
export const FeatureHintSchema = z.object({
  id: UUIDSchema,
  type: HintTypeSchema,

  /** The value to search for.
   *  - For "class":  the class name, e.g. "UsageCalculator"
   *  - For "method": the function/method name, e.g. "calculateUsage"
   *  - For "regex":  a regex pattern string, e.g. "@feature\\s+billing"
   */
  value: z.string().min(1),

  /** Optional human-readable explanation of why this hint matters. */
  description: z.string().optional(),

  /** If true, the file is only considered linked when ALL hints match.
   *  Defaults to false (any single hint match is enough). */
  required: z.boolean().optional(),

  order: z.number().int().nonnegative(),
});

/** Represent FeatureHint values inferred from the schema layer. */
export type FeatureHint = z.infer<typeof FeatureHintSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §3  FEATURE FILE — a file associated with a feature
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureFileSchema validation schema. */
export const FeatureFileSchema = z.object({
  id: UUIDSchema,
  /** Relative path from repo root, e.g. "src/billing/usage/calculator.ts" */
  path: z.string().min(1),

  /** Language of the file (aids hint matching strategy). */
  language: z.string().optional(),

  /** How this file was associated: manually declared, directory rule, or annotation. */
  source: z.enum(["manual", "directory_rule", "annotation", "auto_detected"]).optional(),

  /** Role this file plays in the feature. */
  role: z.enum([
    "entry_point",
    "implementation",
    "test",
    "config",
    "migration",
    "documentation",
    "types",
    "helper",
  ]).optional(),

  /**
   * Hints that confirm the link between this file and the feature.
   * When present, the tooling should verify at least one hint matches
   * (or all hints marked `required: true`) before considering the link valid.
   */
  hints: z.array(FeatureHintSchema).optional(),

  // ─── Provenance & Change Tracking ───

  /** SHA-256 hash of file content (detects changes without reading full file) */
  contentHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),

  /** File size in bytes (quick change detection before hash computation) */
  sizeBytes: z.number().int().nonnegative().optional(),

  /** Last time this file was scanned/verified to exist and match hints */
  lastScannedAt: z.iso.datetime().optional(),

  /** Who/what last updated this entry */
  lastUpdatedBy: z.enum(["manual", "auto_scan", "git_hook", "ci"]).optional(),

  /** Git commit SHA where this file was last modified (if available) */
  lastCommitSha: z.string().regex(/^[a-f0-9]{40}$/).optional(),

  /** Mutability: can this file entry be auto-updated by scans? */
  mutable: z.boolean().default(true),

  order: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime().optional(),
});

/** Represent FeatureFile values inferred from the schema layer. */
export type FeatureFile = z.infer<typeof FeatureFileSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §4  FEATURE MODULE — directory-level ownership
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureModuleSchema validation schema. */
export const FeatureModuleSchema = z.object({
  id: UUIDSchema,
  /** Directory path (glob-friendly), e.g. "src/billing/usage/**" */
  path: z.string().min(1),

  language: z.string().optional(),

  /** The main export / entry file within this module. */
  entryPoint: z.string().optional(),

  /** Hints applied to ALL files discovered under this module path. */
  hints: z.array(FeatureHintSchema).optional(),

  order: z.number().int().nonnegative(),
});

/** Represent FeatureModule values inferred from the schema layer. */
export type FeatureModule = z.infer<typeof FeatureModuleSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §5  ENTITLEMENT — plan-based feature gating
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureEntitlementSchema validation schema. */
export const FeatureEntitlementSchema = z.object({
  id: UUIDSchema,
  plan: EntitlementPlanSchema,
  enabled: z.boolean().default(true),

  /**
   * Arbitrary limits scoped to the plan, e.g. { maxSeats: 5, rateLimit: 100 }
   * Common keys: maxSeats, maxProjects, rateLimit, storageGB, apiCallsPerMonth
   */
  limits: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .describe("Plan-specific usage limits and quotas")
    .optional(),

  order: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime().optional(),
});

/** Represent FeatureEntitlement values inferred from the schema layer. */
export type FeatureEntitlement = z.infer<typeof FeatureEntitlementSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §6  DEPENDENCY — relationships between features
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureDependencySchema validation schema. */
export const FeatureDependencySchema = z.object({
  id: UUIDSchema,
  /** The key of the feature this depends on. */
  featureKey: z.string().min(1),
  type: DependencyTypeSchema.default("required"),
  description: z.string().optional(),

  order: z.number().int().nonnegative(),
});

/** Represent FeatureDependency values inferred from the schema layer. */
export type FeatureDependency = z.infer<typeof FeatureDependencySchema>;

// ─────────────────────────────────────────────────────────────────────────
// §7  CONFIG KNOB — runtime configuration for features
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureConfigSchema validation schema. */
export const FeatureConfigSchema = z.object({
  id: UUIDSchema,
  key: z.string().min(1),
  type: ConfigTypeSchema,
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  description: z.string().optional(),

  /** Validation constraints for the config value. */
  constraints: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      enumValues: z.array(z.string()).optional(),
    })
    .optional(),

  order: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime().optional(),
});

/** Represent FeatureConfig values inferred from the schema layer. */
export type FeatureConfig = z.infer<typeof FeatureConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §8  EVENT — audit trail for feature changes
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureEventSchema validation schema. */
export const FeatureEventSchema = z.object({
  id: UUIDSchema,
  type: z.enum([
    "status_change",
    "rollout_update",
    "config_change",
    "ownership_change",
    "file_added",
    "file_removed",
    // Auto-update events
    "file_modified",
    "metadata_computed",
    "dependency_detected",
    "tag_auto_added",
    "scan_completed",
  ]),
  actor: z.string().optional(),
  // TODO: Discriminate oldValue/newValue by event type when event shapes stabilize
  // (e.g., status_change → FeatureStatus, config_change → config values)
  oldValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  occurredAt: z.iso.datetime(),
  description: z.string().optional(),

  // ─── Auto-update attribution ───
  /** Whether this event was triggered automatically (vs. manual edit) */
  automated: z.boolean().default(false),

  /** What triggered this event */
  trigger: z.enum(["manual", "auto_scan", "git_hook", "ci"]).optional(),

  /** Git commit SHA associated with this event */
  commitSha: z.string().regex(/^[a-f0-9]{40}$/).optional(),
});

/** Represent FeatureEvent values inferred from the schema layer. */
export type FeatureEvent = z.infer<typeof FeatureEventSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §8.5  MUTABILITY — field-level update control
// ─────────────────────────────────────────────────────────────────────────

/**
 * Controls which fields can be auto-updated by scans vs. require manual edits.
 */
export const FieldMutabilitySchema = z.object({
  /** Which fields can be auto-updated by scans */
  mutableFields: z
    .array(
      z.enum([
        "files", // Auto-discover files matching hints/modules
        "metadata", // Auto-compute test_count, coverage_percent
        "tags", // Auto-derive from file paths or annotations
        "dependencies", // Auto-detect import statements
        "updatedAt", // Always auto-update on change
      ]),
    )
    .default(["files", "metadata", "updatedAt"]),

  /** Which fields are frozen (never auto-update) */
  frozenFields: z.array(z.string()).optional(),

  /** Who can modify frozen fields */
  frozenBy: z.enum(["manual_only", "owner_only", "admin_only"]).optional(),
});

/** Represent FieldMutability values inferred from the schema layer. */
export type FieldMutability = z.infer<typeof FieldMutabilitySchema>;

/**
 * Metadata that is auto-computed from file analysis and test reports.
 * Separate from manually-declared metadata to prevent accidental overwrites.
 */
export const DerivedMetadataSchema = z.object({
  /** Test counts auto-computed from test files */
  testCount: z.number().int().nonnegative().optional(),

  /** Coverage auto-computed from coverage reports */
  coveragePercent: z.number().min(0).max(100).optional(),

  /** Line count auto-summed from implementation files */
  lineCount: z.number().int().nonnegative().optional(),

  /** Last time derived metadata was recomputed */
  lastComputedAt: z.iso.datetime().optional(),

  /** Source of computation (which tool/command) */
  computedBy: z.string().optional(), // e.g., "vitest", "c8", "auto-scan"
});

/** Represent DerivedMetadata values inferred from the schema layer. */
export type DerivedMetadata = z.infer<typeof DerivedMetadataSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §9  FEATURE — root schema for individual features
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureSchema validation schema. */
export const FeatureSchema = z.object({
  // ─── Identity ───
  id: UUIDSchema,
  /** Unique dotted key, e.g. "billing.usage-based-pricing" */
  key: z.string().min(1).regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/),

  name: z.string().min(1),
  description: z.string().optional(),

  // ─── Ordering ───
  order: z.number().int().nonnegative(),

  // ─── Status ───
  status: FeatureStatusSchema.default("draft"),

  /** Dot-separated category derived from key, or overridden. */
  category: z.string().optional(),

  // ─── Ownership ───
  ownerTeam: z.string().optional(),
  ownerContact: z.email().optional(),

  // ─── Lifecycle ───
  introducedAt: z.iso.date().optional(),
  gaAt: z.iso.date().optional(),
  deprecatedAt: z.iso.date().optional(),
  removedAt: z.iso.date().optional(),
  targetVersion: z.string().optional(),

  // ─── Feature flag ───
  flagKey: z.string().optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),

  // ─── Visibility ───
  isPublic: z.boolean().default(true),
  documentationUrl: z.url().optional(),

  // ─── Code mapping ───
  modules: z.array(FeatureModuleSchema).optional(),
  files: z.array(FeatureFileSchema).optional(),

  // ─── Relations ───
  dependencies: z.array(FeatureDependencySchema).optional(),
  entitlements: z.array(FeatureEntitlementSchema).optional(),
  config: z.array(FeatureConfigSchema).optional(),

  // ─── Audit ───
  events: z.array(FeatureEventSchema).optional(),

  // ─── Mutability & Provenance ───
  /** Controls which fields can be auto-updated vs. require manual edits */
  mutability: FieldMutabilitySchema.optional(),

  /** Auto-computed metadata (test counts, coverage, line counts) */
  derivedMetadata: DerivedMetadataSchema.optional(),

  // ─── Metadata ───
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
})
  .refine((f) => f.status !== "ga" || f.gaAt != null, {
    message: "gaAt is required when status is 'ga'",
    path: ["gaAt"],
  })
  .refine((f) => f.status !== "deprecated" || f.deprecatedAt != null, {
    message: "deprecatedAt is required when status is 'deprecated'",
    path: ["deprecatedAt"],
  })
  .refine((f) => f.status !== "removed" || f.removedAt != null, {
    message: "removedAt is required when status is 'removed'",
    path: ["removedAt"],
  });

/** Represent Feature values inferred from the schema layer. */
export type Feature = z.infer<typeof FeatureSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §9.5  SCAN HISTORY — track automated scans
// ─────────────────────────────────────────────────────────────────────────

/**
 * Record of a feature registry scan.
 * Tracks which features/files were scanned, what changed, and performance.
 */
export const ScanHistorySchema = z.object({
  id: UUIDSchema,
  scannedAt: z.iso.datetime(),

  /** Which features were scanned */
  scannedFeatures: z.array(z.string()).optional(), // feature keys

  /** Which files were scanned */
  scannedFiles: z.array(z.string()).optional(), // file paths

  /** Summary of changes detected */
  changes: z
    .object({
      filesAdded: z.number().int().nonnegative(),
      filesRemoved: z.number().int().nonnegative(),
      filesModified: z.number().int().nonnegative(),
      featuresUpdated: z.array(z.string()), // feature keys
    })
    .optional(),

  /** Scan duration in milliseconds */
  durationMs: z.number().int().nonnegative().optional(),

  /** Scan trigger (manual, git hook, CI, cron) */
  trigger: z.enum(["manual", "git_hook", "ci", "cron"]).optional(),
});

/** Represent ScanHistory values inferred from the schema layer. */
export type ScanHistory = z.infer<typeof ScanHistorySchema>;

// ─────────────────────────────────────────────────────────────────────────
// §10  FEATURE REGISTRY — collection of all features
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureRegistrySchema validation schema. */
export const FeatureRegistrySchema = z.object({
  $schema: z.string().optional(),
  version: z.string().default("1.0.0"),
  features: z.array(FeatureSchema),

  // ─── Scan history ───
  /** History of automated scans (keep last 50) */
  scanHistory: z.array(ScanHistorySchema).max(50).optional(),

  /** Last scan metadata */
  lastScannedAt: z.iso.datetime().optional(),
  lastScanTrigger: z.enum(["manual", "git_hook", "ci", "cron"]).optional(),
});

/** Represent FeatureRegistry values inferred from the schema layer. */
export type FeatureRegistry = z.infer<typeof FeatureRegistrySchema>;

// ─────────────────────────────────────────────────────────────────────────
// §11  AI AGENT METADATA — teaching agents how to generate and operate
// ─────────────────────────────────────────────────────────────────────────

// ── Feature.key ──
ai(FeatureSchema.shape.key)
  .instruct("Unique dotted identifier following semantic hierarchy (category.subcategory.feature)")
  .generate("Use lowercase letters and numbers, with dots separating semantic levels")
  .example("billing.usage-based-pricing", "auth.oauth.google", "notifications.email.templates")
  .antipattern("BillingUsage", "billing_usage", "billing-usage", "Billing.Usage", "billing")
  .always("Format: lowercase, dots for hierarchy, hyphens within segments, 2-5 levels deep")
  .priority("critical")
  .semantic("feature_identifier")
  .boundary("2-5 segments separated by dots, each segment 2-20 chars")
  .whenMissing("ask_user");

// ── Feature.status ──
ai(FeatureSchema.shape.status)
  .instruct("Current lifecycle stage of the feature")
  .generate("New features start as 'draft', move to 'in_development' during build, 'feature_flagged' during rollout, 'ga' for general availability")
  .update("When transitioning to 'deprecated', set deprecatedAt timestamp")
  .update("When transitioning to 'ga', set gaAt timestamp and rolloutPercent to 100")
  .update("When transitioning to 'removed', set removedAt timestamp")
  .always("Status transitions must follow the lifecycle: draft → in_development → feature_flagged → ga → deprecated → removed")
  .priority("high")
  .dependsOn("FeatureSchema.gaAt", "Must be set when status is 'ga'")
  .dependsOn("FeatureSchema.deprecatedAt", "Must be set when status is 'deprecated'");

// ── Feature.rolloutPercent ──
ai(FeatureSchema.shape.rolloutPercent)
  .instruct("Percentage of users receiving this feature (0-100, integers only)")
  .generate("Start at 0-5% for canary releases, increase gradually (e.g., 5 → 25 → 50 → 100)")
  .update("Only increase in increments, never decrease without explicit rollback intent")
  .example(0, 5, 25, 50, 100)
  .antipattern(-1, 101, 33.333, 50.5)
  .validate("Must be integer between 0-100")
  .priority("medium")
  .semantic("percentage_integer")
  .whenMissing("use_default");

// ── Feature.ownerContact ──
ai(FeatureSchema.shape.ownerContact)
  .instruct("Email address of the feature owner or team lead")
  .generate("Use corporate email format")
  .example("alice@company.com", "team-leads@company.com")
  .antipattern("alice", "alice@", "alice.smith")
  .priority("medium")
  .semantic("email")
  .whenMissing("infer_from_context");

// ── Feature.documentationUrl ──
ai(FeatureSchema.shape.documentationUrl)
  .instruct("URL to feature documentation (design doc, RFC, wiki page)")
  .generate("Prefer internal wiki or docs site URLs")
  .example("https://docs.company.com/features/billing-usage", "https://wiki.company.com/Features/AuthOAuth")
  .priority("low")
  .semantic("url")
  .whenMissing("skip");

// ── FeatureDependency.featureKey ──
ai(FeatureDependencySchema.shape.featureKey)
  .instruct("The dotted key of another feature this one depends on")
  .generate("Must reference an existing feature's key")
  .validate("Referenced feature must exist in the registry")
  .example("auth.session-management", "billing.payment-processing")
  .priority("high")
  .semantic("feature_reference")
  .boundary("Must match the format of Feature.key")
  .whenMissing("ask_user");

// ── FeatureFile.path ──
ai(FeatureFileSchema.shape.path)
  .instruct("Relative path from repository root to a file belonging to this feature")
  .generate("Use forward slashes, include file extension")
  .example("src/billing/usage/calculator.ts", "tests/auth/oauth/google.test.ts")
  .antipattern("/src/billing/usage.ts", "src\\billing\\usage.ts", "billing/usage")
  .priority("medium")
  .semantic("file_path")
  .boundary("Relative path with forward slashes, must have file extension");

// ── FeatureModule.path ──
ai(FeatureModuleSchema.shape.path)
  .instruct("Directory path (glob-friendly) owning all files in this module")
  .generate("Use forward slashes, support glob patterns like ** for recursive matching")
  .example("src/billing/usage/**", "src/auth/oauth/**/*.ts", "tests/billing/**")
  .priority("medium")
  .semantic("directory_glob")
  .boundary("Relative directory path with optional glob patterns");

// ── FeatureConfig.key ──
ai(FeatureConfigSchema.shape.key)
  .instruct("Configuration key name (environment variable or config file key)")
  .generate("Use UPPER_SNAKE_CASE for environment variables, lowercase for config files")
  .example("BILLING_USAGE_THRESHOLD", "auth.oauth.client_id", "MAX_CONCURRENT_REQUESTS")
  .priority("medium")
  .semantic("config_key")
  .boundary("Alphanumeric with underscores or dots");

// ── FeatureConfig.type ──
ai(FeatureConfigSchema.shape.type)
  .instruct("Data type of the configuration value")
  .generate("Choose based on the value: 'string' for text, 'number' for integers/floats, 'boolean' for flags, 'json' for complex objects")
  .always("If constraints.pattern exists, type must be 'string'")
  .always("If constraints.enumValues exists, type must be 'string'")
  .priority("high")
  .dependsOn("FeatureConfig.constraints", "Validation constraints must match the type");

// ── FeatureHint.value ──
ai(FeatureHintSchema.shape.value)
  .instruct("The pattern to search for in file content (class name, method name, or regex)")
  .generate("For type='class': use PascalCase class name. For type='method': use camelCase or snake_case. For type='regex': use valid regex syntax")
  .example("UsageCalculator", "calculateUsage", "@feature\\s+billing")
  .priority("medium")
  .semantic("search_pattern")
  .dependsOn("FeatureHint.type", "Pattern format depends on hint type");

// ── Feature.tags ──
ai(FeatureSchema.shape.tags)
  .instruct("Free-form tags for categorization and search (e.g., 'billing', 'enterprise', 'v2')")
  .generate("Use lowercase, single words or hyphenated phrases")
  .example(["billing", "enterprise-only", "experimental", "v2"])
  .antipattern(["Billing", "Enterprise Only", "EXPERIMENTAL"])
  .priority("low")
  .semantic("tag_array")
  .whenMissing("skip");
