# Confidence Thresholds

**Purpose:** Guidelines for when AI agents should proceed autonomously vs. ask for clarification.

---

## Proceed Autonomously When

Requirements and constraints are clear enough to implement confidently:

### Clear Requirements
- User provides specific, unambiguous instructions
- Acceptance criteria are explicit
- Examples or test cases are provided
- Task matches a well-established pattern

**Example:**
> User: "Add validation to reject email addresses without '@' symbol. Return HTTP 400 with error message."
>
> → **Proceed autonomously:** Requirements are specific and testable

### Pattern Matching
- Change matches existing codebase patterns
- Similar functionality already exists
- Consistent with established conventions
- No architectural decisions needed

**Example:**
> User: "Add a new API endpoint for updating user profile, similar to the existing create user endpoint."
>
> → **Proceed autonomously:** Pattern to follow is clear

### ADR Guidance
- ADRs explicitly cover this scenario
- No ambiguity in architectural decisions
- Trade-offs are already documented
- Technology choices are established

**Example:**
> User: "Add caching to the user lookup"
>
> ADR-042: "Use Redis for all application caching"
>
> → **Proceed autonomously:** ADR provides explicit guidance

### Test-Defined Behavior
- Existing tests clearly define expected behavior
- Test patterns are established
- Edge cases are documented in tests
- No ambiguity in specifications

**Example:**
> User: "Fix the failing test_user_validation_rejects_invalid_email"
>
> → **Proceed autonomously:** Test defines exactly what needs to work

---

## Ask for Clarification When

Uncertainty exists that could lead to wrong implementation:

### Multiple Valid Approaches

**Example:**
> User: "Add authentication to the API"
>
> **Ask:** "There are several authentication approaches:
> 1. JWT tokens (stateless, scales horizontally)
> 2. Session cookies (simpler, more secure for web apps)
> 3. API keys (simpler for service-to-service)
>
> Which approach fits your requirements?"

### Ambiguous Requirements

**Example:**
> User: "Make the API faster"
>
> **Ask:** "To optimize effectively, I need to understand:
> 1. What operations are too slow? (specific endpoints/queries)
> 2. What's the target latency? (e.g., <100ms p99)
> 3. Are there constraints? (memory budget, backward compatibility)
>
> Could you provide more context?"

### Architectural Impact

**Example:**
> User: "Add real-time notifications"
>
> **Ask:** "This has architectural implications:
> 1. WebSockets require stateful connections (affects scaling)
> 2. Server-Sent Events are simpler but one-way
> 3. Polling is easiest but less efficient
>
> Do you have preferences on:
> - Maximum connection count expected?
> - Bidirectional communication needed?
> - Infrastructure constraints (load balancers, etc.)?"

### Breaking Changes Needed

**Example:**
> User: "Change the user ID from integer to UUID"
>
> **Ask:** "This is a breaking change that affects:
> - Database migration required
> - API clients need updates
> - Existing data needs conversion
>
> Should I:
> 1. Create a migration plan first?
> 2. Support both formats during transition?
> 3. Implement as a new API version?"

### Domain-Specific Constraints

