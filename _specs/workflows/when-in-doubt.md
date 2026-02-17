# When in Doubt

**Purpose:** Quick reference for decision-making when uncertain.

---

## Decision Hierarchy

When faced with uncertainty, consult in this order:

### 1. Check Project Documentation First

**Read in priority order:**
1. **PURPOSE.md** - Understand project intent and principles
2. **ADRs** - Check for existing architectural decisions
3. **Enhancement Proposals** - Check for ongoing discussions
4. **README.md** - Understand project usage and structure
5. **CONTRIBUTING.md** - Check contribution guidelines

**Example:**
> "Should I use Redis or Memcached for caching?"
>
> → Check ADRs first - there may be an ADR-042 that already decided this

---

### 2. Follow TDD

**Always use Test-Driven Development:**
1. **Red Phase**: Write failing test first
2. **Green Phase**: Implement minimal code to pass
3. **Refactor Phase**: Optimize while keeping tests green
4. **Cleanup Phase**: Remove old/dead code

**When uncertain about implementation:**
- Write the test that describes desired behavior
- Let the test guide the implementation
- Tests become executable specifications

---

### 3. Fix Root Causes

**Never patch symptoms, always fix root causes:**
- Ask "why" 5 times to find root cause
- Fix at the source, not at symptom location
- Prevent entire classes of bugs, not just this one instance

**Example:**
> "Should I add a null check here?"
>
> → Why is this null? Fix the source that produces null, don't patch everywhere null might appear

---

### 4. Write Tests

**When in doubt about correctness:**
- **Unit tests**: Verify individual functions work
- **Integration tests**: Verify components work together
- **E2E tests**: Verify complete workflows work
- **Property tests**: Verify algebraic properties hold

**Coverage targets:**
- Libraries: 80%+ line coverage
- CLI/Applications: 60%+ line coverage

---

### 5. Ask Questions

**Better to clarify than assume.**

**Good questions:**
- Specific with context
- Offer multiple options
- Include recommendation with rationale
- Show you've done research first

**Example:**
> "For error handling, I can:
> A) Return generic 'Invalid input' (simple, less helpful)
> B) Return field-level errors (complex, better UX)
> C) Follow pattern from user creation endpoint (consistent)
>
> I recommend C because it maintains consistency with ADR-023.
> Does this align with your expectations?"

---

## Quick Decision Matrix

| Situation | Action |
|-----------|--------|
| **M task requested** | Create formal plan → [Plan Generation Protocol](../ai-agents/plan-generation.md) |
| **L/XL task requested** | Build mental model first → [Mental Model Protocol](../ai-agents/mental-model-protocol.md), then plan |
| **Multiple valid approaches** | Check ADRs → Ask user with options |
| **Unclear requirements** | Ask specific questions with examples |
| **Performance concern** | Measure first, optimize second |
| **Security concern** | Validate/sanitize inputs, follow OWASP |
| **Breaking change** | Document impact, propose migration path |
| **Technical debt** | Fix if touching code, otherwise create issue |
| **Test failing** | Don't skip, fix root cause |
| **Linter warning** | Fix immediately, don't disable |
| **Coverage below target** | Add tests before committing |

---

## Common Scenarios

### "Should I create a formal plan?"

**Check:**
1. Is the task M, L, or XL complexity?
2. Does it involve multiple steps or coordination?
3. Are there irreversible actions?

**Decision:**
- ✅ **Yes** if: M/L/XL complexity OR multi-step OR irreversible
- ❌ **No** if: XS/S complexity, single actor, reversible

**If yes and L/XL:** Build a [Mental Model](../ai-agents/mental-model-protocol.md) first, then follow [Plan Generation Protocol](../ai-agents/plan-generation.md).
**If yes and M:** Follow [Plan Generation Protocol](../ai-agents/plan-generation.md) directly. Read the schema first.

### "Should I add this feature?"

**Check:**
1. Is it in PURPOSE.md scope?
2. Is there an Enhancement Proposal for it?
3. Does user explicitly request it?

**Decision:**
- ✅ **Yes** if: User requested OR Enhancement Proposal approved
- ❌ **No** if: Speculative "nice to have"

### "Should I refactor this code?"

