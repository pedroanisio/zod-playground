import { useState, useMemo, useRef, useCallback } from "react";
import {
  CORE,
  THEMES,
  TYPE,
  SP,
  RAD,
  SHADOW,
  MOTION,
  globalCSS,
  ThemeToggle,
  Badge,
  Overline,
  Card,
  CodeRef,
} from "../iande-theme.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// Semantic mappings
// ═══════════════════════════════════════════════════════════════════════════

function confTokens(c, t) {
  return {
    high:   { fg: t.fg.success, bg: t.bg.success, border: t.border.success, label: "HIGH" },
    medium: { fg: t.fg.warning, bg: t.bg.warning, border: t.border.warning, label: "MEDIUM" },
    low:    { fg: t.fg.error,   bg: t.bg.error,   border: t.border.error,   label: "LOW" },
  }[c] || { fg: t.fg.tertiary, bg: t.bg.tertiary, border: t.border.default, label: c };
}

function readinessTokens(r, t) {
  return {
    "ready-for-plan":     { fg: t.fg.success, bg: t.bg.success, border: t.border.success, label: "READY FOR PLAN", icon: "+" },
    "needs-human-input":  { fg: t.fg.warning, bg: t.bg.warning, border: t.border.warning, label: "NEEDS HUMAN INPUT", icon: "!" },
    "needs-investigation":{ fg: t.fg.error,   bg: t.bg.error,   border: t.border.error,   label: "NEEDS INVESTIGATION", icon: "x" },
  }[r] || { fg: t.fg.tertiary, bg: t.bg.tertiary, border: t.border.default, label: r, icon: "?" };
}

const SIZE_META = {
  XS: { label: "XS", color: (t) => t.fg.success },
  S:  { label: "S",  color: (t) => t.fg.success },
  M:  { label: "M",  color: (t) => t.fg.warning },
  L:  { label: "L",  color: (t) => t.fg.error },
  XL: { label: "XL", color: (t) => t.fg.error },
};

const TRUST_LABELS = { codebase: "Codebase", reference: "Reference", "user-provided": "User Provided" };
const DERIVATION_LABELS = {
  "user-explicit": "User Explicit", "inferred-from-reference": "Inferred (Reference)",
  "inferred-from-codebase": "Inferred (Codebase)", composite: "Composite",
};
const REASON_LABELS = {
  "external-vendor-cost": "Vendor Cost", "irreversible-architecture": "Irreversible Arch.",
  "infrastructure-commitment": "Infra Commitment", "scope-expansion": "Scope Expansion",
  "security-implications": "Security", other: "Other",
};

// ═══════════════════════════════════════════════════════════════════════════
// Readiness computation (mirrors validateMentalModel from schema)
// ═══════════════════════════════════════════════════════════════════════════

function computeReadiness(m) {
  const errors = [], warnings = [];
  const wsIds = new Set((m.delta?.workStreams || []).map(ws => ws.id));

  for (const ws of m.delta?.workStreams || []) {
    for (const dep of ws.dependsOn || []) {
      if (!wsIds.has(dep)) errors.push(`Work stream "${ws.id}" depends on unknown "${dep}"`);
    }
  }

  if (m.proposedPhases) {
    const phaseIds = new Set(m.proposedPhases.map(p => p.phaseId));
    const assigned = new Set();
    for (const ph of m.proposedPhases) {
      for (const wsId of ph.workStreamIds || []) {
        if (!wsIds.has(wsId)) errors.push(`Phase "${ph.phaseId}" refs unknown work stream "${wsId}"`);
        if (assigned.has(wsId)) errors.push(`Work stream "${wsId}" in multiple phases`);
        assigned.add(wsId);
      }
      for (const dep of ph.dependsOnPhases || []) {
        if (!phaseIds.has(dep)) errors.push(`Phase "${ph.phaseId}" depends on unknown phase "${dep}"`);
      }
    }
    for (const ws of m.delta?.workStreams || []) {
      if (!assigned.has(ws.id)) warnings.push(`Work stream "${ws.id}" not assigned to any phase`);
    }
  }

  const oq = m.openQuestions?.length || 0;
  const od = m.openDecisions?.length || 0;
  const uv = m.entities?.unverified?.length || 0;
  if (oq > 0) warnings.push(`${oq} open question(s) must be resolved`);
  if (od > 0) warnings.push(`${od} open decision(s) require human authority`);
  if (uv > 0) warnings.push(`${uv} unverified entity/entities`);
  if (m.overallConfidence !== "high") warnings.push(`Agent confidence is "${m.overallConfidence}"`);

  const lowConf = (m.assumptions || []).filter(a => a.confidence === "low").length;
  if (lowConf > 0) warnings.push(`${lowConf} low-confidence assumption(s)`);

  if (m.targetState?.derivation !== "user-explicit" && !m.targetState?.derivationRationale) {
    warnings.push("Target inferred but derivationRationale missing");
  }

  let readiness;
  if (errors.length > 0) readiness = "needs-investigation";
  else if (oq > 0 || od > 0 || uv > 0 || m.overallConfidence !== "high") readiness = "needs-human-input";
  else readiness = "ready-for-plan";

  return { errors, warnings, readiness, valid: errors.length === 0 };
}

function ConfBadge({ confidence, t, compact }) {
  const ct = confTokens(confidence, t);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: SP[1],
      padding: compact ? `${SP[0.5]}px ${SP[2]}px` : `${SP[1]}px ${SP[3]}px`,
      borderRadius: RAD.sm, fontFamily: TYPE.family.body,
      fontSize: compact ? "0.6875rem" : TYPE.size.xs,
      fontWeight: TYPE.weight.semibold, letterSpacing: TYPE.tracking.widest,
      color: ct.fg, background: ct.bg, border: `1px solid ${ct.border}`,
    }}>{ct.label}</span>
  );
}

