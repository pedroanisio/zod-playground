# Schema Module: prompt-schema

Source: `_specs/schemas/prompt-schema.ts`

**Overview:** discriminated union. references, and migration guide.



## Exported Symbols

### CallSpec (type)

**Source:** `_specs/schemas/prompt-schema.ts:786`

**Summary:** Validated single-call specification, inferred from {@link CallSpecSchema}.

---

### CallSpecSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:268`

**Summary:** Define everything that goes into a single API call.

#### TSDoc Tags

##### @remarks

Compilation target: given a CallSpec and variable bindings, a runtime
deterministically produces an Anthropic Messages API request body.
A bidirectional refinement ensures every `{{var}}` in `userTemplate`
is declared, and every required variable is referenced.
See docs/prompt-schema.md for full compilation semantics.

---

### chainedExample (const)

**Source:** `_specs/schemas/prompt-schema.ts:1011`

**Summary:** Type-checked example of recursive chain composition.

---

### ChainOfThoughtSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:235`

**Summary:** Chain-of-Thought: elicit step-by-step reasoning.

---

### ContextConfig (type)

**Source:** `_specs/schemas/prompt-schema.ts:809`

**Summary:** Validated context engineering config, inferred from {@link ContextConfigSchema}.

---

### ContextConfigSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:423`

**Summary:** Validate full context engineering configuration.

#### TSDoc Tags

##### @remarks

Token budget refinement ensures the sum of sub-budgets does not
exceed the total when all are specified.

---

### Evaluation (type)

**Source:** `_specs/schemas/prompt-schema.ts:821`

**Summary:** Validated evaluation criteria set, inferred from {@link EvaluationSchema}.

---

### EvaluationSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:680`

**Summary:** Validate evaluation criteria and optional reference outputs.

#### TSDoc Tags

##### @remarks

Weights are relative (normalized by the consumer). When all
criteria specify weights, they must sum to ~1.0 (±0.01).
Partial weighting (some criteria without weights) is valid.

---

### Example (type)

**Source:** `_specs/schemas/prompt-schema.ts:797`

**Summary:** Validated few-shot example pair, inferred from {@link ExampleSchema}.

---

### examplePromptDocument (const)

**Source:** `_specs/schemas/prompt-schema.ts:861`

**Summary:** Type-checked sample prompt document for a TypeScript code review.

---

### ExampleSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:107`

**Summary:** A single input→output example for few-shot prompting.

---

### FewShotSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:221`

**Summary:** Few-shot: provide input/output examples.

---

### Memory (type)

**Source:** `_specs/schemas/prompt-schema.ts:815`

**Summary:** Validated memory configuration, inferred from {@link MemorySchema}.

---

### MemorySchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:382`

**Summary:** Validate short-term and long-term memory configuration.

---

### ModelParams (type)

**Source:** `_specs/schemas/prompt-schema.ts:803`

**Summary:** Validated model inference parameters, inferred from {@link ModelParamsSchema}.

---

### ModelParamsSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:165`

**Summary:** Model-level inference parameters for a single API call.

---

### Orchestration (type)

**Source:** `_specs/schemas/prompt-schema.ts:634`

**Summary:** Recursive orchestration strategy union, defined manually for `z.lazy()` compatibility.

---

### OrchestrationSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:497`

**Summary:** Discriminated union of multi-call coordination strategies.

#### TSDoc Tags

##### @remarks

Recursive via `z.lazy()`: a chain step's orchestration field is
itself an OrchestrationSchema, enabling arbitrary nesting.
Each variant wraps one or more {@link CallSpecSchema} instances.
See docs/prompt-schema.md for execution semantics per strategy.

---

### OutputFormat (type)

**Source:** `_specs/schemas/prompt-schema.ts:800`

**Summary:** Validated output format descriptor, inferred from {@link OutputFormatSchema}.

---

### OutputFormatSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:120`

**Summary:** Validate output format type, optional JSON Schema, and constraints.

---

### parseCallSpec (function)

**Source:** `_specs/schemas/prompt-schema.ts:1158`

**Summary:** Parse and validate raw data as a {@link CallSpec}.

#### TSDoc Tags

##### @param

input - Unvalidated call spec data.

##### @returns

A validated {@link CallSpec}.

##### @throws

{@link z.ZodError} If `input` fails schema validation.

---

### parsePrompt (const)

**Source:** `_specs/schemas/prompt-schema.ts:1173`

#### TSDoc Tags

##### @deprecated

Since v0.3.0. Use {@link parsePromptDocument} instead. Removal in v0.4.0.

---

### parsePromptDocument (function)

**Source:** `_specs/schemas/prompt-schema.ts:1137`

**Summary:** Parse and validate raw data as a {@link PromptDocument}.

#### TSDoc Tags

##### @param

input - Unvalidated prompt document data.

##### @returns

A validated {@link PromptDocument}.

##### @throws

