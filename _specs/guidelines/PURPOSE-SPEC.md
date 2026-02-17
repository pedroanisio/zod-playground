# PURPOSE.md Specification

**Version:** 1.0.0  
**Status:** Proposal  
**Author:** Community  
**Inspired by:** Simon Sinek's Golden Circle Framework

---

## Abstract

This specification proposes the adoption of a `PURPOSE.md` file as a standard artifact in software repositories. While `README.md` answers "what does this do and how do I use it," `PURPOSE.md` answers "why does this exist and why should I care."

As codebases increasingly serve multiple audiences—human developers, AI coding agents, automated systems, and non-technical stakeholders—the need for a canonical source of *intent* has never been greater.

---

## The Problem

### Codebases Are Rich in What, Poor in Why

Modern repositories excel at documenting mechanics:
- README.md explains usage
- API docs describe endpoints
- Code comments clarify implementation
- Tests specify behavior

Yet critical context remains absent or scattered:
- **Why** was this built instead of using an existing solution?
- **What problem** in the world does this solve?
- **Who suffers** without it?
- **What principles** guide architectural decisions?
- **What does success look like** beyond passing tests?

### The Cost of Missing Purpose

| Audience | Impact of Missing Purpose |
|----------|---------------------------|
| **New developers** | Onboard to mechanics without understanding mission; make locally-optimal decisions that violate project intent |
| **AI agents** | Generate technically correct but philosophically misaligned code; optimize for wrong objectives |
| **Maintainers** | Struggle to evaluate contributions against unclear standards; accept scope creep |
| **Stakeholders** | Can't assess alignment with business goals; fund features that drift from original vision |
| **Future self** | Return to project months later unable to recall why certain trade-offs were made |

### README.md Is Not Enough

README.md has evolved into an installation and usage guide. Attempting to overload it with purpose creates documents that serve no audience well—too philosophical for users seeking quick-start instructions, too shallow for those seeking deep understanding.

Purpose deserves its own artifact.

---

## The Solution: PURPOSE.md

A dedicated file at repository root that captures the **why**, **how**, and **what** of a project—in that order—following the Golden Circle framework.

### Placement

```
repository/
├── PURPOSE.md      ← Project intent and philosophy
├── README.md       ← Usage, installation, quick start
├── CONTRIBUTING.md ← How to contribute
├── LICENSE
└── src/
```

### Relationship to Other Files

| File | Question Answered | Audience | Changes |
|------|-------------------|----------|---------|
| `PURPOSE.md` | Why does this exist? | Everyone | Rarely |
| `README.md` | How do I use this? | Users | Often |
| `CONTRIBUTING.md` | How do I contribute? | Contributors | Sometimes |
| `ARCHITECTURE.md` | How is this built? | Developers | Sometimes |
| `CHANGELOG.md` | What changed? | Users | Every release |

PURPOSE.md is the **most stable** document in a repository. If your purpose changes frequently, you don't have a purpose—you have a to-do list.

---

## Structure

A PURPOSE.md file MUST contain three sections in the following order:

### 1. Why (Required)

The **belief, problem, or injustice** that motivated creation. Written to create emotional resonance before technical understanding.

Guidelines:
- Lead with what you believe, not what you built
- Describe the pain of the status quo
- Make the reader feel the problem before presenting the solution
- Avoid technical jargon—a non-technical stakeholder should understand this section

**Good example:**
> We believe data migrations shouldn't begin in the dark. Organizations sitting on years of Excel-based business logic deserve clarity before making irreversible architectural decisions.

**Bad example:**
> This tool analyzes Excel files and outputs JSON metadata for database schema design.

### 2. How (Required)

The **principles, values, and approach** that guide the project. This is your philosophy of building, not your architecture.

Guidelines:
- Express principles as declarative statements
- Explain trade-offs and what you deliberately chose *not* to optimize for
- Differentiate from alternatives philosophically, not just technically
- These should be stable enough to evaluate any future contribution against

**Good example:**
> - **Inference over assumption** — We analyze actual data, never trust headers alone
> - **Relationships are first-class** — Hidden foreign keys matter as much as columns
> - **Schema hints, not schema dictates** — Final decisions stay with humans

**Bad example:**
> - Uses Rust for performance
> - Outputs JSON
> - Has CLI interface

### 3. What (Required)

