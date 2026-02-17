# Incremental Validation

**Purpose:** Validate work continuously throughout implementation, not just at the end.

---

## Don't Wait Until Everything is Complete

**Anti-pattern:**
```
1. Write all code
2. Write all tests
3. Run formatter
4. Run linter
5. Run tests
6. Fix everything at once
```

**Problem:** Fixing issues is expensive and time-consuming when found late.

---

## Correct Approach: Validate Incrementally

### After Each TDD Phase

**Red Phase → Validate**
```bash
# Write failing test
vim test_user.py

# Verify test fails for the right reason
pytest test_user.py::test_user_validation
# ✓ Confirm it fails as expected
```

**Green Phase → Validate**
```bash
# Implement minimal code
vim user.py

# Verify test passes
pytest test_user.py::test_user_validation
# ✓ Confirm it passes now

# Quick lint check
ruff check user.py
# ✓ Confirm no new warnings
```

**Refactor Phase → Validate**
```bash
# Optimize code
vim user.py

# Verify tests still pass
pytest test_user.py
# ✓ Confirm refactoring didn't break anything

# Check coverage
pytest --cov=user
# ✓ Confirm coverage maintained/improved
```

**Cleanup Phase → Validate**
```bash
# Remove dead code
git diff

# Verify all tests still pass
pytest
# ✓ Confirm cleanup didn't break anything
```

---

## Validation Frequency

### During Implementation

**Every code change:**
- [ ] Does it compile/parse?
- [ ] Do related tests still pass?
- [ ] Any obvious linter warnings?

**Every few minutes:**
- Run specific test you're working on
- Quick linter check on modified files
- Verify behavior matches expectation

### Before Committing

**Pre-commit validation:**
- [ ] All tests pass
- [ ] Formatter applied
- [ ] Linter clean (zero warnings)
- [ ] Coverage targets met
- [ ] No TODOs or placeholders

### During Code Review

**While reviewing code:**
- [ ] ADR compliance
- [ ] Test coverage adequate
- [ ] Error handling proper
- [ ] Documentation updated
- [ ] No anti-patterns

---

## Validation Tools by Phase

### Phase 1: Syntax/Compilation

**Run frequently** (after every few lines):
```bash
# Python
python -m py_compile user.py

# JavaScript/TypeScript
tsc --noEmit

# Rust
cargo check

# Go
go build
```

**Why:** Catch syntax errors immediately, not after 100 lines.

### Phase 2: Unit Tests

**Run frequently** (after implementing each function):
```bash
# Run specific test
pytest test_user.py::test_user_validation -v

# Run test file
pytest test_user.py

# Run related tests
pytest -k "user"
```

**Why:** Confirm logic works before moving to next function.

### Phase 3: Linting

**Run periodically** (every 5-10 minutes):
```bash
# Lint single file
eslint src/user.js

# Lint with autofix
ruff check --fix user.py

# Type checking
mypy user.py
```

**Why:** Fix style issues while context is fresh.

### Phase 4: Formatting

**Run before commit**:
```bash
# Format code
black user.py
prettier --write user.js
rustfmt user.rs

# Verify formatting
black --check user.py
```

**Why:** Automated formatting is non-controversial.

### Phase 5: Integration Tests

**Run after component complete**:
```bash
# Run integration tests
pytest tests/integration/

# Run with coverage
pytest tests/integration/ --cov
```

**Why:** Verify components work together before moving on.

### Phase 6: Full Test Suite

**Run before pushing**:
```bash
# Run everything
pytest

# Run with coverage check
pytest --cov --cov-fail-under=80

# Run in CI mode
pytest -x --ff --tb=short
```

**Why:** Ensure no regressions before sharing code.

---

## Continuous Validation Workflow

### Example: Adding New Feature

```bash
# 1. Write failing test
vim test_calculator.py
pytest test_calculator.py::test_add
# VALIDATE: ✓ Test fails as expected

# 2. Implement minimal code
vim calculator.py
pytest test_calculator.py::test_add
# VALIDATE: ✓ Test passes

# 3. Check linter
ruff check calculator.py
# VALIDATE: ✓ No warnings

# 4. Add edge case test
vim test_calculator.py
pytest test_calculator.py::test_add_negative
# VALIDATE: ✓ Test fails

# 5. Fix edge case
vim calculator.py
pytest test_calculator.py
# VALIDATE: ✓ All tests pass

# 6. Refactor for clarity
vim calculator.py
pytest test_calculator.py
# VALIDATE: ✓ Still passes after refactor

# 7. Format code
black calculator.py test_calculator.py
# VALIDATE: ✓ Formatted

# 8. Full test suite
pytest
# VALIDATE: ✓ No regressions

# 9. Coverage check
pytest --cov=calculator --cov-fail-under=80
# VALIDATE: ✓ Coverage meets target

# 10. Commit
git add calculator.py test_calculator.py
git commit -m "feat(calc): add addition with negative number support"
```

