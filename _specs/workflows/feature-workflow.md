# Feature Development Workflow

**Purpose:** Step-by-step workflow for implementing new features using TDD.

---

## Overview

This workflow ensures production-ready features through systematic TDD practice.

---

## Workflow Steps

### 0. PLAN Phase (M/L/XL Complexity Only)

For tasks estimated at **M complexity or larger**, plan before coding:

**For L/XL tasks:**
```bash
# 1. Build mental model (mental-model-protocol.md)
#    Inspect codebase → read references → produce MentalModel JSON
# 2. Present mental model for human review — STOP AND WAIT
# 3. After confirmation: generate plan (plan-generation.md)
#    Load schema → skeleton-first → fill → validate
# 4. Present plan for review before proceeding to RED
```

**For M tasks:**
```bash
# 1. Follow Plan Generation Protocol (plan-generation.md)
#    Load schema → resolve scope → generate → validate
# 2. Present plan for review before proceeding to RED
```

**Expected outcome:** Validated plan JSON with steps, verification, and constraints. For L/XL: human-confirmed mental model first.

**Verification:**
- [ ] (L/XL) Mental model reviewed and confirmed
- [ ] Plan passes schema validation
- [ ] Plan passes well-formedness checks
- [ ] Semantic self-check passes
- [ ] Domain entities verified against codebase

**Skip this phase for XS/S tasks.** Proceed directly to RED phase.

---

### 1. RED Phase: Write Failing Test

```bash
# Write failing test first
vim test_feature.py

# Run test - it MUST fail
run_tests test_feature_name
```

**Expected outcome:** Test fails for the right reason.

**Verification:**
- [ ] Test fails (not passes, not errors)
- [ ] Failure message is clear
- [ ] Test describes expected behavior

**Example:**
```python
def test_user_registration_requires_email():
    """User registration must validate email presence."""
    with pytest.raises(ValidationError, match="email is required"):
        register_user(username="john", email=None)
```

---

### 2. GREEN Phase: Implement Minimal Solution

```bash
# Implement minimal code to pass test
vim source.py

# Run test - it MUST pass
run_tests test_feature_name
```

**Expected outcome:** Test passes with minimal implementation.

**Verification:**
- [ ] Test passes
- [ ] Only necessary code added
- [ ] No over-engineering

**Example:**
```python
def register_user(username: str, email: Optional[str]) -> User:
    if email is None:
        raise ValidationError("email is required")
    return User(username=username, email=email)
```

---

### 3. REFACTOR Phase: Optimize While Keeping Tests Green

```bash
# Improve code quality
vim source.py

# Verify linter compliance
run_linter

# Verify all tests still pass
run_tests
```

**Expected outcome:** Better code, all tests still pass.

**Verification:**
- [ ] Code is more readable
- [ ] No duplication
- [ ] Proper abstractions
- [ ] All tests pass

**Example:**
```python
def register_user(username: str, email: Optional[str]) -> User:
    _validate_registration_data(username, email)
    return User(username=username, email=email)

def _validate_registration_data(username: str, email: Optional[str]) -> None:
    if email is None:
        raise ValidationError("email is required")
    if not _is_valid_email(email):
        raise ValidationError("email format is invalid")
```

---

### 4. CLEANUP Phase: Remove Old/Dead Code

```bash
# Remove deprecated code
vim source.py

# Update documentation
vim README.md

# Verify no regressions
run_tests
```

**Expected outcome:** Codebase is cleaner, no dead code.

**Verification:**
- [ ] No commented-out code
- [ ] No unused imports
- [ ] No unreachable code
- [ ] Documentation updated

---

### 5. Verify Coverage

```bash
# Check coverage
run_coverage_report
```

**Expected outcome:** Coverage meets or exceeds targets (80% lib, 60% CLI).

**Verification:**
- [ ] Coverage target met
- [ ] New code is covered
- [ ] Edge cases tested

**If coverage is insufficient:**
```bash
# Add more tests
vim test_feature.py

# Re-check coverage
run_coverage_report
```

---

### 6. Pre-commit Checks

```bash
# These run automatically via pre-commit hook

# Format check
run_formatter --check

# Lint check
run_linter --deny-warnings

# Full test suite
run_tests --all

# Coverage check
run_coverage --fail-under=80
```

**Expected outcome:** All checks pass.

**Verification:**
- [ ] Code is formatted
- [ ] No linter warnings
- [ ] All tests pass
- [ ] Coverage targets met

---

### 7. Commit with Conventional Format

```bash
git add source.py test_feature.py
git commit -m "feat(module): add user email validation

- Validates email presence during registration
- Rejects null/empty email addresses
- Returns clear error messages

Closes #123"
```

