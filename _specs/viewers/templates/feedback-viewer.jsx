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
  Divider,
} from "../iande-theme.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// Disposition → semantic color mapping
// ═══════════════════════════════════════════════════════════════════════════

function dispoTokens(d, t) {
  const map = {
    accepted:           { fg: t.fg.success,  bg: t.bg.success,  border: t.border.success, label: "ACCEPTED",  icon: "+" },
    partially_accepted: { fg: t.fg.warning,  bg: t.bg.warning,  border: t.border.warning, label: "PARTIAL",   icon: "~" },
    refuted:            { fg: t.fg.error,    bg: t.bg.error,    border: t.border.error,   label: "REFUTED",   icon: "x" },
    deferred:           { fg: t.fg.info,     bg: t.bg.info,     border: t.border.info,    label: "DEFERRED",  icon: ">" },
    pending:            { fg: t.fg.tertiary, bg: t.bg.tertiary, border: t.border.default, label: "PENDING",   icon: "?" },
  };
  return map[d] || map.pending;
}

const AUTH_LABELS = {
  domain_expert: "Domain Expert", framework_author: "Framework Author",
  framework_adopter: "Framework Adopter", external_reviewer: "External Reviewer",
  automated_system: "Automated System",
};
const CHAN_LABELS = {
  conversation: "Conversation", document_review: "Document Review",
  pr_review: "PR Review", issue: "Issue", ci_output: "CI Output",
  external_review: "External Review", adversarial: "Adversarial",
};
const FN_LABELS = {
  projection: "Projection gap", specification: "Spec gap",
  measurement: "Measurement gap", none: "Not a false-negative",
};

// ─── Disposition Badge ───────────────────────────────────────────────────

