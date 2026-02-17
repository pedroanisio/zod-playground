import { useState, useMemo, useRef, useCallback } from "react";
import { CORE, THEMES, TYPE, ThemeToggle, globalCSS } from "../iande-theme.jsx";

function resolveViewerTheme(mode) {
  const t = THEMES[mode];
  return {
    bg: t.bg.primary,
    bgCard: t.bg.secondary,
    bgMuted: t.bg.tertiary,
    bgBrandSubtle: t.bg.brandSubtle,
    border: t.border.default,
    borderStrong: t.border.strong,
    fg: t.fg.primary,
    fgDim: t.fg.secondary,
    fgMuted: t.fg.tertiary,
    brand: CORE.teal,
    brandAlt: CORE.info,
    white: CORE.white,
    success: CORE.success,
    successBg: t.bg.success,
    warning: CORE.warning,
    warningBg: t.bg.warning,
    info: CORE.info,
    infoBg: t.bg.info,
    error: CORE.error,
    errorBg: t.bg.error,
    errorBorder: t.border.error,
  };
}

const TOK = resolveViewerTheme("light");

function setThemeTokens(mode) {
  Object.assign(TOK, resolveViewerTheme(mode));
}

// ─── Category config ───
const CATEGORY_META = {
  schemas:             { label: "Schemas",             color: CORE.info,      bg: CORE.infoLight,    icon: "SC" },
  "ai-intelligence":   { label: "AI Intelligence",     color: CORE.tealText,  bg: CORE.tealLight,    icon: "AI" },
  "quality-governance":{ label: "Quality & Governance",color: CORE.success,   bg: CORE.successLight, icon: "QG" },
  pipeline:            { label: "Pipeline",            color: CORE.warning,   bg: CORE.warningLight, icon: "PL" },
  transforms:          { label: "Transforms",          color: CORE.error,     bg: CORE.errorLight,   icon: "TR" },
  utils:               { label: "Utilities",           color: CORE.n700,      bg: CORE.n100,         icon: "UT" },
};

const PALETTE = [CORE.info, CORE.teal, CORE.success, CORE.warning, CORE.error, CORE.n700, CORE.tealText, CORE.infoText];
const CAT_FALLBACK = { label: "Other", color: CORE.n600, bg: CORE.n100, icon: "OT" };

function getCatMeta(category, dynamicMap) {
  if (CATEGORY_META[category]) return CATEGORY_META[category];
  if (dynamicMap[category]) return dynamicMap[category];
  return CAT_FALLBACK;
}

const STATUS_META = {
  ga:             { label: "GA",             color: CORE.success,   bg: CORE.successLight },
  in_development: { label: "In Development", color: CORE.warning,   bg: CORE.warningLight },
  feature_flagged:{ label: "Flagged",        color: CORE.info,      bg: CORE.infoLight },
  deprecated:     { label: "Deprecated",     color: CORE.error,     bg: CORE.errorLight },
  draft:          { label: "Draft",          color: CORE.n600,      bg: CORE.n100 },
  removed:        { label: "Removed",        color: CORE.errorText, bg: CORE.errorLight },
};

const ROLE_ICONS = { implementation: "TS", test: "T", entry_point: "EP", documentation: "DOC" };

// ─── Small components ───
function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: TOK.fgDim, bg: TOK.bgMuted };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      color: m.color, background: m.bg, letterSpacing: "0.02em",
      border: `1px solid ${m.color}22`, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function CategoryPill({ category, onClick, active, count, catMap }) {
  const m = getCatMeta(category, catMap);
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
      color: active ? TOK.white : m.color, background: active ? m.color : m.bg,
      border: `1.5px solid ${active ? m.color : m.color + "33"}`,
      cursor: "pointer", transition: "all .15s ease", letterSpacing: "0.01em",
    }}>
      <span style={{ fontSize: 10 }}>{m.icon}</span> {m.label}
      {count != null && <span style={{ fontSize: 10, opacity: .7 }}>({count})</span>}
    </button>
  );
}

function Tag({ label }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 500,
      background: TOK.bgMuted, color: TOK.fgDim, border: `1px solid ${TOK.border}`, letterSpacing: "0.02em",
    }}>{label}</span>
  );
}