**Verification:**
- [ ] Follows conventional commits format
- [ ] Descriptive commit message
- [ ] References relevant issues

---

### 8. Update CHANGELOG (If Feature Complete)

**Only when entire feature is complete** (not every commit):

```markdown
## [Unreleased]

### Added
- User email validation during registration
  - Rejects registrations without email
  - Validates email format (RFC 5322)
  - Clear error messages for users
```

**When to update:**
- Feature is complete and tested
- Epic is finished
- Before creating a release

**When NOT to update:**
- Work in progress
- Internal refactorings
- Every commit

---

## Complete Example

### Scenario: Add User Profile Update Feature

**1. RED: Write failing test**
```python
# test_user_profile.py
def test_update_profile_changes_email():
    user = create_user(email="old@example.com")
    update_profile(user.id, email="new@example.com")

    updated = get_user(user.id)
    assert updated.email == "new@example.com"
```

```bash
pytest test_user_profile.py::test_update_profile_changes_email
# FAILS: NotImplementedError
```

**2. GREEN: Minimal implementation**
```python
# user_service.py
def update_profile(user_id: str, email: str) -> None:
    user = repository.get(user_id)
    user.email = email
    repository.save(user)
```

```bash
pytest test_user_profile.py::test_update_profile_changes_email
# PASSES
```

**3. REFACTOR: Add validation**
```python
# test_user_profile.py
def test_update_profile_validates_email():
    user = create_user(email="old@example.com")

    with pytest.raises(ValidationError):
        update_profile(user.id, email="invalid")
```

```python
# user_service.py
def update_profile(user_id: str, email: str) -> None:
    if not is_valid_email(email):
        raise ValidationError(f"Invalid email: {email}")

    user = repository.get(user_id)
    user.email = email
    repository.save(user)
```

**4. CLEANUP: Extract validator**
```python
# user_validator.py
class UserValidator:
    @staticmethod
    def validate_email(email: str) -> None:
        if not is_valid_email(email):
            raise ValidationError(f"Invalid email: {email}")

# user_service.py
def update_profile(user_id: str, email: str) -> None:
    UserValidator.validate_email(email)

    user = repository.get(user_id)
    user.email = email
    repository.save(user)
```

**5. Coverage check**
```bash
pytest --cov=user_service --cov=user_validator
# 85% coverage ✓
```

**6. Pre-commit**
```bash
black user_service.py user_validator.py test_user_profile.py
ruff check user_service.py user_validator.py
pytest
# All pass ✓
```

**7. Commit**
```bash
git add user_service.py user_validator.py test_user_profile.py
git commit -m "feat(user): add profile update with email validation

- Users can update their email address
- Email format is validated before saving
- Returns clear error for invalid emails

Closes #234"
```

**8. Update CHANGELOG (if feature complete)**
```markdown
## [Unreleased]

### Added
- User profile update functionality
  - Update email address
  - Email validation (RFC 5322 compliance)
  - Clear error messages for validation failures
```

---

## Troubleshooting

### Test Stays Red
- Check test is testing the right thing
- Verify implementation matches test expectations
- Simplify test to isolate issue
- Add debug logging

### Test Passes Immediately (Should Fail First)
- Test might not be testing anything
- Rewrite test to be more specific
- Verify assertions are correct

### Coverage Below Target
- Add tests for edge cases
- Test error conditions
- Test boundary values
- Use coverage report to find gaps

### Linter Warnings
- Fix warnings immediately
- Don't disable linter rules
- Follow project style guide
- Configure editor to auto-fix

---

## Tips for Effective TDD

1. **Write smallest possible failing test**
   - One assertion per test
   - Clear failure message
   - Obvious what's missing

2. **Implement simplest code to pass**
   - Don't anticipate future requirements
   - Refactor later if needed
   - Let tests drive design

3. **Refactor fearlessly**
   - Tests provide safety net
   - Improve continuously
   - Remove duplication

4. **Keep tests fast**
   - Mock external dependencies
   - Use in-memory databases for tests
   - Parallelize when possible

5. **Test behavior, not implementation**
   - Test public API
   - Don't test private methods directly
   - Allow implementation to change

---

## Related Documents

- [Testing Standards](../development/testing-standards.md) - Testing requirements
- [Code Quality](../development/code-quality.md) - Quality standards
- [Git Workflow](../development/git-workflow.md) - Commit and PR process
- [Core Principles](../principles/core-principles.md) - TDD requirement
- [Plan Generation Protocol](../ai-agents/plan-generation.md) - For M/L/XL features, plan before coding

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
