# Common Anti-Patterns (AVOID)

**Purpose:** Catalog of frequently encountered mistakes and their correct alternatives.

---

## Anti-Pattern Reference Table

| Anti-Pattern | Why Bad | Correct Approach |
|-------------|---------|------------------|
| **Patching symptoms** | Root cause remains, will break again | Fix root cause in source |
| **Skipping tests** | Breaks refactoring confidence | TDD always, no exceptions |
| **Placeholders in production** | Crashes in production | Complete implementation or feature flag |
| **Ignoring errors** | Silent failures, corrupted state | Proper error handling everywhere |
| **Global mutable state** | Race conditions, flaky tests | Dependency injection, pure functions |
| **Mocking too much** | Tests become brittle, don't catch real issues | Mock only boundaries, test real code |
| **Time-dependent tests** | Fail unpredictably | Use deterministic time injection |
| **Order-dependent tests** | Break under parallel execution | Isolated, independent tests |
| **Hardcoded values** | Brittle, hard to change | Configuration files, environment variables |
| **Unclear naming** | Hard to understand intent | Descriptive names that explain purpose |
| **Inventing domain entities in plans** | Unimplementable plan | Verify against codebase or ask user |
| **Self-authorizing vendor decisions** | Violates authority conservation | Set decidedBy to human-level actor |
| **Empty safety fields on complex steps** | Disables constraint framework | Populate stopConditions, resourceRequirements for M+ |

---

## Detailed Explanations

### Patching Symptoms Instead of Root Causes

**What it looks like:**
```python
# BAD: Patching the symptom
if user is None:
    user = get_default_user()  # Why is user None in the first place?
```

**Why it's wrong:**
- Doesn't address why `user` is None
- Will fail when default user also has issues
- Hides the real problem deeper in the call stack

**Correct approach:**
```python
# GOOD: Fix root cause
def get_user(user_id: str) -> User:
    user = database.find_user(user_id)
    if user is None:
        raise UserNotFoundError(f"User {user_id} does not exist")
    return user
```

---

### Skipping Tests

**What it looks like:**
- "I'll write tests later"
- "This is a small change, no test needed"
- "Tests are taking too long, I'll just commit this"

**Why it's wrong:**
- "Later" never comes
- Small changes break in unexpected ways
- Refactoring becomes terrifying without test coverage

**Correct approach:**
- Write test first (TDD Red phase)
- No code reaches main without corresponding tests
- Test coverage is a merge requirement

---

### Placeholders in Production Code

**What it looks like:**
```rust
// BAD: Placeholder in production
pub fn process_payment(amount: f64) -> Result<Receipt> {
    todo!("Implement payment processing")  // CRASHES IN PRODUCTION
}
```

**Why it's wrong:**
- Crashes when called
- Creates false sense of progress
- Blocks other developers who depend on this function

**Correct approach:**
```rust
// GOOD: Feature flag or don't commit
#[cfg(feature = "payment_processing")]
pub fn process_payment(amount: f64) -> Result<Receipt> {
    // Complete implementation
    Ok(Receipt::new(amount))
}

#[cfg(not(feature = "payment_processing"))]
pub fn process_payment(_amount: f64) -> Result<Receipt> {
    Err(Error::FeatureNotEnabled("payment_processing"))
}
```

---

### Ignoring Errors

**What it looks like:**
```javascript
// BAD: Silently ignoring errors
try {
    await saveUserData(user);
} catch (e) {
    // Do nothing
}
```

**Why it's wrong:**
- User thinks data was saved
- Silent data corruption
- Impossible to debug

**Correct approach:**
```javascript
// GOOD: Proper error handling
try {
    await saveUserData(user);
} catch (error) {
    logger.error('Failed to save user data', { userId: user.id, error });
    throw new DataPersistenceError('Could not save user data', { cause: error });
}
```

---

### Global Mutable State

**What it looks like:**
```python
# BAD: Global mutable state
_cache = {}

def get_user(user_id):
    if user_id in _cache:
        return _cache[user_id]
    user = fetch_user(user_id)
    _cache[user_id] = user
    return user
```

**Why it's wrong:**
- Race conditions in concurrent environments
- Impossible to test in isolation
- Hidden dependencies make refactoring dangerous