function KV({ label, children, t, mono }) {
  return (
    <div style={{ display: "contents" }}>
      <span style={{ color: t.fg.tertiary, fontWeight: TYPE.weight.semibold, fontSize: TYPE.size.sm, textAlign: "right" }}>{label}</span>
      <span style={{
        color: t.fg.primary, fontSize: TYPE.size.sm, lineHeight: TYPE.leading.relaxed,
        fontFamily: mono ? TYPE.family.mono : TYPE.family.body,
        ...(mono ? { fontSize: TYPE.size.xs } : {}),
      }}>{children}</span>
    </div>
  );
}

function Prose({ children, t, style = {} }) {
  return (
    <p style={{
      margin: 0, fontFamily: TYPE.family.body, fontSize: TYPE.size.sm,
      color: t.fg.primary, lineHeight: TYPE.leading.relaxed, ...style,
    }}>{children}</p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Components
// ═══════════════════════════════════════════════════════════════════════════

// ── Readiness Banner ─────────────────────────────────────────────────────

function ReadinessBanner({ model, t }) {
  const v = useMemo(() => computeReadiness(model), [model]);
  const rt = readinessTokens(v.readiness, t);

  return (
    <Card t={t} style={{ marginBottom: SP[4], borderLeft: `3px solid ${rt.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: SP[3], marginBottom: v.errors.length + v.warnings.length > 0 ? SP[3] : 0 }}>
        <span style={{
          width: 28, height: 28, borderRadius: RAD.md,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.heavy,
          background: rt.bg, color: rt.fg, border: `1px solid ${rt.border}`,
        }}>{rt.icon}</span>
        <div>
          <span style={{
            fontSize: TYPE.size.xs, fontWeight: TYPE.weight.semibold,
            letterSpacing: TYPE.tracking.widest, color: rt.fg,
          }}>{rt.label}</span>
          <span style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary, marginLeft: SP[2] }}>
            {v.errors.length} error{v.errors.length !== 1 ? "s" : ""}, {v.warnings.length} warning{v.warnings.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ConfBadge confidence={model.overallConfidence} t={t} compact />
      </div>
      {v.errors.length > 0 && (
        <div style={{ marginBottom: SP[2] }}>
          {v.errors.map((e, i) => (
            <div key={i} style={{ fontSize: TYPE.size.xs, color: t.fg.error, padding: `${SP[0.5]}px 0`, fontFamily: TYPE.family.mono }}>{e}</div>
          ))}
        </div>
      )}
      {v.warnings.length > 0 && (
        <div>
          {v.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: TYPE.size.xs, color: t.fg.warning, padding: `${SP[0.5]}px 0` }}>{w}</div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Identity ─────────────────────────────────────────────────────────────

function IdentitySection({ id: ident, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[3] }}>
      <Card t={t}>
        <Overline t={t}>Identity</Overline>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: `${SP[1.5]}px ${SP[4]}px` }}>
          <KV label="Model ID" t={t} mono>{ident.modelId}</KV>
          <KV label="Author" t={t} mono>{ident.authorId}</KV>
          <KV label="Created" t={t} mono>{ident.createdAt}</KV>
        </div>
      </Card>

      <Card t={t}>
        <Overline t={t}>Task Description</Overline>
        <Prose t={t}>{ident.taskDescription}</Prose>
      </Card>

      <div>
        <Overline t={t} count={ident.sourcesConsulted?.length}>Sources Consulted</Overline>
        <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
          {(ident.sourcesConsulted || []).map((s, i) => {
            const trustColors = {
              codebase: { fg: t.fg.success, bg: t.bg.success, border: t.border.success },
              reference: { fg: t.fg.info, bg: t.bg.info, border: t.border.info },
              "user-provided": { fg: t.fg.warning, bg: t.bg.warning, border: t.border.warning },
            };
            const tc = trustColors[s.trustLevel] || trustColors.reference;
            return (
              <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px` }}>
                <div style={{ display: "flex", alignItems: "center", gap: SP[2], flexWrap: "wrap" }}>
                  <CodeRef t={t}>{s.path}</CodeRef>
                  <Badge fg={tc.fg} bg={tc.bg} border={tc.border} style={{ fontSize: "0.625rem" }}>
                    {TRUST_LABELS[s.trustLevel] || s.trustLevel}
                  </Badge>
                </div>
                <div style={{ fontSize: TYPE.size.xs, color: t.fg.secondary, marginTop: SP[1], lineHeight: TYPE.leading.normal }}>{s.description}</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Baseline ─────────────────────────────────────────────────────────────

function BaselineSection({ baseline: b, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[3] }}>
      <Card t={t}>
        <div style={{ display: "flex", alignItems: "center", gap: SP[3], marginBottom: SP[3] }}>
          <Overline t={t}>Snapshot</Overline>
          <CodeRef t={t}>{b.snapshot}</CodeRef>
        </div>
        <Prose t={t}>{b.summary}</Prose>
      </Card>

      {b.metrics?.length > 0 && (
        <div>
          <Overline t={t} count={b.metrics.length}>Metrics</Overline>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: SP[2] }}>
            {b.metrics.map((m, i) => (
              <Card key={i} t={t} style={{ padding: `${SP[3]}px`, textAlign: "center" }}>
                <div style={{
                  fontSize: TYPE.size.xl, fontWeight: TYPE.weight.heavy,
                  fontFamily: TYPE.family.mono, color: t.fg.brand, marginBottom: SP[0.5],
                }}>{m.value}</div>
                <div style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary, marginBottom: SP[1] }}>{m.unit}</div>
                <div style={{
                  fontSize: TYPE.size.sm, fontWeight: TYPE.weight.semibold, color: t.fg.primary,
                  lineHeight: TYPE.leading.normal,
                }}>{m.name}</div>
                <div style={{
                  fontSize: "0.625rem", color: t.fg.tertiary, fontFamily: TYPE.family.mono,
                  marginTop: SP[1], lineHeight: TYPE.leading.normal, wordBreak: "break-all",
                }}>{m.measuredBy}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {b.existingCapabilities?.length > 0 && (
        <div>
          <Overline t={t} count={b.existingCapabilities.length}>Existing Capabilities</Overline>
          <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
            {b.existingCapabilities.map((c, i) => (
              <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${t.border.success}` }}>
                <Prose t={t}>{c}</Prose>
              </Card>
            ))}
          </div>
        </div>
      )}

      {b.knownIssues?.length > 0 && (
        <div>
          <Overline t={t} count={b.knownIssues.length}>Known Issues</Overline>
          <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
            {b.knownIssues.map((iss, i) => (
              <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${t.border.warning}` }}>
                <Prose t={t} style={{ color: t.fg.warning }}>{iss}</Prose>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Target ───────────────────────────────────────────────────────────────

function TargetSection({ target: tgt, t }) {
  const dColors = {
    "user-explicit": { fg: t.fg.success, bg: t.bg.success, border: t.border.success },
    "inferred-from-reference": { fg: t.fg.info, bg: t.bg.info, border: t.border.info },
    "inferred-from-codebase": { fg: t.fg.warning, bg: t.bg.warning, border: t.border.warning },
    composite: { fg: t.fg.brand, bg: t.bg.brandSubtle, border: t.border.brand },
  };
  const dc = dColors[tgt.derivation] || dColors.composite;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[3] }}>
      <Card t={t} style={{ borderLeft: `3px solid ${t.border.brand}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[2], flexWrap: "wrap" }}>
          <Overline t={t}>Definition</Overline>
          <Badge fg={dc.fg} bg={dc.bg} border={dc.border}>{DERIVATION_LABELS[tgt.derivation] || tgt.derivation}</Badge>
        </div>
        <Prose t={t} style={{ fontSize: TYPE.size.base, fontWeight: TYPE.weight.medium }}>{tgt.definition}</Prose>
      </Card>

      {tgt.derivationRationale && (
        <Card t={t}>
          <Overline t={t}>Derivation Rationale</Overline>
          <Prose t={t}>{tgt.derivationRationale}</Prose>
        </Card>
      )}

      {tgt.successCriteria?.length > 0 && (
        <div>
          <Overline t={t} count={tgt.successCriteria.length}>Success Criteria</Overline>
          <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
            {tgt.successCriteria.map((sc, i) => (
              <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, display: "flex", alignItems: "flex-start", gap: SP[2] }}>
                <span style={{
                  width: 20, height: 20, borderRadius: RAD.sm, flexShrink: 0,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontFamily: TYPE.family.mono, fontSize: "0.625rem", fontWeight: TYPE.weight.heavy,
                  background: t.bg.brandSubtle, color: t.fg.brand, marginTop: 1,
                }}>{i + 1}</span>
                <Prose t={t}>{sc}</Prose>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Delta / Work Streams ─────────────────────────────────────────────────

function DeltaSection({ delta: d, t, onWsClick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[3] }}>
      <Card t={t}>
        <Overline t={t}>Gap Summary</Overline>
        <Prose t={t}>{d.summary}</Prose>
      </Card>

      <Overline t={t} count={d.workStreams?.length}>Work Streams</Overline>
      <div style={{ display: "flex", flexDirection: "column", gap: SP[2] }}>
        {(d.workStreams || []).map(ws => {
          const sm = SIZE_META[ws.estimatedSize] || SIZE_META.M;
          return (
            <Card key={ws.id} t={t} onClick={() => onWsClick?.(ws.id)}
              style={{ borderLeft: `3px solid ${t.border.brand}`, cursor: onWsClick ? "pointer" : "default" }}>
              <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[1], flexWrap: "wrap" }}>
                <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: t.fg.primary }}>{ws.id}</span>
                <Badge fg={sm.color(t)} bg={t.bg.tertiary} border={t.border.default} style={{ fontSize: "0.625rem" }}>{sm.label}</Badge>
                {(ws.dependsOn || []).map(dep => (
                  <span key={dep} style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary }}>
                    {"<-"} <span style={{ fontFamily: TYPE.family.mono, color: t.fg.info }}>{dep}</span>
                  </span>
                ))}
              </div>
              <div style={{
                fontSize: TYPE.size.sm, fontWeight: TYPE.weight.semibold, color: t.fg.primary,
                marginBottom: SP[1], lineHeight: TYPE.leading.normal,
              }}>{ws.title}</div>
              <Prose t={t} style={{ color: t.fg.secondary }}>{ws.deliverable}</Prose>
              {ws.touchesAreas?.length > 0 && (
                <div style={{ display: "flex", gap: SP[1], flexWrap: "wrap", marginTop: SP[2] }}>
                  {ws.touchesAreas.map((a, i) => <CodeRef key={i} t={t}>{a}</CodeRef>)}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {d.excludedFromScope?.length > 0 && (
        <div style={{ marginTop: SP[2] }}>
          <Overline t={t} count={d.excludedFromScope.length}>Excluded from Scope</Overline>
          <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
            {d.excludedFromScope.map((ex, i) => (
              <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${t.border.default}` }}>
                <div style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.semibold, color: t.fg.primary, marginBottom: SP[0.5] }}>{ex.item}</div>
                <div style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary, lineHeight: TYPE.leading.normal }}>{ex.reason}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Entities ─────────────────────────────────────────────────────────────

function EntitiesSection({ entities: e, t }) {
  const [tab, setTab] = useState("verified");
  const counts = { verified: e.verified?.length || 0, unverified: e.unverified?.length || 0, absent: e.confirmedAbsent?.length || 0 };
  const tabs = [
    { key: "verified", label: "Verified", count: counts.verified, fg: t.fg.success, bg: t.bg.success, border: t.border.success },
    { key: "unverified", label: "Unverified", count: counts.unverified, fg: t.fg.error, bg: t.bg.error, border: t.border.error },
    { key: "absent", label: "Confirmed Absent", count: counts.absent, fg: t.fg.warning, bg: t.bg.warning, border: t.border.warning },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: SP[1], marginBottom: SP[3], flexWrap: "wrap" }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            display: "inline-flex", alignItems: "center", gap: SP[1],
            padding: `${SP[1.5]}px ${SP[3]}px`, borderRadius: RAD.md,
            fontFamily: TYPE.family.body, fontSize: TYPE.size.xs,
            fontWeight: TYPE.weight.semibold, cursor: "pointer",
            transition: `all ${MOTION.fast}`,
            background: tab === tb.key ? tb.bg : t.bg.secondary,
            color: tab === tb.key ? tb.fg : t.fg.secondary,
            border: `1px solid ${tab === tb.key ? tb.border : t.border.subtle}`,
          }}>{tb.label} ({tb.count})</button>
        ))}
      </div>

      {tab === "verified" && (
        <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
          {(e.verified || []).map((ent, i) => (
            <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${t.border.success}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: SP[2], flexWrap: "wrap" }}>
                <span style={{ fontWeight: TYPE.weight.semibold, fontSize: TYPE.size.sm, color: t.fg.primary }}>{ent.name}</span>
                <Badge fg={t.fg.brand} bg={t.bg.brandSubtle} style={{ fontSize: "0.625rem" }}>{ent.kind}</Badge>
              </div>
              <div style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary, fontFamily: TYPE.family.mono, marginTop: SP[1], lineHeight: TYPE.leading.normal }}>{ent.verifiedFrom}</div>
            </Card>
          ))}
          {counts.verified === 0 && <div style={{ color: t.fg.tertiary, fontSize: TYPE.size.sm, padding: SP[4], textAlign: "center" }}>No verified entities.</div>}
        </div>
      )}

      {tab === "unverified" && (
        <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
          {(e.unverified || []).map((ent, i) => (
            <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${t.border.error}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: SP[2], flexWrap: "wrap" }}>
                <span style={{ fontWeight: TYPE.weight.semibold, fontSize: TYPE.size.sm, color: t.fg.primary }}>{ent.name}</span>
                <Badge fg={t.fg.brand} bg={t.bg.brandSubtle} style={{ fontSize: "0.625rem" }}>{ent.kind}</Badge>
              </div>
              <div style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary, marginTop: SP[1] }}>Source: <span style={{ fontFamily: TYPE.family.mono }}>{ent.source}</span></div>
              <div style={{ fontSize: TYPE.size.xs, color: t.fg.error, marginTop: SP[0.5], lineHeight: TYPE.leading.normal }}>If missing: {ent.impactIfMissing}</div>
            </Card>
          ))}
          {counts.unverified === 0 && <div style={{ color: t.fg.success, fontSize: TYPE.size.sm, padding: SP[4], textAlign: "center" }}>All entities verified.</div>}
        </div>
      )}

      {tab === "absent" && (
        <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
          {(e.confirmedAbsent || []).map((ent, i) => (
            <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${t.border.warning}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: SP[2], flexWrap: "wrap" }}>
                <span style={{ fontWeight: TYPE.weight.semibold, fontSize: TYPE.size.sm, color: t.fg.primary }}>{ent.name}</span>
                <Badge fg={t.fg.brand} bg={t.bg.brandSubtle} style={{ fontSize: "0.625rem" }}>{ent.kind}</Badge>
              </div>
              <div style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary, fontFamily: TYPE.family.mono, marginTop: SP[1] }}>Expected: {ent.expectedLocation}</div>
              <div style={{ fontSize: TYPE.size.xs, color: t.fg.warning, fontFamily: TYPE.family.mono, marginTop: SP[0.5], lineHeight: TYPE.leading.normal }}>Checked: {ent.checkedVia}</div>
            </Card>
          ))}
          {counts.absent === 0 && <div style={{ color: t.fg.tertiary, fontSize: TYPE.size.sm, padding: SP[4], textAlign: "center" }}>No confirmed absent entities.</div>}
        </div>
      )}
    </div>
  );
}