function DispositionBadge({ disposition, t, compact }) {
  const dt = dispoTokens(disposition, t);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: SP[1],
      padding: compact ? `${SP[0.5]}px ${SP[2]}px` : `${SP[1]}px ${SP[3]}px`,
      borderRadius: RAD.sm, fontFamily: TYPE.family.body,
      fontSize: compact ? "0.6875rem" : TYPE.size.xs,
      fontWeight: TYPE.weight.semibold, letterSpacing: TYPE.tracking.widest,
      color: dt.fg, background: dt.bg, border: `1px solid ${dt.border}`,
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: compact ? 14 : 16, height: compact ? 14 : 16, borderRadius: RAD.sm,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: TYPE.family.mono, fontSize: compact ? "0.625rem" : TYPE.size.xs,
        fontWeight: TYPE.weight.heavy, background: dt.fg + "1A",
      }}>{dt.icon}</span>
      {dt.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Item Detail View
// ═══════════════════════════════════════════════════════════════════════════

function ItemDetail({ item, t, onBack }) {
  const dt = dispoTokens(item.disposition, t);

  return (
    <div style={{ animation: "iandeSlide 200ms cubic-bezier(0.2,0,0,1)" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: TYPE.family.body, fontSize: TYPE.size.sm,
        fontWeight: TYPE.weight.medium, color: t.fg.secondary,
        padding: 0, marginBottom: SP[4], display: "flex", alignItems: "center", gap: SP[1],
        transition: `color ${MOTION.fast}`,
      }}
      onMouseEnter={e => e.currentTarget.style.color = t.fg.brand}
      onMouseLeave={e => e.currentTarget.style.color = t.fg.secondary}
      >{"<-"} Back to items</button>

      {/* Claim header */}
      <Card t={t} style={{ marginBottom: SP[4], borderLeftWidth: 3, borderLeftColor: dt.border, borderLeftStyle: "solid" }}>
        <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[2], flexWrap: "wrap" }}>
          <span style={{
            fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm,
            fontWeight: TYPE.weight.bold, color: t.fg.primary,
          }}>{item.id}</span>
          <DispositionBadge disposition={item.disposition} t={t} />
          {item.false_negative_channel && (
            <Badge fg={t.fg.info} bg={t.bg.info} border={t.border.info}>
              FN: {FN_LABELS[item.false_negative_channel] || item.false_negative_channel}
            </Badge>
          )}
        </div>
        <p style={{
          margin: 0, fontFamily: TYPE.family.body, fontSize: TYPE.size.base,
          fontWeight: TYPE.weight.medium, color: t.fg.primary, lineHeight: TYPE.leading.relaxed,
        }}>{item.claim}</p>
      </Card>

      {/* Rationale */}
      {item.rationale && (
        <Card t={t} style={{ marginBottom: SP[3] }}>
          <Overline t={t}>Rationale</Overline>
          <p style={{ margin: 0, fontFamily: TYPE.family.body, fontSize: TYPE.size.sm, color: t.fg.primary, lineHeight: TYPE.leading.relaxed }}>{item.rationale}</p>
        </Card>
      )}

      {/* Targets */}
      {item.targets?.length > 0 && (
        <div style={{ marginBottom: SP[3] }}>
          <Overline t={t} count={item.targets.length}>Targets</Overline>
          <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
            {item.targets.map((tg, i) => (
              <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px` }}>
                <div style={{ display: "flex", alignItems: "center", gap: SP[2], flexWrap: "wrap" }}>
                  <Badge fg={t.fg.brand} bg={t.bg.brandSubtle} border={t.border.brand}>{tg.entity_type}</Badge>
                  <CodeRef t={t}>{tg.entity_ref}</CodeRef>
                  {tg.entity_version && (
                    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: t.fg.tertiary }}>v{tg.entity_version}</span>
                  )}
                </div>
                {tg.aspect && <div style={{ fontSize: TYPE.size.sm, color: t.fg.secondary, marginTop: SP[1], lineHeight: TYPE.leading.normal }}>{tg.aspect}</div>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Actions taken (accepted / partial) */}
      {item.actions_taken?.length > 0 && (
        <div style={{ marginBottom: SP[3] }}>
          <Overline t={t} count={item.actions_taken.length}>Actions Taken</Overline>
          <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
            {item.actions_taken.map((a, i) => (
              <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${t.border.success}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[1], flexWrap: "wrap" }}>
                  <Badge fg={t.fg.success} bg={t.bg.success} border={t.border.success} style={{ fontSize: "0.625rem" }}>{a.type}</Badge>
                  <CodeRef t={t}>{a.ref}</CodeRef>
                </div>
                <div style={{ fontSize: TYPE.size.sm, color: t.fg.primary, lineHeight: TYPE.leading.normal }}>{a.description}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Partial: accepted + refuted portions */}
      {item.disposition === "partially_accepted" && (
        <div style={{ display: "flex", gap: SP[2], marginBottom: SP[3], flexWrap: "wrap" }}>
          {item.accepted_portion && (
            <Card t={t} style={{ flex: "1 1 220px", borderLeft: `2px solid ${t.border.success}` }}>
              <Overline t={t}>Accepted Portion</Overline>
              <p style={{ margin: 0, fontSize: TYPE.size.sm, color: t.fg.primary, lineHeight: TYPE.leading.normal }}>{item.accepted_portion}</p>
            </Card>
          )}
          {item.refuted_portion && (
            <Card t={t} style={{ flex: "1 1 220px", borderLeft: `2px solid ${t.border.error}` }}>
              <Overline t={t}>Refuted Portion</Overline>
              <p style={{ margin: 0, fontSize: TYPE.size.sm, color: t.fg.primary, lineHeight: TYPE.leading.normal }}>{item.refuted_portion}</p>
            </Card>
          )}
        </div>
      )}

      {/* Objections (refuted) */}
      {item.objections?.length > 0 && (
        <div style={{ marginBottom: SP[3] }}>
          <Overline t={t} count={item.objections.length}>Objections</Overline>
          <div style={{ display: "flex", flexDirection: "column", gap: SP[1] }}>
            {item.objections.map((obj, i) => (
              <Card key={i} t={t} style={{ padding: `${SP[2]}px ${SP[3]}px`, borderLeft: `2px solid ${t.border.error}` }}>
                <p style={{ margin: 0, fontSize: TYPE.size.sm, color: t.fg.primary, lineHeight: TYPE.leading.normal }}>{obj}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Deferred: rationale + revisit */}
      {item.disposition === "deferred" && (
        <div style={{ display: "flex", gap: SP[2], marginBottom: SP[3], flexWrap: "wrap" }}>
          {item.defer_rationale && (
            <Card t={t} style={{ flex: "1 1 220px", borderLeft: `2px solid ${t.border.info}` }}>
              <Overline t={t}>Deferral Rationale</Overline>
              <p style={{ margin: 0, fontSize: TYPE.size.sm, color: t.fg.primary, lineHeight: TYPE.leading.normal }}>{item.defer_rationale}</p>
            </Card>
          )}
          {item.defer_until && (
            <Card t={t} style={{ flex: "1 1 220px", borderLeft: `2px solid ${t.border.warning}` }}>
              <Overline t={t}>Revisit When</Overline>
              <p style={{ margin: 0, fontSize: TYPE.size.sm, color: t.fg.primary, lineHeight: TYPE.leading.normal }}>{item.defer_until}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Feedback View
// ═══════════════════════════════════════════════════════════════════════════

function FeedbackView({ data, t, onReset }) {
  const [view, setView] = useState("items");
  const [selId, setSelId] = useState(null);
  const [dFilter, setDFilter] = useState(null);

  const items = data.items || [];
  const prov = data.provenance || {};
  const ext = data.ext || {};

  const dcounts = useMemo(() => {
    const c = {};
    items.forEach(it => { c[it.disposition] = (c[it.disposition] || 0) + 1; });
    return c;
  }, [items]);

  const filtered = useMemo(() =>
    dFilter ? items.filter(it => it.disposition === dFilter) : items,
  [items, dFilter]);

  const selItem = selId ? items.find(it => it.id === selId) : null;
  if (selItem) return <ItemDetail item={selItem} t={t} onBack={() => setSelId(null)} />;

  const statusLabels = { received: "RECEIVED", processing: "PROCESSING", processed: "PROCESSED" };
  const costColors = { trivial: t.fg.tertiary, low: t.fg.success, medium: t.fg.warning, high: CORE.warning, extensive: t.fg.error };

  const tabs = [
    { key: "items", label: "Items" },
    { key: "provenance", label: "Provenance" },
    ...(Object.keys(ext).length ? [{ key: "ext", label: "Extensions" }] : []),
  ];

  return (
    <>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: SP[1], marginBottom: SP[4], overflowX: "auto" }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setView(tb.key)} style={{
            padding: `${SP[1.5]}px ${SP[4]}px`, borderRadius: RAD.md,
            fontFamily: TYPE.family.body, fontSize: TYPE.size.sm,
            fontWeight: TYPE.weight.semibold, cursor: "pointer",
            transition: `all ${MOTION.fast}`, whiteSpace: "nowrap",
            background: view === tb.key ? t.bg.brandSubtle : t.bg.secondary,
            color: view === tb.key ? t.fg.brand : t.fg.secondary,
            border: `1px solid ${view === tb.key ? t.border.brand : t.border.subtle}`,
          }}>{tb.label}</button>
        ))}
        <button onClick={onReset} style={{
          marginLeft: "auto", padding: `${SP[1.5]}px ${SP[3]}px`, borderRadius: RAD.md,
          fontFamily: TYPE.family.body, fontSize: TYPE.size.xs,
          fontWeight: TYPE.weight.semibold, color: t.fg.tertiary,
          background: t.bg.tertiary, border: `1px solid ${t.border.default}`,
          cursor: "pointer", flexShrink: 0, transition: `all ${MOTION.fast}`,
        }}>Load different</button>
      </div>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: SP[2], flexWrap: "wrap", marginBottom: SP[4] }}>
        {[
          { label: "Items", val: items.length, color: t.fg.primary },
          { label: "Status", val: statusLabels[data.processing_status] || data.processing_status, color: data.processing_status === "processed" ? t.fg.success : t.fg.warning },
          data.verification_cost && { label: "Cost", val: data.verification_cost, color: costColors[data.verification_cost] || t.fg.tertiary },
          data.processed_by && { label: "Processor", val: data.processed_by, color: t.fg.brand },
        ].filter(Boolean).map((s, i) => (
          <Card key={i} t={t} style={{ flex: "1 1 110px", minWidth: 110, textAlign: "center", padding: `${SP[2]}px ${SP[3]}px` }}>
            <div style={{
              fontSize: TYPE.size.xs, fontWeight: TYPE.weight.semibold,
              letterSpacing: TYPE.tracking.widest, textTransform: "uppercase",
              color: t.fg.tertiary, marginBottom: SP[1],
            }}>{s.label}</div>
            <div style={{
              fontSize: TYPE.size.lg, fontWeight: TYPE.weight.heavy,
              fontFamily: TYPE.family.mono, color: s.color,
            }}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* ── ITEMS ── */}
      {view === "items" && (
        <div>
          {/* Disposition filter chips */}
          <div style={{ display: "flex", gap: SP[1], flexWrap: "wrap", marginBottom: SP[3] }}>
            {["accepted", "partially_accepted", "refuted", "deferred", "pending"].map(d => {
              const count = dcounts[d];
              if (!count) return null;
              const dt = dispoTokens(d, t);
              const on = dFilter === d;
              return (
                <button key={d} onClick={() => setDFilter(on ? null : d)} style={{
                  display: "inline-flex", alignItems: "center", gap: SP[1],
                  padding: `${SP[1]}px ${SP[3]}px`, borderRadius: RAD.sm,
                  fontFamily: TYPE.family.body, fontSize: TYPE.size.xs,
                  fontWeight: TYPE.weight.semibold, letterSpacing: TYPE.tracking.wide,
                  cursor: "pointer", transition: `all ${MOTION.fast}`,
                  color: on ? t.bg.secondary : dt.fg,
                  background: on ? dt.fg : dt.bg,
                  border: `1px solid ${dt.border}`,
                }}>{dt.label} ({count})</button>
              );
            })}
            {dFilter && (
              <button onClick={() => setDFilter(null)} style={{
                padding: `${SP[1]}px ${SP[3]}px`, borderRadius: RAD.sm,
                fontFamily: TYPE.family.body, fontSize: TYPE.size.xs,
                fontWeight: TYPE.weight.semibold, color: t.fg.error,
                background: t.bg.error, border: `1px solid ${t.border.error}`,
                cursor: "pointer",
              }}>Clear</button>
            )}
          </div>

          {/* Item list */}
          <div style={{ display: "flex", flexDirection: "column", gap: SP[2] }}>
            {filtered.map(item => {
              const dt = dispoTokens(item.disposition, t);
              return (
                <Card key={item.id} t={t} onClick={() => setSelId(item.id)}
                  style={{ borderLeft: `3px solid ${dt.border}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[1], flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm,
                      fontWeight: TYPE.weight.bold, color: t.fg.primary,
                    }}>{item.id}</span>
                    <DispositionBadge disposition={item.disposition} t={t} compact />
                    {item.actions_taken?.length > 0 && (
                      <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.semibold, color: t.fg.success }}>
                        {item.actions_taken.length} action{item.actions_taken.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {item.objections?.length > 0 && (
                      <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.semibold, color: t.fg.error }}>
                        {item.objections.length} objection{item.objections.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <span style={{ fontSize: TYPE.size.base, color: t.fg.disabled, marginLeft: "auto", flexShrink: 0 }}>{">"}</span>
                  </div>
                  <p style={{
                    margin: 0, fontFamily: TYPE.family.body, fontSize: TYPE.size.sm,
                    color: t.fg.secondary, lineHeight: TYPE.leading.normal,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>{item.claim}</p>
                  {item.targets?.length > 0 && (
                    <div style={{ display: "flex", gap: SP[1], flexWrap: "wrap", marginTop: SP[2] }}>
                      {item.targets.map((tg, i) => (
                        <Badge key={i} fg={t.fg.brand} bg={t.bg.brandSubtle} style={{ fontSize: "0.625rem" }}>
                          {tg.entity_type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: SP[8], color: t.fg.tertiary, fontSize: TYPE.size.sm }}>
                No items match the current filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROVENANCE ── */}
      {view === "provenance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: SP[3] }}>
          <Card t={t}>
            <Overline t={t}>Source</Overline>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: `${SP[1.5]}px ${SP[4]}px`, fontSize: TYPE.size.sm }}>
              {[
                ["ID", prov.source_id],
                ["Authority", AUTH_LABELS[prov.source_authority] || prov.source_authority],
                ["Channel", CHAN_LABELS[prov.channel] || prov.channel],
                ["Received", prov.received],
                prov.artifact_ref && ["Artifact", prov.artifact_ref],
              ].filter(Boolean).map(([label, val], i) => (
                <div key={i} style={{ display: "contents" }}>
                  <span style={{ color: t.fg.tertiary, fontWeight: TYPE.weight.semibold, textAlign: "right" }}>{label}</span>
                  <span style={{ color: t.fg.primary, fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>

          {prov.projection_included?.length > 0 && (
            <Card t={t}>
              <Overline t={t} count={prov.projection_included.length}>Projection Included</Overline>
              {prov.projection_included.map((p, i) => (
                <div key={i} style={{
                  fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs,
                  color: t.fg.primary, padding: `${SP[1]}px 0`, lineHeight: TYPE.leading.relaxed,
                  borderBottom: i < prov.projection_included.length - 1 ? `1px solid ${t.border.subtle}` : "none",
                }}>{p}</div>
              ))}
            </Card>
          )}

          {prov.projection_excluded?.length > 0 && (
            <Card t={t} style={{ borderColor: t.border.warning }}>
              <Overline t={t} count={prov.projection_excluded.length}>Projection Excluded</Overline>
              {prov.projection_excluded.map((p, i) => (
                <div key={i} style={{
                  fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs,
                  color: t.fg.warning, padding: `${SP[1]}px 0`, lineHeight: TYPE.leading.relaxed,
                  borderBottom: i < prov.projection_excluded.length - 1 ? `1px solid ${t.border.subtle}` : "none",
                }}>{p}</div>
              ))}
            </Card>
          )}

          {(data.triggered_transitions?.length > 0 || data.triggered_tensions?.length > 0) && (
            <Card t={t}>
              <Overline t={t}>Triggered Effects</Overline>
              {data.triggered_transitions?.length > 0 && (
                <div style={{ marginBottom: SP[2] }}>
                  <span style={{ fontSize: TYPE.size.xs, color: t.fg.success, fontWeight: TYPE.weight.semibold, letterSpacing: TYPE.tracking.widest, textTransform: "uppercase" }}>TRANSITIONS </span>
                  {data.triggered_transitions.map(r => <CodeRef key={r} t={t}>{r}</CodeRef>)}
                </div>
              )}
              {data.triggered_tensions?.length > 0 && (
                <div>
                  <span style={{ fontSize: TYPE.size.xs, color: t.fg.warning, fontWeight: TYPE.weight.semibold, letterSpacing: TYPE.tracking.widest, textTransform: "uppercase" }}>TENSIONS </span>
                  {data.triggered_tensions.map(r => <CodeRef key={r} t={t}>{r}</CodeRef>)}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ── EXTENSIONS ── */}
      {view === "ext" && (
        <div>
          <Overline t={t}>Extension Data</Overline>
          <Card t={t}>
            {Object.entries(ext).map(([k, v]) => (
              <div key={k} style={{ marginBottom: SP[2] }}>
                <div style={{
                  fontSize: TYPE.size.xs, fontWeight: TYPE.weight.semibold,
                  letterSpacing: TYPE.tracking.widest, textTransform: "uppercase",
                  color: t.fg.tertiary, marginBottom: SP[0.5],
                }}>{k}</div>
                <div style={{
                  fontSize: TYPE.size.sm, color: t.fg.primary,
                  fontFamily: TYPE.family.mono, wordBreak: "break-all",
                }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
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
      if (!p.items && !p.provenance) {
        setError('Expected "items" or "provenance" at root.');
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

  const onDrop = useCallback(e => {
    e.preventDefault(); e.stopPropagation(); setDrag(false);
    handleFile(e.dataTransfer?.files?.[0]);
  }, [handleFile]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: t.bg.primary, padding: SP[5],
    }}>
      <div style={{ width: "100%", maxWidth: 500, animation: "iandeSlide 350ms cubic-bezier(0.05,0.7,0.1,1)" }}>
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: SP[8] }}>
          <div style={{
            width: 48, height: 48, borderRadius: RAD.lg, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            background: CORE.teal, color: CORE.white,
            fontFamily: TYPE.family.mono, fontSize: TYPE.size.lg, fontWeight: TYPE.weight.heavy,
            marginBottom: SP[4], boxShadow: SHADOW.lg,
          }}>FB</div>
          <h1 style={{
            margin: 0, fontFamily: TYPE.family.heading,
            fontSize: TYPE.size["2xl"], fontWeight: TYPE.weight.bold,
            letterSpacing: TYPE.tracking.tight, color: t.fg.primary, lineHeight: TYPE.leading.snug,
          }}>Feedback Viewer</h1>
          <p style={{
            margin: `${SP[2]}px 0 0`, fontFamily: TYPE.family.body,
            fontSize: TYPE.size.sm, color: t.fg.secondary, lineHeight: TYPE.leading.relaxed,
          }}>Load a processed feedback JSON to inspect claims, dispositions, and provenance.</p>
        </div>

        {/* Mode toggle */}
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

        {/* Upload */}
        {mode === "upload" && (
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={e => { e.preventDefault(); setDrag(false); }}
            onDrop={onDrop}
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
            <div style={{
              fontFamily: TYPE.family.body, fontSize: TYPE.size.base,
              fontWeight: TYPE.weight.semibold, color: t.fg.primary, marginBottom: SP[1],
            }}>{drag ? "Drop here" : "Drop a .json file or click to browse"}</div>
            <div style={{ fontSize: TYPE.size.xs, color: t.fg.tertiary }}>
              Expects a feedback record with <code style={{ color: t.fg.brand, fontFamily: TYPE.family.mono }}>items</code> and <code style={{ color: t.fg.brand, fontFamily: TYPE.family.mono }}>provenance</code>
            </div>
          </div>
        )}

        {/* Paste */}
        {mode === "paste" && (
          <div>
            <textarea value={paste} onChange={e => { setPaste(e.target.value); setError(null); }}
              placeholder='{ "items": [...], "provenance": { ... } }'
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
            {/* DS: components.button.primary */}
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
            >Load Feedback</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: SP[4], padding: `${SP[3]}px ${SP[4]}px`, borderRadius: RAD.md,
            background: t.bg.error, border: `1px solid ${t.border.error}`,
            fontFamily: TYPE.family.body, fontSize: TYPE.size.sm,
            fontWeight: TYPE.weight.medium, color: t.fg.error,
            animation: "iandeSlide 200ms cubic-bezier(0.2,0,0,1)",
          }}>{error}</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Root
// ═══════════════════════════════════════════════════════════════════════════

export default function FeedbackExplorer() {
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
        <div style={{ maxWidth: 840, margin: "0 auto", padding: `${SP[8]}px ${SP[5]}px` }}>
          {/* Header */}
          <div style={{ marginBottom: SP[6] }}>
            <div style={{ display: "flex", alignItems: "center", gap: SP[3], marginBottom: SP[1], flexWrap: "wrap" }}>
              <div style={{
                width: 28, height: 28, borderRadius: RAD.md,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: CORE.teal, color: CORE.white,
                fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs,
                fontWeight: TYPE.weight.heavy, flexShrink: 0,
              }}>FB</div>
              <h1 style={{
                margin: 0, fontFamily: TYPE.family.heading,
                fontSize: TYPE.size.xl, fontWeight: TYPE.weight.bold,
                letterSpacing: TYPE.tracking.snug, color: t.fg.primary,
              }}>{data.title || data.id || "Feedback Record"}</h1>
            </div>
            {data.id && data.title && (
              <code style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: t.fg.tertiary }}>{data.id}</code>
            )}
            <div style={{ display: "flex", gap: SP[4], marginTop: SP[2], fontSize: TYPE.size.xs, flexWrap: "wrap" }}>
              {data.date && <span style={{ color: t.fg.tertiary }}>Processed: <span style={{ color: t.fg.primary, fontWeight: TYPE.weight.semibold }}>{data.date}</span></span>}
              {data.framework_version_at_processing && (
                <span style={{ color: t.fg.tertiary }}>Framework: <span style={{ fontFamily: TYPE.family.mono, color: t.fg.primary }}>{data.framework_version_at_processing}</span></span>
              )}
              {data._source && <span style={{ color: t.fg.tertiary }}>Source: {data._source}</span>}
            </div>
          </div>

          <FeedbackView data={data} t={t} onReset={() => setData(null)} />
        </div>
      )}
    </div>
  );
}