The **concrete capabilities** that emerge from your why and how. Features should feel like natural consequences of your purpose, not a disconnected list.

Guidelines:
- Keep brief—detailed feature documentation belongs in README.md
- Connect capabilities back to purpose where non-obvious
- Include non-goals: what this deliberately does NOT do

---

## Template

```markdown
# [Project Name]

## Why We Built This

[1-3 paragraphs describing the belief, problem, or injustice that motivated this project. 
No technical details. A non-technical person should understand and feel this.]

---

## How We Approach This

[Your principles and philosophy. What guides decisions? What trade-offs do you consciously make?
Express as declarative statements that could evaluate any future contribution.]

- **[Principle 1]** — [Brief explanation]
- **[Principle 2]** — [Brief explanation]
- **[Principle 3]** — [Brief explanation]

---

## What It Does

[Brief description of capabilities. Keep it high-level; README.md has details.]

### Core Capabilities
- [Capability 1]
- [Capability 2]
- [Capability 3]

### What This Is Not

This project does **not**:
- [Non-goal 1]
- [Non-goal 2]
- [Non-goal 3]

---

## Who This Is For

- **[Audience 1]** — [How they benefit]
- **[Audience 2]** — [How they benefit]
- **[Audience 3]** — [How they benefit]
```

---

## Benefits by Audience

### For Human Developers

**Onboarding:** New team members understand *why* decisions were made, not just what was decided. They can make autonomous decisions aligned with project intent.

**Contribution quality:** Pull requests can be evaluated against stated principles. "Does this align with our purpose?" becomes a concrete question with a canonical reference.

**Motivation:** Developers connecting daily work to meaningful purpose report higher engagement. PURPOSE.md makes that connection explicit.

### For AI Coding Agents

**Context window efficiency:** A well-written PURPOSE.md provides maximum intent signal with minimum tokens. AI agents can understand project philosophy without parsing entire codebases.

**Aligned generation:** When AI agents understand *why* a project exists, they generate code that serves the mission, not just code that compiles. Principles in the "How" section become soft constraints on generation.

**Reduced hallucination:** Clear non-goals prevent AI agents from adding capabilities the project explicitly rejects.

**Prompt grounding:** PURPOSE.md becomes a canonical document to include in AI prompts:
```
Given the project purpose defined in PURPOSE.md:
[contents]

Generate a function that...
```

### For Non-Technical Stakeholders

**Alignment verification:** Product managers, executives, and funders can assess whether development aligns with business objectives without reading code.

**Communication artifact:** PURPOSE.md becomes source material for marketing, investor updates, and internal communications.

### For Automated Systems

**Repository classification:** Systems analyzing repositories can categorize by purpose, not just language or framework.

**Dependency evaluation:** When evaluating whether to depend on a project, automated systems can assess philosophical alignment.

---

## Implementation Guidance

### When to Write PURPOSE.md

- **New projects:** Write PURPOSE.md before README.md. If you can't articulate why, you're not ready to build.
- **Existing projects:** Add PURPOSE.md during any significant refactoring or when onboarding struggles indicate missing context.
- **Forks:** When forking, write a new PURPOSE.md explaining why the fork exists and how its purpose diverges from upstream.

### When to Update PURPOSE.md

PURPOSE.md should change **rarely**. Frequent changes indicate:
- Original purpose was not well understood
- Project is pivoting (acknowledge this explicitly)
- Scope creep has occurred (reconsider)

Valid reasons to update:
- Clarifying language without changing meaning
- Adding principles discovered through experience
- Acknowledging evolved understanding of the problem space

### Versioning Guidance

PURPOSE.md is **versioned with your codebase** in version control, but its stability deserves special consideration:

#### Tracking Purpose Evolution

**Standard Projects (< 5 years old):**
- PURPOSE.md lives in version control like any other file
- Git history serves as the canonical record of purpose evolution
- If purpose fundamentally changes, acknowledge it in commit message and CHANGELOG.md

**Long-Lived Projects (5+ years):**
- Consider adding a "Purpose Evolution" appendix to PURPOSE.md documenting major shifts:
  ```markdown
  ## Appendix: Purpose Evolution

  ### 2020-2025: Original Purpose
  We believed [original problem statement]...

  ### 2025-Present: Evolved Purpose
  As the ecosystem matured, we learned [what changed]. Our refined purpose...
  ```
- This preserves institutional knowledge for stakeholders who joined after pivots

