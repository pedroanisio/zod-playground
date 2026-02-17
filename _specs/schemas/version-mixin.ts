// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Version Mixin
// ─────────────────────────────────────────────────────────────────────────
//
// Define semver-aware schemas and utilities that attach version metadata to
// other schemas and provide parse/compare/increment helpers.
// See docs/_specs/schemas/docs/version-mixin-design.md for architecture notes.

import { z } from "zod/v4";
import {
  SemVerSchema,
  DateTimeSchema,
  ProvenanceSourceSchema,
  RiskLevelSchema,
  ImpactSeveritySchema,
  CoverageLevelSchema,
} from "./common";

// Re-export for convenience — consumers can import from either location
/** Re-export SemVerSchema for schema consumers. */
export { SemVerSchema } from "./common";

// ─────────────────────────────────────────────────────────────────────────
// §1  PARSED SEMVER — structured representation
// ─────────────────────────────────────────────────────────────────────────

/** Define the ParsedSemVerSchema validation schema. */
export const ParsedSemVerSchema = z.object({
  major: z.number().int().nonnegative(),
  minor: z.number().int().nonnegative(),
  patch: z.number().int().nonnegative(),
  prerelease: z.string().optional(),
  build: z.string().optional(),
});

/** Represent ParsedSemVer values inferred from the schema layer. */
export type ParsedSemVer = z.infer<typeof ParsedSemVerSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §2  VERSION CHANGE — Keep a Changelog entry types
// ─────────────────────────────────────────────────────────────────────────

/** Define the VersionChangeSchema validation schema. */
export const VersionChangeSchema = z.object({
  type: z.enum([
    "added",       // new features
    "changed",     // changes in existing functionality
    "deprecated",  // soon-to-be removed features
    "removed",     // removed features
    "fixed",       // bug fixes
    "security",    // vulnerability fixes
  ]),
  description: z.string(),
  breaking: z.boolean().default(false),
  traceability: z
    .object({
      source: ProvenanceSourceSchema.optional(),
      risk: RiskLevelSchema.optional(),
      severity: ImpactSeveritySchema.optional(),
      coverage: CoverageLevelSchema.optional(),
      evidence: z.string().optional(),
      references: z.array(z.string()).optional(),
    })
    .optional(),
});

/** Represent VersionChange values inferred from the schema layer. */
export type VersionChange = z.infer<typeof VersionChangeSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §3  VERSION INFO — full version metadata
// ─────────────────────────────────────────────────────────────────────────

/** Define the VersionInfoSchema validation schema. */
export const VersionInfoSchema = z.object({
  version: SemVerSchema,
  releaseDate: DateTimeSchema.optional(),
  label: z.string().optional(),                            // "GA", "Beta", "v1.2"
  changelog: z.array(VersionChangeSchema).optional(),
  compatibility: z
    .object({
      minVersion: SemVerSchema.optional(),                 // minimum compatible version
      maxVersion: SemVerSchema.optional(),                 // maximum compatible version
    })
    .optional(),
  deprecated: z.boolean().default(false),
  deprecationMessage: z.string().optional(),
});

/** Represent VersionInfo values inferred from the schema layer. */
export type VersionInfo = z.infer<typeof VersionInfoSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §4  VERSION MIXIN — spread into any schema
// ─────────────────────────────────────────────────────────────────────────

/**
 * Use via Zod v4 spread syntax:
 *
 *   const MySchema = z.object({
 *     ...VersionMixin.shape,
 *     id: UUIDSchema,
 *     name: z.string(),
 *   });
 */
export const VersionMixin = z.object({
  semver: VersionInfoSchema.optional(),
});

// ─────────────────────────────────────────────────────────────────────────
// §5  UTILITIES — parse, format, compare, increment, range check
// ─────────────────────────────────────────────────────────────────────────

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Parse a SemVer string into structured components.
 *
 * @param version - Candidate semantic-version string.
 * @returns Parsed SemVer components.
 * @throws `Error` If `version` is not valid SemVer.
 */
