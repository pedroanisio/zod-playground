# Context Window Management

**Purpose:** Guidelines for AI agents to prioritize information when context is limited.

---

## Priority Reading Order

When context is limited, prioritize reading in this order:

1. **PURPOSE.md** - Understand project intent, vision, and philosophy
2. **Relevant ADRs** - Understand technical decisions for the area you're working in
3. **Test files** - Understand expected behavior through tests
4. **Source code** - Understand implementation details

**Rationale:**
- **Purpose first** ensures you understand the "why" before the "what"
- **ADRs** prevent violating established architectural decisions
- **Tests** reveal intent more clearly than implementation
- **Source code** is the last resort, not the first

---

## Document Relationships

```
PURPOSE.md (WHY)
    ↓
ADRs (HOW WE DECIDED)
    ↓
Tests (WHAT WE EXPECT)
    ↓
Source Code (HOW WE IMPLEMENTED)
```

Each layer provides context for understanding the next.

---

## Context-Limited Strategies

### When You Can't Read Everything

**Strategy 1: Targeted Reading**
```
User: "Fix the authentication bug"

Priority:
1. Read PURPOSE.md authentication principles
2. Read ADR on authentication strategy
3. Read authentication tests
4. Read authentication implementation
5. Skip: Unrelated modules
```

**Strategy 2: Breadth-First Exploration**
```
User: "How does the system work?"

Priority:
1. Read PURPOSE.md (high-level intent)
2. Scan ADR index/README (architectural overview)
3. Read main README.md (usage overview)
4. Explore key modules based on above
5. Skip: Implementation details initially
```

**Strategy 3: Depth-First Investigation**
```
User: "Why is the parser so slow?"

Priority:
1. Read parser tests (understand expectations)
2. Read parser ADRs (understand design decisions)
3. Profile/benchmark parser (understand bottlenecks)
4. Read parser implementation (understand why it's slow)
5. Skip: Unrelated modules
```

**Strategy 4: Plan Generation**
```
User: "Plan the implementation of feature X" (M/L/XL complexity)

Priority:
1. Read plan-schema.ts (required — do not generate from memory)
2. Read plan-generation.md (generation protocol)
3. Read PURPOSE.md and relevant ADRs (intent and constraints)
4. Run treemeta.sh to map codebase structure (scope zones, existing files)
5. Verify domain entities against treemeta output (do not invent names)
6. Skip: Implementation details (planning phase, not coding phase)
```

**Codebase exploration with treemeta.sh:**

When available in `_specs/scripts/`, `treemeta.sh` produces token-efficient file metadata. Preferred over raw `find` or `tree` because it respects `.gitignore`, supports filtering by extension and date, and paginates large outputs to avoid context flooding.

```bash
# Quick overview: how big is this codebase?
_specs/scripts/treemeta.sh -g --count ./src

# Filtered inventory for a specific area
_specs/scripts/treemeta.sh -g -l -e ts,tsx --limit 50 ./src/auth

# What changed recently? (find active areas of work)
_specs/scripts/treemeta.sh -g -l --sort modified -o desc --limit 20 .
```

If the tool is not available, fall back to `find . -type f | head -50` or `tree -fi --gitignore`, but prefer structured output.

---

## What to Skip

When context is limited, you can safely skip:

- Unrelated modules/files
- Historical commit messages (unless investigating regression)
- Dependency source code (unless debugging dependency issue)
- Generated code (focus on generators instead)
- Verbose documentation (prioritize concise ADRs/tests)

---

## Context Budget Allocation

If you have limited context budget (e.g., 100K tokens):

**Allocate approximately:**
- 10% - PURPOSE.md and project overview
- 20% - Relevant ADRs
- 30% - Test files for area of work
- 30% - Source code for area of work
- 10% - Buffer for exploration/clarification

**Adjust based on task:**
- Bug fixes: More tests, less overview
- New features: More ADRs, balanced code/tests
- Refactoring: More source code, existing tests
- Architecture decisions: More PURPOSE.md and ADRs
- Plan generation: Schema + generation protocol first, then codebase structure for scope/entity verification

---

## Efficient Reading Techniques

### Scanning vs. Deep Reading

**Scan quickly:**
- File/directory structure
- ADR titles and statuses
- Test names and assertions
- Function/class signatures
- Comments marking important sections

**Read deeply:**
- PURPOSE.md (always read fully)
- ADRs relevant to your task
- Tests that fail or relate to your change
- Code sections you're modifying

### Using Search Effectively

**Instead of reading entire files:**
```bash
# Find authentication-related code
grep -r "authentication" --include="*.md"

# Find relevant tests
find . -name "*auth*test*"

# Find ADRs about databases
ls docs/adrs/ | grep -i database

# Token-efficient file inventory (if treemeta.sh available)
_specs/scripts/treemeta.sh -g -l -e ts,tsx --limit 30 ./src
```

---

## Cache and Reuse Context

**Across multiple turns:**
- Remember key ADRs you've read
- Cache architectural understanding
- Reuse test understanding when modifying nearby code
- Build mental model incrementally

**Don't re-read:**
- Files that haven't changed
- ADRs you've already processed
- Test files for areas you understand

---

## When to Ask for Guidance

**Ask user to provide context when:**
- Critical ADRs are missing
- PURPOSE.md doesn't exist or is vague
- Test coverage is too low to understand behavior
- Documentation contradicts implementation

**Example:**
> "I don't see an ADR documenting the authentication strategy. Could you:
> 1. Point me to relevant documentation, or
> 2. Confirm whether I should follow OAuth2 patterns from the existing login code?"

---

## Context Prioritization Example

**Scenario:** "Add rate limiting to API"

**Context loading order:**
```
1. Read PURPOSE.md (2K tokens)
   → Understand: Why does this API exist? What principles guide it?

2. Search for rate limiting ADRs (5K tokens)
   → Find: ADR-023 chose Redis for rate limiting
   → Understand: Architectural constraints, performance requirements

3. Read API test files (15K tokens)
   → Understand: Current API behavior, testing patterns

4. Read API middleware code (10K tokens)
   → Understand: Where to add rate limiting, existing middleware

5. Read rate limiter library docs (8K tokens)
   → Understand: How to implement Redis-based rate limiting

Total: 40K tokens (efficient use of context)
```

**What we skipped:**
- Database schema (not relevant for rate limiting)
- Frontend code (API-only change)
- Unrelated API endpoints
- Historical discussions about rate limiting

---

## Incremental Loading

Don't load everything at once:

**Phase 1: Understand (10-20% of context)**
- PURPOSE.md
- Relevant ADRs
- README.md

**Phase 2: Plan (20-30% of context)**
- Test files for area
- Related code signatures
- Dependencies/interfaces

**Phase 3: Implement (40-50% of context)**
- Source code to modify
- Related utilities
- Examples of similar implementations

**Phase 4: Validate (10-20% of context)**
- Run tests
- Check coverage
- Verify ADR compliance

---

## Related Documents

- [Confidence Thresholds](../ai-agents/confidence-thresholds.md) - When to ask vs. proceed
- [Incremental Validation](../ai-agents/incremental-validation.md) - Validate as you go
- [Plan Generation Protocol](./plan-generation.md) - Context strategy for plan generation
- [Core Principles](../principles/core-principles.md) - What to prioritize

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
