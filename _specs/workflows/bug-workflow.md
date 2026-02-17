# Bug Fix Workflow

**Purpose:** Systematic approach to fixing bugs using root cause analysis and TDD.

---

## Overview

This workflow ensures bugs are fixed at their root cause and prevented from recurring.

---

## Workflow Steps

### 1. RED: Write Failing Test that Reproduces the Bug

```bash
# Write test that demonstrates the bug
vim test_bug_reproduction.py

# Run test - it MUST fail (showing the bug exists)
run_tests test_bug_reproduction
```

**Expected outcome:** Test fails, reproducing the exact bug.

**Verification:**
- [ ] Test fails with the bug's symptoms
- [ ] Test is minimal and focused
- [ ] Test will pass when bug is fixed

**Example:**
```python
def test_division_by_zero_returns_error():
    """Bug: Division by zero crashes instead of returning error."""
    calculator = Calculator()

    # This currently raises unhandled ZeroDivisionError
    # Should return Result.Error instead
    result = calculator.divide(10, 0)

    assert result.is_error()
    assert "division by zero" in result.error_message.lower()
```

---

### 2. Investigate Root Cause

**Don't jump to fixing symptoms** - understand why the bug exists.

#### Techniques:

**A. Stack Trace Analysis**
```bash
# Run test with full traceback
pytest test_bug.py -vv --tb=long

# Identify where error originates
# Not where it surfaces
```

**B. Git Blame/Bisect**
```bash
# Find when bug was introduced
git blame problematic_file.py

# Binary search for breaking commit
git bisect start
git bisect bad  # Current version has bug
git bisect good v1.2.0  # This version was fine
```

**C. Add Debug Logging**
```python
def problematic_function(x, y):
    logger.debug(f"Input: x={x}, y={y}")
    result = x / y
    logger.debug(f"Result: {result}")
    return result
```

**D. Check Related Code**
```bash
# Find similar patterns
grep -r "divide\|division" --include="*.py"

# Check if bug exists elsewhere
```

---

### 3. Identify Root Cause

Ask the "5 Whys":

**Example:**
1. **Why did the app crash?**
   → Division by zero wasn't handled

2. **Why wasn't division by zero handled?**
   → No validation before division operation

3. **Why was there no validation?**
   → Function assumed input would always be valid

4. **Why did it assume valid input?**
   → No API contract/validation layer

5. **Why is there no validation layer?**
   → **Root cause:** Missing input validation architecture

**Fix the root cause** (validation layer), not the symptom (this one division).

---

### 4. GREEN: Fix the Root Cause

```bash
# Implement fix at root cause level
vim source.py

# Run test - it MUST pass now
run_tests test_bug_reproduction
```

**Expected outcome:** Test passes, bug is fixed.

**Verification:**
- [ ] Test passes
- [ ] Fix addresses root cause, not symptom
- [ ] Similar bugs prevented by fix

**Bad fix (symptom):**
```python
def divide(x, y):
    # Only fixes this one instance
    if y == 0:
        return Result.error("division by zero")
    return Result.ok(x / y)
```

**Good fix (root cause):**
```python
# validator.py - Shared validation layer
class MathValidator:
    @staticmethod
    def validate_divisor(value: float) -> None:
        if value == 0:
            raise ValidationError("Divisor cannot be zero")

# calculator.py - All operations use validation
def divide(x, y):
    MathValidator.validate_divisor(y)
    return Result.ok(x / y)

def modulo(x, y):
    MathValidator.validate_divisor(y)  # Prevents same bug here
    return Result.ok(x % y)
```

---

### 5. Verify No Regressions

```bash
# Run ALL tests, not just the bug fix test
run_tests --all
```

**Expected outcome:** All tests pass.

**Verification:**
- [ ] New test passes
- [ ] Existing tests still pass
- [ ] No unexpected failures

**If tests fail:**
- Fix is too broad and breaks other functionality
- Need more targeted fix
- Need to update tests if behavior intentionally changed

---

### 6. Add Additional Edge Case Tests

```bash
# Add tests for related scenarios
vim test_bug_edge_cases.py

# Verify edge cases work
run_tests test_bug_edge_cases
```

**Consider:**
- [ ] Boundary values (0, negative, max int)
- [ ] Null/undefined inputs
- [ ] Empty collections
- [ ] Related operations with same issue

**Example:**
```python
def test_division_by_zero_with_negative_numerator():
    result = calculator.divide(-10, 0)
    assert result.is_error()

def test_division_by_very_small_number():
    # Near-zero but not zero
    result = calculator.divide(10, 0.0000001)
    assert result.is_ok()

def test_modulo_by_zero_also_prevented():
    # Root cause fix should prevent this too
    result = calculator.modulo(10, 0)
    assert result.is_error()
```

---

### 7. Update Documentation

```bash
# Document behavior
vim docs/calculator.md

# Update API documentation
vim README.md
```

**Document:**
- Error conditions and handling
- Valid input ranges
- Expected behavior for edge cases

**Example:**
```markdown
## Calculator.divide(x, y)

Divides x by y.

**Parameters:**
- `x` (float): Numerator
- `y` (float): Denominator (must not be zero)

**Returns:**
- `Result.ok(value)` on success
- `Result.error(message)` if y is zero

**Errors:**
- `ValidationError`: If y is zero

**Example:**
```python
result = calculator.divide(10, 2)
# => Result.ok(5.0)

result = calculator.divide(10, 0)
# => Result.error("Divisor cannot be zero")
```
```

