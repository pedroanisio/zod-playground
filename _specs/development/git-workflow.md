# Git & CI/CD Workflow

**Purpose:** Version control and continuous integration practices.

---

## Pre-Commit Hooks

Automatically run quality checks before every commit:
- Format check (code formatter)
- Lint check (linter with all warnings enabled)
- Test suite (at minimum, fast unit tests)

Configure hooks to prevent broken code from entering version control.

### Setup

**Using pre-commit framework:**
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: format
        name: Format code
        entry: npm run format:check
        language: system
        pass_filenames: false

      - id: lint
        name: Lint code
        entry: npm run lint
        language: system
        pass_filenames: false

      - id: test
        name: Run tests
        entry: npm test
        language: system
        pass_filenames: false
```

**Manual git hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "Running pre-commit checks..."

echo "1. Formatting..."
npm run format:check

echo "2. Linting..."
npm run lint

echo "3. Tests..."
npm test

echo "✓ All checks passed"
```

---

## Commit Messages

Use **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature/bug change)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, tooling)

### Examples

**Simple:**
```
feat(auth): add OAuth2 login flow
```

**With body:**
```
fix(api): handle null values in user profile

Previously, null email addresses would cause a 500 error.
Now they return a 400 with a clear error message.

Fixes #123
```

**Breaking change:**
```
feat(api)!: remove deprecated /v1/users endpoint

BREAKING CHANGE: The /v1/users endpoint has been removed.
Use /v2/users instead.
```

### Scope

Scope indicates what part of the codebase changed:
- `auth`, `api`, `db`, `ui`, `docs`, etc.
- Optional but recommended
- Helps with changelog generation

---

## Branching Strategy

### Main Branch Protection

**Main branch requirements:**
- Always production-ready
- All tests pass
- Code review approval required
- CI checks must pass
- No direct commits (use PRs)

### Feature Branches

```bash
# Create feature branch
git checkout -b feat/user-authentication

# Make changes, commit often
git add .
git commit -m "feat(auth): add login endpoint"

# Push to remote
git push -u origin feat/user-authentication

# Create pull request
gh pr create --title "Add user authentication" --body "..."
```

### Branch Naming

```
<type>/<short-description>
```

**Examples:**
- `feat/oauth-login`
- `fix/null-pointer-error`
- `docs/api-examples`
- `refactor/user-service`

---

## Pull Requests

### PR Template

```markdown
## Summary
Brief description of changes

## Changes
- Added X
- Updated Y
- Removed Z

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Follows code style guidelines
- [ ] Self-reviewed code
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Tests pass locally
```

### Review Process

**Before requesting review:**
- [ ] All tests pass locally
- [ ] Code is self-reviewed
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with main

**During review:**
- Address all comments
- Re-request review after changes
- Keep PR scope focused

**After approval:**
- Squash and merge (or rebase, based on team preference)
- Delete feature branch
- Close related issues

---

## Release Process

### Semantic Versioning

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

### Release Workflow

1. **Update version in project manifest**
   ```bash
   # package.json, Cargo.toml, pyproject.toml, etc.
   ```

2. **Update CHANGELOG.md**
   ```markdown
   ## [1.2.0] - 2026-01-24

   ### Added
   - User authentication with OAuth2
   - API rate limiting

   ### Fixed
   - Null pointer error in user profile
   - Memory leak in background worker

   ### Changed
   - Improved error messages

   ### Deprecated
   - `/v1/users` endpoint (use `/v2/users`)
   ```

3. **Create annotated git tag**
   ```bash
   git tag -a v1.2.0 -m "Release 1.2.0"
   ```

4. **Push tag to trigger CI**
   ```bash
   git push origin v1.2.0
   ```

5. **CI builds release artifacts**
   - Compiles binaries for multiple platforms
   - Runs full test suite
   - Publishes to package registry
   - Creates GitHub release with changelog

### When to Update CHANGELOG

- After completing a significant feature or epic
- Before creating a release
- Document what changed, why it matters, any breaking changes

**Do NOT update CHANGELOG:**
- For every commit
- For work-in-progress changes
- For internal refactorings that don't affect users

---

## Continuous Integration

### CI Pipeline

```yaml
# Example: GitHub Actions
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup
        run: npm install

      - name: Format
        run: npm run format:check

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Coverage
        run: npm run coverage

      - name: Build
        run: npm run build
```

### Required Checks

**All CI pipelines must:**
- Run on every PR
- Run on every push to main
- Fail fast (stop on first error)
- Report coverage
- Cache dependencies for speed
- Use matrix testing for multiple environments

### Status Checks

**Configure branch protection:**
- Require status checks to pass
- Require branches to be up-to-date
- Require review approval
- Restrict who can push to main

---

## Git Best Practices

### Commit Hygiene

**Do:**
- Commit early and often
- Each commit should be atomic (one logical change)
- Write meaningful commit messages
- Test before committing

**Don't:**
- Commit broken code to main
- Commit secrets or credentials
- Use `git commit -am` without reviewing changes
- Rewrite public history

### Handling Secrets

**Never commit:**
- API keys
- Passwords
- Private keys
- Environment variables with secrets

**Instead:**
- Use environment variables
- Use secret management tools (Vault, AWS Secrets Manager)
- Add to `.gitignore`: `.env`, `secrets.json`, etc.
- Rotate secrets if accidentally committed

**If secret is committed:**
```bash
# Immediately revoke the secret
# Rotate credentials
# Use git-filter-repo or BFG to remove from history
git filter-repo --path secrets.json --invert-paths
```

---

## Related Documents

- [Code Quality](../development/code-quality.md) - Quality standards enforced by CI
- [Testing Standards](../development/testing-standards.md) - Tests run in CI
- [Feature Workflow](../workflows/feature-workflow.md) - End-to-end development flow

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