// ── Assumptions ──────────────────────────────────────────────────────────

function AssumptionsSection({ assumptions: aList, t }) {
  const [selId, setSelId] = useState(null);
  const sel = selId ? aList.find(a => a.id === selId) : null;

  if (sel) {
    const ct = confTokens(sel.confidence, t);
    return (
      <div style={{ animation: "iandeSlide 200ms cubic-bezier(0.2,0,0,1)" }}>
        <button onClick={() => setSelId(null)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: TYPE.family.body, fontSize: TYPE.size.sm,
          fontWeight: TYPE.weight.medium, color: t.fg.secondary,
          padding: 0, marginBottom: SP[4], display: "flex", alignItems: "center", gap: SP[1],
        }}>{"<-"} Back</button>
        <Card t={t} style={{ borderLeft: `3px solid ${ct.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[3], flexWrap: "wrap" }}>
            <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: t.fg.primary }}>{sel.id}</span>
            <ConfBadge confidence={sel.confidence} t={t} />
          </div>
          <Overline t={t}>Statement</Overline>
          <Prose t={t} style={{ marginBottom: SP[4] }}>{sel.statement}</Prose>
          <Overline t={t}>If Wrong</Overline>
          <Prose t={t} style={{ color: t.fg.error, marginBottom: sel.verificationHint ? SP[4] : 0 }}>{sel.ifWrong}</Prose>
          {sel.verificationHint && (<>
            <Overline t={t}>Verification Hint</Overline>
            <Prose t={t} style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs }}>{sel.verificationHint}</Prose>
          </>)}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
      {(aList || []).map(a => {
        const ct = confTokens(a.confidence, t);
        return (
          <Card key={a.id} t={t} onClick={() => setSelId(a.id)}
            style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `3px solid ${ct.border}`, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[1], flexWrap: "wrap" }}>
              <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: t.fg.primary }}>{a.id}</span>
              <ConfBadge confidence={a.confidence} t={t} compact />
              <span style={{ fontSize: TYPE.size.base, color: t.fg.disabled, marginLeft: "auto" }}>{">"}</span>
            </div>
            <Prose t={t} style={{
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              color: t.fg.secondary,
            }}>{a.statement}</Prose>
          </Card>
        );
      })}
      {(!aList || aList.length === 0) && <div style={{ color: t.fg.tertiary, fontSize: TYPE.size.sm, padding: SP[4], textAlign: "center" }}>No assumptions recorded.</div>}
    </div>
  );
}

// ── Open Questions ───────────────────────────────────────────────────────

function QuestionsSection({ questions: qList, t }) {
  const [selId, setSelId] = useState(null);
  const sel = selId ? qList.find(q => q.id === selId) : null;

  if (sel) return (
    <div style={{ animation: "iandeSlide 200ms cubic-bezier(0.2,0,0,1)" }}>
      <button onClick={() => setSelId(null)} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: TYPE.family.body, fontSize: TYPE.size.sm,
        fontWeight: TYPE.weight.medium, color: t.fg.secondary, padding: 0, marginBottom: SP[4],
      }}>{"<-"} Back</button>
      <Card t={t} style={{ borderLeft: `3px solid ${t.border.warning}`, marginBottom: SP[3] }}>
        <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[2] }}>
          <span style={{ fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold, fontSize: TYPE.size.sm, color: t.fg.primary }}>{sel.id}</span>
          <Badge fg={t.fg.warning} bg={t.bg.warning} border={t.border.warning}>OPEN</Badge>
        </div>
        <Prose t={t} style={{ fontSize: TYPE.size.base, fontWeight: TYPE.weight.medium }}>{sel.question}</Prose>
      </Card>
      <Card t={t} style={{ marginBottom: SP[3] }}>
        <Overline t={t}>Context</Overline>
        <Prose t={t}>{sel.context}</Prose>
      </Card>
      <Overline t={t} count={sel.options?.length}>Options</Overline>
      <div style={{ display: "flex", flexDirection: "column", gap: SP[1], marginBottom: SP[3] }}>
        {(sel.options || []).map((o, i) => (
          <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px` }}>
            <div style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.semibold, color: t.fg.primary, marginBottom: SP[1] }}>{o.answer}</div>
            <div style={{ fontSize: TYPE.size.xs, color: t.fg.secondary, lineHeight: TYPE.leading.normal }}>{o.implication}</div>
          </Card>
        ))}
      </div>
      {sel.blocksWorkStreams?.length > 0 && (
        <div style={{ marginBottom: SP[3] }}>
          <Overline t={t}>Blocks Work Streams</Overline>
          <div style={{ display: "flex", gap: SP[1], flexWrap: "wrap" }}>{sel.blocksWorkStreams.map(ws => <CodeRef key={ws} t={t}>{ws}</CodeRef>)}</div>
        </div>
      )}
      {sel.agentRecommendation && (
        <Card t={t} style={{ borderLeft: `2px solid ${t.border.brand}` }}>
          <Overline t={t}>Agent Recommendation</Overline>
          <Prose t={t} style={{ fontStyle: "italic" }}>{sel.agentRecommendation}</Prose>
        </Card>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
      {(qList || []).map(q => (
        <Card key={q.id} t={t} onClick={() => setSelId(q.id)}
          style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `3px solid ${t.border.warning}`, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[1], flexWrap: "wrap" }}>
            <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: t.fg.primary }}>{q.id}</span>
            {q.blocksWorkStreams?.length > 0 && <span style={{ fontSize: TYPE.size.xs, color: t.fg.error }}>Blocks {q.blocksWorkStreams.length}</span>}
            <span style={{ fontSize: TYPE.size.base, color: t.fg.disabled, marginLeft: "auto" }}>{">"}</span>
          </div>
          <Prose t={t} style={{ color: t.fg.secondary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{q.question}</Prose>
        </Card>
      ))}
      {(!qList || qList.length === 0) && <div style={{ color: t.fg.success, fontSize: TYPE.size.sm, padding: SP[4], textAlign: "center" }}>No open questions. All resolved.</div>}
    </div>
  );
}

