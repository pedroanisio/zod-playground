# Effort Estimation

**Purpose:** Communicate task complexity using T-shirt sizes (XS/S/M/L/XL), priority, and sequencing order—NEVER time estimates.

**Key Principle:** Focus on **complexity** (what makes it hard), **priority** (what order to do it), and **dependencies** (what blocks what)—NOT duration, calendars, or deadlines.

---

## NEVER Provide Time Estimates (ZERO TOLERANCE)

**⛔ ABSOLUTE PROHIBITION: NEVER provide time estimates, duration references, or calendar commitments.**

This includes:
- ❌ Explicit time units (hours, days, weeks, months, minutes)
- ❌ Implicit duration words (quick, fast, slow, trivial, simple)
- ❌ Calendar references (Friday, next sprint, tomorrow, EOD)
- ❌ ETA or deadline language (estimated delivery, will be ready, should be done)

**Why this is non-negotiable:**

1. **Inherently inaccurate** - AI agents cannot predict human development time
2. **Creates false expectations** - Users plan around broken commitments
3. **Wrong focus** - Emphasizes duration over complexity and value
4. **Wildly variable** - Same task takes different time for different developers
5. **Unmeasurable** - Interruptions, blockers, and unknowns make estimates meaningless
6. **Reduces trust** - Broken time promises damage credibility

**Enforcement:** Zero exceptions. Violations are treated as critical errors equivalent to shipping broken code.

---

## Use T-shirt Sizes + Priority + Sequencing

**Always provide three components:**

1. **Complexity Size (T-shirt)** - How complex is it?
2. **Implementation Steps** - What needs to be done?
3. **Sequencing Order** - What order/priority makes sense?

### T-shirt Size Reference

Communicate relative complexity using standardized sizes:

| Size | Complexity Description | File Count | Testing Needs |
|------|------------------------|------------|---------------|
| **XS** | Trivial change, obvious implementation | 1 file | Minimal/none |
| **S** | Straightforward feature, clear pattern | 2-3 files | Unit tests |
| **M** | Moderate feature, some integration | 4-8 files | Unit + Integration |
| **L** | Complex feature, cross-cutting concerns | 10-20 files | Unit + Integration + E2E |
| **XL** | Major feature, must break into smaller tasks | 20+ files | Extensive (all types) |

**Important:** T-shirt size alone is insufficient. Always include complexity factors and sequencing.

---

## Forbidden Phrases (ZERO TOLERANCE)

**Explicit Time Estimates (NEVER):**
- ❌ "This will take 2 hours"
- ❌ "Should be done in a few minutes"
- ❌ "Approximately 3 days of work"
- ❌ "Estimated delivery: 2 weeks"
- ❌ "Will be ready by Friday"
- ❌ "ETA: Thursday afternoon"
- ❌ "Give me 10 minutes"
- ❌ "This should only take..."
- ❌ "In about an hour we'll have..."
- ❌ "By end of day this will..."

**Implicit Time References (ALSO FORBIDDEN):**
- ❌ "This is a quick fix"
- ❌ "This is fast to implement"
- ❌ "This is slow/time-consuming"
- ❌ "This won't take long"
- ❌ "This is a long task"
- ❌ "Rapid implementation"
- ❌ "Time-intensive work"
- ❌ "This is immediate"
- ❌ "This is trivial" (use "XS complexity" instead)
- ❌ "This is simple" (use "S complexity" instead)
- ❌ "This is straightforward" (use size + "straightforward implementation pattern")

**Deadline/Calendar References (FORBIDDEN):**
- ❌ "Ready by next sprint"
- ❌ "Done by Monday"
- ❌ "Available tomorrow"
- ❌ "Shipping next week"

---

## Required Response Format

**Every estimation MUST include:**

1. **Size in bold** (e.g., "This is **M** complexity")
2. **Files/components affected** (concrete list)
3. **Complexity factors** (what makes it this size)
4. **Dependencies** (what blocks/is blocked)
5. **Recommended sequencing** (priority order)

**Template:**
```
This is [SIZE] complexity.

Implementation scope:
- [List files/components]

Complexity factors:
- [Why this size]

Dependencies:
- [What blocks this]
- [What this blocks]

Recommended sequence:
1. [First phase/task]
2. [Second phase/task]

Should we proceed with [specific phase]?
```

