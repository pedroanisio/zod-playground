// Shared IANDE theme tokens and primitives for viewer templates.
// All resolved values trace to docs/_specs/viewers/iande-design-system-v2.ts.

export const CORE = {
  teal: "#00796B",
  tealText: "#005B4F",
  tealLight: "#E0F2F1",
  tealMuted: "#B2DFDB",
  graphite: "#1A1A1A",
  offWhite: "#F5F5F5",
  white: "#FFFFFF",
  n50: "#FAFAFA",
  n100: "#F5F5F5",
  n200: "#EEEEEE",
  n300: "#E0E0E0",
  n400: "#BDBDBD",
  n500: "#9E9E9E",
  n600: "#757575",
  n700: "#616161",
  n800: "#424242",
  n900: "#212121",
  error: "#C62828",
  errorLight: "#FFEBEE",
  errorText: "#B71C1C",
  warning: "#EF6C00",
  warningLight: "#FFF3E0",
  warningText: "#E65100",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  successText: "#1B5E20",
  info: "#0277BD",
  infoLight: "#E1F5FE",
  infoText: "#01579B",
};

export const THEMES = {
  light: {
    fg: {
      primary: CORE.graphite,
      secondary: CORE.n600,
      tertiary: CORE.n500,
      inverse: CORE.white,
      brand: CORE.tealText,
      disabled: CORE.n400,
      error: CORE.errorText,
      warning: CORE.warningText,
      success: CORE.successText,
      info: CORE.infoText,
    },
    bg: {
      primary: CORE.offWhite,
      secondary: CORE.white,
      tertiary: CORE.n100,
      inverse: CORE.graphite,
      brand: CORE.teal,
      brandSubtle: CORE.tealLight,
      brandMuted: CORE.tealMuted,
      error: CORE.errorLight,
      warning: CORE.warningLight,
      success: CORE.successLight,
      info: CORE.infoLight,
      disabled: CORE.n200,
    },
    border: {
      default: CORE.n300,
      strong: CORE.n500,
      subtle: CORE.n200,
      brand: CORE.teal,
      error: CORE.error,
      warning: CORE.warning,
      success: CORE.success,
      info: CORE.info,
    },
  },
  dark: {
    fg: {
      primary: CORE.n50,
      secondary: CORE.n400,
      tertiary: CORE.n500,
      inverse: CORE.graphite,
      brand: CORE.tealMuted,
      disabled: CORE.n700,
      error: CORE.errorLight,
      warning: CORE.warningLight,
      success: CORE.successLight,
      info: CORE.infoLight,
    },
    bg: {
      primary: CORE.n900,
      secondary: CORE.n800,
      tertiary: CORE.n700,
      inverse: CORE.white,
      brand: CORE.teal,
      brandSubtle: "#0E312D",
      brandMuted: "#163D38",
      error: "#3E1111",
      warning: "#3E2400",
      success: "#0E2E10",
      info: "#0A2433",
      disabled: CORE.n800,
    },
    border: {
      default: CORE.n700,
      strong: CORE.n500,
      subtle: CORE.n800,
      brand: CORE.teal,
      error: CORE.error,
      warning: CORE.warning,
      success: CORE.success,
      info: CORE.info,
    },
  },
};

export const TYPE = {
  family: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.25rem",
    xl: "1.563rem",
    "2xl": "1.953rem",
  },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 },
  leading: { tight: 1.1, snug: 1.25, normal: 1.5, relaxed: 1.6 },
  tracking: { tight: "-0.02em", snug: "-0.01em", wide: "0.02em", widest: "0.08em" },
};

export const SP = { 0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 };

export const RAD = { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };

export const SHADOW = {
  sm: "0px 1px 3px #1A1A1A14",
  md: "0px 4px 8px -2px #1A1A1A1F",
  lg: "0px 12px 24px -4px #1A1A1A25",
};

export const MOTION = {
  fast: "120ms cubic-bezier(0.2,0,0,1)",
  normal: "200ms cubic-bezier(0.2,0,0,1)",
  slow: "350ms cubic-bezier(0.2,0,0,1)",
};

export function globalCSS(t) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700;800&display=swap');
    @keyframes iandeSlide {
      from { opacity: 0; transform: translateY(${SP[2]}px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${t.border.default}; border-radius: ${RAD.full}px; }
  `;
}

export function Badge({ children, fg, bg, border: bd, style = {} }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: SP[1],
        padding: `${SP[0.5]}px ${SP[2]}px`,
        borderRadius: RAD.full,
        fontSize: TYPE.size.xs,
        fontWeight: TYPE.weight.medium,
        fontFamily: TYPE.family.body,
        letterSpacing: TYPE.tracking.widest,
        color: fg,
        background: bg,
        border: `1px solid ${bd || "transparent"}`,
        whiteSpace: "nowrap",
        lineHeight: TYPE.leading.normal,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Overline({ children, t, count, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: SP[2], marginBottom: SP[3] }}>
      <span
        style={{
          fontSize: TYPE.size.xs,
          fontWeight: TYPE.weight.semibold,
          fontFamily: TYPE.family.body,
          letterSpacing: TYPE.tracking.widest,
          textTransform: "uppercase",
          color: t.fg.secondary,
          lineHeight: TYPE.leading.normal,
        }}
      >
        {children}
      </span>
      {count != null && <Badge fg={t.fg.tertiary} bg={t.bg.tertiary}>{count}</Badge>}
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}

export function Card({ children, t, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: t.bg.secondary,
        border: `1px solid ${t.border.subtle}`,
        borderRadius: RAD.lg,
        padding: SP[4],
        boxShadow: SHADOW.sm,
        transition: `all ${MOTION.fast}`,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!onClick) {
          return;
        }
        e.currentTarget.style.boxShadow = SHADOW.md;
        e.currentTarget.style.borderColor = t.border.default;
      }}
      onMouseLeave={(e) => {
        if (!onClick) {
          return;
        }
        e.currentTarget.style.boxShadow = SHADOW.sm;
        e.currentTarget.style.borderColor = t.border.subtle;
      }}
    >
      {children}
    </div>
  );
}

export function CodeRef({ children, t }) {
  return (
    <code
      style={{
        fontFamily: TYPE.family.mono,
        fontSize: TYPE.size.xs,
        fontWeight: TYPE.weight.regular,
        lineHeight: TYPE.leading.relaxed,
        color: t.fg.brand,
        background: t.bg.brandSubtle,
        padding: `${SP[0.5]}px ${SP[1.5]}px`,
        borderRadius: RAD.sm,
        wordBreak: "break-all",
      }}
    >
      {children}
    </code>
  );
}

export function Divider({ t }) {
  return <div style={{ height: 1, background: t.border.subtle, margin: `${SP[4]}px 0` }} />;
}

export function ThemeToggle({ mode, setMode, t }) {
  return (
    <button
      onClick={() => setMode(mode === "dark" ? "light" : "dark")}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed",
        top: SP[4],
        right: SP[4],
        zIndex: 100,
        width: 36,
        height: 36,
        borderRadius: RAD.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: `all ${MOTION.fast}`,
        background: t.bg.secondary,
        border: `1px solid ${t.border.default}`,
        fontFamily: TYPE.family.mono,
        fontSize: TYPE.size.xs,
        fontWeight: TYPE.weight.bold,
        color: t.fg.secondary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = t.border.brand;
        e.currentTarget.style.color = t.fg.brand;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = t.border.default;
        e.currentTarget.style.color = t.fg.secondary;
      }}
    >
      {mode === "dark" ? "LT" : "DK"}
    </button>
  );
}