// ── Open Decisions ───────────────────────────────────────────────────────

function DecisionsSection({ decisions: dList, t }) {
  const [selId, setSelId] = useState(null);
  const sel = selId ? dList.find(d => d.id === selId) : null;

  if (sel) return (
    <div style={{ animation: "iandeSlide 200ms cubic-bezier(0.2,0,0,1)" }}>
      <button onClick={() => setSelId(null)} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: TYPE.family.body, fontSize: TYPE.size.sm,
        fontWeight: TYPE.weight.medium, color: t.fg.secondary, padding: 0, marginBottom: SP[4],
      }}>{"<-"} Back</button>
      <Card t={t} style={{ borderLeft: `3px solid ${t.border.error}`, marginBottom: SP[3] }}>
        <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[2], flexWrap: "wrap" }}>
          <span style={{ fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold, fontSize: TYPE.size.sm, color: t.fg.primary }}>{sel.id}</span>
          <Badge fg={t.fg.error} bg={t.bg.error} border={t.border.error}>{REASON_LABELS[sel.reason] || sel.reason}</Badge>
        </div>
        <Prose t={t} style={{ fontSize: TYPE.size.base, fontWeight: TYPE.weight.medium }}>{sel.title}</Prose>
      </Card>
      <Overline t={t} count={sel.options?.length}>Options</Overline>
      <div style={{ display: "flex", flexDirection: "column", gap: SP[1], marginBottom: SP[3] }}>
        {(sel.options || []).map((o, i) => (
          <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px` }}>
            <div style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.semibold, color: t.fg.primary, marginBottom: SP[1] }}>{o.option}</div>
            <div style={{ fontSize: TYPE.size.xs, color: t.fg.secondary, lineHeight: TYPE.leading.normal }}>{o.tradeoff}</div>
          </Card>
        ))}
      </div>
      {sel.affectsWorkStreams?.length > 0 && (
        <div style={{ marginBottom: SP[3] }}>
          <Overline t={t}>Affects Work Streams</Overline>
          <div style={{ display: "flex", gap: SP[1], flexWrap: "wrap" }}>{sel.affectsWorkStreams.map(ws => <CodeRef key={ws} t={t}>{ws}</CodeRef>)}</div>
        </div>
      )}
      {sel.agentRecommendation && (
        <Card t={t} style={{ borderLeft: `2px solid ${t.border.brand}` }}>
          <Overline t={t}>Agent Recommendation</Overline>
          <Prose t={t} style={{ fontStyle: "italic" }}>{sel.agentRecommendation}</Prose>
        </Card>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
      {(dList || []).map(d => (
        <Card key={d.id} t={t} onClick={() => setSelId(d.id)}
          style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `3px solid ${t.border.error}`, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[1], flexWrap: "wrap" }}>
            <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: t.fg.primary }}>{d.id}</span>
            <Badge fg={t.fg.error} bg={t.bg.error} border={t.border.error} style={{ fontSize: "0.625rem" }}>{REASON_LABELS[d.reason] || d.reason}</Badge>
            <span style={{ fontSize: TYPE.size.base, color: t.fg.disabled, marginLeft: "auto" }}>{">"}</span>
          </div>
          <Prose t={t} style={{ color: t.fg.secondary }}>{d.title}</Prose>
        </Card>
      ))}
      {(!dList || dList.length === 0) && <div style={{ color: t.fg.success, fontSize: TYPE.size.sm, padding: SP[4], textAlign: "center" }}>No open decisions. All resolved.</div>}
    </div>
  );
}

// ── Constraints ──────────────────────────────────────────────────────────

function ConstraintsSection({ constraints: cList, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
      {(cList || []).map(c => (
        <Card key={c.id} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${c.kind === "invariant" ? t.border.error : t.border.info}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[1], flexWrap: "wrap" }}>
            <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: t.fg.primary }}>{c.id}</span>
            <Badge
              fg={c.kind === "invariant" ? t.fg.error : t.fg.info}
              bg={c.kind === "invariant" ? t.bg.error : t.bg.info}
              border={c.kind === "invariant" ? t.border.error : t.border.info}
              style={{ fontSize: "0.625rem" }}
            >{c.kind.toUpperCase()}</Badge>
          </div>
          <Prose t={t}>{c.description}</Prose>
          {c.verificationCommand && (
            <div style={{ marginTop: SP[2], padding: `${SP[1.5]}px ${SP[3]}px`, borderRadius: RAD.md, background: t.bg.tertiary }}>
              <code style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: t.fg.brand, lineHeight: TYPE.leading.relaxed, wordBreak: "break-all" }}>{c.verificationCommand}</code>
            </div>
          )}
        </Card>
      ))}
      {(!cList || cList.length === 0) && <div style={{ color: t.fg.tertiary, fontSize: TYPE.size.sm, padding: SP[4], textAlign: "center" }}>No constraints recorded.</div>}
    </div>
  );
}

// ── Phases ────────────────────────────────────────────────────────────────

function PhasesSection({ phases, t }) {
  if (!phases?.length) return <div style={{ color: t.fg.tertiary, fontSize: TYPE.size.sm, padding: SP[4], textAlign: "center" }}>Single-plan scope. No phasing needed.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SP[2] }}>
      {phases.map((ph, i) => (
        <Card key={ph.phaseId} t={t} style={{ borderLeft: `3px solid ${t.border.brand}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[2], flexWrap: "wrap" }}>
            <span style={{
              width: 24, height: 24, borderRadius: RAD.sm,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.heavy,
              background: t.bg.brand, color: t.fg.inverse,
            }}>{i + 1}</span>
            <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: t.fg.primary }}>{ph.phaseId}</span>
            {ph.estimatedPlanLines && <Badge fg={t.fg.tertiary} bg={t.bg.tertiary}>~{ph.estimatedPlanLines} lines</Badge>}
          </div>
          <div style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.semibold, color: t.fg.primary, marginBottom: SP[1] }}>{ph.title}</div>
          <Prose t={t} style={{ color: t.fg.secondary, marginBottom: SP[2] }}>{ph.description}</Prose>
          <div style={{ display: "flex", gap: SP[1], flexWrap: "wrap" }}>
            {(ph.workStreamIds || []).map(ws => <CodeRef key={ws} t={t}>{ws}</CodeRef>)}
          </div>
          {ph.dependsOnPhases?.length > 0 && (
            <div style={{ marginTop: SP[2], fontSize: TYPE.size.xs, color: t.fg.tertiary }}>
              Depends on: {ph.dependsOnPhases.map(p => <span key={p} style={{ fontFamily: TYPE.family.mono, color: t.fg.info, marginRight: SP[1] }}>{p}</span>)}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main View
// ═══════════════════════════════════════════════════════════════════════════

function ModelView({ data, t, onReset }) {
  const [view, setView] = useState("overview");

  const oq = data.openQuestions?.length || 0;
  const od = data.openDecisions?.length || 0;
  const uv = data.entities?.unverified?.length || 0;

  const tabs = [
    { key: "overview",    label: "Overview" },
    { key: "baseline",    label: "Baseline" },
    { key: "target",      label: "Target" },
    { key: "delta",       label: "Delta" },
    { key: "entities",    label: "Entities" },
    { key: "assumptions", label: "Assumptions", count: data.assumptions?.length },
    { key: "questions",   label: "Questions",   count: oq, alert: oq > 0 },
    { key: "decisions",   label: "Decisions",   count: od, alert: od > 0 },
    { key: "constraints", label: "Constraints", count: data.constraints?.length },
    ...(data.proposedPhases?.length ? [{ key: "phases", label: "Phases" }] : []),
  ];

  return (
    <>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: SP[1], marginBottom: SP[4], overflowX: "auto", paddingBottom: SP[1] }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setView(tb.key)} style={{
            padding: `${SP[1.5]}px ${SP[3]}px`, borderRadius: RAD.md,
            fontFamily: TYPE.family.body, fontSize: TYPE.size.xs,
            fontWeight: TYPE.weight.semibold, cursor: "pointer",
            transition: `all ${MOTION.fast}`, whiteSpace: "nowrap",
            display: "inline-flex", alignItems: "center", gap: SP[1],
            background: view === tb.key ? t.bg.brandSubtle : t.bg.secondary,
            color: view === tb.key ? t.fg.brand : t.fg.secondary,
            border: `1px solid ${view === tb.key ? t.border.brand : t.border.subtle}`,
          }}>
            {tb.label}
            {tb.count != null && <span style={{
              fontSize: "0.625rem", padding: `0 ${SP[1]}px`, borderRadius: RAD.full,
              background: tb.alert ? t.bg.error : t.bg.tertiary,
              color: tb.alert ? t.fg.error : t.fg.tertiary,
            }}>{tb.count}</span>}
          </button>
        ))}
        <button onClick={onReset} style={{
          marginLeft: "auto", padding: `${SP[1.5]}px ${SP[3]}px`, borderRadius: RAD.md,
          fontFamily: TYPE.family.body, fontSize: TYPE.size.xs,
          fontWeight: TYPE.weight.semibold, color: t.fg.tertiary,
          background: t.bg.tertiary, border: `1px solid ${t.border.default}`,
          cursor: "pointer", flexShrink: 0,
        }}>Load different</button>
      </div>

      {/* Overview */}
      {view === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: SP[3] }}>
          <ReadinessBanner model={data} t={t} />

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: SP[2] }}>
            {[
              { label: "Work Streams", val: data.delta?.workStreams?.length || 0, color: t.fg.brand },
              { label: "Verified", val: data.entities?.verified?.length || 0, color: t.fg.success },
              { label: "Unverified", val: uv, color: uv > 0 ? t.fg.error : t.fg.success },
              { label: "Absent", val: data.entities?.confirmedAbsent?.length || 0, color: t.fg.warning },
              { label: "Assumptions", val: data.assumptions?.length || 0, color: t.fg.primary },
              { label: "Questions", val: oq, color: oq > 0 ? t.fg.error : t.fg.success },
              { label: "Decisions", val: od, color: od > 0 ? t.fg.error : t.fg.success },
              { label: "Constraints", val: data.constraints?.length || 0, color: t.fg.info },
            ].map((s, i) => (
              <Card key={i} t={t} style={{ textAlign: "center", padding: `${SP[3]}px ${SP[2]}px` }}>
                <div style={{
                  fontSize: TYPE.size.lg, fontWeight: TYPE.weight.heavy,
                  fontFamily: TYPE.family.mono, color: s.color, marginBottom: SP[0.5],
                }}>{s.val}</div>
                <div style={{
                  fontSize: "0.625rem", fontWeight: TYPE.weight.semibold,
                  letterSpacing: TYPE.tracking.widest, textTransform: "uppercase",
                  color: t.fg.tertiary,
                }}>{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Target preview */}
          {data.targetState?.definition && (
            <Card t={t} style={{ borderLeft: `3px solid ${t.border.brand}` }}>
              <Overline t={t}>Target State</Overline>
              <Prose t={t} style={{ fontWeight: TYPE.weight.medium }}>{data.targetState.definition}</Prose>
            </Card>
          )}

          {/* Delta preview */}
          {data.delta?.summary && (
            <Card t={t}>
              <Overline t={t}>Delta Summary</Overline>
              <Prose t={t}>{data.delta.summary}</Prose>
            </Card>
          )}

          {/* Review notes */}
          {data.reviewNotes && (
            <Card t={t} style={{ borderLeft: `2px solid ${t.border.info}` }}>
              <Overline t={t}>Review Notes</Overline>
              <Prose t={t}>{data.reviewNotes}</Prose>
            </Card>
          )}
        </div>
      )}

      {view === "baseline" && <BaselineSection baseline={data.baseline || {}} t={t} />}
      {view === "target" && <TargetSection target={data.targetState || {}} t={t} />}
      {view === "delta" && <DeltaSection delta={data.delta || {}} t={t} />}
      {view === "entities" && <EntitiesSection entities={data.entities || {}} t={t} />}
      {view === "assumptions" && <AssumptionsSection assumptions={data.assumptions || []} t={t} />}
      {view === "questions" && <QuestionsSection questions={data.openQuestions || []} t={t} />}
      {view === "decisions" && <DecisionsSection decisions={data.openDecisions || []} t={t} />}
      {view === "constraints" && <ConstraintsSection constraints={data.constraints || []} t={t} />}
      {view === "phases" && <PhasesSection phases={data.proposedPhases} t={t} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Loader
// ═══════════════════════════════════════════════════════════════════════════

function Loader({ onLoad, t }) {
  const [mode, setMode] = useState("upload");
  const [paste, setPaste] = useState("");
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);

  const tryParse = useCallback((text, src) => {
    setError(null);
    try {
      const p = JSON.parse(text);
      if (!p.identity && !p.baseline && !p.targetState) {
        setError('Expected "identity", "baseline", or "targetState" at root.');
        return;
      }
      onLoad({ ...p, _source: src });
    } catch (e) { setError(`Invalid JSON: ${e.message}`); }
  }, [onLoad]);

  const handleFile = useCallback(f => {
    if (!f) return; setError(null);
    const r = new FileReader();
    r.onload = e => tryParse(e.target.result, f.name);
    r.onerror = () => setError("Failed to read file.");
    r.readAsText(f);
  }, [tryParse]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: t.bg.primary, padding: SP[5],
    }}>
      <div style={{ width: "100%", maxWidth: 500, animation: "iandeSlide 350ms cubic-bezier(0.05,0.7,0.1,1)" }}>
        <div style={{ textAlign: "center", marginBottom: SP[8] }}>
          <div style={{
            width: 48, height: 48, borderRadius: RAD.lg, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            background: CORE.teal, color: CORE.white,
            fontFamily: TYPE.family.mono, fontSize: TYPE.size.lg, fontWeight: TYPE.weight.heavy,
            marginBottom: SP[4], boxShadow: SHADOW.lg,
          }}>MM</div>
          <h1 style={{
            margin: 0, fontFamily: TYPE.family.heading,
            fontSize: TYPE.size["2xl"], fontWeight: TYPE.weight.bold,
            letterSpacing: TYPE.tracking.tight, color: t.fg.primary, lineHeight: TYPE.leading.snug,
          }}>Mental Model Viewer</h1>
          <p style={{
            margin: `${SP[2]}px 0 0`, fontFamily: TYPE.family.body,
            fontSize: TYPE.size.sm, color: t.fg.secondary, lineHeight: TYPE.leading.relaxed,
          }}>Load a mental model JSON to inspect baseline, target, delta, entities, and readiness.</p>
        </div>

        <div style={{
          display: "flex", background: t.bg.secondary, borderRadius: RAD.md,
          padding: SP[0.5], marginBottom: SP[4], border: `1px solid ${t.border.subtle}`,
        }}>
          {[{ key: "upload", label: "Upload File" }, { key: "paste", label: "Paste JSON" }].map(tb => (
            <button key={tb.key} onClick={() => { setMode(tb.key); setError(null); }} style={{
              flex: 1, padding: `${SP[2]}px 0`, borderRadius: RAD.sm,
              fontFamily: TYPE.family.body, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.semibold,
              border: "none", cursor: "pointer", transition: `all ${MOTION.fast}`,
              background: mode === tb.key ? t.bg.brandSubtle : "transparent",
              color: mode === tb.key ? t.fg.brand : t.fg.tertiary,
            }}>{tb.label}</button>
          ))}
        </div>

        {mode === "upload" && (
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={e => { e.preventDefault(); setDrag(false); }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); setDrag(false); handleFile(e.dataTransfer?.files?.[0]); }}
            onClick={() => ref.current?.click()}
            style={{
              border: `2px dashed ${drag ? t.border.brand : t.border.default}`,
              borderRadius: RAD.lg, padding: `${SP[8]}px ${SP[6]}px`, textAlign: "center",
              cursor: "pointer", transition: `all ${MOTION.normal}`,
              background: drag ? t.bg.brandSubtle : t.bg.secondary,
            }}
          >
            <input ref={ref} type="file" accept=".json" style={{ display: "none" }}
              onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            <div style={{ fontSize: TYPE.size.base, fontWeight: TYPE.weight.semibold, color: t.fg.primary, marginBottom: SP[1] }}>
              {drag ? "Drop here" : "Drop a .json file or click to browse"}
            </div>
            <div style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary }}>
              Expects MentalModelSchema v0.1.0
            </div>
          </div>
        )}

        {mode === "paste" && (
          <div>
            <textarea value={paste} onChange={e => { setPaste(e.target.value); setError(null); }}
              placeholder='{ "schemaVersion": "0.1.0", "identity": { ... }, ... }'
              spellCheck={false}
              style={{
                width: "100%", minHeight: 200, padding: SP[4], borderRadius: RAD.lg,
                border: `1px solid ${t.border.default}`, fontFamily: TYPE.family.mono,
                fontSize: TYPE.size.xs, color: t.fg.primary, background: t.bg.secondary,
                resize: "vertical", outline: "none", lineHeight: TYPE.leading.relaxed,
                transition: `border-color ${MOTION.fast}`,
              }}
              onFocus={e => e.target.style.borderColor = t.border.brand}
              onBlur={e => e.target.style.borderColor = t.border.default}
            />
            <button onClick={() => paste.trim() && tryParse(paste, "pasted JSON")}
              disabled={!paste.trim()}
              style={{
                marginTop: SP[3], width: "100%", padding: `${SP[3]}px 0`,
                borderRadius: RAD.md, fontFamily: TYPE.family.body,
                fontSize: TYPE.size.sm, fontWeight: TYPE.weight.semibold,
                border: "none", cursor: paste.trim() ? "pointer" : "not-allowed",
                background: paste.trim() ? CORE.teal : t.bg.disabled,
                color: paste.trim() ? CORE.white : t.fg.disabled,
                transition: `all ${MOTION.fast}`, boxShadow: paste.trim() ? SHADOW.md : "none",
              }}
            >Load Mental Model</button>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: SP[4], padding: `${SP[3]}px ${SP[4]}px`, borderRadius: RAD.md,
            background: t.bg.error, border: `1px solid ${t.border.error}`,
            fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: t.fg.error,
          }}>{error}</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Root
