# Plan Schema Protocol Notes

This companion document captures the extended protocol context extracted from the `plan-schema.ts` header.

## A. Core Semantics

1. A plan is a claim that a step graph can execute while respecting capacity, scope, authority, reversibility, and verification constraints.
2. Actors operate on partial projections of state rather than global state.
3. Authority is delegated and cannot be self-escalated for irreversible actions.
4. Verification bandwidth is finite and must be budgeted.

## B. Constraint Mapping

The schema operationalizes constraints for:
- Context capacity
- Temporal fragility
- Scope boundaries
- Knowledge asymmetry
- Communication bandwidth
- Non-determinism
- Error propagation
- Trust and authority
- Context thrashing

## C. Well-Formedness Conditions

Validation enforces feasibility and governance conditions including:
- Capacity feasibility
- Scope containment
- Authority consistency
- Temporal and dependency feasibility
- Irreversibility gating
- Thrashing avoidance
- Detection adequacy
- Intent projection adequacy

## D. Verification Economics

Constraint debt tracks required versus completed validation load.

- `D(t) = Σ [val_req - val_done]^+`
- Review bandwidth constraints must remain feasible.
- Residual human verification burden must not exceed review capacity.

## E. Agent Execution Protocol

Agents must:
- Parse and validate plans before execution.
- Stop and escalate on hard validation errors.
- Stay within declared scope zones and actor assignments.
- Enforce required approvers on irreversible steps.
- Update validation accounting during execution.

Agents should:
- Treat warnings as active risk controls.
- Preserve explicit handoff context.
- Revalidate across plan version transitions.

## F. Model Limits

- Several values are proxies (capacity, tacit knowledge, divergence).
- The model governs coordination and risk; it does not prove semantic correctness.
- Passing schema and well-formedness checks reduces risk but does not eliminate it.
