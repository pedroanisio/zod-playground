# Zod Playground

## Why We Built This

We believe schema validation should be explored, understood, and shared without setup friction.  
When developers have to create throwaway projects just to test one schema idea, learning slows down and confidence drops.

We built Zod Playground to remove that friction. It gives developers a fast place to think through schema behavior, see real validation outcomes, and communicate examples with shared context instead of screenshots.

---

## How We Approach This

- **Learn by running** - Immediate feedback beats static examples.
- **Version-aware experimentation** - Validation behavior must be tested against the Zod version actually in use.
- **Share context, not fragments** - A link should capture schema, values, and version so others can reproduce exactly what you saw.
- **Low ceremony by default** - Useful defaults and persistence reduce setup overhead and keep focus on validation logic.
- **Human judgment stays central** - The playground informs decisions; it does not replace production tests or schema review.

---

## What It Does

Zod Playground provides a browser-based environment for interactive Zod schema work and fast collaboration.

### Core Capabilities

- Edit TypeScript-flavored Zod schemas and sample values side by side
- Validate values in real time with clear valid/invalid feedback and parsed output
- Switch between available Zod versions (including `zod/mini` where supported)
- Share the current state through URL-based app data
- Persist local working state for quick iteration

### What This Is Not

This project does **not**:

- Replace unit/integration tests in real applications
- Act as a backend validation platform or production API
- Generate full application architecture, migrations, or domain models from schemas

---

## Who This Is For

- **Developers learning Zod** - Understand schema behavior by trying real examples quickly
- **Teams upgrading Zod versions** - Compare behavior across versions before changing production code
- **Engineers debugging edge cases** - Reproduce tricky validation scenarios and share them as links
- **Reviewers and collaborators** - Evaluate schema intent and sample payloads with the same exact context