✅ **Good:**
> "This is a **Medium (M)** complexity task requiring changes to:
> - Authentication middleware (1 file)
> - API endpoint handlers (3 files)
> - Integration tests (2 files)
>
> Complexity factors:
> - Database schema changes needed
> - Breaking change requiring migration
> - Security review required"

✅ **Good:**
> "Breaking this **XL** task into three **M** tasks would be more manageable:
> 1. Core authentication (M)
> 2. OAuth integration (M)
> 3. Admin panel updates (M)"

✅ **Good:**
> "This appears to be a **Small (S)** change affecting only the validation logic in user_validator.py"

✅ **Good:**
> "Given the architectural impact, this is **Large (L)** complexity. It touches the auth system, API layer, and database schema."

---

## Size Definitions with Examples

### XS (Extra Small)

**Characteristics:**
- Single file change
- No architectural impact
- Minimal or no testing needed
- Obvious implementation

**Examples:**
- Fix typo in error message
- Update constant value
- Add missing docstring
- Rename variable for clarity

**Communication:**
> "This is **XS** complexity - updating the error message in auth.py line 42"

### S (Small)

**Characteristics:**
- 2-3 files affected
- Straightforward logic
- Clear pattern to follow
- Standard testing (unit tests)

**Examples:**
- Add new validation rule
- Add new API endpoint following existing pattern
- Simple bug fix with regression test
- Update configuration option

**Communication:**
> "This is **S** complexity - adding email validation following the existing phone number validation pattern"

### M (Medium)

**Characteristics:**
- Multiple files (4-8)
- Integration between components
- Moderate testing needs (unit + integration)
- Some design decisions needed

**Examples:**
- Add caching layer
- Implement new feature with business logic
- Refactor module to use dependency injection
- Add new database table with CRUD operations

**Communication:**
> "This is **M** complexity requiring:
> - New database model (user_preferences.py)
> - Repository layer (preferences_repository.py)
> - API endpoints (preferences_api.py)
> - Integration tests
> - Database migration"

### L (Large)

**Characteristics:**
- Many files (10-20)
- Cross-cutting concerns
- Extensive testing (unit + integration + E2E)
- Architectural decisions needed
- Potential breaking changes

**Examples:**
- Add authentication system
- Migrate from REST to GraphQL
- Implement event sourcing
- Add multi-tenancy support

**Communication:**
> "This is **L** complexity with significant architectural impact:
> - Affects authentication, authorization, and audit logging
> - Requires database migration
> - Breaking API changes
> - Extensive test coverage needed
> - Should be broken into phases"

### XL (Extra Large)

**Characteristics:**
- Massive scope (20+ files)
- System-wide impact
- Requires architectural changes
- MUST be broken into smaller tasks
- Multiple epics worth of work

**Examples:**
- Migrate from monolith to microservices
- Replace ORM with different framework
- Add real-time collaboration features
- Rewrite frontend in different framework

**Communication:**
> "This is **XL** complexity - too large for a single task.
>
> I recommend breaking into:
> 1. User authentication service (**L**)
> 2. API gateway (**M**)
> 3. Event bus setup (**M**)
> 4. Service discovery (**S**)
>
> Should we start with task 1?"

---

## What to Focus On Instead

When describing work, include:

### Concrete Steps

✅ **Good:**
> "Implementation steps:
> 1. Add User Preferences model
> 2. Create database migration
> 3. Implement repository layer
> 4. Add API endpoints (GET, PUT)
> 5. Write integration tests
> 6. Update documentation"

### Complexity Factors

✅ **Good:**
> "Complexity factors:
> - Database schema change required
> - Breaking API change (needs versioning)
> - Security implications (auth token storage)
> - Performance impact (requires caching strategy)
> - Three different user roles to support"

### Blockers or Unknowns

✅ **Good:**
> "Potential blockers:
> - Need clarification on authentication flow
> - Database migration strategy needs approval
> - Depends on ADR decision for caching approach
> - Performance requirements not yet defined"

### Dependencies

✅ **Good:**
> "Dependencies:
> - Blocked by: PR #123 (adds base authentication)
> - Blocks: Issue #456 (admin dashboard needs this)
> - Requires: Redis for caching (infrastructure)
> - Integrates with: User service, Notification service"

---

## Comparison Examples

### Bad (Time-Based)

❌ **Bad:**
> "This will take about 2 days. The database migration is quick (30 min), the API changes are maybe 3-4 hours, and tests will take the rest of the time. Should be done by Thursday."

### Good (Complexity-Based)

