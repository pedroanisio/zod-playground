# Schema Module: plan-schema

Source: `_specs/schemas/plan-schema.ts`

**Overview:** Define the operational schema for multi-actor execution plans. This module implements the formal constraint model used by planning workflows.

## Companion Design Doc
- [plan-schema-protocol](../../_specs/schemas/docs/plan-schema-protocol.md)


## Exported Symbols

### AcceptanceCriterion (type)

**Source:** `_specs/schemas/plan-schema.ts:686`

**Summary:** Represent AcceptanceCriterion values inferred from the schema layer.

---

### ActorLifespan (type)

**Source:** `_specs/schemas/plan-schema.ts:642`

**Summary:** Represent ActorLifespan values inferred from the schema layer.

---

### ActorRegistration (type)

**Source:** `_specs/schemas/plan-schema.ts:640`

**Summary:** Represent ActorRegistration values inferred from the schema layer.

---

### BaselineState (type)

**Source:** `_specs/schemas/plan-schema.ts:632`

**Summary:** Represent BaselineState values inferred from the schema layer.

---

### BlastRadiusEntry (type)

**Source:** `_specs/schemas/plan-schema.ts:666`

**Summary:** Represent BlastRadiusEntry values inferred from the schema layer.

---

### ChannelBandwidth (type)

**Source:** `_specs/schemas/plan-schema.ts:648`

**Summary:** Represent ChannelBandwidth values inferred from the schema layer.

---

### CommunicationChannel (type)

**Source:** `_specs/schemas/plan-schema.ts:646`

**Summary:** Represent CommunicationChannel values inferred from the schema layer.

---

### ConcurrencyModel (type)

**Source:** `_specs/schemas/plan-schema.ts:650`

**Summary:** Represent ConcurrencyModel values inferred from the schema layer.

---

### DataSyncRules (type)

**Source:** `_specs/schemas/plan-schema.ts:684`

**Summary:** Represent DataSyncRules values inferred from the schema layer.

---

### Decision (type)

**Source:** `_specs/schemas/plan-schema.ts:678`

**Summary:** Represent Decision values inferred from the schema layer.

---

### ExecutionOrder (type)

**Source:** `_specs/schemas/plan-schema.ts:692`

**Summary:** Represent ExecutionOrder values inferred from the schema layer.

---

### FileChange (type)

**Source:** `_specs/schemas/plan-schema.ts:664`

**Summary:** Represent FileChange values inferred from the schema layer.

---

### FutureWorkItem (type)

**Source:** `_specs/schemas/plan-schema.ts:690`

**Summary:** Represent FutureWorkItem values inferred from the schema layer.

---

### HandoffState (type)

**Source:** `_specs/schemas/plan-schema.ts:674`

**Summary:** Represent HandoffState values inferred from the schema layer.

---

### IntentConstraint (type)

**Source:** `_specs/schemas/plan-schema.ts:654`

**Summary:** Represent IntentConstraint values inferred from the schema layer.

---

### MergeStrategy (type)

**Source:** `_specs/schemas/plan-schema.ts:688`

**Summary:** Represent MergeStrategy values inferred from the schema layer.

---

### MetricThreshold (type)

**Source:** `_specs/schemas/plan-schema.ts:634`

**Summary:** Represent MetricThreshold values inferred from the schema layer.

---

### MigrationPolicy (type)

**Source:** `_specs/schemas/plan-schema.ts:682`

**Summary:** Represent MigrationPolicy values inferred from the schema layer.

---

### Plan (type)

**Source:** `_specs/schemas/plan-schema.ts:618`

**Summary:** Represent Plan values inferred from the schema layer.

---

### PlanInput (type)

**Source:** `_specs/schemas/plan-schema.ts:620`

**Summary:** Represent PlanInput values inferred from the schema layer.

---

### PlanMetadata (type)

**Source:** `_specs/schemas/plan-schema.ts:624`

**Summary:** Represent PlanMetadata values inferred from the schema layer.

---

### PlanSchema (const)

**Source:** `_specs/schemas/plan-schema.ts:591`

**Summary:** Define the PlanSchema validation schema.

---

### PlanStep (type)

**Source:** `_specs/schemas/plan-schema.ts:658`

**Summary:** Represent PlanStep values inferred from the schema layer.

---

### PlanVersionTransition (type)

**Source:** `_specs/schemas/plan-schema.ts:626`

**Summary:** Represent PlanVersionTransition values inferred from the schema layer.

---

### ProblemDefinition (type)

**Source:** `_specs/schemas/plan-schema.ts:628`

**Summary:** Represent ProblemDefinition values inferred from the schema layer.

---

### ReproducibilityContext (type)

**Source:** `_specs/schemas/plan-schema.ts:644`

**Summary:** Represent ReproducibilityContext values inferred from the schema layer.

---

### Resource (type)

**Source:** `_specs/schemas/plan-schema.ts:630`

**Summary:** Represent Resource values inferred from the schema layer.

---

### Reversibility (type)

**Source:** `_specs/schemas/plan-schema.ts:670`

**Summary:** Represent Reversibility values inferred from the schema layer.

---

### Risk (type)

**Source:** `_specs/schemas/plan-schema.ts:676`

**Summary:** Represent Risk values inferred from the schema layer.

---

### ScopeDefinition (type)

**Source:** `_specs/schemas/plan-schema.ts:636`

**Summary:** Represent ScopeDefinition values inferred from the schema layer.

---

### ScopeZone (type)

**Source:** `_specs/schemas/plan-schema.ts:638`

**Summary:** Represent ScopeZone values inferred from the schema layer.

---

### StepResourceRequirements (type)

**Source:** `_specs/schemas/plan-schema.ts:662`

**Summary:** Represent StepResourceRequirements values inferred from the schema layer.

---

### StopCondition (type)

**Source:** `_specs/schemas/plan-schema.ts:672`

**Summary:** Represent StopCondition values inferred from the schema layer.

---

### SyncRule (type)

**Source:** `_specs/schemas/plan-schema.ts:680`

**Summary:** Represent SyncRule values inferred from the schema layer.

---

### TemporalScope (type)

**Source:** `_specs/schemas/plan-schema.ts:652`

**Summary:** Represent TemporalScope values inferred from the schema layer.

---

### validatePlanConsistency (function)

**Source:** `_specs/schemas/plan-schema.ts:993`

**Summary:** Return only hard consistency errors for backward compatibility.

#### TSDoc Tags

##### @param

plan - Parsed plan document to validate.

##### @returns

Array of hard consistency errors.

---

### validateWellFormedness (function)

**Source:** `_specs/schemas/plan-schema.ts:736`

**Summary:** Validate structural and governance constraints for a plan instance.

#### TSDoc Tags

##### @param

plan - Parsed plan document to validate.

##### @returns

Hard errors and warning signals discovered by well-formedness checks.

---

### ValidationBudget (type)

**Source:** `_specs/schemas/plan-schema.ts:660`

**Summary:** Represent ValidationBudget values inferred from the schema layer.

---

### VerificationCheck (type)

**Source:** `_specs/schemas/plan-schema.ts:668`

**Summary:** Represent VerificationCheck values inferred from the schema layer.

---

### VerificationEconomics (type)

**Source:** `_specs/schemas/plan-schema.ts:656`

**Summary:** Represent VerificationEconomics values inferred from the schema layer.

---

### WellFormednessResult (interface)

**Source:** `_specs/schemas/plan-schema.ts:699`

**Summary:** Define the WellFormednessResult interface contract.

