# Quality Assurance Protocol

**Purpose:** Non-negotiable enforcement mechanisms for code quality standards.

---

## Mandatory Quality Checklist

**CRITICAL**: Before processing ANY user request, mentally apply this quality checklist:

```
%PROJECT_EXCELLENCE = {
  "root_cause": "Fix root causes, NEVER patch symptoms",
  "tdd_required": "Red → Green → Refactor → Cleanup (NO EXCEPTIONS)",
  "production_ready": "NO placeholders, TODOs, or incomplete code in main",
  "no_time_estimates": "T-shirt sizes (XS/S/M/L/XL) + priority/sequencing, NEVER time/duration",
  "formal_plans_required": "M/L/XL tasks MUST use plan-schema.ts with valid JSON output",
  "adrs_checked": "Verify compliance with ADRs before implementation",
  "test_coverage": "Meet coverage targets - write tests BEFORE marking done",
  "error_handling": "Proper error handling everywhere, no ignoring errors",
  "fix_existing_errors": "Pre-existing bugs are NOT excuses - fix them correctly",
  "changelog_update": "Update CHANGELOG when features/epics complete"
}
```

---

## Pre-Implementation Checklist

For EVERY code change, verify:
- [ ] Have I checked relevant ADRs?
- [ ] Have I reviewed related Enhancement Proposals?
- [ ] For M/L/XL complexity: Did I create formal plan JSON (plan-schema.ts)?
- [ ] For M/L/XL complexity: Does plan pass schema + well-formedness validation?
- [ ] Am I fixing the root cause, not symptoms?
- [ ] Did I write the failing test first (TDD Red phase)?
- [ ] Is this production-ready with no placeholders?
- [ ] Will this achieve coverage targets?
- [ ] Am I using proper error handling?
- [ ] Have I avoided time estimates (using T-shirt sizes instead)?
- [ ] Have I updated documentation if needed?

---

## Enforcement

This protocol is **non-negotiable**. Every implementation must satisfy all criteria in `%PROJECT_EXCELLENCE`.

If you cannot meet these standards for a given request, explain the gap and propose how to achieve compliance rather than delivering substandard code.

**Example:**
```
User: "Add a new authentication feature"

Internal Processing: User request + %PROJECT_EXCELLENCE
→ Check ADRs for authentication patterns
→ Review Enhancement Proposals for auth changes
→ Write failing test first (TDD Red phase)
→ Implement with proper error handling
→ Ensure coverage targets met
→ No placeholders anywhere
→ Update CHANGELOG when complete
```

---

## Zero Tolerance for Issue Minimization

**ABSOLUTE PROHIBITION**: NEVER minimize, downplay, or dismiss code quality issues regardless of their perceived severity, category, or source.

### Forbidden Language Patterns:
- ❌ "mostly pedantic/minor warnings"
- ❌ "just style issues"
- ❌ "low priority warnings"
- ❌ "acceptable technical debt"
- ❌ "these can be ignored"
- ❌ "not critical"
- ❌ "minor issues"
- ❌ "good enough for now"

### Required Behavior:
- ✅ Report ALL issues factually without diminishing language
- ✅ Treat every linter warning as equally important
- ✅ State the exact count and categories objectively
- ✅ Never suggest that remaining issues are acceptable
- ✅ Never compare issue severity to justify inaction

### Examples:

**FORBIDDEN response pattern:**
```
"We've fixed the major issues. The remaining 352 warnings are mostly
minor lints that are lower priority."
```

**REQUIRED response pattern:**
```
"We've fixed 171 warnings. 352 warnings remain across these categories:
- unused_variables: 45 instances
- missing_docs: 38 instances
- inconsistent_naming: 127 instances
- [other categories...]

Each of these needs to be addressed."
```

### Rationale:

Every code quality issue detected by tooling exists for a reason. Categorizing issues as "minor" or "low priority":
1. Violates production-ready code standards
2. Contradicts CI denial of warnings
3. Undermines the %PROJECT_EXCELLENCE protocol
4. Creates false sense of completion
5. Accumulates technical debt

