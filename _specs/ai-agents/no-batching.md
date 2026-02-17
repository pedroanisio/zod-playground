# No Batching or Splitting Deliverables

**Purpose:** Absolute prohibition on incomplete, batched, or deferred work.

---

## ABSOLUTE PROHIBITION

**NEVER batch, split, or defer work with promises like "let me create the remaining items" or "due to length, I'll continue in parts."**

---

## Two Types of Batching (Both Prohibited)

### 1. Temporal Batching (Work Splitting)

**❌ BAD:** Splitting work across multiple responses with promises to complete later.

**Examples:**
- "I'll create files 1-5 now and 6-10 in the next response"
- "Let me implement the code first, I'll add tests later"
- "I'll handle the high-priority items now and tackle the rest after"

**Why it's bad:** Incomplete deliverables, broken state between batches, lost context, work never finishes.

### 2. Tool Batching (Mass Operations)

**❌ BAD:** Using mass find-replace, shell scripts, or automated operations instead of careful, deliberate edits.

**Examples:**
- Using `sed`/`awk` to mass-replace across 20 files instead of using Edit tool for each file
- Writing a shell script to generate 10 schema files at once instead of using Write tool individually
- Running `find . -name "*.ts" -exec sed -i 's/foo/bar/g' {}` instead of surgical edits

**✅ GOOD:** Using Edit/Write tools for each file individually with reviewed, validated changes.

**Why tool batching is bad:**
- Mass operations bypass review and validation
- Errors propagate silently across many files
- No opportunity to verify each change is correct
- Violates "careful, deliberate" principle even if more token-expensive
- Can introduce inconsistencies the agent doesn't notice

**The Rule:** **Always use Edit/Write tools for file operations, never bash scripts or mass find-replace.** Token cost is worth the quality and safety.

---

## Forbidden Patterns

These phrases and patterns are **absolutely prohibited**:

- ❌ "Due to the length of the response, let me create the remaining ADRs in efficient batches"
- ❌ "I'll create the first 5 files now and the remaining 10 in the next response"
- ❌ "Let me start with the high-priority items and handle the rest later"
- ❌ "I'll implement part 1 now, and we can do part 2 after"
- ❌ "Creating files 1-3 in this batch, 4-6 in the next"
- ❌ "I'll complete the easy ones first and tackle the complex ones later"
- ❌ "For now, I'll implement X, and we can add Y in a follow-up"

---

## Why Batching is Prohibited

1. **Batched responses are consistently lower quality**
   - First batch gets attention, subsequent batches are rushed
   - Copy-paste errors multiply across batches
   - Context is lost between batches
   - Patterns aren't consistent across batches

2. **Creates incomplete deliverables**
   - Violates production-ready code standards
   - Leaves project in broken state between batches
   - Half-done features can't be tested or deployed

3. **Forces users to track what was/wasn't done**
   - User must remember "batch 2 of 5 pending"
   - Mental overhead tracking state
   - Unclear when work is actually complete

4. **Breaks atomicity of work**
   - Can't review incomplete work properly
   - Can't test partial implementations
   - Can't commit partial batches safely

5. **Often results in second batch never being delivered**
   - User forgets to request continuation
   - Context changes and batch 2 becomes irrelevant
   - Promises are forgotten, work remains incomplete

---

## Required Behavior

### If the Work is Too Large for a Single Response

**Option 1: Break into complete, atomic tasks**

✅ **Correct:**
> "This requires creating 15 ADRs. I can create ADR-001 completely (with full content, examples, validation, and proper formatting). Which ADR should I start with?"

❌ **Forbidden:**
> "I'll create ADRs 1-5 now and 6-15 in the next batch"

**Option 2: Deliver one complete task per response**

✅ **Correct:**
> "I've completed the authentication module with:
> - All source code
> - Complete test coverage (87%)
> - Documentation
> - ADR documenting the approach
>
> Ready to move to the authorization module next?"

❌ **Forbidden:**
> "I've implemented the authentication code. I'll add tests in the next response."

**Option 3: Do everything if it fits**

✅ **Correct:**
> "Creating all 10 files now as a complete, atomic change"
>
> [Actually creates all 10 files with complete content]

❌ **Forbidden:**
> "Creating all 10 files now... [creates 3 files] ...I'll create the remaining 7 in the next response"

---

## If You Truly Cannot Complete the Work

### State the Constraint Clearly

✅ **Correct:**
> "This requires changes to 50 files, which exceeds my capacity in a single response.
>
> I can fully implement the user authentication flow (5 files, all tests, docs). Then we can tackle authorization separately.
>
> Would you like me to proceed with authentication first?"

❌ **Forbidden:**
> "I'll start implementing and see how far I get"

### Propose a Complete Subset

✅ **Correct:**
> "The full implementation requires:
> 1. Authentication (S complexity - 5 files)
> 2. Authorization (M complexity - 8 files)
> 3. Audit logging (S complexity - 3 files)
>
> I can deliver #1 completely in this response. Should I start there?"

❌ **Forbidden:**
> "I'll implement as much as I can and let you know what's left"

### Wait for User Decision Before Proceeding

✅ **Correct:**
> "Given the scope, I recommend implementing in this order:
> 1. Core authentication (complete with tests)
> 2. OAuth integration (complete with tests)
> 3. Admin panel updates (complete with tests)
>
> Should I proceed with #1, or would you prefer a different order?"

[Wait for user response before implementing anything]

❌ **Forbidden:**
> "I'll start with authentication and move through the list"

[Implements authentication, promises to do OAuth next]

---

## The One Complete Deliverable Rule

**Every response must contain AT LEAST ONE of:**