{@link z.ZodError} If `input` fails schema validation.

---

### Prompt (type)

**Source:** `_specs/schemas/prompt-schema.ts:824`

#### TSDoc Tags

##### @deprecated

Since v0.3.0. Use {@link PromptDocument} instead. Removal in v0.4.0.

---

### PROMPT_TECHNIQUE_NAMES (const)

**Source:** `_specs/schemas/prompt-schema.ts:203`

**Summary:** Valid prompt-level technique discriminator values.

---

### PromptDocument (type)

**Source:** `_specs/schemas/prompt-schema.ts:783`

**Summary:** Validated top-level prompt document, inferred from {@link PromptDocumentSchema}.

---

### promptDocumentJsonSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:838`

**Summary:** JSON Schema representation of {@link PromptDocumentSchema} (draft-2020-12).

#### TSDoc Tags

##### @remarks

`.refine()` validations and `z.lazy()` recursive references are
runtime-only and not expressible in JSON Schema. Consumers must
implement equivalent checks in their validation layer.

---

### PromptDocumentSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:720`

**Summary:** Validate a top-level prompt document combining identity, orchestration,
context engineering, and evaluation into a single versionable artifact.

---

### PromptTechnique (type)

**Source:** `_specs/schemas/prompt-schema.ts:789`

**Summary:** Validated prompt technique variant, inferred from {@link PromptTechniqueSchema}.

---

### PromptTechniqueName (type)

**Source:** `_specs/schemas/prompt-schema.ts:210`

**Summary:** Union type of valid prompt-level technique names.

---

### PromptTechniqueNameSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:213`

**Summary:** Validate a string as a prompt-level technique name.

---

### PromptTechniqueSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:250`

**Summary:** Discriminated union of prompt-level technique variants.

---

### Retrieval (type)

**Source:** `_specs/schemas/prompt-schema.ts:812`

**Summary:** Validated retrieval source entry, inferred from {@link RetrievalSchema}.

---

### RetrievalSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:368`

**Summary:** Validate a single RAG / retrieval source configuration.

---

### Role (type)

**Source:** `_specs/schemas/prompt-schema.ts:794`

**Summary:** Validated model persona and behavioral constraints, inferred from {@link RoleSchema}.

---

### RoleSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:91`

**Summary:** Semantic role the model should adopt.

---

### safeParseCallSpec (function)

**Source:** `_specs/schemas/prompt-schema.ts:1168`

**Summary:** Safely parse raw data as a {@link CallSpec} without throwing.

#### TSDoc Tags

##### @param

input - Unvalidated call spec data.

##### @returns

A Zod safe-parse result with `success`, `data`, or `error`.

---

### safeParsePrompt (const)

**Source:** `_specs/schemas/prompt-schema.ts:1175`

#### TSDoc Tags

##### @deprecated

Since v0.3.0. Use {@link safeParsePromptDocument} instead. Removal in v0.4.0.

---

### safeParsePromptDocument (function)

**Source:** `_specs/schemas/prompt-schema.ts:1147`

**Summary:** Safely parse raw data as a {@link PromptDocument} without throwing.

#### TSDoc Tags

##### @param

input - Unvalidated prompt document data.

##### @returns

A Zod safe-parse result with `success`, `data`, or `error`.

---

### SCHEMA_VERSION (const)

**Source:** `_specs/schemas/prompt-schema.ts:19`

**Summary:** Current schema version literal.

---

### SchemaVersionSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:22`

**Summary:** Validate that the schema version matches the current release.

---

### Technique (type)

**Source:** `_specs/schemas/prompt-schema.ts:826`

#### TSDoc Tags

##### @deprecated

Since v0.3.0. Use {@link PromptTechnique} instead. Removal in v0.4.0.

---

### ThinkingConfig (type)

**Source:** `_specs/schemas/prompt-schema.ts:806`

**Summary:** Validated thinking configuration variant, inferred from {@link ThinkingConfigSchema}.

---

### ThinkingConfigSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:150`

**Summary:** Extended thinking configuration, discriminated on `type`.

#### TSDoc Tags

##### @remarks

`"disabled"` omits the thinking parameter; `"enabled"` requires
`budgetTokens` (Anthropic API contract). The runtime translates
this to the provider-specific API format.

---

### ToolDefinition (type)

**Source:** `_specs/schemas/prompt-schema.ts:818`

**Summary:** Validated tool definition, inferred from {@link ToolDefinitionSchema}.

---

### ToolDefinitionSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:189`

**Summary:** Canonical tool definition used across all schema layers.

#### TSDoc Tags

##### @remarks

Shared by {@link CallSpecSchema} and {@link OrchestrationSchema}.
When both declare tools, orchestration-level tools take precedence;
call-level tools pass through to the API's `tools` parameter.

---

### ZeroShotSchema (const)

**Source:** `_specs/schemas/prompt-schema.ts:216`

**Summary:** Zero-shot: instruction only, no examples.