**Example:**
> User: "Calculate compound interest for the loan calculator"
>
> **Ask:** "Financial calculations have domain-specific requirements:
> 1. Rounding rules (banker's rounding vs. half-up)?
> 2. Precision requirements (how many decimal places)?
> 3. Regulatory compliance considerations?
>
> What are the requirements for this context?"

### Domain Entity Enumeration (Plan Generation)

**Example:**
> User: "Plan the implementation of connectors for all third-party integrations"
>
> **Ask:** "This plan requires enumerating specific integration targets. I can see 3 connectors
> in the codebase, but the task implies there may be more.
>
> Could you provide or confirm the complete list of integrations this plan should cover?
> I want to avoid inventing names that don't correspond to real, accessible services."
>
> → **Always ask** when a plan requires enumerating more than 5 domain entities you cannot
> verify from the codebase. See [Plan Generation Protocol](./plan-generation.md) §1.2.

### Scope Ambiguity (Plan Generation)

**Example:**
> User: "Create a plan to move this codebase to completion"
>
> **Ask:** "The term 'completion' maps to several possible scopes:
> 1. Close the 17 coverage gaps identified in ADR-120 (~6 steps, M plan)
> 2. Coverage gaps + CI/CD + infrastructure (~15 steps, L plan)
> 3. Full Phase 3-4 delivery per the reference plan (~30+ steps, XL plan, needs phasing)
>
> Which scope should this plan target?"
>
> → **Always ask** when the request uses words like "completion,"
> "finish," "everything," or "move forward" and the codebase has
> multiple possible scope boundaries.
> See [Plan Generation Protocol](./plan-generation.md) §1.0.

### Conflicting Information

**Example:**
> PURPOSE.md says: "We prioritize security over convenience"
> User request: "Remove password requirements to make signup easier"
>
> **Ask:** "This request conflicts with the stated principle in PURPOSE.md of prioritizing security. Should we:
> 1. Maintain current password requirements?
> 2. Update the principle to reflect new priorities?
> 3. Find a middle ground (e.g., optional strong passwords with warnings)?"

---

## Decision Framework

Use this framework to decide whether to proceed or ask:

```
Can I implement this with >90% confidence?
│
├─ YES ─→ Proceed autonomously
│         (but mention assumptions in commit message)
│
└─ NO ─→ Is this a small clarification?
          │
          ├─ YES ─→ Ask quick question
          │         "Just to confirm: should emails be case-insensitive?"
          │
          └─ NO ─→ Ask detailed question with options
                    "I need guidance on X. Here are the options..."
```

---

## How to Ask Questions

### Bad Questions

❌ **Too vague:**
> "How should I implement this?"

❌ **Overwhelming:**
> "Tell me everything about your authentication requirements, error handling, rate limiting, logging, monitoring..."

❌ **Leading:**
> "I'm going to use JWT tokens, okay?"

### Good Questions

✅ **Specific with context:**
> "The user lookup is slow (200ms avg). I can optimize by:
> 1. Adding database index on email (fastest, easy)
> 2. Adding Redis cache (faster, more complex)
> 3. Denormalizing data (fastest reads, harder writes)
>
> What are your priorities: simplicity, read performance, or write performance?"

✅ **Multiple-choice:**
> "For error handling, should I:
> A) Return generic 'Invalid input' message
> B) Return specific field-level errors
> C) Follow existing pattern in user creation endpoint"

✅ **With recommendation:**
> "I recommend option B (field-level errors) because:
> - Better UX for users
> - Consistent with ADR-023
> - Similar to other validation endpoints
>
> Does this align with your expectations?"

---

## Confidence Levels

### High Confidence (90-100%)
- Proceed autonomously
- Clearly documented pattern or requirement
- No architectural decisions needed
- Testable acceptance criteria

### Medium Confidence (70-90%)
- State assumptions and proceed
- "I'm implementing X assuming Y. If that's not correct, please let me know."
- Small, easily reversible decisions
- Low risk of major rework

### Low Confidence (<70%)
- Ask for clarification
- Multiple valid approaches
- High risk of rework if wrong
- Architectural or business-critical decisions

---

## Stating Assumptions

When proceeding with medium confidence, state assumptions:

**Example:**
> "I'm implementing email validation with these assumptions:
> - Email format follows RFC 5322
> - Case-insensitive comparison
> - Maximum length 254 characters
> - Returns HTTP 400 for invalid emails
>
> If any of these assumptions are incorrect, please let me know before I proceed."

This gives users a chance to correct course early.

---

## Learning from Feedback

**Track patterns:**
- Which assumptions were correct?
- Which questions led to better implementations?
- Which areas need more documentation?

**Suggest improvements:**
> "This question came up because there's no ADR on email validation. Should we document the decision?"

---

## Related Documents

- [Context Management](../ai-agents/context-management.md) - What to read first
- [No Batching](../ai-agents/no-batching.md) - Avoid splitting work
- [Plan Generation Protocol](./plan-generation.md) - Domain confidence gate for plans
- [Core Principles](../principles/core-principles.md) - Always follow these

---

## License

This document is released under CC0 1.0 Universal (Public Domain).