✅ **Good:**
> "This is **Medium (M)** complexity. It involves:
>
> **Files affected:**
> - Database migration (new table)
> - Repository layer (CRUD operations)
> - API endpoints (3 new endpoints)
> - Integration tests
>
> **Complexity factors:**
> - Schema change requires careful migration
> - Three API endpoints to implement
> - Integration testing with existing auth system
> - Documentation updates needed
>
> **Dependencies:**
> - Requires Redis for caching (already available)
> - Builds on existing auth middleware
>
> Ready to proceed?"

---

## Breaking Down XL Tasks

When encountering XL tasks:

**Step 1: Identify major components**
```
XL Task: "Add real-time collaboration"

Components:
- WebSocket server
- Event broadcasting
- Conflict resolution
- Presence tracking
- UI updates
```

**Step 2: Assign sizes to each component**
```
- WebSocket server setup (M)
- Event broadcasting (S)
- Conflict resolution (L)
- Presence tracking (S)
- UI updates (M)
```

**Step 3: Propose phased approach**
```
Phase 1: Basic real-time updates (M)
  - WebSocket server
  - Event broadcasting
  - Basic UI updates

Phase 2: Advanced features (L)
  - Conflict resolution
  - Presence tracking
  - Optimistic UI
```

**Step 4: Let user choose**
```
"This XL task breaks down into:
1. Basic real-time (M) - functional but basic
2. Advanced features (L) - production-ready

Should we implement phase 1 first and iterate, or do you need both phases?"
```

---

## User Decides Timing and Priority

After providing size and complexity:

✅ **Good:**
> "This is **M** complexity. Based on your team's capacity, current priorities, and sprint velocity, you can decide when to schedule this work."

✅ **Good:**
> "I recommend this **sequencing order** based on dependencies:
> 1. Authentication (M) - blocks everything else
> 2. Authorization (S) - depends on #1
> 3. Audit logging (S) - independent
>
> You can adjust priority based on business needs."