#### Handling Major Purpose Changes

When purpose fundamentally shifts (not just clarification):

1. **Document the pivot explicitly** — Write a brief appendix explaining what changed and why
2. **Update version header** — If using version numbers in PURPOSE.md, increment major version (1.0.0 → 2.0.0)
3. **Communicate broadly** — Major purpose changes affect all stakeholders; announce in CHANGELOG.md and team communications
4. **Evaluate codebase alignment** — A purpose change may reveal technical debt that no longer serves the new mission

#### Version Numbers in PURPOSE.md (Optional)

While not required, some projects benefit from explicit versioning:

```markdown
**Purpose Version:** 2.0.0
**Last Updated:** 2025-03-15
**Status:** Active
```

Semantic versioning for purpose:
- **Major (2.0.0):** Fundamental shift in why, how, or target audience
- **Minor (1.1.0):** New principles added or significantly refined understanding
- **Patch (1.0.1):** Clarification of language without meaning change

#### Git History vs. Documented History

| Audience | Needs | Solution |
|----------|-------|----------|
| **Developers familiar with git** | Historical context for specific changes | Git history via `git log PURPOSE.md` |
| **New stakeholders/AI agents** | Understanding of major purpose shifts without archaeology | Optional "Purpose Evolution" appendix in PURPOSE.md |
| **Compliance/audit** | Proof of when purpose was established | Git commit history + optional version header |

**Rule of thumb:** If your purpose has changed more than twice, document the evolution in an appendix. If it's changed more than five times, reconsider whether you truly understand your purpose.

### Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| **Feature list masquerading as purpose** | "Why" section lists technical capabilities | Rewrite to describe problem and belief |
| **Marketing copy** | Hyperbolic language without substance | Ground in specific, verifiable claims |
| **Living document syndrome** | PURPOSE.md changes with every sprint | Separate stable purpose from evolving roadmap |
| **Copying README.md** | Duplication without differentiation | PURPOSE.md = why/philosophy; README.md = usage |
| **Too long** | Multiple pages of purpose | Distill to essence; move details elsewhere |

### Validation Checklist

Before committing PURPOSE.md, verify:

- [ ] A non-technical person can understand the "Why" section
- [ ] The "How" section contains principles that could reject a contribution
- [ ] The "What" section includes explicit non-goals
- [ ] No technical jargon appears before the "What" section
- [ ] The document is under 500 words (excluding template sections)
- [ ] Reading it makes you *want* to contribute to the project

---

## Adoption

### Individual Projects

Add PURPOSE.md to your repository root. Reference it in CONTRIBUTING.md:

> Before contributing, please read [PURPOSE.md](PURPOSE.md) to understand the principles that guide this project.

### Organizations

Add PURPOSE.md to repository templates. Include in new-project checklists alongside LICENSE and README.md.

### AI Agent Instructions

When configuring AI coding agents, include:

> Always read PURPOSE.md before generating code. Ensure generated code aligns with stated principles and avoids explicit non-goals.

---

## FAQ

**Q: Isn't this just vision/mission statements for code?**

A: Yes, and that's the point. Vision/mission statements transformed how organizations communicate intent. Codebases deserve the same clarity.

**Q: What if my project is too small for this?**

A: If your project is worth building, it's worth understanding why. Even a 100-line utility benefits from "I built this because X was frustrating and I believe Y."

**Q: Should libraries have PURPOSE.md?**

A: Especially libraries. Library authors make trade-off decisions (performance vs. ergonomics, flexibility vs. simplicity) that downstream users need to understand.

**Q: How does this relate to ADRs (Architecture Decision Records)?**

A: ADRs document *specific* decisions and their context. PURPOSE.md documents the *enduring* principles that inform all decisions. ADRs may reference PURPOSE.md as justification.

**Q: What about monorepos?**

A: Root PURPOSE.md for the monorepo; optional PURPOSE.md in significant sub-packages if their purpose diverges meaningfully.

---

## References

- Sinek, Simon. *Start with Why: How Great Leaders Inspire Everyone to Take Action.* Portfolio, 2009.
- Sinek, Simon. "How Great Leaders Inspire Action." TED Talk, 2009.
- *The Golden Circle* — simonsinek.com

---

## License

This specification is released under CC0 1.0 Universal (Public Domain). 

Use it freely. Spread the why.