// ═══════════════════════════════════════════════════════════════════════════

export default function MentalModelExplorer() {
  const [data, setData] = useState(null);
  const [mode, setMode] = useState("light");
  const t = THEMES[mode];

  return (
    <div style={{
      fontFamily: TYPE.family.body, minHeight: "100vh",
      background: t.bg.primary, color: t.fg.primary,
      transition: `background ${MOTION.slow}, color ${MOTION.slow}`,
    }}>
      <style>{globalCSS(t)}</style>

      <ThemeToggle mode={mode} setMode={setMode} t={t} />

      {!data ? (
        <Loader onLoad={setData} t={t} />
      ) : (
        <div style={{ maxWidth: 880, margin: "0 auto", padding: `${SP[8]}px ${SP[5]}px` }}>
          {/* Header */}
          <div style={{ marginBottom: SP[6] }}>
            <div style={{ display: "flex", alignItems: "center", gap: SP[3], marginBottom: SP[1], flexWrap: "wrap" }}>
              <div style={{
                width: 28, height: 28, borderRadius: RAD.md,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: CORE.teal, color: CORE.white,
                fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs,
                fontWeight: TYPE.weight.heavy, flexShrink: 0,
              }}>MM</div>
              <h1 style={{
                margin: 0, fontFamily: TYPE.family.heading,
                fontSize: TYPE.size.xl, fontWeight: TYPE.weight.bold,
                letterSpacing: TYPE.tracking.snug, color: t.fg.primary,
              }}>Mental Model</h1>
              <Badge fg={t.fg.brand} bg={t.bg.brandSubtle} border={t.border.brand}>v{data.schemaVersion || "0.1.0"}</Badge>
            </div>
            <code style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: t.fg.tertiary }}>{data.identity?.modelId}</code>
            <div style={{ display: "flex", gap: SP[4], marginTop: SP[2], fontSize: TYPE.size.xs, flexWrap: "wrap" }}>
              {data.identity?.createdAt && <span style={{ color: t.fg.tertiary }}>Created: <span style={{ color: t.fg.primary, fontWeight: TYPE.weight.semibold }}>{data.identity.createdAt}</span></span>}
              {data.identity?.authorId && <span style={{ color: t.fg.tertiary }}>Author: <span style={{ fontFamily: TYPE.family.mono, color: t.fg.primary }}>{data.identity.authorId}</span></span>}
              {data._source && <span style={{ color: t.fg.tertiary }}>Source: {data._source}</span>}
            </div>
          </div>

          <ModelView data={data} t={t} onReset={() => setData(null)} />
        </div>
      )}
    </div>
  );
}