**Correct approach:**
```python
# GOOD: Dependency injection
class UserRepository:
    def __init__(self, cache: Cache):
        self._cache = cache

    def get_user(self, user_id: str) -> User:
        cached = self._cache.get(user_id)
        if cached:
            return cached
        user = self._fetch_user(user_id)
        self._cache.set(user_id, user)
        return user
```

---

### Mocking Too Much

**What it looks like:**
```javascript
// BAD: Mocking everything
test('user validation', () => {
    const mockString = jest.fn().mockReturnValue('test@email.com');
    const mockRegex = jest.fn().mockReturnValue(true);
    const mockValidator = jest.fn().mockReturnValue(mockRegex);
    // Test becomes meaningless
});
```

**Why it's wrong:**
- Tests pass but real code fails
- Brittle tests that break on refactoring
- Not testing actual behavior

**Correct approach:**
```javascript
// GOOD: Mock only external boundaries
test('user validation', () => {
    // Use real validation logic
    const email = 'test@email.com';
    expect(isValidEmail(email)).toBe(true);
});

test('user creation with database', () => {
    // Mock only the database boundary
    const mockDb = createMockDatabase();
    const repo = new UserRepository(mockDb);
    // Test real repository logic
});
```

---

### Inventing Domain Entities in Plans

**What it looks like:**
```json
{
  "steps": [{
    "title": "Add analytics-warehouse connector",
    "fileChanges": [{ "path": "src/connectors/analytics-warehouse.ts", "action": "create" }]
  }]
}
```
Where "analytics-warehouse" sounds plausible but doesn't correspond to a real, verified service in the project's infrastructure.

**Why it's wrong:**
- Plan references entities that may not exist
- Produces unimplementable steps that waste execution effort
- Errors compound: downstream steps depend on hallucinated entities
- Post-hoc discovery is expensive (deep into execution before failure)

**Correct approach:**
- Verify every domain entity against the codebase or user-provided list
- When enumeration exceeds 5 unverified entities, STOP and ask
- See [Plan Generation Protocol](../ai-agents/plan-generation.md) §1.2

---

### Self-Authorizing Vendor/Infrastructure Decisions

**What it looks like:**
```json
{
  "decisions": [{
    "id": "dec-use-openai",
    "description": "Use OpenAI embeddings",
    "decidedBy": "actor-agent-1"
  }]
}
```

**Why it's wrong:**
- External vendor choices carry cost and lock-in commitments
- Authority conservation: agents cannot expand their own scope
- Reversing vendor decisions after integration is expensive

**Correct approach:**
```json
{
  "decisions": [{
    "id": "dec-use-openai",
    "description": "Use OpenAI embeddings",
    "decidedBy": "actor-human-1",
    "alternatives": ["Cohere", "local model"],
    "rationale": "Requires operator approval — vendor cost commitment"
  }]
}
```

---

### Empty Safety Fields on Complex Steps

**What it looks like:**
- M/L/XL steps with `"stopConditions": []`
- L/XL steps with no `verifiedBy: "human"` in verification array
- All steps with `"resourceRequirements": { "simultaneousResources": [] }`

**Why it's wrong:**
- Disables the constraint framework that prevents overload and drift
- Thrashing detection impossible without resource requirements
- Domain errors undetectable without human verification on complex steps
- No stop signals means the agent runs blind through ambiguity

**Correct approach:**
- M+ steps: populate stopConditions (even `blindSpotRisk: "unknown"`)
- M+ steps: populate resourceRequirements with simultaneous context needs
- L/XL steps: add at least one `verifiedBy: "human"` verification check
- See [Plan Generation Protocol](../ai-agents/plan-generation.md) §2.5

---

## Detection and Prevention

**During code review, check for:**
1. Quick fixes that don't address underlying issues
2. Missing test coverage
3. TODO/FIXME comments in production code
4. Empty catch blocks
5. Global variables
6. Excessive mocking in tests

**Prevention strategies:**
1. Enforce TDD workflow
2. Require tests in PR checklist
3. Linter rules against placeholders
4. Code review focus on root causes
5. Pre-commit hooks for quality gates

---

## Related Documents

- [Core Principles](../principles/core-principles.md) - Principles these anti-patterns violate
- [Quality Protocol](../principles/quality-protocol.md) - Zero tolerance enforcement
- [Testing Standards](../development/testing-standards.md) - Proper testing practices
- [Plan Generation Protocol](../ai-agents/plan-generation.md) - Avoiding plan generation anti-patterns

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
