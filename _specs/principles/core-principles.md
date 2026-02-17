# Core Principles (Non-Negotiable)

**Purpose:** Foundational principles that guide all development work. These are absolute requirements with no exceptions.

---

## 1. Root Cause Fixing

- **ALWAYS fix the root cause** — NEVER patch symptoms or workaround core issues
- No shortcuts "just to make it simple"
- Pre-existing errors are NOT excuses — fix them correctly (users don't care if it was already broken)
- If you're generating code, fix the generator, not the generated output

**Why this matters:**
- Patches create technical debt that compounds over time
- Symptoms will resurface in different forms
- Root cause fixes prevent entire classes of bugs
- Future maintainers inherit your architectural decisions

---

## 2. Test-Driven Development (TDD)

Every code change, fix, or feature MUST follow **strict TDD**:

1. **Red Phase**: Write failing test first
2. **Green Phase**: Implement minimal code to pass the test
3. **Refactor Phase**: Optimize while keeping tests green
4. **Cleanup Phase**: Remove old/dead code

**No exceptions.** If TDD isn't possible, create **regression tests** at minimum.

**Why this matters:**
- Tests become living documentation of intent
- Refactoring becomes safe and confident
- Design emerges from usage patterns, not speculation
- Coverage is automatic, not an afterthought

---

## 3. Production-Ready Code Only

- NO placeholders: `TODO`, `FIXME`, `unimplemented!()`, `todo!()`, `panic!("TODO")`
- NO stub functions or mock data outside test code
- NO incomplete implementations — if it's not ready, don't commit it
- Use feature flags to hide incomplete work, not broken code
- Code in main branch must always be deployable

**Why this matters:**
- Main branch represents production-ready state
- Placeholders become permanent technical debt
- Incomplete code blocks other developers
- Deployment confidence requires zero broken code

---

## Enforcement

These principles are **non-negotiable**. Every code change must satisfy all three:

- [ ] Did I fix the root cause, not the symptom?
- [ ] Did I follow TDD (Red → Green → Refactor → Cleanup)?
- [ ] Is this production-ready with zero placeholders?

If you cannot meet these standards, explain the gap and propose how to achieve compliance rather than delivering substandard code.

---

## Related Documents

- [Anti-Patterns](../principles/anti-patterns.md) - Common violations of these principles
- [Quality Protocol](../principles/quality-protocol.md) - Enforcement mechanisms
- [Testing Standards](../development/testing-standards.md) - Detailed TDD practices

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
