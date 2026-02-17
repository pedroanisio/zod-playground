# AI Agent Development Specifications

This directory contains modular specifications for AI coding agent development standards.

---

## Overview

These specifications define universal, language-agnostic development standards for AI coding agents and human developers. Each module focuses on a single concern and can be adopted independently or as a complete system.

---

## Directory Structure

```
specs/
├── CLAUDE.md                    # Main entry point (start here)
├── principles/                  # Foundational principles
│   ├── core-principles.md       # Root cause fixing, TDD, production-ready code
│   ├── anti-patterns.md         # Common mistakes and corrections
│   └── quality-protocol.md      # Zero tolerance enforcement
├── development/                 # Development standards
│   ├── testing-standards.md     # Coverage, organization, TDD workflow
│   ├── code-quality.md          # Error handling, linting, dependencies
│   ├── git-workflow.md          # Commits, branches, releases
│   └── adrs-and-proposals.md    # Architectural decision records
├── ai-agents/                   # AI agent-specific guidance
│   ├── context-management.md    # Context window priorities
│   ├── confidence-thresholds.md # When to ask vs. proceed
│   ├── no-batching.md           # Complete deliverables only
│   ├── effort-estimation.md     # T-shirt sizing (no time estimates)
│   ├── mental-model-protocol.md # Pre-plan understanding checkpoint
│   ├── plan-generation.md       # How to generate formally sound plans
│   └── incremental-validation.md# Continuous validation
├── schemas/                     # Formal contracts (Zod)
│   ├── plan-schema.ts           # Plan structure + well-formedness validation
│   └── mental-model-schema.ts   # Mental model structure + readiness validation
├── scripts/                     # Tooling
│   └── treemeta.sh              # Token-efficient codebase inventory
└── workflows/                   # Practical application
    ├── feature-workflow.md      # TDD for new features
    ├── bug-workflow.md          # Root cause bug fixing
    └── when-in-doubt.md         # Decision-making guide
```

---

## Quick Start

### For AI Agents
1. Read **[CLAUDE.md](./CLAUDE.md)** - Overview and quick start
2. Read **[core-principles.md](./principles/core-principles.md)** - Non-negotiable requirements
3. Read **[context-management.md](./ai-agents/context-management.md)** - Efficient information prioritization
4. Use **[when-in-doubt.md](./workflows/when-in-doubt.md)** as quick reference

### For Human Developers
1. Read **[CLAUDE.md](./CLAUDE.md)** - Overview and rationale
2. Read **[core-principles.md](./principles/core-principles.md)** - Standards foundation
3. Review **[testing-standards.md](./development/testing-standards.md)** - Quality requirements
4. Follow workflows for specific tasks

### For Project Adoption
1. Read **[PURPOSE-MD-SPEC.md](./PURPOSE-MD-SPEC.md)** - Understand PURPOSE.md pattern
2. Read **[CLAUDE.md](./CLAUDE.md)** - Understand standards system
3. Adopt modules that fit your needs (composable)
4. Create project-specific PURPOSE.md and ADRs

---

## Design Philosophy

### Modular by Design
- Each file focuses on a single concern
- Files can be adopted independently
- Clear dependencies between modules
- Easy to maintain and update

### Skills-Like Organization
- Similar to how skills are organized in plugin systems
- Each module is self-contained
- Cross-references instead of duplication
- Composable for different project needs

### Universal Application
- Language-agnostic principles
- Framework-agnostic practices
- Adaptable to any tech stack
- Focused on fundamentals, not specifics

---

## Module Categories

### Principles (Non-Negotiable)
**What:** Foundational requirements that apply to all code
**Who:** Everyone (AI agents and human developers)
**Examples:** Root cause fixing, TDD, production-ready code only

### Development (Standards)
**What:** Practical standards for code quality and process
**Who:** All developers working in codebases
**Examples:** Testing coverage, error handling, git workflow

### AI Agents (Specialized)
**What:** Guidance specific to AI coding agents
**Who:** AI agents and their designers
**Examples:** Context management, batching prohibition, effort estimation, plan generation

### Workflows (Applied)
**What:** Step-by-step processes for common tasks
**Who:** Anyone implementing features or fixing bugs
**Examples:** TDD workflow, bug fixing process, decision making

---

## Adoption Strategies

### Full Adoption
Adopt all modules as a complete system:
1. Use CLAUDE.md as your agent instructions
2. Require all contributors to follow standards
3. Enforce via CI/CD and code review
4. Create project-specific ADRs building on these principles

### Partial Adoption
Pick specific modules that fit your needs:
- Just core principles for small teams
- Just testing standards for quality focus
- Just AI agent guidance for AI-assisted development
- Mix and match based on priorities

### Customization
Adapt modules to your context:
1. Fork and modify to fit your tech stack
2. Add project-specific sections to modules
3. Create supplementary ADRs
4. Maintain consistency with core principles

---

## Relationship to Other Files

| File | Purpose | Stability |
|------|---------|-----------|
| **PURPOSE.md** | Why the project exists | Very stable (rarely changes) |
| **CLAUDE.md** | How to build the project | Stable (evolves slowly) |
| **README.md** | What the project does | Dynamic (updates frequently) |
| **CONTRIBUTING.md** | How to contribute | Semi-stable |
| **ADRs** | Decisions made | Immutable (new ADRs supersede old) |

**When in conflict:**
- PURPOSE.md defines intent (the "why")
- CLAUDE.md defines execution standards (the "how")
- ADRs provide project-specific decisions

---

## Versioning

### Specification Versioning
- Each module has implicit version (tracked via git)
- Breaking changes warrant new major version
- Projects can pin to specific versions

### Current Version
- **v2.3.0** - Mental model protocol, plan generation hardening, scope resolution (current)
- **v2.0.0** - Modular structure
- **v1.0.0** - Monolithic CLAUDE.md (deprecated)

---

## Contributing

To propose changes:
1. Check if Enhancement Proposal needed (for major changes)
2. Submit PR with rationale
3. Ensure changes align with core principles
4. Update cross-references if needed

---

## License

All specifications are released under CC0 1.0 Universal (Public Domain).

Use freely. Adapt to your needs. Build better software.

---

## Support

For questions or discussions:
- **Issues:** GitHub Issues for bugs/improvements
- **Discussions:** GitHub Discussions for questions
- **PRs:** Pull requests for contributions

---

## History

**v2.0.0** (Current)
- Modular structure with single-concern files
- Skills-like organization
- Improved composability
- Better maintainability

**v1.0.0** (Deprecated)
- Monolithic CLAUDE.md
- All content in single file
- See CLAUDE-v1-DEPRECATED.md for reference

---

## Further Reading

- **[PURPOSE-MD-SPEC.md](./PURPOSE-MD-SPEC.md)** - Specification for PURPOSE.md pattern
- **[CLAUDE.md](./CLAUDE.md)** - Main entry point for standards
- **[core-principles.md](./principles/core-principles.md)** - Start here for principles

---

## Generated Docs

Schema reference pages are generated from TSDoc and published via MkDocs.

- Pipeline scripts: `docs/_specs/scripts/`
- Generated output: `docs/generated/schemas/`
- MkDocs config: `docs/_specs/mkdocs.yml`
- Docker runtime: `docs/_specs/docker/`

Run:

```bash
npm run docs:generate
npm run docs:build
```
