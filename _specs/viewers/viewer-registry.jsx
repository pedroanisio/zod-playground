import { useMemo, useState } from "react";
import { CORE, THEMES, TYPE, SP, RAD, SHADOW, MOTION, ThemeToggle, globalCSS } from "./iande-theme.jsx";

const VIEWERS = [
  {
    key: "feedback",
    label: "Feedback Explorer",
    description: "Explore feedback records, dispositions, provenance, and review traceability.",
    path: "./templates/feedback-viewer.jsx",
    icon: "FB",
  },
  {
    key: "feature-registry",
    label: "Feature Registry Explorer",
    description: "Browse feature metadata, dependencies, coverage, and module mappings.",
    path: "./templates/feature-registry-explorer.jsx",
    icon: "FR",
  },
  {
    key: "plan",
    label: "Plan Explorer",
    description: "Inspect execution plans, risks, dependencies, and acceptance gates.",
    path: "./templates/plan-explorer.jsx",
    icon: "PL",
  },
];

function ViewerCard({ viewer, t, onLaunch }) {
  return (
    <button
      onClick={() => onLaunch(viewer)}
      style={{
        width: "100%",
        textAlign: "left",
        background: t.bg.secondary,
        border: `1px solid ${t.border.subtle}`,
        borderRadius: RAD.lg,
        padding: `${SP[5]}px ${SP[5]}px`,
        cursor: "pointer",
        transition: `all ${MOTION.fast}`,
        boxShadow: SHADOW.sm,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = t.border.default;
        e.currentTarget.style.boxShadow = SHADOW.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = t.border.subtle;
        e.currentTarget.style.boxShadow = SHADOW.sm;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SP[3], marginBottom: SP[2] }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: RAD.md,
            background: CORE.teal,
            color: CORE.white,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: TYPE.family.mono,
            fontSize: TYPE.size.xs,
            fontWeight: TYPE.weight.heavy,
            letterSpacing: TYPE.tracking.wide,
          }}
        >
          {viewer.icon}
        </div>
        <div>
          <div style={{ fontFamily: TYPE.family.heading, fontSize: TYPE.size.base, fontWeight: TYPE.weight.bold, color: t.fg.primary }}>
            {viewer.label}
          </div>
          <code style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: t.fg.tertiary }}>{viewer.key}</code>
        </div>
      </div>
      <div style={{ fontSize: TYPE.size.sm, color: t.fg.secondary, lineHeight: TYPE.leading.relaxed }}>{viewer.description}</div>
      <div style={{ marginTop: SP[3], fontSize: TYPE.size.xs, color: t.fg.brand, fontFamily: TYPE.family.mono }}>{viewer.path}</div>
    </button>
  );
}

export default function ViewerRegistry({ onLaunch }) {
  const [mode, setMode] = useState("light");
  const t = THEMES[mode];

  const launch = useMemo(() => {
    if (typeof onLaunch === "function") {
      return onLaunch;
    }

    return (viewer) => {
      if (typeof window !== "undefined") {
        window.open(viewer.path, "_blank", "noopener,noreferrer");
      }
    };
  }, [onLaunch]);

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: TYPE.family.body,
        background: t.bg.primary,
        color: t.fg.primary,
        transition: `background ${MOTION.slow}, color ${MOTION.slow}`,
      }}
    >
      <style>{globalCSS(t)}</style>
      <ThemeToggle mode={mode} setMode={setMode} t={t} />

      <main style={{ maxWidth: 920, margin: "0 auto", padding: `${SP[8]}px ${SP[5]}px` }}>
        <header style={{ marginBottom: SP[6] }}>
          <div style={{ display: "flex", alignItems: "center", gap: SP[3], marginBottom: SP[2] }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: RAD.md,
                background: CORE.teal,
                color: CORE.white,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TYPE.family.mono,
                fontSize: TYPE.size.xs,
                fontWeight: TYPE.weight.heavy,
              }}
            >
              VR
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: TYPE.family.heading,
                fontSize: TYPE.size["2xl"],
                fontWeight: TYPE.weight.bold,
                letterSpacing: TYPE.tracking.snug,
                color: t.fg.primary,
              }}
            >
              Viewer Registry
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: TYPE.size.sm, color: t.fg.secondary, maxWidth: 660, lineHeight: TYPE.leading.relaxed }}>
            Unified launcher for spec viewers. Each card opens the corresponding template and keeps the same IANDE tokens/primitives.
          </p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: SP[4] }}>
          {VIEWERS.map((viewer) => (
            <ViewerCard key={viewer.key} viewer={viewer} t={t} onLaunch={launch} />
          ))}
        </section>
      </main>
    </div>
  );
}
