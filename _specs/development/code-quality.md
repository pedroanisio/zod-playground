# Code Quality Standards

**Purpose:** Universal code quality requirements for production-ready software.

---

## Error Handling

### Libraries

- Use typed errors that callers can handle
- Never panic in library code
- Return `Result`/`Either` types for operations that can fail
- Provide meaningful error messages with context

**Example (Rust):**
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum UserError {
    #[error("User {id} not found")]
    NotFound { id: String },

    #[error("Invalid email: {email}")]
    InvalidEmail { email: String },
}

pub fn find_user(id: &str) -> Result<User, UserError> {
    database.get(id)
        .ok_or(UserError::NotFound { id: id.to_string() })
}
```

### Applications

- Handle errors gracefully with user-friendly messages
- Log errors with appropriate severity levels
- Provide actionable error messages (what went wrong, how to fix it)

**Example:**
```javascript
try {
    await processPayment(order);
} catch (error) {
    if (error instanceof InsufficientFundsError) {
        showUserMessage("Payment failed: insufficient funds. Please add a payment method.");
        logger.warn('Payment failed', { orderId: order.id, reason: 'insufficient_funds' });
    } else {
        showUserMessage("Payment failed. Please try again or contact support.");
        logger.error('Unexpected payment error', { orderId: order.id, error });
    }
}
```

### Universal Rules

- Never ignore errors silently
- Never use bare `unwrap()`, `expect()`, or equivalents in production code
- Always propagate errors to appropriate handlers
- Include context in error messages

**Bad:**
```python
try:
    data = json.loads(response)
except:  # NEVER do this
    pass
```

**Good:**
```python
try:
    data = json.loads(response)
except json.JSONDecodeError as e:
    raise InvalidResponseError(f"Failed to parse JSON response: {e}") from e
```

---

## Formatting & Linting

Projects MUST have:
- **Automated formatter** configured and enforced in CI
- **Linter** with appropriate rules for the language/framework
- **CI denies warnings** — all linter warnings must be fixed

Configure formatters/linters in project config files, not in code comments.

### By Language

**Python:**
```ini
# pyproject.toml
[tool.black]
line-length = 100

[tool.ruff]
select = ["E", "F", "W", "I", "N"]
```

**JavaScript/TypeScript:**
```json
// .eslintrc.json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

**Rust:**
```toml
# rustfmt.toml
max_width = 100
edition = "2021"

# .clippy.toml
deny = ["warnings", "clippy::pedantic"]
```

### CI Enforcement

```yaml
# Example: GitHub Actions
- name: Check formatting
  run: npm run format:check

- name: Lint
  run: npm run lint -- --max-warnings=0

- name: Build
  run: npm run build
```

---

## Code Markers

**Inline markers** (TODO, FIXME, HACK, NOTE):
- MUST be resolved before PR merge
- For persistent work, use issue tracker
- Never commit code with unresolved TODOs in main branch

### Enforcement

**Pre-commit hook:**
```bash
# .git/hooks/pre-commit
if git grep -E "TODO|FIXME|HACK" -- '*.py' '*.js' '*.rs'; then
    echo "Error: Found TODO/FIXME/HACK markers. Resolve before committing."
    exit 1
fi
```

**Linter rule:**
```javascript
// ESLint
rules: {
  "no-warning-comments": ["error", {
    "terms": ["todo", "fixme", "hack"],
    "location": "anywhere"
  }]
}
```

---

## Dependencies

### Dependency Hygiene

- Minimize dependencies — prefer standard library when sufficient
- Keep dependencies up-to-date
- Run security audits on dependencies
- Document why each major dependency was chosen (in ADRs)
- Review licenses for compatibility

### Security Auditing

**By ecosystem:**
```bash
# Node.js
npm audit
npm audit fix

# Rust
cargo audit
cargo deny check

# Python
pip-audit
safety check

# Go
go list -json -m all | nancy sleuth
```

### Version Pinning

**Lock files are required:**
- `package-lock.json` (Node.js)
- `Cargo.lock` (Rust)
- `requirements.txt` or `poetry.lock` (Python)
- `go.sum` (Go)

**Why:**
- Reproducible builds
- Prevent supply chain attacks
- Controlled dependency updates

### Dependency Review

Before adding a dependency, check:
- [ ] Is it actively maintained?
- [ ] Does it have good test coverage?
- [ ] Is the license compatible?
- [ ] Are there known security vulnerabilities?
- [ ] Could stdlib accomplish this?
- [ ] What's the transitive dependency cost?

---

## Code Organization

### Single Responsibility Principle

Each module, class, function should have one reason to change.

**Bad:**
```python
class User:
    def save_to_database(self):  # Database concern
        pass

    def send_welcome_email(self):  # Email concern
        pass

    def validate_password(self):  # Validation concern
        pass
```

**Good:**
```python
class User:
    """Domain model - only user data and business logic"""
    def validate_password(self, password: str) -> bool:
        return PasswordValidator.validate(password)

class UserRepository:
    """Persistence concern"""
    def save(self, user: User) -> None:
        database.insert(user)

class UserNotificationService:
    """Communication concern"""
    def send_welcome_email(self, user: User) -> None:
        email_service.send(user.email, "Welcome!")
```

### Naming Conventions

- **Variables**: Descriptive, not abbreviated (`user_count` not `uc`)
- **Functions**: Verb phrases (`calculate_total`, `send_email`)
- **Classes**: Noun phrases (`UserRepository`, `PaymentProcessor`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`, `API_TIMEOUT`)
- **Booleans**: Predicates (`is_valid`, `has_permission`, `should_retry`)

---

## Documentation

### Code Comments

**When to comment:**
- Complex algorithms that aren't self-evident
- Business logic rationale
- Performance optimizations
- Security considerations

**When NOT to comment:**
- Don't comment what the code does (write clearer code instead)
- Don't comment obvious things
- Don't leave dead code commented out (delete it)

**Bad:**
```python
# Increment counter
counter += 1
```

**Good:**
```python
# Skip validation for admin users per security policy SEC-042
if user.is_admin:
    return True
```

### Public API Documentation

All public APIs require:
- Purpose and usage description
- Parameter documentation
- Return value documentation
- Error conditions
- Examples

**Python:**
```python
def calculate_discount(price: Decimal, user: User) -> Decimal:
    """Calculate discount for a user based on loyalty tier.

    Args:
        price: Original price before discount
        user: User with loyalty tier information

    Returns:
        Discounted price (never negative)

    Raises:
        ValueError: If price is negative

    Examples:
        >>> calculate_discount(Decimal('100'), gold_tier_user)
        Decimal('85.00')
    """
```

---

## Related Documents

- [Testing Standards](../development/testing-standards.md) - Test quality requirements
- [Git Workflow](../development/git-workflow.md) - Version control practices
- [Core Principles](../principles/core-principles.md) - Foundational standards

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
