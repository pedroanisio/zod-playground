---
disclaimer: >
  No information within this document should be taken for granted.
  Any statement or premise not backed by a real logical definition
  or verifiable reference may be invalid, erroneous, or a
  hallucination. This document is a design proposal, not an
  accepted specification. It must be evaluated against the existing
  framework artifacts before adoption.
---

# Feedback Entity — Design Specification

**Proposed schema version:** 0.6.0  
**Status:** proposed  
**Targets:** schema.js, validate.js, EntitySchemaMap, intent-spec-core.md

---

## The Problem

The framework's transition log records that feedback was received and
what changed as a result. The manifesto's evolution history (1.1.1,
1.4.0, 1.5.0) shows three transitions driven by external review.
But the feedback itself — what was claimed, what was accepted, what
was refuted, and why — has no structured representation.

This creates three gaps:

1. **The rationale is in prose, not in data.** The 1.4.0 transition
   says "An external critical review identified three structural
   gaps." Which specific claims were accepted? Which were refuted?
   The transition log compresses the feedback disposition into a
   narrative. Narrative is not queryable.

2. **Refutations are invisible.** When feedback is partially
   accepted, the accepted portion becomes a transition. The refuted
   portion vanishes. There is no record of *why* a claim was
   rejected. Future reviewers making the same claim will not know it
   was already evaluated and found unsound.

3. **Provenance is unstructured.** The framework requires provenance
   on intents (origin, co_origins) but not on the feedback that
   drives transitions. Who gave the feedback? What could they see?
   What couldn't they see? Without this, the processor cannot
   evaluate whether the source's projection was sufficient for their
   claims to be well-founded.

## The Design Axiom

> Feedback is not a source of truth. Feedback must be processed:
> if its content — in full or in part — is sound, accept it and
> improve accordingly; if not, refute it and clarify the objections.

This axiom has four structural consequences for the schema:

1. **Decomposition is mandatory.** A feedback record is not a
   monolith. It is decomposed into items, each carrying a single
   claim that receives its own independent disposition. If two
   assertions could have different dispositions, they are separate
   items.

2. **Silence is not a disposition.** Every item must reach a
   terminal state: accepted, partially_accepted, refuted, or
   deferred. "Pending" is a transient state, not a final one. A
   feedback record with pending items is incomplete.

3. **Refutation requires engagement.** Dismissal is not refutation.
   "The reviewer lacks context" is not an objection. "The claim
   assumes X, but X does not hold because Y" is. The schema
   enforces this through minimum-length validators on objections.

4. **Acceptance requires action.** Accepting a claim without
   recording what changed is a promise without a commit. The schema
   requires `actions_taken` on accepted items. The exception is
   `no_action_needed` — when the claim is true but the system
   already accounts for it.

## Ontological Position

### Within the framework

Feedback becomes the seventh first-class entity:

| Entity | Purpose |
|---|---|
| Intent | What the system commits to |
| Transition | How commitments change |
| Decision | What actions serve commitments |
| Tension | Where commitments conflict |
| Manifest | What boundaries exist |
| Origin | Where commitments came from |
| **Feedback** | **What external input was received and how it was processed** |

Feedback is to the framework what a code review is to a pull
request: structured evaluation of proposed or existing state by an
actor with a different projection. The framework already practices
this — the manifesto's transition log shows it. The schema makes
the practice governable.

### Within the constraint paper

Feedback maps to the paper's formal objects:

| Paper concept | Feedback mapping |
|---|---|
| Actor (Def 1.2) | `provenance.source_id` + `source_authority` |
| Observable projection (Def 2.1) | `provenance.projection_included` / `projection_excluded` |
| Channel (Def 2.10) | `provenance.channel` with loss model per channel type |
| SAC false-negative (Prop 2.7) | `false_negative_channel` on items — why was this missed? |
| Verification bandwidth (§4.8) | `verification_cost` — processing feedback consumes bw_verify |
| Specification-oversight tradeoff (§4.8) | Time spent processing feedback is time not spent declaring or reviewing |

The critical insight: **feedback processing is verification**.
Every item evaluated is a constraint checked. Every accepted item
is a constraint declared (it becomes a transition or tension).
Every refuted item is a constraint evaluated and found inapplicable.
Both directions consume the same scarce `bw_verify` the paper
proves is the binding resource.

## Worked Example

The manifesto's v1.4.0 transition was driven by an external critical
review. Here is how that feedback would be structured under the
proposed schema:

