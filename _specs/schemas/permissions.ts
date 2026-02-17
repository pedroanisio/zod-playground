// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Permissions Schema
// ─────────────────────────────────────────────────────────────────────────
//
import { z } from "zod/v4";

// ─────────────────────────────────────────────────────────────────────────
// Permissions & Entitlements — RBAC model for CMS/SaaS authorization
// ─────────────────────────────────────────────────────────────────────────
//
// Defines roles, permissions, feature entitlements, data scopes, and UI
// behaviors for authorization. Used by site-schema and AI agents to
// enforce access control and generate permission-aware content.

// ─────────────────────────────────────────────────────────────────────────
// §1  DATA SCOPE — visibility boundaries
// ─────────────────────────────────────────────────────────────────────────

/** Define the DataScopeSchema validation schema. */
export const DataScopeSchema = z.enum(["own", "team", "org", "global"]);
/** Represent DataScope values inferred from the schema layer. */
export type DataScope = z.infer<typeof DataScopeSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §2  ROLE DEFINITION — named roles with inheritance
// ─────────────────────────────────────────────────────────────────────────

/** Define the RoleDefinitionSchema validation schema. */
export const RoleDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  inheritsFrom: z.array(z.string()).optional(),    // parent role IDs
  isDefault: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

/** Represent RoleDefinition values inferred from the schema layer. */
export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §3  PERMISSION DEFINITION — named permissions grouped by category
// ─────────────────────────────────────────────────────────────────────────

/** Define the PermissionDefinitionSchema validation schema. */
export const PermissionDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),                            // "content", "admin", "billing", etc.
  description: z.string().optional(),
});

/** Represent PermissionDefinition values inferred from the schema layer. */
export type PermissionDefinition = z.infer<typeof PermissionDefinitionSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §4  FEATURE ENTITLEMENT — plan-gated features
// ─────────────────────────────────────────────────────────────────────────

/** Define the FeatureEntitlementSchema validation schema. */
export const FeatureEntitlementSchema = z.object({
  feature: z.string(),                             // "custom_domains", "api_access"
  plans: z.array(z.string()),                      // ["pro", "enterprise"]
  limits: z.record(z.string(), z.number()).optional(), // { "api_calls": 10000 }
  upsellMessage: z.string().optional(),            // "Upgrade to Pro for custom domains"
  gracePeriod: z.number().int().nonnegative().optional(), // days after downgrade
});

/** Represent FeatureEntitlement values inferred from the schema layer. */
export type FeatureEntitlement = z.infer<typeof FeatureEntitlementSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §5  DATA SCOPE RULE — per-entity visibility
// ─────────────────────────────────────────────────────────────────────────

/** Define the DataScopeRuleSchema validation schema. */
export const DataScopeRuleSchema = z.object({
  entity: z.string(),                              // "page", "section", "asset"
  scope: DataScopeSchema,
  conditions: z.array(z.string()).optional(),      // additional constraints
});

/** Represent DataScopeRule values inferred from the schema layer. */
export type DataScopeRule = z.infer<typeof DataScopeRuleSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §6  UI BEHAVIOR — how the UI responds to denied permissions
// ─────────────────────────────────────────────────────────────────────────

/** Define the PermissionUIBehaviorSchema validation schema. */
export const PermissionUIBehaviorSchema = z.object({
  hiddenWhenDenied: z.boolean(),                   // hide element entirely
  disabledWhenDenied: z.boolean(),                 // show but disable
  showUpgradePrompt: z.boolean(),                  // show upsell
  tooltipWhenDenied: z.string().optional(),        // "Upgrade to edit"
});

/** Represent PermissionUIBehavior values inferred from the schema layer. */
export type PermissionUIBehavior = z.infer<typeof PermissionUIBehaviorSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §7  PERMISSIONS MODEL — complete RBAC configuration
// ─────────────────────────────────────────────────────────────────────────

/** Define the PermissionsModelSchema validation schema. */
export const PermissionsModelSchema = z.object({
  roles: z.array(RoleDefinitionSchema),
  permissions: z.array(PermissionDefinitionSchema),
  rolePermissionMatrix: z.record(z.string(), z.array(z.string())), // roleId → permissionIds
  featureEntitlements: z.array(FeatureEntitlementSchema),
  dataScopes: z.array(DataScopeRuleSchema),
  uiBehaviors: z.record(z.string(), PermissionUIBehaviorSchema),
});

/** Represent PermissionsModel values inferred from the schema layer. */
export type PermissionsModel = z.infer<typeof PermissionsModelSchema>;
