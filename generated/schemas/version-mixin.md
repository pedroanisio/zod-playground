# Schema Module: version-mixin

Source: `_specs/schemas/version-mixin.ts`

**Overview:** other schemas and provide parse/compare/increment helpers. See docs/_specs/schemas/docs/version-mixin-design.md for architecture notes.

## Companion Design Doc
- [version-mixin-design](../../_specs/schemas/docs/version-mixin-design.md)


## Exported Symbols

### compareSemVer (function)

**Source:** `_specs/schemas/version-mixin.ts:176`

**Summary:** Compare two semantic-version strings.
Build metadata is ignored. Prerelease values have lower precedence than
release versions when major/minor/patch are equal.

#### TSDoc Tags

##### @param

a - First version string.

##### @param

b - Second version string.

##### @returns

`-1` when `a < b`, `0` when equal, and `1` when `a > b`.

##### @throws

`Error` If either input is not valid SemVer.

---

### formatSemVer (function)

**Source:** `_specs/schemas/version-mixin.ts:154`

**Summary:** Format a parsed SemVer object into canonical string form.

#### TSDoc Tags

##### @param

parsed - Structured SemVer value.

##### @returns

Canonical semantic-version string.

---

### incrementSemVer (function)

**Source:** `_specs/schemas/version-mixin.ts:242`

**Summary:** Increment a semantic version by bump type.
Prerelease and build metadata are stripped from the returned version.

#### TSDoc Tags

##### @param

version - Base semantic-version string.

##### @param

bump - Version segment to increment.

##### @returns

Incremented semantic-version string.

##### @throws

`Error` If `version` is not valid SemVer.

---

### ParsedSemVer (type)

**Source:** `_specs/schemas/version-mixin.ts:39`

**Summary:** Represent ParsedSemVer values inferred from the schema layer.

---

### ParsedSemVerSchema (const)

**Source:** `_specs/schemas/version-mixin.ts:30`

**Summary:** Define the ParsedSemVerSchema validation schema.

---

### parseSemVer (function)

**Source:** `_specs/schemas/version-mixin.ts:126`

**Summary:** Parse a SemVer string into structured components.

#### TSDoc Tags

##### @param

version - Candidate semantic-version string.

##### @returns

Parsed SemVer components.

##### @throws

`Error` If `version` is not valid SemVer.

---

### satisfiesRange (function)

**Source:** `_specs/schemas/version-mixin.ts:267`

**Summary:** Check whether a version falls within an inclusive optional range.

#### TSDoc Tags

##### @param

version - Version under test.

##### @param

minVersion - Optional inclusive lower bound.

##### @param

maxVersion - Optional inclusive upper bound.

##### @returns

`true` when the version satisfies the provided bounds.

##### @throws

`Error` If any provided version string is invalid.

---

### VersionChange (type)

**Source:** `_specs/schemas/version-mixin.ts:70`

**Summary:** Represent VersionChange values inferred from the schema layer.

---

### VersionChangeSchema (const)

**Source:** `_specs/schemas/version-mixin.ts:46`

**Summary:** Define the VersionChangeSchema validation schema.

---

### VersionInfo (type)

**Source:** `_specs/schemas/version-mixin.ts:93`

**Summary:** Represent VersionInfo values inferred from the schema layer.

---

### VersionInfoSchema (const)

**Source:** `_specs/schemas/version-mixin.ts:77`

**Summary:** Define the VersionInfoSchema validation schema.

---

### VersionMixin (const)

**Source:** `_specs/schemas/version-mixin.ts:108`

**Summary:** Use via Zod v4 spread syntax:
const MySchema = z.object({
...VersionMixin.shape,
id: UUIDSchema,
name: z.string(),
});