```yaml
feedback:
  id: FB-001
  title: "External critical review — ambition, novelty, and structural limits"
  date: "2026-02-06"

  provenance:
    source_id: external-reviewer-001
    source_authority: external_reviewer
    received: "2026-02-06"
    channel: external_review
    projection_included:
      - intent-driven-framework-definition.yml (v1.3.0)
      - prose/intent-manifesto.md (v1.3.0)
      - prose/intent-spec-core.md
    projection_excluded:
      - Lean 4 proof source (not published at time of review)
      - Zod schema internals (schema.js)
      - Flaw store implementation (store.js)
      - Constraint model paper (not yet written)
    artifact_ref: "external-review-2026-02-06"

  items:
    - id: FBI-01
      claim: >
        The framework does not cite 30+ years of prior art in
        goal-oriented requirements engineering, tension management,
        design rationale capture, and governance cycles.
      targets:
        - entity_type: intent
          entity_ref: intent-driven-framework-definition
          entity_version: "1.3.0"
          aspect: intellectual_lineage
      disposition: accepted
      rationale: >
        The claim is factually correct. The framework at v1.3.0
        made no reference to GORE/KAOS, Polarity Management,
        IBIS, PDCA, OODA, double-loop learning, or ADR prior art.
        These are established traditions that address overlapping
        concerns. Omitting them weakens the framework's
        positioning and risks re-inventing known solutions.
      actions_taken:
        - type: spec_change
          ref: "v1.4.0-intellectual-lineage"
          description: >
            Added intellectual_lineage section citing 6 traditions:
            GORE/KAOS, Polarity Management & Paradox Theory,
            Design Rationale Capture (IBIS), Governance Cycles
            (PDCA/OODA/double-loop), ADRs, and Organizational
            Strategy Frameworks. Each entry includes what_idf_adds.
      false_negative_channel: specification

    - id: FBI-02
      claim: >
        Goodhart's Law risk is unacknowledged — formalizing intent
        into measurable conditions creates gaming targets.
      targets:
        - entity_type: intent
          entity_ref: intent-driven-framework-definition
          entity_version: "1.3.0"
          aspect: failure_modes
        - entity_type: tension
          entity_ref: intent-driven-framework-definition
          entity_version: "1.3.0"
          aspect: tensions
      disposition: accepted
      rationale: >
        Correct. The framework at v1.3.0 had no acknowledgment
        that formalization creates gaming incentives. Falsifiable
        claims and achieved_coverage are exactly the kind of
        measurable proxies that Goodhart's Law predicts will be
        gamed when they become targets. This is a structural risk,
        not an edge case.
      actions_taken:
        - type: tension_created
          ref: T-06
          description: >
            Added T-06: Formalization vs. Goodhart's Law.
            Resolution policy: declares in prose remains the
            authority; Green boundary is owner judgment, not
            metric threshold; FM-07 makes gaming explicit.
        - type: fm_added
          ref: FM-07
          description: >
            Added FM-07: Metric gaming (Goodhart corruption).
            Diagnostic and mitigation defined.
      false_negative_channel: specification

    - id: FBI-03
      claim: >
        The TDD-based operational cycle does not consider
        alternative governance cycles (PDCA, double-loop learning)
        that may be more structurally appropriate.
      targets:
        - entity_type: intent
          entity_ref: intent-driven-framework-definition
          entity_version: "1.3.0"
          aspect: operational_cycle
      disposition: partially_accepted
      rationale: >
        The claim that alternatives should be considered is sound.
        The claim that alternatives may be "more structurally
        appropriate" is unsubstantiated — no argument was provided
        for why PDCA or double-loop learning would produce
        better governance outcomes for intent evolution than
        Red/Green/Refactor. The framework now documents the
        alternatives and positions the TDD framing as an adoption
        bridge rather than a structural necessity.
      accepted_portion: >
        Alternative governance cycles (PDCA, double-loop learning,
        OODA) should be acknowledged and compared. The framework
        at v1.3.0 presented Red/Green/Refactor as if no
        alternatives existed.
      refuted_portion: >
        The claim that alternatives "may be more structurally
        appropriate" was asserted without argument. The reviewer
        did not demonstrate that PDCA's Plan-Do-Check-Act or
        Argyris' double-loop learning produces tighter constraint
        discipline than Red/Green/Refactor for intent governance.
        The framework now compares all three but does not concede
        structural superiority without evidence.
      actions_taken:
        - type: spec_change
          ref: "v1.4.0-alternative-cycles"
          description: >
            Added alternative_cycles section to operational_cycle,
            comparing PDCA, double-loop learning, and OODA.
            Added reframe_commitment: TDD framing is an adoption
            bridge, not a structural necessity.
      false_negative_channel: specification

  processed_by: authors
  processing_status: processed
  verification_cost: high
  framework_version_at_processing: "1.3.0"

  triggered_transitions:
    - "v1.4.0-intellectual-lineage"
    - "v1.4.0-alternative-cycles"

  triggered_tensions:
    - T-06
```