function CoverageBar({ value }) {
  const color = value >= 98 ? TOK.success : value >= 90 ? TOK.warning : TOK.error;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: TOK.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width .4s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 36, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

function DepLink({ dep, features, onNavigate }) {
  const target = features.find(f => f.key === dep.featureKey);
  return (
    <button onClick={() => target && onNavigate(target.key)} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
      background: dep.type === "required" ? TOK.warningBg : TOK.bgMuted,
      border: `1px solid ${dep.type === "required" ? TOK.warning : TOK.border}`,
      borderRadius: 8, cursor: target ? "pointer" : "default",
      width: "100%", textAlign: "left", transition: "all .12s ease",
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
        background: dep.type === "required" ? TOK.warning : TOK.border,
        color: dep.type === "required" ? TOK.white : TOK.fgDim,
        textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
      }}>{dep.type}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: TOK.fg }}>{target?.name || dep.featureKey}</div>
        {dep.description && <div style={{ fontSize: 11, color: TOK.fgDim, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dep.description}</div>}
      </div>
      {target && <span style={{ fontSize: 14, color: TOK.fgMuted, flexShrink: 0 }}>{">"}</span>}
    </button>
  );
}

function FileRow({ file }) {
  const roleIcon = ROLE_ICONS[file.role] || "DF";
  const roleColor = file.role === "test" ? TOK.info : file.role === "entry_point" ? TOK.success : file.role === "documentation" ? TOK.warning : TOK.brand;
  const segments = (file.path || "").split("/");
  const fileName = segments.pop();
  const dirPath = segments.length ? segments.join("/") + "/" : "";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, fontSize: 12,
      fontFamily: TYPE.family.mono,
      background: TOK.bgMuted, border: `1px solid ${TOK.border}`,
    }}>
      <span style={{
        fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 3,
        background: roleColor + "18", color: roleColor, minWidth: 22, textAlign: "center", flexShrink: 0,
      }}>{roleIcon}</span>
      <span style={{ color: TOK.fgMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dirPath}</span>
      <span style={{ color: TOK.fg, fontWeight: 600, flexShrink: 0 }}>{fileName}</span>
    </div>
  );
}

