# Schema Module: mental-model-schema

Source: `_specs/schemas/mental-model-schema.ts`

**Overview:** assumptions, and open questions before generating a formal execution plan. so the human can evaluate whether the model addresses it.



## Exported Symbols

### MentalModel (type)

**Source:** `_specs/schemas/mental-model-schema.ts:424`

**Summary:** Represent MentalModel values inferred from the schema layer.

---

### MentalModelSchema (const)

**Source:** `_specs/schemas/mental-model-schema.ts:391`

**Summary:** Define the MentalModelSchema validation schema.

---

### MentalModelValidationResult (interface)

**Source:** `_specs/schemas/mental-model-schema.ts:431`

**Summary:** Define the MentalModelValidationResult interface contract.

---

### validateMentalModel (function)

**Source:** `_specs/schemas/mental-model-schema.ts:453`

**Summary:** Validate a mental model's internal consistency and readiness.
A mental model is "ready-for-plan" only when:
- No open questions remain
- No open decisions remain
- No unverified entities exist
- Overall confidence is "high"
This is intentionally strict. The whole point is to force resolution
BEFORE plan generation, not during.

#### TSDoc Tags

##### @param

model - Mental model document to validate.

##### @returns

Validation result with structural errors, readiness warnings, and status.