**Check:**
1. Am I already touching this code?
2. Does it violate ADR standards?
3. Does it have test coverage?

**Decision:**
- ✅ **Yes** if: Touching it anyway OR clearly violates standards
- ❌ **No** if: Working code with tests, not related to current task

### "Should I add a TODO comment?"

**Never.**

**Instead:**
- ✅ Fix it now (production-ready code only)
- ✅ Create issue in tracker
- ✅ Add to backlog
- ❌ Don't commit TODO to main branch

### "Should I skip tests for this?"

**Never.**

**Always:**
- ✅ Follow TDD: Red → Green → Refactor → Cleanup
- ✅ Write regression tests at minimum
- ✅ Maintain coverage targets
- ❌ Never commit untested code

### "Should I use this dependency?"

**Check:**
1. Can stdlib do this?
2. Is dependency actively maintained?
3. Are there security vulnerabilities?
4. What's the license?
5. What's the transitive dependency cost?

**Decision:**
- ✅ **Yes** if: Saves significant work AND well-maintained AND license compatible
- ❌ **No** if: Simple to implement OR unmaintained OR license issues

### "Should I handle this error?"

**Always.**

**Libraries:**
- Return `Result`/`Either` types
- Never panic/throw in library code
- Provide meaningful error messages

**Applications:**
- Handle gracefully with user-friendly messages
- Log with appropriate severity
- Never ignore errors silently

### "Should I mock this in tests?"

**Check:**
1. Is it a system boundary? (network, file I/O, database)
2. Is it external API?
3. Is it framework/stdlib?

**Decision:**
- ✅ **Mock** if: External API OR system boundary
- ❌ **Don't mock** if: Stdlib OR framework OR your own code

### "Should I commit this?"

**Checklist:**
- [ ] All tests pass
- [ ] Coverage targets met
- [ ] No linter warnings
- [ ] No TODO/FIXME markers
- [ ] Code is formatted
- [ ] Follows ADR patterns
- [ ] Root cause fixed (not symptom)
- [ ] Production-ready

**If any checkbox unchecked:** Don't commit.

---

## Remember

### Production-Ready Code Only

If it's not done right, it's not done.

- No placeholders
- No incomplete implementations
- No workarounds
- No "fix later" code

### Fix Root Causes

- No patches
- No symptoms
- No band-aids
- Fix the source

### TDD Always

- Red → Green → Refactor → Cleanup
- No exceptions
- Regression tests at minimum

### When Uncertain

1. Check docs (PURPOSE.md, ADRs)
2. Follow TDD
3. Fix root causes
4. Write tests
5. Ask questions

---

## Emergency Decision Tree

```
Is this an emergency/outage?
│
├─ YES → Quick fix to restore service
│         → Document what you did
│         → Create issue for proper fix
│         → Fix root cause in next sprint
│
└─ NO → Follow standard workflow
        → Don't rush
        → Do it right the first time
```

**Remember:** Most "emergencies" aren't. Take time to do it properly.

---

## Anti-Patterns to Avoid

❌ "I'll fix it properly later" → Fix it properly now
❌ "This is just a quick hack" → No hacks in production
❌ "The tests can wait" → Tests come first (TDD)
❌ "I'll add TODO for now" → No TODOs in production
❌ "It works on my machine" → Not production-ready
❌ "Coverage doesn't matter for this" → Coverage always matters
❌ "I'll skip the ADR check" → Always check ADRs

---

## Success Patterns

✅ "Let me write the test first" → TDD
✅ "Let me check the ADRs" → Following decisions
✅ "This fixes the root cause" → Proper fix
✅ "All tests pass, coverage is 85%" → Production-ready
✅ "Let me ask for clarification" → Good judgment
✅ "I'll break this into smaller tasks" → Manageable scope

---

## Related Documents

- [Core Principles](../principles/core-principles.md) - Foundational standards
- [Quality Protocol](../principles/quality-protocol.md) - Enforcement
- [Feature Workflow](../workflows/feature-workflow.md) - Implementation process
- [Bug Workflow](../workflows/bug-workflow.md) - Bug fixing process
- [Plan Generation Protocol](../ai-agents/plan-generation.md) - When planning complex tasks

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