1. ✅ Complete feature (with tests, docs, passing CI)
2. ✅ Complete bug fix (with regression test)
3. ✅ Complete analysis/research (with actionable recommendations)
4. ✅ Complete question (with context and options for user)

**NEVER deliver:**
- ❌ Partial feature (missing tests)
- ❌ Partial bug fix (didn't address root cause)
- ❌ Partial analysis (will continue later)
- ❌ Partial files (will add rest next time)

---

## Examples

### Example 1: Creating Multiple Files

**❌ WRONG:**
```
I'll create the user service files in batches:

Batch 1 (this response):
- user.py
- user_repository.py
- user_dto.py

Batch 2 (next response):
- user_test.py
- user_repository_test.py
- user_integration_test.py
```

**✅ CORRECT Option A:**
```
I'm creating user.py with complete implementation, tests, and documentation.

After this is reviewed, would you like me to create user_repository.py next?
```

**✅ CORRECT Option B:**
```
I'm creating all 6 files now:
- user.py (complete)
- user_repository.py (complete)
- user_dto.py (complete)
- user_test.py (complete)
- user_repository_test.py (complete)
- user_integration_test.py (complete)

[Actually creates all 6 files with complete content]
```

### Example 2: Large Refactoring

**❌ WRONG:**
```
This refactoring touches 40 files. I'll start with the core 10 files and handle the rest in subsequent responses.
```

**✅ CORRECT:**
```
This refactoring touches 40 files, which exceeds single-response capacity.

I can break this into complete, testable phases:
1. Refactor core domain models (10 files, all tests passing)
2. Update repositories (15 files, all tests passing)
3. Update API layer (15 files, all tests passing)

Each phase is independently testable and deployable.

Should I proceed with phase 1?
```

### Example 3: Writing Documentation

**❌ WRONG:**
```
I'll write the API documentation in sections:
- Authentication endpoints (this response)
- User endpoints (next response)
- Admin endpoints (third response)
```

**✅ CORRECT Option A:**
```
I'm writing complete documentation for the Authentication API, including:
- Overview and authentication flow
- All endpoints with examples
- Error codes and handling
- Rate limiting details

After this is complete, should I document the User endpoints next?
```

**✅ CORRECT Option B:**
```
I'm writing complete API documentation for all endpoints now:
- Authentication (complete)
- User management (complete)
- Admin operations (complete)

[Actually writes all sections completely]
```

### Example 4: Tool Batching vs. Surgical Edits

**❌ WRONG (Tool Batching):**
```bash
# Mass-replace import paths across all files
find schemas -name "*.ts" -exec sed -i 's/from "\.\.\/common"/from "@\/common"/g' {} \;

# Generate multiple schema files with a script
for entity in User Product Order Payment; do
  cat > "schemas/${entity}.ts" << EOF
  import { z } from "zod";
  export const ${entity}Schema = z.object({ /* ... */ });
  EOF
done
```

**Why it's wrong:**
- No validation that replacements are correct
- Can't verify each schema is properly structured
- Errors propagate across all generated files
- Bypasses careful review of each change

**✅ CORRECT (Surgical Edits):**
```
Using Edit tool for schemas/user.ts:
- Read the file first to understand current imports
- Replace the specific import with correct path
- Verify the change is correct in context

Using Write tool for schemas/product.ts:
- Write complete, validated ProductSchema
- Include all required fields with proper validation
- Add AI metadata and type exports
- Verify against STYLE_GUIDE.md

Repeat for each file individually...
```

**Why it's correct:**
- Each file gets careful review
- Can verify each change is correct
- Validation happens per file
- Follows "measure twice, cut once" principle
- Token-expensive but quality-guaranteed

---

## Self-Check Before Responding

Before sending a response, ask yourself:

**Temporal Batching Check:**
- [ ] Have I delivered at least one **complete** deliverable?
- [ ] Is everything I'm delivering **production-ready**?
- [ ] Am I making any promises about "next batch" or "rest later"?
- [ ] Could the user successfully use/deploy what I've delivered?
- [ ] If I only sent this response and never continued, is it valuable?

**Tool Batching Check:**
- [ ] Am I using Edit/Write tools for file operations (not bash scripts)?
- [ ] Am I making surgical, reviewed changes (not mass find-replace)?
- [ ] Am I validating each change individually (not trusting automated operations)?
- [ ] Would I trust this change without reviewing the diff?

If you answer "no" to any question, **revise your response**.

---

## The Golden Rules

**1. One complete, production-ready deliverable is infinitely better than multiple incomplete batches.**

**2. Careful, surgical edits with Edit/Write tools are infinitely better than fast mass operations with bash scripts.**

Both rules prioritize **quality and correctness over speed and convenience**.

---

## Clarification: Multi-Pass Plan Generation Is Not Batching

The [Plan Generation Protocol](./plan-generation.md) uses a skeleton-first, then fill-details strategy for large plans. This is **not batching** because:

- Each pass **refines the same plan** (not delivering separate pieces)
- The final output is **one complete plan JSON** (not partial deliverables)
- The user receives **one validated artifact** (not promises of future work)

What would be batching: "Here are steps 1-5, I'll add steps 6-10 next." What multi-pass does: generate the complete skeleton, then fill all step details, then emit one validated plan.

---

## Related Documents

- [Core Principles](../principles/core-principles.md) - Production-ready code only
- [Quality Protocol](../principles/quality-protocol.md) - Zero tolerance enforcement
- [Effort Estimation](../ai-agents/effort-estimation.md) - Breaking work into sizes
- [Plan Generation Protocol](./plan-generation.md) - Multi-pass strategy (not batching)

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
