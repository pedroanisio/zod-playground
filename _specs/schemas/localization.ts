// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Localization Schema
// ─────────────────────────────────────────────────────────────────────────
//
import { z } from "zod/v4";

// ─────────────────────────────────────────────────────────────────────────
// Localization & Internationalization — i18n configuration schemas
// ─────────────────────────────────────────────────────────────────────────
//
// Defines locale settings, pluralization strategies, date/number formatting,
// and string interpolation patterns. Attach via LocalizationMixin to any
// site or content schema for multi-language support.

// ─────────────────────────────────────────────────────────────────────────
// §1  PLURALIZATION — count-based text rules
// ─────────────────────────────────────────────────────────────────────────

/** Define the PluralizationConfigSchema validation schema. */
export const PluralizationConfigSchema = z.object({
  strategy: z.enum(["zero-one-other", "one-other", "ordinal", "custom"]),
  customRules: z.record(z.string(), z.array(z.string())).optional(),
});

/** Represent PluralizationConfig values inferred from the schema layer. */
export type PluralizationConfig = z.infer<typeof PluralizationConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §2  INTERPOLATION — variable insertion syntax
// ─────────────────────────────────────────────────────────────────────────

/** Define the InterpolationConfigSchema validation schema. */
export const InterpolationConfigSchema = z.object({
  pattern: z.enum(["braces", "doubleBraces", "percent", "dollar"]),
  syntax: z.string(),                              // "{name}", "{{name}}", "%{name}", "${name}"
});

/** Represent InterpolationConfig values inferred from the schema layer. */
export type InterpolationConfig = z.infer<typeof InterpolationConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §3  LOCALIZATION CONFIG — complete i18n settings
// ─────────────────────────────────────────────────────────────────────────

/** Define the LocalizationConfigSchema validation schema. */
export const LocalizationConfigSchema = z.object({
  defaultLocale: z.string(),                       // "en-US"
  supportedLocales: z.array(z.string()).min(1),     // ["en-US", "pt-BR", "ja-JP"]
  fallbackStrategy: z.enum(["default", "key", "empty"]),
  rtlSupport: z.boolean(),
  pluralization: PluralizationConfigSchema,
  dateTimeFormat: z.object({
    short: z.string(),                             // "MM/DD/YYYY"
    medium: z.string(),                            // "MMM D, YYYY"
    long: z.string(),                              // "MMMM D, YYYY h:mm A"
    relative: z.boolean(),                         // "2 hours ago" style
  }),
  numberFormat: z.object({
    decimal: z.string(),                           // "." or ","
    thousand: z.string(),                          // "," or "."
    currency: z.string(),                          // "USD", "EUR", "BRL"
  }),
  interpolation: InterpolationConfigSchema,
});

/** Represent LocalizationConfig values inferred from the schema layer. */
export type LocalizationConfig = z.infer<typeof LocalizationConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────
// §4  MIXIN — attach localization config to any schema
// ─────────────────────────────────────────────────────────────────────────

/** Define the LocalizationMixin mixin schema. */
export const LocalizationMixin = z.object({
  localization: LocalizationConfigSchema.optional(),
});