**This behavior will not be tolerated.** Report issues factually, fix them systematically, or explain blockers objectively without minimizing their importance.

---

## Zero Tolerance for Time Estimates

**ABSOLUTE PROHIBITION**: NEVER provide time estimates, duration references, or calendar commitments when planning or describing work.

### Forbidden Language Patterns:

**Explicit time estimates:**
- ❌ "This will take 2 hours"
- ❌ "Should be done in 3 days"
- ❌ "Estimated delivery: 2 weeks"
- ❌ "Ready by Friday"
- ❌ "ETA: tomorrow"

**Implicit duration references:**
- ❌ "This is a quick fix"
- ❌ "This is fast/slow"
- ❌ "This won't take long"
- ❌ "This is trivial/simple"
- ❌ "Rapid implementation"

### Required Behavior:

- ✅ Use T-shirt sizes (XS, S, M, L, XL) for complexity
- ✅ Provide concrete implementation steps
- ✅ List complexity factors (what makes it hard)
- ✅ Identify dependencies and blockers
- ✅ Recommend sequencing/priority order
- ✅ Let users decide timing based on their capacity

### Examples:

**FORBIDDEN response pattern:**
```
"This authentication feature should take about 2-3 days.
The database migration is quick (30 min), and the API
changes are maybe 3-4 hours."
```

**REQUIRED response pattern:**
```
This is **M** complexity.

Implementation scope:
- Database migration (schema changes)
- Authentication middleware (2 files)
- API endpoints (3 files)
- Integration tests

Complexity factors:
- Breaking schema change requires careful migration
- Security-critical code needs thorough review
- Integration with existing auth system

Recommended sequence:
1. Database migration (must complete first)
2. Authentication middleware
3. API endpoints
4. Integration tests

Based on your team's capacity and priorities, you can
schedule this work. Should we proceed with step 1?
```

### Rationale:

Time estimates from AI agents:
1. Are inherently inaccurate (cannot predict human development time)
2. Create false expectations and broken commitments
3. Focus on duration instead of complexity and value
4. Vary wildly by developer, interruptions, and unknowns
5. Reduce trust when consistently wrong

**Enforcement:** Violations treated as critical errors equivalent to shipping broken code. See [Effort Estimation](../ai-agents/effort-estimation.md) for complete specification.

---

## Mandatory Formal Planning for M/L/XL Tasks

**ABSOLUTE REQUIREMENT**: All M, L, or XL complexity tasks MUST use formal plan schema with valid JSON output.

> **Generation guidance:** For the complete plan generation process — pre-generation checklist, verification economics calibration, conditional field requirements, domain confidence gates, output budget management — see **[Plan Generation Protocol](../ai-agents/plan-generation.md)**.

### When Formal Plans Are Required:

**MUST create formal plan:**
- ✅ Task is M, L, or XL complexity
- ✅ Multi-step or multi-actor coordination
- ✅ Irreversible actions involved
- ✅ Resource/capacity tracking needed
- ✅ User explicitly requests a plan

**MAY skip formal plan:**
- ✅ XS or S complexity, single actor
- ✅ Immediate, reversible changes
- ✅ Exploratory research tasks

### Required Plan Schema Compliance:

**Every formal plan MUST:**
1. Follow `_specs/schemas/plan-schema.ts` strictly
2. Output valid JSON passing `PlanSchema.parse()`
3. Pass `validateWellFormedness()` with zero errors
4. Include all required sections:
   - Metadata (version, snapshot, author)
   - Problem definition with success criteria
   - Baseline state with metrics
   - Scope definition with authorized zones
   - Actor registrations with trust levels
   - Steps with T-shirt sizes (XS/S/M/L/XL)
   - Verification economics (bandwidth allocation)
   - Execution order (dependency graph)
   - Acceptance criteria

### Examples:

**FORBIDDEN approach:**
```
User: "Implement authentication system" (L complexity)

Agent: "Let me start working on authentication..."
[proceeds without formal plan]
```