export function parseSemVer(version: string): ParsedSemVer {
  const match = version.match(SEMVER_RE);
  if (!match) {
    throw new Error(`Invalid SemVer string: "${version}"`);
  }

  const result: ParsedSemVer = {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };

  if (match[4] !== undefined) {
    result.prerelease = match[4];
  }
  if (match[5] !== undefined) {
    result.build = match[5];
  }

  return result;
}

/**
 * Format a parsed SemVer object into canonical string form.
 *
 * @param parsed - Structured SemVer value.
 * @returns Canonical semantic-version string.
 */
export function formatSemVer(parsed: ParsedSemVer): string {
  let version = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  if (parsed.prerelease) {
    version += `-${parsed.prerelease}`;
  }
  if (parsed.build) {
    version += `+${parsed.build}`;
  }
  return version;
}

/**
 * Compare two semantic-version strings.
 *
 * Build metadata is ignored. Prerelease values have lower precedence than
 * release versions when major/minor/patch are equal.
 *
 * @param a - First version string.
 * @param b - Second version string.
 * @returns `-1` when `a < b`, `0` when equal, and `1` when `a > b`.
 * @throws `Error` If either input is not valid SemVer.
 */
export function compareSemVer(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemVer(a);
  const pb = parseSemVer(b);

  // Compare major.minor.patch
  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;

  // Both have same M.m.p — compare prerelease
  const aPre = pa.prerelease;
  const bPre = pb.prerelease;

  // No prerelease on either → equal
  if (aPre === undefined && bPre === undefined) return 0;
  // Release > prerelease
  if (aPre === undefined) return 1;
  if (bPre === undefined) return -1;

  // Compare prerelease identifiers dot-separated
  const aIds = aPre.split(".");
  const bIds = bPre.split(".");
  const len = Math.min(aIds.length, bIds.length);

  for (let i = 0; i < len; i++) {
    const aId = aIds[i];
    const bId = bIds[i];
    if (aId === undefined || bId === undefined) {
      continue;
    }

    const aNum = /^\d+$/.test(aId);
    const bNum = /^\d+$/.test(bId);

    if (aNum && bNum) {
      // Both numeric → compare as integers
      const diff = Number(aId) - Number(bId);
      if (diff !== 0) return diff > 0 ? 1 : -1;
    } else if (aNum !== bNum) {
      // Numeric < string per SemVer spec §11.4.4
      return aNum ? -1 : 1;
    } else {
      // Both strings → lexicographic
      if (aId < bId) return -1;
      if (aId > bId) return 1;
    }
  }

  // Shorter prerelease set < longer
  if (aIds.length !== bIds.length) {
    return aIds.length > bIds.length ? 1 : -1;
  }

  return 0;
}

/**
 * Increment a semantic version by bump type.
 *
 * Prerelease and build metadata are stripped from the returned version.
 *
 * @param version - Base semantic-version string.
 * @param bump - Version segment to increment.
 * @returns Incremented semantic-version string.
 * @throws `Error` If `version` is not valid SemVer.
 */
export function incrementSemVer(
  version: string,
  bump: "major" | "minor" | "patch",
): string {
  const parsed = parseSemVer(version);

  switch (bump) {
    case "major":
      return `${parsed.major + 1}.0.0`;
    case "minor":
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case "patch":
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
}

/**
 * Check whether a version falls within an inclusive optional range.
 *
 * @param version - Version under test.
 * @param minVersion - Optional inclusive lower bound.
 * @param maxVersion - Optional inclusive upper bound.
 * @returns `true` when the version satisfies the provided bounds.
 * @throws `Error` If any provided version string is invalid.
 */
export function satisfiesRange(
  version: string,
  minVersion?: string,
  maxVersion?: string,
): boolean {
  if (minVersion !== undefined && compareSemVer(version, minVersion) < 0) {
    return false;
  }
  if (maxVersion !== undefined && compareSemVer(version, maxVersion) > 0) {
    return false;
  }
  return true;
}