---

### 8. Commit

```bash
git add calculator.py math_validator.py test_bug.py docs/calculator.md
git commit -m "fix(calc): prevent division by zero crash

Root cause: Missing input validation layer for mathematical operations.

Changes:
- Add MathValidator with divisor validation
- Apply validation to divide() and modulo()
- Add comprehensive tests for zero divisor
- Update documentation with error conditions

Previously, division by zero raised unhandled ZeroDivisionError.
Now returns Result.error() with clear message.

Fixes #456"
```

**Verification:**
- [ ] Conventional commits format
- [ ] Explains root cause
- [ ] Lists changes
- [ ] References issue

---

## Complete Example

### Scenario: User Login Fails with Whitespace in Email

**1. RED: Reproduce bug**
```python
def test_login_with_email_whitespace():
    """Bug: Login fails when email has trailing whitespace."""
    create_user(email="user@example.com", password="secret")

    # This currently fails but should succeed
    result = login(email="user@example.com ", password="secret")

    assert result.is_authenticated()
    assert result.user.email == "user@example.com"
```

```bash
pytest test_login.py::test_login_with_email_whitespace
# FAILS: Authentication failed
```

**2. Investigate root cause**
```python
# Check login logic
def login(email: str, password: str):
    user = repository.find_by_email(email)  # Exact match required
    if user and user.check_password(password):
        return AuthResult.success(user)
    return AuthResult.failure()
```

**Root cause:** Email comparison is case-sensitive and whitespace-sensitive.

**Ask 5 Whys:**
1. Why did login fail? → Email didn't match
2. Why didn't it match? → Trailing whitespace
3. Why does whitespace matter? → Exact string comparison
4. Why exact comparison? → No normalization layer
5. **Root cause:** Missing email normalization architecture

**3. GREEN: Fix root cause**
```python
# email_normalizer.py - New normalization layer
class EmailNormalizer:
    @staticmethod
    def normalize(email: str) -> str:
        """Normalize email for consistent comparison."""
        return email.strip().lower()

# user.py - Apply at storage and lookup
class User:
    def __init__(self, email: str, password: str):
        self.email = EmailNormalizer.normalize(email)
        self._password_hash = hash_password(password)

# auth_service.py - Apply at login
def login(email: str, password: str):
    normalized = EmailNormalizer.normalize(email)
    user = repository.find_by_email(normalized)
    if user and user.check_password(password):
        return AuthResult.success(user)
    return AuthResult.failure()
```

**4. Verify no regressions**
```bash
pytest
# All tests pass ✓
```

**5. Add edge case tests**
```python
def test_login_with_uppercase_email():
    create_user(email="user@example.com", password="secret")
    result = login(email="USER@EXAMPLE.COM", password="secret")
    assert result.is_authenticated()

def test_login_with_mixed_case_and_whitespace():
    create_user(email="user@example.com", password="secret")
    result = login(email="  UsEr@ExAmPlE.cOm  ", password="secret")
    assert result.is_authenticated()

def test_registration_normalizes_email():
    user = create_user(email="  USER@EXAMPLE.COM  ", password="secret")
    assert user.email == "user@example.com"
```

**6. Update documentation**
```markdown
## Email Handling

All email addresses are automatically normalized:
- Converted to lowercase
- Whitespace trimmed
- Consistent storage and comparison

Example:
- Input: "  USER@Example.Com  "
- Stored: "user@example.com"
```

**7. Commit**
```bash
git commit -m "fix(auth): normalize email addresses for login

Root cause: Missing email normalization layer caused login failures
when emails had different casing or whitespace.

Changes:
- Add EmailNormalizer for consistent email handling
- Apply normalization at registration and login
- Normalize to lowercase and trim whitespace
- Add comprehensive tests for email variations

Previously, 'user@example.com' and 'USER@EXAMPLE.COM  ' were
treated as different accounts.

Fixes #789"
```

---

## Common Bug Types and Root Causes

| Bug Type | Common Root Cause | Fix |
|----------|-------------------|-----|
| **Crashes** | Missing error handling | Add validation and error handling layer |
| **Data corruption** | Race conditions | Add proper locking or use immutable data |
| **Inconsistent behavior** | Global mutable state | Use dependency injection |
| **Slow performance** | N+1 queries, no caching | Add database optimization layer |
| **Security vulnerabilities** | Missing input validation | Add validation and sanitization layer |
| **Flaky tests** | Non-deterministic code | Inject time/random dependencies |

---

## Preventing Future Bugs

After fixing root cause:

**1. Create ADR**
```markdown
# ADR-055: Email Normalization Strategy

**Decision:** All email addresses must be normalized (lowercase, trimmed)
at system boundaries (input, storage, comparison).

**Rationale:** Prevents authentication and duplicate account issues.

**Implementation:** Use EmailNormalizer class at all email entry points.
```

**2. Add Linter Rule (if applicable)**
```yaml
# .pylintrc
[CUSTOM]
# Enforce email normalization
checks = email_normalization_check
```

**3. Update Code Review Checklist**
```markdown
## Security Review
- [ ] All user inputs validated
- [ ] Email addresses normalized
- [ ] SQL injection prevented
- [ ] XSS prevented
```

---

## Related Documents

- [Core Principles](../principles/core-principles.md) - Root cause fixing requirement
- [Testing Standards](../development/testing-standards.md) - Testing practices
- [Feature Workflow](../workflows/feature-workflow.md) - TDD workflow

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