**REQUIRED approach:**
```
User: "Implement authentication system"

Agent: "This is **L** complexity requiring formal planning.

I'll create a formal plan following plan-schema.ts:

Creating: plans/PLAN-add-auth-v1.0.0.json

[Generates valid JSON with:]
- 5 actors (human operator, 2 agents, 2 reviewers)
- 8 steps (M+S complexity breakdown)
- Resource requirements (12 files, capacity checks)
- Verification economics (bwVerify: 20, bwDecl: 7, bwReview: 13)
- 3 irreversible steps with operator approval gates
- DAG execution order with 2 parallel groups

Validating plan...
✓ Schema validation passed
✓ Well-formedness validation passed
⚠ 2 warnings:
  - Step "migrate-db" uses 85% of agent capacity (thrashing risk)
  - Cumulative handoff loss: 23%

Plan ready. Should I proceed with execution?"
```

### Validation Protocol:

**Before ANY plan execution:**

```bash
# 1. Schema validation (BLOCKING)
PlanSchema.parse(planJson)
# Errors = STOP immediately

# 2. Well-formedness validation (BLOCKING)
result = validateWellFormedness(plan)
if (result.errors.length > 0) {
  // HALT - Cannot proceed
  escalate_to_user(result.errors)
}

# 3. Warnings review (REQUIRED)
if (result.warnings.length > 0) {
  // MUST surface to user
  // Proceed only with explicit acceptance
  present_warnings_for_review(result.warnings)
}

# 4. Execute only if validated
execute_plan(plan)
```

### Prohibited Shortcuts:

**NEVER:**
- ❌ Use informal markdown plans for M/L/XL tasks
- ❌ Skip schema validation ("it's probably fine")
- ❌ Ignore well-formedness errors ("just warnings")
- ❌ Omit required fields ("we'll add later")
- ❌ Use invalid step sizes (must be XS/S/M/L/XL from enum)
- ❌ Skip verification economics section
- ❌ Proceed with plans that have validation errors

### Rationale:

Formal plan schemas:
1. Make constraints explicit and machine-verifiable
2. Prevent capacity overload before it happens
3. Enforce authority boundaries (no self-approving irreversible actions)
4. Track verification debt accumulation
5. Enable automated validation and execution
6. Create audit trail for all decisions
7. Catch errors in planning phase, not execution phase

**Enforcement:** Plan schema violations are BLOCKING ERRORS. See [Plan Schema](../../schemas/plan-schema.ts) and [Effort Estimation](../ai-agents/effort-estimation.md) for complete specification.

---

## Systematic Issue Resolution

When facing numerous warnings/issues:

1. **Group by category** (e.g., all unused variable warnings)
2. **Fix one category completely** before moving to next
3. **Report progress factually**: "45/352 warnings resolved (unused_variables complete)"
4. **Never stop until count reaches zero**
5. **Document patterns** if same issue appears repeatedly (create ADR for prevention)

---

## Escalation

If you encounter situations where meeting these standards is blocked:

1. **Identify the blocker** clearly and objectively
2. **Propose solutions** to remove the blocker
3. **Document the constraint** if truly unavoidable
4. **Never compromise on standards** - adjust scope instead

**Examples:**

**Blocked scenario:**
> "I cannot meet 80% test coverage because the legacy authentication module has no test infrastructure."

**Proper response:**
> "Achieving 80% coverage requires test infrastructure for authentication. Options:
> 1. Build test infrastructure first (M complexity)
> 2. Refactor authentication to be testable (L complexity)
> 3. Defer authentication changes until infrastructure exists
>
> Which approach would you prefer?"

---

## Related Documents

- [Core Principles](../principles/core-principles.md) - Standards being enforced
- [Anti-Patterns](../principles/anti-patterns.md) - What this protocol prevents
- [Testing Standards](../development/testing-standards.md) - Coverage requirements
- [Effort Estimation](../ai-agents/effort-estimation.md) - T-shirt sizing and time estimate prohibition
- [Plan Generation Protocol](../ai-agents/plan-generation.md) - How to generate formally sound plans
- [Plan Schema](../../schemas/plan-schema.ts) - **MANDATORY** formal planning schema for M/L/XL tasks

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
