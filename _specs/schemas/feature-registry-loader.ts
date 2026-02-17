// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Feature Registry Loader
// ─────────────────────────────────────────────────────────────────────────
//
// Define synchronous loading and validation for feature registry metadata and
// feature JSON documents from the configured feature directory.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FeatureRegistrySchema, type FeatureRegistry } from "./feature-schema";

/** Define the metadata filename required in each feature registry directory. */
export const FEATURE_REGISTRY_META_FILE = "registry-meta.json";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseJsonFile = (path: string): unknown => JSON.parse(readFileSync(path, "utf-8"));

/**
 * Load and validate feature registry data from disk.
 *
 * @param featuresDir - Directory containing `registry-meta.json` and feature JSON files.
 * @returns A validated and order-sorted {@link FeatureRegistry}.
 * @throws `Error` If required files are missing or data fails schema validation.
 */
export const loadFeatureRegistrySync = (
  featuresDir: string = resolve(process.cwd(), "_data/features"),
): FeatureRegistry => {
  if (!existsSync(featuresDir)) {
    throw new Error(`Feature directory does not exist: ${featuresDir}`);
  }

  const metaPath = resolve(featuresDir, FEATURE_REGISTRY_META_FILE);
  if (!existsSync(metaPath)) {
    throw new Error(`Missing feature registry metadata file: ${metaPath}`);
  }

  const metaRaw = parseJsonFile(metaPath);
  if (!isObject(metaRaw)) {
    throw new Error(`Invalid JSON object in metadata file: ${metaPath}`);
  }

  const featureFilePaths = readdirSync(featuresDir)
    .filter((name) => name.endsWith(".json") && name !== FEATURE_REGISTRY_META_FILE)
    .sort()
    .map((name) => resolve(featuresDir, name));
  const features = featureFilePaths.map((path) => parseJsonFile(path));

  const candidateRegistry = {
    ...metaRaw,
    features,
  };
  const parsed = FeatureRegistrySchema.safeParse(candidateRegistry);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
        return `${path}: ${issue.message}`;
      })
      .join("\n");
    throw new Error(`Invalid feature registry data in ${featuresDir}\n${details}`);
  }

  return {
    ...parsed.data,
    features: [...parsed.data.features].sort((a, b) => a.order - b.order),
  };
};