**Let users judge timing and priority based on:**
- Their team's velocity (you don't know it)
- Current sprint capacity (you don't see it)
- Business priority vs. other work (user decides)
- Available infrastructure (may have constraints)
- Business deadlines (user's responsibility)
- Risk tolerance (user's decision)

**You provide (Complexity):**
- T-shirt size (XS/S/M/L/XL)
- Concrete implementation steps
- Dependency chains
- Technical risks and blockers
- Recommended sequencing order

**User decides (Timing & Priority):**
- When to do it (calendar)
- Who should do it (assignment)
- How it fits in roadmap (priority)
- Whether to do it at all (value judgment)
- Which phases to implement (scope)

---

## Enforcement Protocol

### Zero Tolerance Policy

**This is a HARD RULE with ZERO exceptions.**

Any time estimate, deadline, or duration reference is a violation. This includes:
- Direct time estimates ("2 hours")
- Indirect time references ("quick", "slow", "fast")
- Calendar commitments ("by Friday")
- Velocity assumptions ("should be done soon")

**Violations are treated as:**
- ⛔ **Critical errors** (same severity as shipping broken code)
- Requires immediate correction
- Subject to quality protocol enforcement

### Detection Patterns

The following patterns indicate violations:

```regex
# Explicit time units
\b(hour|minute|second|day|week|month|year)s?\b

# Time-based adjectives
\b(quick|fast|slow|rapid|immediate|soon|trivial|simple)\b

# Calendar references
\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|weekend|sprint|iteration)\b

# ETA patterns
\b(ETA|estimate|approximately|about \d+|should take|will take|by \w+day)\b

# Implicit duration words
\b(time-consuming|time-intensive|lengthy|brief)\b
```

**Automated Detection:**
- CI/CD checks should flag these patterns in planning docs, ADRs, proposals
- Code review should reject PRs with time estimates in commit messages or PR descriptions
- Agent responses should self-validate before sending (use Self-Check section)
- Pre-commit hooks can scan markdown files for forbidden patterns

### CI/CD Integration

**Recommended checks:**

```bash
# .github/workflows/effort-estimation-check.yml
# Scan for time estimate violations in markdown files

prohibited_patterns=(
  '\b(hour|minute|day|week|month)s?\b'
  '\b(quick|fast|slow|rapid|immediate|soon)\b'
  '\b(monday|tuesday|wednesday|thursday|friday|weekend|sprint)\b'
  '\b(ETA|estimate|approximately|about \d+)\b'
)

# Fail CI if patterns found in docs/planning/**/*.md
```

**Allowed exceptions:**
- Historical documents (past tense: "This took 3 days" for retrospectives)
- Direct quotes (when documenting what NOT to do)
- This specification itself (explaining the rules)

---

## Self-Check Before Responding

**Before providing ANY estimation or planning response, verify:**

### Complexity Check
- [ ] Have I assigned a T-shirt size (XS/S/M/L/XL)?
- [ ] Is the size in **bold** formatting?
- [ ] Did I explain WHY this size (complexity factors)?

### Time Estimate Check
- [ ] Have I avoided ALL time-based words? (hours, minutes, days, weeks, months)
- [ ] Have I avoided implicit duration words? (quick, fast, slow, trivial, simple)
- [ ] Have I avoided calendar references? (Friday, Monday, next sprint, tomorrow)
- [ ] Have I avoided ETA/deadline language?

### Focus Check
- [ ] Did I provide **concrete steps** (numbered list of tasks)?
- [ ] Did I identify **complexity factors** (what makes it complex)?
- [ ] Did I list **dependencies** (what blocks/is blocked)?
- [ ] Did I note **blockers or unknowns** (risks)?
- [ ] Did I propose **sequencing order** (priority/phases)?

### User Autonomy Check
- [ ] Did I leave timing decisions to the user?
- [ ] Did I avoid assuming team velocity?
- [ ] Did I provide information, not commitments?

**If you answer "no" to ANY question above, revise your response immediately.**

---

## Priority and Sequencing (Not Time)

### Always Provide Sequencing

When breaking down work, **always propose implementation order**:

✅ **Good:**
> "I recommend implementing in this **sequence**:
>
> **Phase 1: Core functionality (M)**
> - Authentication service
> - User repository
> - Basic API endpoints
>
> **Phase 2: Advanced features (L)**
> - OAuth integration
> - Role-based permissions
> - Audit logging
>
> **Phase 3: Polish (S)**
> - Rate limiting
> - API documentation
> - Error messages
>
> Should we proceed with Phase 1, or adjust the priority?"

❌ **Bad:**
> "This will take 2-3 sprints. Week 1 we'll do authentication, week 2 OAuth, week 3 polish."

### Sequencing Language

**Use these terms:**
- ✅ "Implementation sequence"
- ✅ "Recommended order"
- ✅ "Priority phases"
- ✅ "Dependency chain"
- ✅ "Critical path"
- ✅ "Blocking vs. non-blocking tasks"

**Avoid these terms:**
- ❌ "Timeline"
- ❌ "Schedule"
- ❌ "Delivery date"
- ❌ "Milestone dates"
- ❌ "Sprint planning"

### Priority Criteria

Help users prioritize by providing:

1. **Technical dependencies**
   > "Phase 1 must complete before Phase 2 (authentication blocks OAuth)"

2. **Risk factors**
   > "High risk: database migration. Recommend tackling early."

3. **Value delivery**
   > "Phase 1 delivers core value. Phases 2-3 are enhancements."

4. **Complexity distribution**
   > "Front-load the L complexity work; S tasks can fill gaps later"

**Let the user decide:**
- Which phase to start with
- Whether to do all phases or stop after MVP
- How to balance risk vs. value

---

## Violation Examples and Corrections

### Example 1: Subtle Time Reference

❌ **Violation:**
> "This is a simple change to the config file"

✅ **Corrected:**
> "This is **S** complexity - updating configuration in config.yaml (single file, straightforward pattern)"

**Why it's wrong:** "Simple" implies time/effort assessment. Use T-shirt size instead.

### Example 2: Calendar Reference

❌ **Violation:**
> "We can have this ready by next sprint"

✅ **Corrected:**
> "This is **M** complexity. Based on your sprint capacity and priorities, you can schedule it in an upcoming iteration."

**Why it's wrong:** "Next sprint" is a calendar commitment. Let user decide timing.

### Example 3: Indirect Duration

❌ **Violation:**
> "The authentication module will be time-consuming due to OAuth complexity"

✅ **Corrected:**
> "The authentication module is **L** complexity due to:
> - OAuth integration (complex flow)
> - Token management (security critical)
> - Multiple provider support (3 integrations)
> - Extensive testing requirements"

**Why it's wrong:** "Time-consuming" is a duration reference. Use complexity factors instead.

### Example 4: Implicit Speed Reference

❌ **Violation:**
> "Let me quickly add the validation logic"

✅ **Corrected:**
> "Adding validation logic (**S** complexity - follows existing pattern in user_validator.py)"

**Why it's wrong:** "Quickly" implies time. Describe complexity instead.

### Example 5: Mixed Violations

❌ **Violation:**
> "This quick refactoring should take about 2 hours and be done by EOD"

✅ **Corrected:**
> "This is **S** complexity refactoring affecting:
> - user_service.py (extract helper method)
> - user_service_test.py (update 3 tests)
>
> You can schedule this based on your current workload."

**Why it's wrong:** Multiple violations - "quick" (implicit time), "2 hours" (explicit time), "EOD" (deadline).

---

## Formal Planning Requirements (MANDATORY)

> **Role split:** This section defines **WHEN** formal plans are required and **WHAT** compliance means. For **HOW** to produce a good plan — pre-generation checklist, verification economics calibration, conditional field requirements, domain confidence gates, output budget management — see **[Plan Generation Protocol](./plan-generation.md)**.

### When Formal Plans Are Required

**MUST create a formal plan JSON file when:**
- Task is **M complexity or larger**
- Task involves multiple steps/phases
- Task requires coordination between actors
- Task has irreversible actions
- Task requires capacity/resource tracking
- User explicitly requests a plan

**MAY skip formal plan for:**
- **XS** or **S** complexity tasks with single actor
- Immediate, reversible changes
- Exploratory/research tasks

### Plan Schema Compliance (ZERO TOLERANCE)

**All formal plans MUST:**

1. **Follow strict schema** at `/_specs/schemas/plan-schema.ts`
2. **Output valid JSON** that passes `PlanSchema.parse()`
3. **Pass well-formedness validation** via `validateWellFormedness()`
4. **Include all required fields**:
   - Metadata (version, snapshot, author)
   - Problem definition
   - Baseline state
   - Scope definition
   - Actor registrations
   - Steps with T-shirt sizes
   - Execution order
   - Verification economics
   - Acceptance criteria

**Enforcement:**
- Plans that fail schema validation = **BLOCKING ERRORS**
- Plans that fail well-formedness checks = **BLOCKING ERRORS**
- Missing required fields = **BLOCKING ERRORS**

### Plan File Structure

**File naming convention:**
```
plans/PLAN-{task-id}-v{semver}.json
```

**Example:**
```
plans/PLAN-add-auth-v1.0.0.json
plans/PLAN-migrate-db-v2.1.0.json
```

### Required Plan Format

**Minimum valid plan structure:**

```json
{
  "schemaVersion": "0.3.0",
  "metadata": {
    "planId": "unique-id",
    "version": "1.0.0",
    "createdAt": "2026-02-14T10:00:00Z",
    "updatedAt": "2026-02-14T10:00:00Z",
    "authorId": "actor-human-1",
    "snapshotRef": "abc123f",
    "branch": "main",
    "supersedes": [],
    "selfPath": "plans/PLAN-example-v1.0.0.json",
    "versionHistory": []
  },
  "problem": {
    "problemStatement": "Clear problem description",
    "affectedActors": ["actor-human-1"],
    "successOutcome": "Measurable success criteria"
  },
  "baseline": {
    "snapshotRef": "abc123f",
    "metrics": [{
      "name": "test-coverage",
      "baseline": 75,
      "floor": 75,
      "unit": "percent"
    }],
    "knownIssues": [],
    "invariants": [],
    "healthCommands": ["npm test"]
  },
  "resources": [],
  "scope": {
    "inScope": [{
      "id": "zone-1",
      "label": "Authentication module",
      "includes": ["src/auth/**"],
      "excludes": []
    }],
    "nonScope": []
  },
  "actors": [{
    "id": "actor-human-1",
    "kind": "human",
    "trustLevel": "operator",
    "label": "Lead Developer",
    "gitAuthor": "dev@example.com",
    "authorizedZones": ["zone-1"]
  }],
  "concurrency": {
    "mode": {
      "mode": "sequential",
      "executorId": "actor-human-1"
    },
    "channels": []
  },
  "verificationEconomics": {
    "unit": "checks-per-hour",
    "bwVerify": 10,
    "bwDecl": 3,
    "bwReview": 7,
    "intentProjection": [{
      "id": "intent-1",
      "name": "Test coverage maintained",
      "temporalScope": { "kind": "all-steps" },
      "modality": "hybrid",
      "gradingKind": "boolean",
      "predicateRef": "coverage >= baseline.metrics.test-coverage.floor"
    }]
  },
  "steps": [{
    "id": "step-1",
    "title": "Implement authentication",
    "description": "Add JWT-based authentication",
    "size": "M",
    "assignedTo": "actor-human-1",
    "dependsOn": [],
    "scopeZones": ["zone-1"],
    "fileChanges": [{
      "path": "src/auth/jwt.ts",
      "action": "create",
      "description": "JWT token generation"
    }],
    "blastRadius": [],
    "verification": [{
      "name": "Unit tests pass",
      "command": "npm test",
      "passCriteria": "All tests green",
      "blocking": true
    }],
    "reversibility": {
      "kind": "reversible",
      "rollbackProcedure": "git revert commit-sha"
    },
    "stopConditions": []
  }],
  "executionOrder": {
    "sequence": ["step-1"],
    "parallelizableGroups": []
  },
  "risks": [],
  "decisions": [],
  "dataSyncRules": {
    "syncRules": []
  },
  "acceptanceCriteria": [{
    "description": "All tests pass",
    "passCriteria": "npm test exits 0"
  }],
  "mergeStrategy": {
    "targetBranch": "main",
    "method": "squash",
    "requiredGates": ["tests", "review"],
    "approvers": ["actor-human-1"]
  },
  "futureWork": []
}
```

### Integration with T-shirt Sizing

**Step sizes MUST match estimation:**

| Estimation | Plan Step Size | File Count Check |
|------------|----------------|------------------|
| XS complexity | `"size": "XS"` | 1 file |
| S complexity | `"size": "S"` | 2-3 files |
| M complexity | `"size": "M"` | 4-8 files |
| L complexity | `"size": "L"` | 10-20 files |
| XL complexity | `"size": "XL"` | 20+ files (break down) |

**Validation:**
```typescript
import { PlanSchema, validateWellFormedness } from './plan-schema';

// 1. Parse JSON
const plan = PlanSchema.parse(jsonData);

// 2. Validate well-formedness
const result = validateWellFormedness(plan);

// 3. Check for errors (BLOCKING)
if (result.errors.length > 0) {
  throw new Error(`Plan validation failed: ${result.errors.join(', ')}`);
}

// 4. Review warnings (MUST be addressed)
if (result.warnings.length > 0) {
  console.warn(`Plan warnings: ${result.warnings.join(', ')}`);
}
```

### Plan Workflow

**1. Estimate complexity (this document)**
```
This is **M** complexity requiring:
- Authentication service (2 files)
- API endpoints (3 files)
- Tests (2 files)
```

**2. Generate formal plan JSON ([Plan Generation Protocol](./plan-generation.md))**
```bash
# Follow pre-generation checklist
# Load schema, gather domain inputs, resolve decisions
# Generate with skeleton-first strategy
# Apply conditional field requirements
```

**3. Validate against schema**
```bash
# Validate against schema
npm run validate-plan plans/PLAN-add-auth-v1.0.0.json
```

**4. Execute plan**
```bash
# Run plan executor (validates first)
npm run execute-plan plans/PLAN-add-auth-v1.0.0.json
```

**5. Update plan as work progresses**
```json
{
  "steps": [{
    "id": "step-1",
    "validationBudget": {
      "valReq": 5,
      "valDone": 5,  // Updated as work completes
      "valAuto": 3,
      "valHuman": 2
    }
  }]
}
```

### Prohibited Shortcuts

**NEVER:**
- ❌ Skip plan schema for M/L/XL complexity tasks
- ❌ Create informal markdown plans instead of JSON
- ❌ Omit required fields ("we'll add it later")
- ❌ Ignore schema validation errors
- ❌ Ignore well-formedness warnings
- ❌ Use invalid step sizes (must be XS/S/M/L/XL)
- ❌ Skip verification economics section
- ❌ Omit actor registrations

**Rationale:**
1. Machine-readable plans enable automation
2. Schema validation catches errors early
3. Formal structure ensures nothing is forgotten
4. Constraint tracking prevents overload
5. Audit trail for decisions and transitions

---

## Related Documents

- [Plan Generation Protocol](./plan-generation.md) - **HOW** to generate formally sound plans
- [Plan Schema](../../schemas/plan-schema.ts) - **MANDATORY** formal schema for all plans
- [No Batching](../ai-agents/no-batching.md) - Deliver complete work, don't split
- [Context Management](../ai-agents/context-management.md) - Efficient planning
- [Confidence Thresholds](../ai-agents/confidence-thresholds.md) - When to ask

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
