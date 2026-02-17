# Schema Module: patchable

Source: `_specs/schemas/patchable.ts`

**Overview:** including nested array operations, diff computation, and transactions.



## Exported Symbols

### applyArrayOps (function)

**Source:** `_specs/schemas/patchable.ts:373`

**Summary:** Apply ordered array patch operations to an identified collection.

#### TSDoc Tags

##### @param

current - Current array snapshot.

##### @param

ops - Ordered array operations to apply.

##### @param

patchFn - Item patch function used for update operations.

##### @param

resolve - Resolver that maps symbolic IDs to concrete IDs.

##### @returns

Updated and re-indexed array.

---

### BatchEntry (interface)

**Source:** `_specs/schemas/patchable.ts:35`

**Summary:** One entry in a batch — a labeled patch

---

### BatchEntryResult (type)

**Source:** `_specs/schemas/patchable.ts:43`

**Summary:** Result of one patch within a batch

---

### BatchOptions (interface)

**Source:** `_specs/schemas/patchable.ts:64`

**Summary:** Options controlling batch behavior

---

### BatchResult (interface)

**Source:** `_specs/schemas/patchable.ts:48`

**Summary:** Full batch result

---

### computeDiff (function)

**Source:** `_specs/schemas/patchable.ts:446`

**Summary:** Compute field-level diffs between two object trees.

#### TSDoc Tags

##### @param

original - Original object state.

##### @param

updated - Updated object state.

##### @param

prefix - Optional path prefix for recursive traversal.

##### @returns

Flat list of changed paths with before/after values.

---

### deepMerge (function)

**Source:** `_specs/schemas/patchable.ts:288`

**Summary:** RFC 7396-style deep merge.
- `undefined` → skip
- `null`      → set to null
- object+object → recurse
- everything else → replace

#### TSDoc Tags

##### @param

target - Base object.

##### @param

patch - Partial patch object to merge.

##### @returns

Merged object preserving recursive semantics.

---

### deriveDeepPartial (function)

**Source:** `_specs/schemas/patchable.ts:254`

**Summary:** Derive a deep-partial patch schema from any ZodObject.
- Object fields → recursively deep-partial, then optional
- Discriminated unions → kept as-is but optional (replace variant)
- Arrays → optional (replace semantics)
- Scalars → optional
- Nullable fields → optional + nullable

#### TSDoc Tags

##### @param

schema - Source object schema to transform.

##### @returns

Deep-partial schema suitable for patch payloads.

---

### DiffEntry (type)

**Source:** `_specs/schemas/patchable.ts:17`

**Summary:** A single change record

---

### patchable (function)

**Source:** `_specs/schemas/patchable.ts:588`

**Summary:** ┌─────────────────────────────────────────────────────────┐
│  patchable(schema, config?) → Patchable<TSchema>        │
│                                                         │
│  Wraps any Zod v4 object schema with:                   │
│   • Auto-derived deep-partial patch schema              │
│   • Array patch ops for identified collections          │
│   • Recursive nested patching                           │
│   • Validated apply + diff                              │
└─────────────────────────────────────────────────────────┘

#### TSDoc Tags

##### @example

```ts
import { patchable } from "./patchable";
import { ContentSchema } from "./content";
import { PresentationSchema } from "./presentation";
const PatchableContent = patchable(ContentSchema, {
immutable: ["id", "created_at", "created_by"],
nested: {
sections: {
immutable: ["id"],
identifiedArrays: ["blocks"],
nested: {
blocks: { immutable: ["id"] },
},
},
},
});
const PatchablePresentation = patchable(PresentationSchema, {
immutable: ["id", "created_at", "created_by"],
nested: {
slides: {
immutable: ["id"],
identifiedArrays: ["slot_bindings", "decorations"],
},
},
});
// Apply a targeted patch
const result = PatchableContent.apply(existingContent, {
title: "Updated Title",
sections: [
{ op: "update", id: "sec-1", patch: {
title: "Renamed Section",
blocks: [
{ op: "update", id: "blk-1", patch: { content: { type: "text", alignment: "center" } } },
{ op: "add", item: newBlock },
{ op: "move", id: "blk-3", before_id: "blk-1" },
],
}},
{ op: "remove", id: "sec-old" },
],
});
console.log(result.diff);     // what changed
console.log(result.changed);  // boolean
console.log(result.data);     // fully validated new entity
```

##### @param

schema - Source Zod object schema.

##### @param

config - Patch behavior configuration.

##### @returns

Patchable wrapper exposing patch validation and apply helpers.

---

### Patchable (interface)

**Source:** `_specs/schemas/patchable.ts:474`

**Summary:** Define the Patchable interface contract.

---

### PatchableConfig (interface)

**Source:** `_specs/schemas/patchable.ts:103`

**Summary:** Configuration for the patchable plugin

---

### PatchResult (interface)

**Source:** `_specs/schemas/patchable.ts:24`

**Summary:** Result of applying a patch

---

### transaction (function)

**Source:** `_specs/schemas/patchable.ts:915`

**Summary:** Apply patches across multiple different entities atomically.
If any step fails, ALL entities are rolled back to their originals.

#### TSDoc Tags

##### @example

```ts
const result = transaction([
{
patchable: PatchableContent,
current: existingContent,
patches: { title: "Updated" },
label: "content",
},
{
patchable: PatchablePresentation,
current: existingDeck,
patches: [
{ label: "rename", patch: { title: "New Deck Title" } },
{ label: "reorder", patch: { slides: [{ op: "move", id: "s1", to_order: 0 }] } },
],
label: "presentation",
},
]);
if (result.allSucceeded) {
const [contentResult, deckResult] = result.steps;
// contentResult.result.data  → new Content
// deckResult.result.data     → new Presentation
}
```

##### @param

steps - Ordered cross-entity transaction steps.

##### @returns

Transaction result with per-step outcomes and rollback status.

---

### TransactionResult (interface)

**Source:** `_specs/schemas/patchable.ts:93`

**Summary:** Full cross-entity transaction result

---

### TransactionStep (interface)

**Source:** `_specs/schemas/patchable.ts:76`

**Summary:** One step in a cross-entity transaction

---

### TransactionStepResult (type)

**Source:** `_specs/schemas/patchable.ts:88`

**Summary:** Result of one step in a cross-entity transaction