## What This Enables

### 1. Feedback becomes queryable

"What feedback has been refuted?" is now a structured query, not a
prose archaeology exercise. An adopter encountering the framework
can see not just what it claims but what has been challenged and
how those challenges were resolved.

### 2. Refutation history prevents re-litigation

If a future reviewer raises the same Goodhart concern, the system
can show: this was received as FBI-02 in FB-001, accepted, and
produced T-06 and FM-07. If a reviewer claims the TDD isomorphism
is merely analogical, the system can show: this was partially
addressed in FBI-03 — the structural superiority claim was refuted,
but the alternative consideration was accepted.

### 3. False-negative channel closes the verification loop

When a feedback item catches something the validators missed, the
`false_negative_channel` field records *why* it was missed. All
three items in the example above are `specification` — the property
existed but no predicate tested it. This is the paper's Definition
4.12 made operational: each feedback item that identifies a
specification false negative is evidence that the intent projection
$\mathcal{G}$ needs another constraint.

### 4. Provenance makes projection-conditioned evaluation possible

FBI-03 was partially accepted because the source's claim about
structural superiority was unsubstantiated. The `projection_excluded`
field shows the source did not have access to the Lean proofs or
the constraint model paper. A processor can evaluate: "Given that
the source could see X but not Y, is their claim well-founded?"
This is the paper's Proposition 2.1 applied to feedback: every
claim is conditioned on $\hat{S}_a(t)$, not $S(t)$.

### 5. Verification cost makes the tradeoff visible

FB-001 has `verification_cost: high`. This is the paper's
specification-oversight tradeoff (§4.8): the time spent processing
this feedback was time not spent declaring new constraints or
reviewing output. Making this visible allows the framework to
reason about whether feedback processing is consuming too much
of the scarce verification budget — or too little.

## Validators

| ID | Rule | Severity |
|---|---|---|
| FB-RATIONALE | Non-pending items must have rationale ≥ 20 chars | error |
| FB-ACTION | Accepted/partially_accepted items must have actions_taken | error |
| FB-OBJECTION | Refuted items must have ≥ 1 objection, each ≥ 20 chars | error |
| FB-PARTIAL | Partially accepted items must specify both portions | error |
| FB-DEFER | Deferred items must have rationale and defer_until | warning |
| FB-PROVENANCE | projection_included must be non-empty; artifact_ref recommended | warning |
| FB-INTEGRITY | Item IDs must be unique within feedback record | error |
| FB-TRACEABILITY | triggered_transitions/tensions must appear in item actions | warning |

## Integration Points

### EntitySchemaMap addition

```typescript
const EntitySchemaMap = {
  // ... existing
  feedback: Feedback,
};
```

### validate.js addition

```typescript
} else if (entityType === "feedback") {
  const errors = validateFeedbackIntegrity(entityData);
  for (const err of errors) {
    flaws.push({
      criterion: err.criterion,
      message: err.message,
      severity: Severity.ERROR,
      phase: "structural",
    });
  }
}
```

### Repository structure addition

```
_data/
├── ...
└── _feedback/
    ├── FB-001-external-review-2026-02-06.yml
    └── FB-002-adopter-feedback-2026-03-15.yml
```

### Lifecycle hook

```yaml
hooks:
  on_feedback_processed:
    - action: check_unresolved_deferrals
    - action: update_false_negative_coverage_map
```

## What This Does NOT Do

- It does not weight feedback by source authority. Authority
  informs evaluation but does not determine disposition. A domain
  expert can be wrong. An outsider can be right. The disposition is
  determined by engaging with the claim's substance, not the
  claimant's credentials.

- It does not auto-accept or auto-refute. Every disposition is a
  human judgment call. The schema structures the judgment; it does
  not replace it.

- It does not model feedback on feedback (meta-feedback). If
  someone disputes a refutation, that is new feedback targeting the
  original feedback record. The schema is recursive by composition,
  not by self-reference.
