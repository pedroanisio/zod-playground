# Schema Module: zod-ai-meta

Source: `_specs/schemas/zod-ai-meta.ts`

**Overview:** update, and validate values for Zod schemas and compiled prompt outputs. How important is it that the agent gets this field right?



## Exported Symbols

### AgentExample (interface)

**Source:** `_specs/schemas/zod-ai-meta.ts:33`

**Summary:** A positive or negative example.

---

### AgentRelation (interface)

**Source:** `_specs/schemas/zod-ai-meta.ts:40`

**Summary:** A relationship to another schema the agent should be aware of.

---

### AgentRule (interface)

**Source:** `_specs/schemas/zod-ai-meta.ts:23`

**Summary:** A single teaching rule for the agent.

---

### AgentToolHint (interface)

**Source:** `_specs/schemas/zod-ai-meta.ts:47`

**Summary:** Tool or function the agent can call when working with this field.

---

### ai (function)

**Source:** `_specs/schemas/zod-ai-meta.ts:335`

**Summary:** Start teaching an AI agent about a schema.
```ts
ai(mySchema)
.instruct("User's display name")
.generate("Use title case")
.example("Alice Johnson")
.antipattern("ALICE", "a.")
.priority("high");
```

#### TSDoc Tags

##### @param

schema - Zod schema to annotate with AI metadata.

##### @returns

Fluent metadata builder bound to `schema`.

---

### aiRegistry (const)

**Source:** `_specs/schemas/zod-ai-meta.ts:119`

**Summary:** Define the aiRegistry value.

---

### AITeachingMeta (interface)

**Source:** `_specs/schemas/zod-ai-meta.ts:54`

**Summary:** The full AI teaching metadata for a single schema node.

---

### CompiledField (interface)

**Source:** `_specs/schemas/zod-ai-meta.ts:344`

**Summary:** Compiled field instruction for prompt injection.

---

### CompiledPrompt (interface)

**Source:** `_specs/schemas/zod-ai-meta.ts:361`

**Summary:** Full compiled output for a schema tree.

---

### compilePrompt (function)

**Source:** `_specs/schemas/zod-ai-meta.ts:376`

**Summary:** Walk a Zod object schema and collect all AI teaching metadata
into a structured format and a ready-to-use prompt string.

#### TSDoc Tags

##### @param

schema - Root schema to compile.

##### @param

options - Optional scope and priority filters.

##### @returns

Structured compiled fields and prompt text.

---

### compileRegistry (function)

**Source:** `_specs/schemas/zod-ai-meta.ts:481`

**Summary:** Compile ALL schemas in the AI registry into a single prompt.
Useful when you want to dump everything the agent needs to know.

#### TSDoc Tags

##### @param

options - Optional scope and priority filters.

##### @returns

Compiled prompt output for the full registry.

---

### OpScope (type)

**Source:** `_specs/schemas/zod-ai-meta.ts:20`

**Summary:** What kind of operation does a rule apply to?

---

### Priority (type)

**Source:** `_specs/schemas/zod-ai-meta.ts:17`

**Summary:** How important is it that the agent gets this field right?