// ─── Detail Panel ───
function FeatureDetail({ feature, features, catMap, onNavigate, onBack }) {
  const cat = getCatMeta(feature.category, catMap);
  const dependents = features.filter(f => f.dependencies?.some(d => d.featureKey === feature.key));
  const [openSection, setOpenSection] = useState("overview");

  const sections = [
    { key: "overview", label: "Overview" },
    ...(feature.files?.length ? [{ key: "files", label: `Files (${feature.files.length})` }] : []),
    ...(feature.dependencies?.length ? [{ key: "deps", label: `Deps (${feature.dependencies.length})` }] : []),
    ...(dependents.length ? [{ key: "dependents", label: `Used By (${dependents.length})` }] : []),
    ...(feature.config?.length ? [{ key: "config", label: "Config" }] : []),
    ...(feature.modules?.length ? [{ key: "modules", label: "Modules" }] : []),
  ];

  return (
    <div style={{ animation: "slideIn .25s ease" }}>
      <div style={{
        background: TOK.bgCard,
        border: `1px solid ${cat.color}22`, borderRadius: 14, padding: "24px 28px", marginBottom: 20,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer", fontSize: 12, color: TOK.fgDim,
          display: "flex", alignItems: "center", gap: 4, marginBottom: 12, padding: 0,
        }}>{"<-"} Back to registry</button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 20, color: cat.color }}>{cat.icon}</span>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: TOK.fg, letterSpacing: "-0.02em" }}>{feature.name}</h2>
            </div>
            <code style={{ fontSize: 12, color: cat.color, background: cat.color + "12", padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>{feature.key}</code>
            {feature.description && <p style={{ margin: "12px 0 0", fontSize: 13.5, color: TOK.fgDim, lineHeight: 1.6, maxWidth: 540 }}>{feature.description}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
            {feature.status && <StatusBadge status={feature.status} />}
            {feature.metadata?.coverage_percent != null && <div style={{ width: 120 }}><CoverageBar value={feature.metadata.coverage_percent} /></div>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 18, flexWrap: "wrap" }}>
          {[
            feature.introducedAt && { label: "Introduced", value: feature.introducedAt },
            feature.gaAt && { label: "GA", value: feature.gaAt },
            feature.metadata?.test_count && { label: "Tests", value: feature.metadata.test_count },
            feature.isPublic != null && { label: "Visibility", value: feature.isPublic ? "Public" : "Private" },
          ].filter(Boolean).map((s, i) => (
            <div key={i} style={{ fontSize: 11 }}>
              <span style={{ color: TOK.fgMuted, fontWeight: 500 }}>{s.label}: </span>
              <span style={{ color: TOK.fgDim, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {feature.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 14 }}>
            {feature.tags.map(t => <Tag key={t} label={t} />)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: `2px solid ${TOK.border}`, overflowX: "auto" }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => setOpenSection(s.key)} style={{
            padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: "none", border: "none", whiteSpace: "nowrap",
            color: openSection === s.key ? cat.color : TOK.fgMuted,
            borderBottom: openSection === s.key ? `2px solid ${cat.color}` : "2px solid transparent",
            marginBottom: -2, transition: "all .12s ease",
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{ minHeight: 120 }}>
        {openSection === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {Object.entries(feature.metadata || {}).map(([k, v]) => (
              <div key={k} style={{ padding: "12px 16px", background: TOK.bgMuted, borderRadius: 8, border: `1px solid ${TOK.border}` }}>
                <div style={{ fontSize: 10, color: TOK.fgMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: TOK.fg }}>
                  {typeof v === "boolean" ? (v ? "Yes" : "No") : Array.isArray(v) ? v.join(" -> ") : String(v)}
                </div>
              </div>
            ))}
            {feature.documentationUrl && (
              <div style={{ gridColumn: "1/-1", padding: "12px 16px", background: TOK.bgBrandSubtle, borderRadius: 8, border: `1px solid ${TOK.brand}33` }}>
                <div style={{ fontSize: 10, color: TOK.brand, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Documentation</div>
                <a href={feature.documentationUrl} target="_blank" rel="noopener" style={{ fontSize: 13, color: TOK.brand, fontWeight: 600, wordBreak: "break-all" }}>{feature.documentationUrl}</a>
              </div>
            )}
            {Object.keys(feature.metadata || {}).length === 0 && !feature.documentationUrl && (
              <div style={{ gridColumn: "1/-1", color: TOK.fgMuted, fontSize: 13, textAlign: "center", padding: 24 }}>No additional metadata</div>
            )}
          </div>
        )}
        {openSection === "files" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(feature.files || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(f => <FileRow key={f.id || f.path} file={f} />)}
          </div>
        )}
        {openSection === "deps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(feature.dependencies || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(d => <DepLink key={d.id || d.featureKey} dep={d} features={features} onNavigate={onNavigate} />)}
          </div>
        )}
        {openSection === "dependents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dependents.map(f => {
              const dep = f.dependencies.find(d => d.featureKey === feature.key);
              return <DepLink key={f.key} dep={{ featureKey: f.key, type: dep?.type || "required", description: f.description }} features={features} onNavigate={onNavigate} />;
            })}
          </div>
        )}
        {openSection === "config" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(feature.config || []).map(c => (
              <div key={c.id || c.key} style={{ padding: "14px 16px", background: TOK.warningBg, borderRadius: 8, border: `1px solid ${TOK.warning}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <code style={{ fontSize: 13, fontWeight: 700, color: TOK.warning }}>{c.key}</code>
                  <span style={{ fontSize: 10, color: TOK.warning, background: TOK.bgCard, padding: "1px 6px", borderRadius: 4 }}>{c.type}</span>
                </div>
                <div style={{ fontSize: 12.5, color: TOK.fgDim, marginBottom: 6 }}>{c.description}</div>
                <div style={{ fontSize: 11, color: TOK.warning }}>
                  Default: <code style={{ fontWeight: 700 }}>{c.defaultValue}</code>
                  {c.constraints?.enumValues && (
                    <span style={{ marginLeft: 12 }}>Enum: {c.constraints.enumValues.map(v => <code key={v} style={{ margin: "0 3px", background: TOK.bgCard, padding: "1px 5px", borderRadius: 3 }}>{v}</code>)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {openSection === "modules" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(feature.modules || []).map(m => (
              <div key={m.id || m.entryPoint} style={{
                padding: "10px 14px", background: TOK.successBg, borderRadius: 8,
                border: `1px solid ${TOK.success}`, fontFamily: TYPE.family.mono, fontSize: 12,
              }}>
                <span style={{ color: TOK.success, fontWeight: 700 }}>{m.entryPoint}</span>
                <span style={{ color: TOK.fgMuted }}> in </span>
                <span style={{ color: TOK.fgDim }}>{m.path}/</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feature Card ───
function FeatureCard({ feature, onClick, catMap }) {
  const cat = getCatMeta(feature.category, catMap);
  return (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px", borderRadius: 10,
      background: TOK.bgCard, border: `1px solid ${TOK.border}`, cursor: "pointer", textAlign: "left", width: "100%",
      transition: "all .15s ease", boxShadow: "0 1px 2px rgba(0,0,0,.04)",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + "55"; e.currentTarget.style.boxShadow = `0 4px 16px ${cat.color}12`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = TOK.border; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ color: cat.color, fontSize: 14, flexShrink: 0 }}>{cat.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: TOK.fg, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{feature.name}</span>
        </div>
        {feature.status && <StatusBadge status={feature.status} />}
      </div>
      <code style={{ fontSize: 10.5, color: TOK.fgMuted, fontWeight: 500 }}>{feature.key}</code>
      {feature.description && <p style={{ margin: 0, fontSize: 12, color: TOK.fgDim, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{feature.description}</p>}
      <div style={{ display: "flex", gap: 14, marginTop: "auto", paddingTop: 4, fontSize: 10.5, color: TOK.fgMuted }}>
        {feature.files?.length > 0 && <span>{feature.files.length} files</span>}
        {feature.dependencies?.length > 0 && <span>{feature.dependencies.length} deps</span>}
        {feature.metadata?.test_count > 0 && <span>{feature.metadata.test_count} tests</span>}
        {feature.metadata?.coverage_percent != null && (
          <span style={{ color: feature.metadata.coverage_percent >= 98 ? TOK.success : feature.metadata.coverage_percent >= 90 ? TOK.warning : TOK.error, fontWeight: 600 }}>
            {feature.metadata.coverage_percent}% cov
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Data Loader Screen ───
function DataLoader({ onLoad, themeMode, setThemeMode, t }) {
  const [mode, setMode] = useState("upload");
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const tryParse = useCallback((text, sourceName) => {
    setError(null);
    try {
      const parsed = JSON.parse(text);
      const feats = parsed.features || (Array.isArray(parsed) ? parsed : null);
      if (!feats || !Array.isArray(feats)) {
        setError('JSON must have a "features" array at root, or be an array of features.');
        return;
      }
      if (feats.length === 0) { setError("The features array is empty."); return; }
      onLoad({ version: parsed.version || null, features: feats, source: sourceName });
    } catch (e) {
      setError(`Invalid JSON: ${e.message}`);
    }
  }, [onLoad]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => tryParse(e.target.result, file.name);
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  }, [tryParse]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    handleFile(e.dataTransfer?.files?.[0]);
  }, [handleFile]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: TOK.bg,
      padding: 20, fontFamily: TYPE.family.body,
    }}>
      <style>{`
        ${globalCSS(t)}
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }
        * { box-sizing: border-box; }
      `}</style>
      <ThemeToggle mode={themeMode} setMode={setThemeMode} t={t} />
      <div style={{ width: "100%", maxWidth: 560, animation: "slideIn .3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: TOK.brand, color: TOK.white, fontSize: 26, fontWeight: 800,
            marginBottom: 18, boxShadow: `0 12px 32px ${TOK.brand}33`,
          }}>FR</div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: TOK.fg }}>Feature Registry</h1>
          <p style={{ margin: "10px auto 0", fontSize: 14.5, color: TOK.fgDim, lineHeight: 1.6, maxWidth: 400 }}>
            Load a <code style={{ fontSize: 12, background: TOK.bgMuted, padding: "2px 7px", borderRadius: 5, fontWeight: 600, color: TOK.fg }}>feature-registry.json</code> to browse, search, and drill into your features.
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: "flex", background: TOK.bgMuted, borderRadius: 10, padding: 3, marginBottom: 20, border: `1px solid ${TOK.border}` }}>
          {[{ key: "upload", label: "Upload File" }, { key: "paste", label: "Paste JSON" }].map(t => (
            <button key={t.key} onClick={() => { setMode(t.key); setError(null); }} style={{
              flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "none", cursor: "pointer", transition: "all .15s ease",
              background: mode === t.key ? TOK.bgCard : "transparent",
              color: mode === t.key ? TOK.fg : TOK.fgDim,
              boxShadow: mode === t.key ? "0 1px 4px rgba(0,0,0,.06)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Upload mode */}
        {mode === "upload" && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setDragging(false); }}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2.5px dashed ${dragging ? TOK.brand : TOK.border}`,
              borderRadius: 16, padding: "56px 24px", textAlign: "center", cursor: "pointer",
              background: dragging ? TOK.bgBrandSubtle : TOK.bgCard,
              transition: "all .2s ease",
              boxShadow: dragging ? `0 0 0 4px ${TOK.brand}22` : "0 1px 4px rgba(0,0,0,.04)",
            }}
          >
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
              onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            <div style={{ fontSize: 22, marginBottom: 14, opacity: .7, fontFamily: TYPE.family.mono, fontWeight: 700 }}>{dragging ? "DROP" : "FILE"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TOK.fg, marginBottom: 6 }}>
              {dragging ? "Drop it right here!" : "Drop a JSON file or click to browse"}
            </div>
            <div style={{ fontSize: 12.5, color: TOK.fgMuted }}>
              Accepts <code style={{ background: TOK.bgMuted, padding: "1px 5px", borderRadius: 3, color: TOK.fg }}>.json</code> files with a <code style={{ background: TOK.bgMuted, padding: "1px 5px", borderRadius: 3, color: TOK.fg }}>features</code> array
            </div>
          </div>
        )}

        {/* Paste mode */}
        {mode === "paste" && (
          <div>
            <textarea
              value={pasteValue}
              onChange={e => { setPasteValue(e.target.value); setError(null); }}
              placeholder={'{\n  "features": [\n    { "key": "...", "name": "...", ... }\n  ]\n}'}
              spellCheck={false}
              style={{
                width: "100%", minHeight: 240, padding: "18px 20px", borderRadius: 14,
                border: `1.5px solid ${TOK.border}`, fontSize: 12.5, color: TOK.fg,
                fontFamily: TYPE.family.mono,
                background: TOK.bgCard, resize: "vertical", outline: "none",
                lineHeight: 1.65, transition: "border-color .15s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,.04)",
              }}
              onFocus={e => { e.target.style.borderColor = `${TOK.brand}55`; e.target.style.boxShadow = `0 0 0 3px ${TOK.brand}15`; }}
              onBlur={e => { e.target.style.borderColor = TOK.border; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,.04)"; }}
            />
            <button
              onClick={() => pasteValue.trim() && tryParse(pasteValue, "pasted JSON")}
              disabled={!pasteValue.trim()}
              style={{
                marginTop: 14, width: "100%", padding: "13px 0", borderRadius: 12,
                fontSize: 14, fontWeight: 700, border: "none", cursor: pasteValue.trim() ? "pointer" : "not-allowed",
                background: pasteValue.trim() ? TOK.brand : TOK.bgMuted,
                color: pasteValue.trim() ? TOK.white : TOK.fgMuted,
                transition: "all .15s ease",
                boxShadow: pasteValue.trim() ? `0 6px 20px ${TOK.brand}33` : "none",
              }}
            >Load Features</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 18, padding: "12px 16px", borderRadius: 10,
            background: TOK.errorBg, border: `1px solid ${TOK.errorBorder}`, color: TOK.error,
            fontSize: 13, fontWeight: 500, display: "flex", alignItems: "flex-start", gap: 8,
            animation: "slideIn .2s ease",
          }}>
            <span style={{ flexShrink: 0, fontSize: 11, fontFamily: TYPE.family.mono, fontWeight: 700 }}>ERR</span>
            <span>{error}</span>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11.5, color: TOK.fgMuted }}>
          Expects <code style={{ background: TOK.bgMuted, padding: "1px 5px", borderRadius: 3, fontSize: 10.5, color: TOK.fg }}>{'{ "features": [...] }'}</code> — each feature needs at least <code style={{ background: TOK.bgMuted, padding: "1px 5px", borderRadius: 3, fontSize: 10.5, color: TOK.fg }}>key</code> and <code style={{ background: TOK.bgMuted, padding: "1px 5px", borderRadius: 3, fontSize: 10.5, color: TOK.fg }}>name</code>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function FeatureRegistryExplorer() {
  const [data, setData] = useState(null);
  const [themeMode, setThemeMode] = useState("light");
  const [selectedKey, setSelectedKey] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch] = useState("");
  const t = THEMES[themeMode];
  setThemeTokens(themeMode);

  const features = data?.features || [];

  const categories = useMemo(() => [...new Set(features.map(f => f.category).filter(Boolean))], [features]);

  // Build dynamic category color map for categories not in CATEGORY_META
  const dynamicCatMap = useMemo(() => {
    const m = {};
    let ci = 0;
    categories.forEach(c => {
      if (!CATEGORY_META[c]) {
        const color = PALETTE[ci % PALETTE.length];
        m[c] = { label: c.replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase()), color, bg: color + "10", icon: "CT" };
        ci++;
      }
    });
    return m;
  }, [categories]);

  const categoryCounts = useMemo(() => {
    const m = {};
    features.forEach(f => { if (f.category) m[f.category] = (m[f.category] || 0) + 1; });
    return m;
  }, [features]);

  const totalTests = useMemo(() => features.reduce((s, f) => s + (f.metadata?.test_count || 0), 0), [features]);
  const avgCoverage = useMemo(() => {
    const covs = features.filter(f => f.metadata?.coverage_percent != null);
    return covs.length ? Math.round(covs.reduce((s, f) => s + f.metadata.coverage_percent, 0) / covs.length) : null;
  }, [features]);

  const filtered = useMemo(() => {
    return features
      .filter(f => !categoryFilter || f.category === categoryFilter)
      .filter(f => !statusFilter || f.status === statusFilter)
      .filter(f => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (f.name || "").toLowerCase().includes(q) || (f.key || "").toLowerCase().includes(q)
          || (f.description || "").toLowerCase().includes(q) || f.tags?.some(t => t.toLowerCase().includes(q));
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [features, categoryFilter, statusFilter, search]);

  const selectedFeature = selectedKey ? features.find(f => f.key === selectedKey) : null;

  const handleReset = () => {
    setData(null); setSelectedKey(null); setCategoryFilter(null); setStatusFilter(null); setSearch("");
  };

  if (!data) {
    return <DataLoader onLoad={setData} themeMode={themeMode} setThemeMode={setThemeMode} t={t} />;
  }

  return (
    <div style={{
      fontFamily: TYPE.family.body,
      minHeight: "100vh", background: t.bg.primary, color: t.fg.primary,
    }}>
      <style>{`
        ${globalCSS(t)}
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${TOK.border}; border-radius: 99px; }
      `}</style>
      <ThemeToggle mode={themeMode} setMode={setThemeMode} t={t} />

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: TOK.brand, color: TOK.white, fontSize: 15, fontWeight: 800, flexShrink: 0,
            }}>FR</div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: TOK.fg }}>Feature Registry</h1>
            {data.version && <code style={{ fontSize: 11, color: TOK.fgMuted, background: TOK.bgMuted, padding: "3px 8px", borderRadius: 4 }}>v{data.version}</code>}
            <button onClick={handleReset} style={{
              marginLeft: "auto", padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
              color: TOK.fgDim, background: TOK.bgMuted, border: `1px solid ${TOK.border}`, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, transition: "all .12s ease", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = TOK.bgCard; }}
            onMouseLeave={e => { e.currentTarget.style.background = TOK.bgMuted; }}
            >Load different file</button>
          </div>
          {data.source && <div style={{ fontSize: 11, color: TOK.fgMuted, marginTop: 4 }}>Loaded from: <b style={{ color: TOK.fg }}>{data.source}</b></div>}
          {!selectedFeature && (
            <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 12, flexWrap: "wrap" }}>
              {[
                { label: "Features", value: features.length },
                totalTests > 0 && { label: "Total Tests", value: totalTests.toLocaleString() },
                avgCoverage != null && { label: "Avg Coverage", value: `${avgCoverage}%` },
                categories.length > 1 && { label: "Categories", value: categories.length },
              ].filter(Boolean).map((s, i) => (
                <div key={i}>
                  <span style={{ color: TOK.fgMuted, fontWeight: 500 }}>{s.label} </span>
                  <span style={{ color: TOK.fg, fontWeight: 800 }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedFeature ? (
          <FeatureDetail feature={selectedFeature} features={features} catMap={dynamicCatMap} onNavigate={k => setSelectedKey(k)} onBack={() => setSelectedKey(null)} />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search features by name, key, or tag..."
                style={{
                  width: "100%", padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${TOK.border}`,
                  fontSize: 13, color: TOK.fg, background: TOK.bgCard, outline: "none",
                  transition: "border-color .15s ease", fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = `${TOK.brand}55`}
                onBlur={e => e.target.style.borderColor = TOK.border}
              />
            </div>

            {categories.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {categories.map(c => (
                  <CategoryPill key={c} category={c} active={categoryFilter === c} count={categoryCounts[c]} catMap={dynamicCatMap}
                    onClick={() => setCategoryFilter(categoryFilter === c ? null : c)} />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {Object.keys(STATUS_META).map(s => {
                const count = features.filter(f => f.status === s).length;
                if (!count) return null;
                return (
                  <button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    color: statusFilter === s ? TOK.white : STATUS_META[s].color,
                    background: statusFilter === s ? STATUS_META[s].color : STATUS_META[s].bg,
                    border: `1px solid ${statusFilter === s ? STATUS_META[s].color : STATUS_META[s].color + "33"}`,
                    cursor: "pointer", transition: "all .12s ease",
                  }}>{STATUS_META[s].label} ({count})</button>
                );
              })}
              {/* Show any statuses not in STATUS_META */}
              {[...new Set(features.map(f => f.status).filter(s => s && !STATUS_META[s]))].map(s => {
                const count = features.filter(f => f.status === s).length;
                return (
                  <button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    color: statusFilter === s ? TOK.white : TOK.fgDim,
                    background: statusFilter === s ? TOK.fgDim : TOK.bgMuted,
                    border: `1px solid ${statusFilter === s ? TOK.fgDim : TOK.border}`,
                    cursor: "pointer", transition: "all .12s ease",
                  }}>{s} ({count})</button>
                );
              })}
              {(categoryFilter || statusFilter || search) && (
                <button onClick={() => { setCategoryFilter(null); setStatusFilter(null); setSearch(""); }} style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  color: TOK.error, background: TOK.errorBg, border: `1px solid ${TOK.errorBorder}`, cursor: "pointer",
                }}>Clear</button>
              )}
            </div>

            <div style={{ fontSize: 11, color: TOK.fgMuted, marginBottom: 12, fontWeight: 500 }}>
              {filtered.length} of {features.length} features
              {categoryFilter && (() => { const cm = getCatMeta(categoryFilter, dynamicCatMap); return <span> in <b style={{ color: cm.color }}>{cm.label}</b></span>; })()}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {filtered.map(f => <FeatureCard key={f.key || f.id} feature={f} onClick={() => setSelectedKey(f.key)} catMap={dynamicCatMap} />)}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", color: TOK.fgMuted }}>
                <div style={{ fontSize: 20, marginBottom: 8, fontFamily: TYPE.family.mono, fontWeight: 700 }}>NONE</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No features match your filters</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