**Total validation points:** 9 (vs. 1 at the end)

**Benefit:** Issues caught immediately, not after 1 hour of coding.

---

## Validation Against ADRs

### During Implementation

**Check ADRs frequently:**
- [ ] Am I following the established error handling pattern? (ADR-021)
- [ ] Am I using the approved database library? (ADR-035)
- [ ] Am I following the testing strategy? (ADR-122)
- [ ] Does this align with architectural decisions? (ADR-060)

**When:** Before committing each logical unit of work.

**How:**
```bash
# Find relevant ADRs
grep -r "error handling" docs/adrs/

# Re-read relevant ADR
cat docs/adrs/ADR-021-error-handling.md

# Verify compliance
# ✓ Using thiserror for typed errors
# ✓ No unwrap() in library code
# ✓ Meaningful error messages with context
```

---

## Incremental Coverage Tracking

### Track Coverage as You Go

```bash
# Baseline coverage
pytest --cov --cov-report=term-missing
# Current: 78% (need 80%)

# After adding feature
pytest --cov --cov-report=term-missing
# Current: 79.5% (still need 80%)

# After adding more tests
pytest --cov --cov-report=term-missing
# Current: 81% (✓ Target met!)
```

**Don't wait** to discover coverage gap at the end.

### Per-File Coverage

```bash
# Check specific file coverage
pytest --cov=src/user --cov-report=term-missing

# Identify uncovered lines
# src/user.py: 45-47, 92-95

# Add tests for those lines
# Re-check
pytest --cov=src/user --cov-report=term-missing
# ✓ 100% coverage on user.py
```

---

## Validation Checklist Template

Use this checklist after each significant change:

```
[ ] Syntax/compilation clean
[ ] Specific test passes
[ ] No new linter warnings
[ ] No new type errors
[ ] Coverage maintained/improved
[ ] Follows ADR patterns
[ ] No placeholders added
[ ] Error handling proper
```

**Don't wait** until commit to run this checklist.

---

## Tools for Continuous Validation

### Watch Mode

**Automatically re-run on file changes:**
```bash
# Python
pytest-watch

# JavaScript
jest --watch

# Rust
cargo watch -x test

# Go
got watch
```

**Benefit:** Instant feedback on every save.

### IDE Integration

**Configure IDE to run:**
- Linter on save
- Formatter on save
- Type checker on type
- Tests on file change

**Benefit:** See issues before leaving editor.

### Pre-commit Hooks

**Automated validation:**
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: test
        name: Run tests
        entry: pytest
        language: system
        pass_filenames: false
        always_run: true
```

**Benefit:** Can't commit broken code.

---

## Benefits of Incremental Validation

1. **Early error detection** - Fix issues when context is fresh
2. **Smaller debugging surface** - Know exactly what change broke it
3. **Continuous confidence** - Always know current state is working
4. **Faster iteration** - Don't waste time on big broken changes
5. **Better code quality** - Encourages clean, incremental changes

---

## Plan Validation (For M/L/XL Tasks)

The incremental validation principle applies to plan generation, not just code. When generating formal plans:

**After skeleton generation → Validate**
- Referential integrity: all step IDs in execution order, all dependsOn targets exist
- DAG acyclicity: no circular dependencies
- Actor-zone authorization: assigned actors have access to declared scope zones

**After filling step details → Validate per step**
- Size ↔ file count consistency against T-shirt table
- Conditional fields populated (stopConditions, resourceRequirements for M+ steps)
- Detection adequacy: L/XL steps have human verification checks

**Before emitting plan → Validate**
- Full self-check (structural + semantic) per [Plan Generation Protocol](../ai-agents/plan-generation.md) §3
- Verification economics: `bwDecl + bwReview ≤ bwVerify`
- Domain confidence: no unverified entity names

**Don't wait** until the plan is fully generated to discover structural errors. Validate the skeleton first, then fill and validate incrementally.

---

## Related Documents

- [Testing Standards](../development/testing-standards.md) - What to validate
- [Code Quality](../development/code-quality.md) - Quality standards
- [Feature Workflow](../workflows/feature-workflow.md) - Full workflow with validation
- [Plan Generation Protocol](../ai-agents/plan-generation.md) - Plan validation self-checks

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
