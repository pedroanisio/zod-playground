# Schema Module: feature-registry-loader

Source: `_specs/schemas/feature-registry-loader.ts`

**Overview:** feature JSON documents from the configured feature directory. Define the metadata filename required in each feature registry directory.



## Exported Symbols

### FEATURE_REGISTRY_META_FILE (const)

**Source:** `_specs/schemas/feature-registry-loader.ts:15`

**Summary:** Define the metadata filename required in each feature registry directory.

---

### loadFeatureRegistrySync (const)

**Source:** `_specs/schemas/feature-registry-loader.ts:29`

**Summary:** Load and validate feature registry data from disk.

#### TSDoc Tags

##### @param

featuresDir - Directory containing `registry-meta.json` and feature JSON files.

##### @returns

A validated and order-sorted {@link FeatureRegistry}.

##### @throws

`Error` If required files are missing or data fails schema validation.

