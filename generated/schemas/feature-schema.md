# Schema Module: feature-schema

Source: `_specs/schemas/feature-schema.ts`

**Overview:** feature discovery, lifecycle tracking, and registry serialization. Define the FeatureStatusSchema validation schema.



## Exported Symbols

### ConfigType (type)

**Source:** `_specs/schemas/feature-schema.ts:47`

**Summary:** Represent ConfigType values inferred from the schema layer.

---

### ConfigTypeSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:44`

**Summary:** Define the ConfigTypeSchema validation schema.

---

### DependencyType (type)

**Source:** `_specs/schemas/feature-schema.ts:35`

**Summary:** Represent DependencyType values inferred from the schema layer.

---

### DependencyTypeSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:32`

**Summary:** Define the DependencyTypeSchema validation schema.

---

### DerivedMetadata (type)

**Source:** `_specs/schemas/feature-schema.ts:346`

**Summary:** Represent DerivedMetadata values inferred from the schema layer.

---

### DerivedMetadataSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:328`

**Summary:** Metadata that is auto-computed from file analysis and test reports.
Separate from manually-declared metadata to prevent accidental overwrites.

---

### EntitlementPlan (type)

**Source:** `_specs/schemas/feature-schema.ts:53`

**Summary:** Represent EntitlementPlan values inferred from the schema layer.

---

### EntitlementPlanSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:50`

**Summary:** Define the EntitlementPlanSchema validation schema.

---

### Feature (type)

**Source:** `_specs/schemas/feature-schema.ts:429`

**Summary:** Represent Feature values inferred from the schema layer.

---

### FeatureConfig (type)

**Source:** `_specs/schemas/feature-schema.ts:248`

**Summary:** Represent FeatureConfig values inferred from the schema layer.

---

### FeatureConfigSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:226`

**Summary:** Define the FeatureConfigSchema validation schema.

---

### FeatureDependency (type)

**Source:** `_specs/schemas/feature-schema.ts:219`

**Summary:** Represent FeatureDependency values inferred from the schema layer.

---

### FeatureDependencySchema (const)

**Source:** `_specs/schemas/feature-schema.ts:208`

**Summary:** Define the FeatureDependencySchema validation schema.

---

### FeatureEntitlement (type)

**Source:** `_specs/schemas/feature-schema.ts:201`

**Summary:** Represent FeatureEntitlement values inferred from the schema layer.

---

### FeatureEntitlementSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:182`

**Summary:** Define the FeatureEntitlementSchema validation schema.

---

### FeatureEvent (type)

**Source:** `_specs/schemas/feature-schema.ts:291`

**Summary:** Represent FeatureEvent values inferred from the schema layer.

---

### FeatureEventSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:255`

**Summary:** Define the FeatureEventSchema validation schema.

---

### FeatureFile (type)

**Source:** `_specs/schemas/feature-schema.ts:151`

**Summary:** Represent FeatureFile values inferred from the schema layer.

---

### FeatureFileSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:96`

**Summary:** Define the FeatureFileSchema validation schema.

---

### FeatureHint (type)

**Source:** `_specs/schemas/feature-schema.ts:89`

**Summary:** Represent FeatureHint values inferred from the schema layer.

---

### FeatureHintSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:67`

**Summary:** A hint is a probe that runs against a file's content to confirm
the file is genuinely linked to the feature (not just co-located).
- class:  look for a class declaration by name
- method: look for a method/function declaration by name
- regex:  arbitrary pattern match (stored as string, compiled at runtime)

---

### FeatureModule (type)

**Source:** `_specs/schemas/feature-schema.ts:175`

**Summary:** Represent FeatureModule values inferred from the schema layer.

---

### FeatureModuleSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:158`

**Summary:** Define the FeatureModuleSchema validation schema.

---

### FeatureRegistry (type)

**Source:** `_specs/schemas/feature-schema.ts:489`

**Summary:** Represent FeatureRegistry values inferred from the schema layer.

---

### FeatureRegistrySchema (const)

**Source:** `_specs/schemas/feature-schema.ts:474`

**Summary:** Define the FeatureRegistrySchema validation schema.

---

### FeatureSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:353`

**Summary:** Define the FeatureSchema validation schema.

---

### FeatureStatus (type)

**Source:** `_specs/schemas/feature-schema.ts:29`

**Summary:** Represent FeatureStatus values inferred from the schema layer.

---

### FeatureStatusSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:19`

**Summary:** Define the FeatureStatusSchema validation schema.

---

### FieldMutability (type)

**Source:** `_specs/schemas/feature-schema.ts:322`

**Summary:** Represent FieldMutability values inferred from the schema layer.

---

### FieldMutabilitySchema (const)

**Source:** `_specs/schemas/feature-schema.ts:300`

**Summary:** Controls which fields can be auto-updated by scans vs. require manual edits.

---

### HintType (type)

**Source:** `_specs/schemas/feature-schema.ts:41`

**Summary:** Represent HintType values inferred from the schema layer.

---

### HintTypeSchema (const)

**Source:** `_specs/schemas/feature-schema.ts:38`

**Summary:** Define the HintTypeSchema validation schema.

---

### ScanHistory (type)

**Source:** `_specs/schemas/feature-schema.ts:467`

**Summary:** Represent ScanHistory values inferred from the schema layer.

---

### ScanHistorySchema (const)

**Source:** `_specs/schemas/feature-schema.ts:439`

**Summary:** Record of a feature registry scan.
Tracks which features/files were scanned, what changed, and performance.

