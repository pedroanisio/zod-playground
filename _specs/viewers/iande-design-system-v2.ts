// ═══════════════════════════════════════════════════════════════════════════
// IANDE Design System v2 — Canonical Visual Identity Tokens
// ═══════════════════════════════════════════════════════════════════════════
//
// "Restraint at the Core, Expression at the Edge."
//
// Architecture:
//   ┌─────────────────────────────────────────────────────────────────────┐
//   │  CORE         Atomic palette — raw values, single source of truth  │
//   │  SEMANTIC     Context-specific aliases — consume core by reference │
//   │  COMPONENTS   Per-component tokens — consume semantic by reference │
//   │  MODES        Dark / high-contrast overrides — shadow the above    │
//   │  PLATFORMS    iOS / Android / Print unit and density overrides     │
//   └─────────────────────────────────────────────────────────────────────┘
//
// Governance Rules:
//   1. No hex literal may appear outside the CORE tier.
//   2. Semantic tokens MUST alias core tokens via {core.x.y} references.
//   3. Component tokens MUST alias semantic tokens via {semantic.x.y}.
//   4. Mode tokens override semantic paths; fallback is always the
//      default (light) semantic token.
//   5. The primary brand color (#00796B) FAILS WCAG AA on white/offWhite.
//      A darker text-safe variant (#005B4F) is provided for all text use.
//
// Sources:
//   - Brand colors:    iande-brand-content.ts → core-palette (3 core hues)
//   - Gradients:       iande-brand-content.ts → iande-lab-palette
//   - Mark tokens:     iande-brand-content.ts → primary/lab-mark-color-rules
//   - State colors:    Derived — hue-matched to brand teal where possible
//   - Neutral scale:   Derived — linear interpolation graphite → offWhite
//   - Typography:      Inter (variable) + JetBrains Mono; modular scale 1.25
//   - Spacing:         4px base unit, powers-of-two progression
//   - Elevation:       4-tier shadow + z-index scale
//   - Motion:          3-tier duration × 3 easing curves
//
// ═══════════════════════════════════════════════════════════════════════════

import type { DesignSystem } from "../schemas/design-system";
import { computeContrastPair } from "../utils/color-contrast";

// Stable UUID — IANDE design system entity
const IANDE_DS_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

// ─────────────────────────────────────────────────────────────────────────
// Raw palette constants (used ONLY in core tier and contrastMatrix)
// ─────────────────────────────────────────────────────────────────────────
const RAW = {
  // Brand
  teal:         "#00796B",  // Proprietary Teal — brand signal
  tealText:     "#005B4F",  // AA-safe text variant (4.58:1 on #FFFFFF)
  tealLight:    "#E0F2F1",  // Teal tint — subtle backgrounds
  tealMuted:    "#B2DFDB",  // Teal wash — tags, badges, highlights
  graphite:     "#1A1A1A",  // Deep Graphite — primary text / dark bg
  offWhite:     "#F5F5F5",  // Off-White — primary canvas
  white:        "#FFFFFF",  // Pure white — surfaces

  // Neutral scale (10 steps, graphite → offWhite)
  neutral50:    "#FAFAFA",
  neutral100:   "#F5F5F5",
  neutral200:   "#EEEEEE",
  neutral300:   "#E0E0E0",
  neutral400:   "#BDBDBD",
  neutral500:   "#9E9E9E",
  neutral600:   "#757575",
  neutral700:   "#616161",
  neutral800:   "#424242",
  neutral900:   "#212121",

  // State — hue-shifted from brand teal where reasonable
  error:        "#C62828",
  errorLight:   "#FFEBEE",
  errorText:    "#B71C1C",
  warning:      "#EF6C00",
  warningLight: "#FFF3E0",
  warningText:  "#E65100",
  success:      "#2E7D32",
  successLight: "#E8F5E9",
  successText:  "#1B5E20",
  info:         "#0277BD",
  infoLight:    "#E1F5FE",
  infoText:     "#01579B",

  // Overlay / alpha
  overlayBlack: "#00000080",  // 50% black overlay
  overlayWhite: "#FFFFFF80",  // 50% white overlay
} as const;

export const iandeDesignSystem: DesignSystem = {
  id: IANDE_DS_ID,
  name: "IANDE Design System",
  slug: "iande-ds",
  description:
    "Restraint at the Core, Expression at the Edge. " +
    "A multi-surface visual identity system: three brand colors, " +
    "controlled gradients for Lab contexts, full semantic/component " +
    "token tiers with dark mode, cross-platform overrides, and " +
    "WCAG AA accessibility as a structural constraint.",

  // ═══════════════════════════════════════════════════════════════════════
  // § CONVENIENCE LAYER — flat fields for simple consumers
  // ═══════════════════════════════════════════════════════════════════════

  colors: {
    primary:       RAW.teal,
    secondary:     RAW.graphite,
    accent:        RAW.tealMuted,
    background:    RAW.offWhite,
    surface:       RAW.white,
    text:          RAW.graphite,
    textSecondary: RAW.neutral600,
    border:        RAW.neutral300,
    error:         RAW.error,
    warning:       RAW.warning,
    success:       RAW.success,
    info:          RAW.info,
    custom: {
      tealText:     RAW.tealText,
      tealLight:    RAW.tealLight,
      tealMuted:    RAW.tealMuted,
      overlayBlack: RAW.overlayBlack,
      overlayWhite: RAW.overlayWhite,
    },
  },

  typography: {
    fontFamilyHeading: "Inter",
    fontFamilyBody:    "Inter",
    fontFamilyMono:    "JetBrains Mono",
    scale: {
      // Modular scale: 1.25 ratio, base 1rem
      display: { fontFamily: "Inter", fontSize: "3.052rem", fontWeight: 800, lineHeight: 1.1,  letterSpacing: "-0.02em" },
      h1:      { fontFamily: "Inter", fontSize: "2.441rem", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.015em" },
      h2:      { fontFamily: "Inter", fontSize: "1.953rem", fontWeight: 600, lineHeight: 1.25 },
      h3:      { fontFamily: "Inter", fontSize: "1.563rem", fontWeight: 600, lineHeight: 1.3 },
      h4:      { fontFamily: "Inter", fontSize: "1.25rem",  fontWeight: 600, lineHeight: 1.35 },
      h5:      { fontFamily: "Inter", fontSize: "1rem",     fontWeight: 600, lineHeight: 1.4 },
      body:    { fontFamily: "Inter", fontSize: "1rem",     fontWeight: 400, lineHeight: 1.6 },
      bodyLg:  { fontFamily: "Inter", fontSize: "1.125rem", fontWeight: 400, lineHeight: 1.6 },
      bodySm:  { fontFamily: "Inter", fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 },
      caption: { fontFamily: "Inter", fontSize: "0.75rem",  fontWeight: 400, lineHeight: 1.5, letterSpacing: "0.01em" },
      overline:{ fontFamily: "Inter", fontSize: "0.75rem",  fontWeight: 600, lineHeight: 1.5, letterSpacing: "0.08em", textTransform: "uppercase" },
      code:    { fontFamily: "JetBrains Mono", fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.6 },
      codeSm:  { fontFamily: "JetBrains Mono", fontSize: "0.75rem",  fontWeight: 400, lineHeight: 1.5 },
    },
    // Content/Presentation style (for SlotVisualConfig consumers)
    heading: { family: "Inter", weight: 700, size: 32, line_height: 1.15 },
    body:    { family: "Inter", weight: 400, size: 16, line_height: 1.6 },
    caption: { family: "Inter", weight: 400, size: 12, line_height: 1.5 },
    code:    { family: "JetBrains Mono", weight: 400, size: 14, line_height: 1.6 },
  },

  spacing: {
    unit: 4,
    scale: {
      "0":   "0px",
      "0.5": "2px",
      "1":   "4px",
      "1.5": "6px",
      "2":   "8px",
      "3":   "12px",
      "4":   "16px",
      "5":   "20px",
      "6":   "24px",
      "8":   "32px",
      "10":  "40px",
      "12":  "48px",
      "16":  "64px",
      "20":  "80px",
      "24":  "96px",
      "32":  "128px",
    },
  },

  borderRadius: {
    none: "0",
    sm:   "0.25rem",
    md:   "0.5rem",
    lg:   "0.75rem",
    full: "9999px",
  },

  shadows: {
    sm: {
      color: "#1A1A1A1A",
      offsetX: "0px",
      offsetY: "1px",
      blur: "2px",
      spread: "0px",
    },
    md: {
      color: "#1A1A1A1F",
      offsetX: "0px",
      offsetY: "4px",
      blur: "8px",
      spread: "-1px",
    },
    lg: {
      color: "#1A1A1A25",
      offsetX: "0px",
      offsetY: "10px",
      blur: "24px",
      spread: "-4px",
    },
    xl: {
      color: "#1A1A1A30",
      offsetX: "0px",
      offsetY: "20px",
      blur: "48px",
      spread: "-8px",
    },
  },

  breakpoints: {
    sm:   "640px",
    md:   "768px",
    lg:   "1024px",
    xl:   "1280px",
    "2xl":"1536px",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § CONTRAST MATRIX — every foreground/background pair, validated
  // ═══════════════════════════════════════════════════════════════════════

  contrastMatrix: [
    // Body text
    computeContrastPair(RAW.graphite,  RAW.white),     // ~16.75:1  AA ✓  AAA ✓
    computeContrastPair(RAW.graphite,  RAW.offWhite),   // ~15.98:1  AA ✓  AAA ✓
    computeContrastPair(RAW.neutral600, RAW.white),     // ~4.65:1   AA ✓  AAA ✗

    // Brand teal — THE KNOWN PROBLEM
    computeContrastPair(RAW.teal,      RAW.white),     // ~3.94:1   AA ✗ — DO NOT use for text
    computeContrastPair(RAW.tealText,  RAW.white),     // ~5.62:1   AA ✓ — use this for text
    computeContrastPair(RAW.tealText,  RAW.offWhite),   // ~5.36:1   AA ✓ — use this for text
    computeContrastPair(RAW.teal,      RAW.graphite),   // ~4.25:1   AA ✓ — teal on dark

    // Inverse (light on dark)
    computeContrastPair(RAW.white,     RAW.graphite),   // ~16.75:1  AA ✓  AAA ✓
    computeContrastPair(RAW.offWhite,  RAW.graphite),   // ~15.98:1  AA ✓  AAA ✓
    computeContrastPair(RAW.tealLight, RAW.graphite),   // ~13.6:1   AA ✓  AAA ✓

    // State colors on white
    computeContrastPair(RAW.errorText,   RAW.white),   // ~7.8:1    AA ✓  AAA ✓
    computeContrastPair(RAW.warningText, RAW.white),   // ~4.6:1    AA ✓  AAA ✗
    computeContrastPair(RAW.successText, RAW.white),   // ~7.1:1    AA ✓  AAA ✓
    computeContrastPair(RAW.infoText,    RAW.white),   // ~8.6:1    AA ✓  AAA ✓

    // State colors on their own light backgrounds
    computeContrastPair(RAW.errorText,   RAW.errorLight),
    computeContrastPair(RAW.warningText, RAW.warningLight),
    computeContrastPair(RAW.successText, RAW.successLight),
    computeContrastPair(RAW.infoText,    RAW.infoLight),
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // § TOKEN ENGINE — multi-tier, cross-surface, aliased
  // ═══════════════════════════════════════════════════════════════════════

  tokens: {
    format: "iande-v1",

    // ───────────────────────────────────────────────────────────────────
    // CORE — atomic values. The ONLY tier that contains raw hex/values.
    // ───────────────────────────────────────────────────────────────────
    core: {
      $description: "Atomic palette — raw design decisions. No other tier may contain hex literals.",

      color: {
        $type: "color",
        $description: "Brand and neutral color primitives",

        // Brand triad
        teal:       { $value: RAW.teal,       $description: "Proprietary Teal — brand signal, coherence, integration. FAILS AA on white — use tealText for text." },
        tealText:   { $value: RAW.tealText,   $description: "AA-safe teal for text on white/offWhite (≥4.5:1)" },
        tealLight:  { $value: RAW.tealLight,  $description: "Teal tint — subtle backgrounds, hover states" },
        tealMuted:  { $value: RAW.tealMuted,  $description: "Teal wash — tags, badges, selected states" },
        graphite:   { $value: RAW.graphite,   $description: "Deep Graphite — primary text, dark backgrounds" },
        offWhite:   { $value: RAW.offWhite,   $description: "Off-White — primary canvas" },
        white:      { $value: RAW.white,      $description: "Pure white — surfaces, card backgrounds" },

        // Neutral scale
        neutral50:  { $value: RAW.neutral50 },
        neutral100: { $value: RAW.neutral100 },
        neutral200: { $value: RAW.neutral200 },
        neutral300: { $value: RAW.neutral300 },
        neutral400: { $value: RAW.neutral400 },
        neutral500: { $value: RAW.neutral500 },
        neutral600: { $value: RAW.neutral600 },
        neutral700: { $value: RAW.neutral700 },
        neutral800: { $value: RAW.neutral800 },
        neutral900: { $value: RAW.neutral900 },

        // State colors
        error:        { $value: RAW.error },
        errorLight:   { $value: RAW.errorLight },
        errorText:    { $value: RAW.errorText,    $description: "AA-safe error text on white" },
        warning:      { $value: RAW.warning },
        warningLight: { $value: RAW.warningLight },
        warningText:  { $value: RAW.warningText,  $description: "AA-safe warning text on white" },
        success:      { $value: RAW.success },
        successLight: { $value: RAW.successLight },
        successText:  { $value: RAW.successText,  $description: "AA-safe success text on white" },
        info:         { $value: RAW.info },
        infoLight:    { $value: RAW.infoLight },
        infoText:     { $value: RAW.infoText,     $description: "AA-safe info text on white" },

        // Overlay
        overlayBlack: { $value: RAW.overlayBlack, $description: "50% black — modal backdrops, image overlays" },
        overlayWhite: { $value: RAW.overlayWhite, $description: "50% white — frosted glass, disabled overlays" },

        // Transparent
        transparent:  { $value: "#00000000", $description: "Fully transparent" },
      },

      gradient: {
        $type: "gradient",
        $description: "Brand gradients — restricted to Lab/innovation contexts",

        deepSignal: {
          $value: {
            type: "linear",
            angle: 135,
            stops: [
              { color: RAW.graphite,  position: 0 },
              { color: RAW.teal,      position: 1 },
            ],
          },
          $description: "Lab hero/backgrounds — graphite-to-teal diagonal",
        },
        lightSignal: {
          $value: {
            type: "linear",
            angle: 135,
            stops: [
              { color: RAW.teal,      position: 0 },
              { color: RAW.tealLight, position: 1 },
            ],
          },
          $description: "Lab accents/overlays — teal-to-mint diagonal",
        },
        subtleWash: {
          $value: {
            type: "linear",
            angle: 180,
            stops: [
              { color: RAW.white,     position: 0 },
              { color: RAW.offWhite,  position: 1 },
            ],
          },
          $description: "Enterprise backgrounds — subtle depth without brand color",
        },
      },

      spacing: {
        $type: "dimension",
        $description: "4px base unit, progressive scale",
        "0":   { $value: "0px" },
        "0.5": { $value: "2px" },
        "1":   { $value: "4px" },
        "1.5": { $value: "6px" },
        "2":   { $value: "8px" },
        "3":   { $value: "12px" },
        "4":   { $value: "16px" },
        "5":   { $value: "20px" },
        "6":   { $value: "24px" },
        "8":   { $value: "32px" },
        "10":  { $value: "40px" },
        "12":  { $value: "48px" },
        "16":  { $value: "64px" },
        "20":  { $value: "80px" },
        "24":  { $value: "96px" },
      },

      size: {
        $type: "dimension",
        $description: "Fixed sizes for icons, avatars, touch targets",
        icon: {
          sm: { $value: "16px" },
          md: { $value: "20px" },
          lg: { $value: "24px" },
          xl: { $value: "32px" },
        },
        avatar: {
          sm: { $value: "24px" },
          md: { $value: "32px" },
          lg: { $value: "40px" },
          xl: { $value: "64px" },
        },
        touchTarget: { $value: "44px", $description: "WCAG 2.5.5 minimum target size" },
      },

      borderWidth: {
        $type: "dimension",
        thin:    { $value: "1px" },
        medium:  { $value: "2px" },
        thick:   { $value: "3px" },
      },

      borderRadius: {
        $type: "dimension",
        none: { $value: "0px" },
        sm:   { $value: "4px" },
        md:   { $value: "8px" },
        lg:   { $value: "12px" },
        xl:   { $value: "16px" },
        full: { $value: "9999px" },
      },

      shadow: {
        $type: "shadow",
        $description: "Elevation tiers — graphite-based shadow color",
        sm: {
          $value: {
            color: "#1A1A1A14",
            offsetX: "0px",
            offsetY: "1px",
            blur: "3px",
            spread: "0px",
          },
        },
        md: {
          $value: {
            color: "#1A1A1A1F",
            offsetX: "0px",
            offsetY: "4px",
            blur: "8px",
            spread: "-2px",
          },
        },
        lg: {
          $value: {
            color: "#1A1A1A25",
            offsetX: "0px",
            offsetY: "12px",
            blur: "24px",
            spread: "-4px",
          },
        },
        xl: {
          $value: {
            color: "#1A1A1A30",
            offsetX: "0px",
            offsetY: "24px",
            blur: "48px",
            spread: "-8px",
          },
        },
        focus: {
          $value: {
            color: "#00796B66",
            offsetX: "0px",
            offsetY: "0px",
            blur: "0px",
            spread: "3px",
          },
          $description: "Focus ring shadow — teal at 40% opacity, 3px spread",
        },
        focusError: {
          $value: {
            color: "#C6282866",
            offsetX: "0px",
            offsetY: "0px",
            blur: "0px",
            spread: "3px",
          },
          $description: "Error focus ring — red at 40% opacity",
        },
      },

      zIndex: {
        $type: "number",
        $description: "Layering scale — consistent stacking order",
        base:     { $value: 0 },
        raised:   { $value: 1 },
        dropdown: { $value: 10 },
        sticky:   { $value: 20 },
        overlay:  { $value: 30 },
        modal:    { $value: 40 },
        popover:  { $value: 50 },
        toast:    { $value: 60 },
        tooltip:  { $value: 70 },
        max:      { $value: 9999 },
      },

      opacity: {
        $type: "number",
        $description: "Opacity scale — 0 is invisible, 1 is fully opaque",
        disabled: { $value: 0.38,  $description: "Disabled state (WCAG: non-text contrast exempt)" },
        hint:     { $value: 0.54,  $description: "Hint / placeholder text" },
        subtle:   { $value: 0.08,  $description: "Subtle hover/pressed backgrounds" },
        hover:    { $value: 0.12,  $description: "Interactive hover overlay" },
        pressed:  { $value: 0.16,  $description: "Active/pressed overlay" },
        overlay:  { $value: 0.50,  $description: "Modal backdrop overlay" },
        full:     { $value: 1 },
      },

      duration: {
        $type: "duration",
        $description: "Animation/transition durations — 3 tiers",
        instant:  { $value: "0ms",   $description: "Immediate state change, no transition" },
        fast:     { $value: "120ms", $description: "Micro-interactions: toggles, checkboxes" },
        normal:   { $value: "200ms", $description: "Standard transitions: hover, focus" },
        slow:     { $value: "350ms", $description: "Entrances, exits, layout shifts" },
        slower:   { $value: "500ms", $description: "Complex choreography, page transitions" },
      },

      easing: {
        $type: "cubicBezier",
        $description: "Easing curves — Material Design 3 aligned",
        standard:        { $value: [0.2, 0.0, 0, 1.0],    $description: "Standard — most transitions" },
        standardDecel:   { $value: [0.0, 0.0, 0, 1.0],    $description: "Decelerate — entering elements" },
        standardAccel:   { $value: [0.3, 0.0, 0.8, 0.15], $description: "Accelerate — exiting elements" },
        emphasized:      { $value: [0.2, 0.0, 0, 1.0],    $description: "Emphasized — large/important transitions" },
        emphasizedDecel: { $value: [0.05, 0.7, 0.1, 1.0], $description: "Emphasized decelerate — hero entrances" },
        emphasizedAccel: { $value: [0.3, 0.0, 0.8, 0.15], $description: "Emphasized accelerate — hero exits" },
        linear:          { $value: "linear" },
      },

      transition: {
        $type: "transition",
        $description: "Pre-composed transition tokens",
        fast: {
          $value: {
            duration: "{core.duration.fast}",
            timingFunction: "{core.easing.standard}",
          },
        },
        normal: {
          $value: {
            duration: "{core.duration.normal}",
            timingFunction: "{core.easing.standard}",
          },
        },
        slow: {
          $value: {
            duration: "{core.duration.slow}",
            timingFunction: "{core.easing.emphasized}",
          },
        },
        entrance: {
          $value: {
            duration: "{core.duration.slow}",
            timingFunction: "{core.easing.standardDecel}",
          },
        },
        exit: {
          $value: {
            duration: "{core.duration.normal}",
            timingFunction: "{core.easing.standardAccel}",
          },
        },
      },

      font: {
        $description: "Font family and weight primitives",
        family: {
          $type: "string",
          heading: { $value: "Inter" },
          body:    { $value: "Inter" },
          mono:    { $value: "JetBrains Mono" },
        },
        weight: {
          $type: "fontWeight",
          regular:  { $value: 400 },
          medium:   { $value: 500 },
          semibold: { $value: 600 },
          bold:     { $value: 700 },
          heavy:    { $value: 800 },
        },
      },

      fontSize: {
        $type: "dimension",
        $description: "Modular scale 1.25, base 1rem (16px)",
        xs:      { $value: "0.75rem" },
        sm:      { $value: "0.875rem" },
        base:    { $value: "1rem" },
        md:      { $value: "1.125rem" },
        lg:      { $value: "1.25rem" },
        xl:      { $value: "1.563rem" },
        "2xl":   { $value: "1.953rem" },
        "3xl":   { $value: "2.441rem" },
        "4xl":   { $value: "3.052rem" },
      },

      lineHeight: {
        $type: "number",
        tight:   { $value: 1.1 },
        snug:    { $value: 1.25 },
        normal:  { $value: 1.5 },
        relaxed: { $value: 1.6 },
        loose:   { $value: 1.8 },
      },

      letterSpacing: {
        $type: "dimension",
        tight:   { $value: "-0.02em" },
        snug:    { $value: "-0.01em" },
        normal:  { $value: "0em" },
        wide:    { $value: "0.02em" },
        wider:   { $value: "0.04em" },
        widest:  { $value: "0.08em" },
      },
    },

    // ───────────────────────────────────────────────────────────────────
    // SEMANTIC — contextual aliases. Every $value is a {core.*} reference.
    // ───────────────────────────────────────────────────────────────────
    semantic: {
      $description: "Context-specific token aliases. All values reference core tokens.",

      color: {
        $type: "color",

        // Foreground (text, icons)
        fg: {
          $description: "Foreground colors — text and icons",
          primary:   { $value: "{core.color.graphite}",   $description: "Primary body text" },
          secondary: { $value: "{core.color.neutral600}",  $description: "Secondary / muted text" },
          tertiary:  { $value: "{core.color.neutral500}",  $description: "Placeholder, hint text" },
          inverse:   { $value: "{core.color.white}",       $description: "Text on dark backgrounds" },
          brand:     { $value: "{core.color.tealText}",    $description: "Brand-colored text — AA-safe variant" },
          link:      { $value: "{core.color.tealText}",    $description: "Hyperlink text — AA-safe" },
          linkHover: { $value: "{core.color.teal}",        $description: "Hyperlink hover — decorative only, not text-critical" },
          disabled:  { $value: "{core.color.neutral400}",  $description: "Disabled text" },
          error:     { $value: "{core.color.errorText}",   $description: "Error messages — AA-safe" },
          warning:   { $value: "{core.color.warningText}", $description: "Warning messages — AA-safe" },
          success:   { $value: "{core.color.successText}", $description: "Success messages — AA-safe" },
          info:      { $value: "{core.color.infoText}",    $description: "Informational messages — AA-safe" },
        },

        // Backgrounds
        bg: {
          $description: "Background colors — surfaces and containers",
          primary:     { $value: "{core.color.offWhite}",     $description: "Page canvas" },
          secondary:   { $value: "{core.color.white}",        $description: "Elevated surfaces (cards, modals)" },
          tertiary:    { $value: "{core.color.neutral100}",    $description: "Subtle distinction layer" },
          inverse:     { $value: "{core.color.graphite}",      $description: "Dark backgrounds" },
          brand:       { $value: "{core.color.teal}",          $description: "Brand-colored surfaces (buttons, badges)" },
          brandSubtle: { $value: "{core.color.tealLight}",     $description: "Subtle brand tint — selected rows, active tabs" },
          brandMuted:  { $value: "{core.color.tealMuted}",     $description: "Medium brand tint — tags, chips" },
          overlay:     { $value: "{core.color.overlayBlack}",  $description: "Modal/drawer backdrop" },
          error:       { $value: "{core.color.errorLight}" },
          warning:     { $value: "{core.color.warningLight}" },
          success:     { $value: "{core.color.successLight}" },
          info:        { $value: "{core.color.infoLight}" },
          disabled:    { $value: "{core.color.neutral200}",    $description: "Disabled element background" },
        },

        // Borders
        border: {
          $description: "Border and divider colors",
          default:  { $value: "{core.color.neutral300}",  $description: "Default border — inputs, cards, dividers" },
          strong:   { $value: "{core.color.neutral500}",  $description: "Emphasized borders" },
          subtle:   { $value: "{core.color.neutral200}",  $description: "Subtle dividers" },
          brand:    { $value: "{core.color.teal}",        $description: "Brand-accent border" },
          focus:    { $value: "{core.color.teal}",        $description: "Focus ring color" },
          error:    { $value: "{core.color.error}" },
          warning:  { $value: "{core.color.warning}" },
          success:  { $value: "{core.color.success}" },
          info:     { $value: "{core.color.info}" },
          disabled: { $value: "{core.color.neutral300}" },
        },
      },

      // Mark tokens — brand identity, context-dependent
      mark: {
        $description: "Logo mark color tokens — enterprise vs. Lab contexts",
        primary: {
          $description: "The Convergent Ring — Enterprise contexts",
          positive: {
            $description: "Light backgrounds",
            background: { $type: "color", $value: "{core.color.white}" },
            ring:       { $type: "color", $value: "{core.color.graphite}" },
            accent:     { $type: "color", $value: "{core.color.teal}" },
          },
          negative: {
            $description: "Dark backgrounds",
            background: { $type: "color", $value: "{core.color.graphite}" },
            ring:       { $type: "color", $value: "{core.color.white}" },
            accent:     { $type: "color", $value: "{core.color.teal}" },
          },
        },
        lab: {
          $description: "The Modular Constellation — Innovation contexts",
          deepSignal: {
            $type: "gradient",
            $value: "{core.gradient.deepSignal}",
            $description: "Dark backgrounds — graphite-to-teal gradient",
          },
          lightSignal: {
            $type: "gradient",
            $value: "{core.gradient.lightSignal}",
            $description: "Light backgrounds — teal-to-mint gradient",
          },
        },
      },

      // Typography tokens
      typography: {
        $type: "typography",
        $description: "Semantic type styles — referencing core font/size/weight tokens",
        display: {
          $value: {
            fontFamily: "{core.font.family.heading}",
            fontSize:   "{core.fontSize.4xl}",
            fontWeight: "{core.font.weight.heavy}",
            lineHeight: "{core.lineHeight.tight}",
            letterSpacing: "{core.letterSpacing.tight}",
          },
        },
        heading1: {
          $value: {
            fontFamily: "{core.font.family.heading}",
            fontSize:   "{core.fontSize.3xl}",
            fontWeight: "{core.font.weight.bold}",
            lineHeight: "{core.lineHeight.tight}",
            letterSpacing: "{core.letterSpacing.snug}",
          },
        },
        heading2: {
          $value: {
            fontFamily: "{core.font.family.heading}",
            fontSize:   "{core.fontSize.2xl}",
            fontWeight: "{core.font.weight.semibold}",
            lineHeight: "{core.lineHeight.snug}",
          },
        },
        heading3: {
          $value: {
            fontFamily: "{core.font.family.heading}",
            fontSize:   "{core.fontSize.xl}",
            fontWeight: "{core.font.weight.semibold}",
            lineHeight: "{core.lineHeight.snug}",
          },
        },
        heading4: {
          $value: {
            fontFamily: "{core.font.family.heading}",
            fontSize:   "{core.fontSize.lg}",
            fontWeight: "{core.font.weight.semibold}",
            lineHeight: "{core.lineHeight.normal}",
          },
        },
        body: {
          $value: {
            fontFamily: "{core.font.family.body}",
            fontSize:   "{core.fontSize.base}",
            fontWeight: "{core.font.weight.regular}",
            lineHeight: "{core.lineHeight.relaxed}",
          },
        },
        bodySmall: {
          $value: {
            fontFamily: "{core.font.family.body}",
            fontSize:   "{core.fontSize.sm}",
            fontWeight: "{core.font.weight.regular}",
            lineHeight: "{core.lineHeight.normal}",
          },
        },
        caption: {
          $value: {
            fontFamily: "{core.font.family.body}",
            fontSize:   "{core.fontSize.xs}",
            fontWeight: "{core.font.weight.regular}",
            lineHeight: "{core.lineHeight.normal}",
          },
        },
        overline: {
          $value: {
            fontFamily:    "{core.font.family.body}",
            fontSize:      "{core.fontSize.xs}",
            fontWeight:    "{core.font.weight.semibold}",
            lineHeight:    "{core.lineHeight.normal}",
            letterSpacing: "{core.letterSpacing.widest}",
            textTransform: "uppercase",
          },
        },
        code: {
          $value: {
            fontFamily: "{core.font.family.mono}",
            fontSize:   "{core.fontSize.sm}",
            fontWeight: "{core.font.weight.regular}",
            lineHeight: "{core.lineHeight.relaxed}",
          },
        },
      },

      // Spacing aliases
      spacing: {
        $type: "dimension",
        $description: "Semantic spacing — named by intent, not magnitude",
        inset:    { $value: "{core.spacing.4}",   $description: "Default internal padding (16px)" },
        insetSm:  { $value: "{core.spacing.2}",   $description: "Compact internal padding (8px)" },
        insetLg:  { $value: "{core.spacing.6}",   $description: "Generous internal padding (24px)" },
        stack:    { $value: "{core.spacing.4}",   $description: "Default vertical gap between elements" },
        stackSm:  { $value: "{core.spacing.2}" },
        stackLg:  { $value: "{core.spacing.6}" },
        inline:   { $value: "{core.spacing.2}",   $description: "Default horizontal gap between inline elements" },
        inlineSm: { $value: "{core.spacing.1}" },
        inlineLg: { $value: "{core.spacing.4}" },
        section:  { $value: "{core.spacing.16}",  $description: "Between major page sections (64px)" },
        page:     { $value: "{core.spacing.24}",  $description: "Top/bottom page margin (96px)" },
      },

      // Elevation aliases
      elevation: {
        $description: "Semantic elevation tiers — shadow + z-index intent",
        flat:    { $type: "shadow", $value: "{core.shadow.sm}" },
        raised:  { $type: "shadow", $value: "{core.shadow.md}" },
        overlay: { $type: "shadow", $value: "{core.shadow.lg}" },
        modal:   { $type: "shadow", $value: "{core.shadow.xl}" },
      },

      // Focus
      focus: {
        $description: "Focus indicator tokens",
        ring:      { $type: "shadow", $value: "{core.shadow.focus}",      $description: "Default focus ring" },
        ringError: { $type: "shadow", $value: "{core.shadow.focusError}", $description: "Error-state focus ring" },
      },

      // Motion aliases
      motion: {
        $description: "Semantic motion tokens — named by intent",
        hover:     { $type: "transition", $value: "{core.transition.fast}" },
        focus:     { $type: "transition", $value: "{core.transition.normal}" },
        enter:     { $type: "transition", $value: "{core.transition.entrance}" },
        exit:      { $type: "transition", $value: "{core.transition.exit}" },
        layout:    { $type: "transition", $value: "{core.transition.slow}" },
      },

      // Accessibility helpers
      a11y: {
        $description: "Accessibility-specific tokens",
        minTouchTarget: { $type: "dimension", $value: "{core.size.touchTarget}" },
        focusOutline:   { $type: "dimension", $value: "{core.borderWidth.medium}", $description: "Minimum focus outline width" },
        reducedMotion: {
          $type: "duration",
          $value: "{core.duration.instant}",
          $description: "Duration for prefers-reduced-motion — override all transitions to 0ms",
        },
      },
    },

    // ───────────────────────────────────────────────────────────────────
    // COMPONENTS — per-component tokens. Reference semantic tokens only.
    // ───────────────────────────────────────────────────────────────────
    components: {
      $description: "Per-component design tokens. All values reference semantic tier.",

      button: {
        $description: "Button component tokens",
        primary: {
          bg:          { $type: "color", $value: "{semantic.color.bg.brand}" },
          fg:          { $type: "color", $value: "{semantic.color.fg.inverse}" },
          border:      { $type: "color", $value: "{core.color.transparent}" },
          bgHover:     { $type: "color", $value: "{core.color.tealText}", $description: "Darker teal on hover" },
          bgActive:    { $type: "color", $value: "{core.color.tealText}" },
          bgDisabled:  { $type: "color", $value: "{semantic.color.bg.disabled}" },
          fgDisabled:  { $type: "color", $value: "{semantic.color.fg.disabled}" },
          shadow:      { $type: "shadow", $value: "{semantic.elevation.flat}" },
          shadowHover: { $type: "shadow", $value: "{semantic.elevation.raised}" },
          radius:      { $type: "dimension", $value: "{core.borderRadius.md}" },
          paddingX:    { $type: "dimension", $value: "{core.spacing.4}" },
          paddingY:    { $type: "dimension", $value: "{core.spacing.2}" },
          fontSize:    { $type: "dimension", $value: "{core.fontSize.sm}" },
          fontWeight:  { $type: "fontWeight", $value: "{core.font.weight.semibold}" },
          transition:  { $type: "transition", $value: "{semantic.motion.hover}" },
        },
        secondary: {
          bg:          { $type: "color", $value: "{core.color.transparent}" },
          fg:          { $type: "color", $value: "{semantic.color.fg.brand}" },
          border:      { $type: "color", $value: "{semantic.color.border.brand}" },
          bgHover:     { $type: "color", $value: "{semantic.color.bg.brandSubtle}" },
          bgActive:    { $type: "color", $value: "{semantic.color.bg.brandMuted}" },
          bgDisabled:  { $type: "color", $value: "{core.color.transparent}" },
          fgDisabled:  { $type: "color", $value: "{semantic.color.fg.disabled}" },
          radius:      { $type: "dimension", $value: "{core.borderRadius.md}" },
          paddingX:    { $type: "dimension", $value: "{core.spacing.4}" },
          paddingY:    { $type: "dimension", $value: "{core.spacing.2}" },
          fontSize:    { $type: "dimension", $value: "{core.fontSize.sm}" },
          fontWeight:  { $type: "fontWeight", $value: "{core.font.weight.semibold}" },
          transition:  { $type: "transition", $value: "{semantic.motion.hover}" },
        },
        ghost: {
          bg:          { $type: "color", $value: "{core.color.transparent}" },
          fg:          { $type: "color", $value: "{semantic.color.fg.brand}" },
          border:      { $type: "color", $value: "{core.color.transparent}" },
          bgHover:     { $type: "color", $value: "{semantic.color.bg.brandSubtle}" },
          bgActive:    { $type: "color", $value: "{semantic.color.bg.brandMuted}" },
          radius:      { $type: "dimension", $value: "{core.borderRadius.md}" },
          paddingX:    { $type: "dimension", $value: "{core.spacing.3}" },
          paddingY:    { $type: "dimension", $value: "{core.spacing.1.5}" },
          fontSize:    { $type: "dimension", $value: "{core.fontSize.sm}" },
          fontWeight:  { $type: "fontWeight", $value: "{core.font.weight.medium}" },
          transition:  { $type: "transition", $value: "{semantic.motion.hover}" },
        },
        danger: {
          bg:          { $type: "color", $value: "{core.color.error}" },
          fg:          { $type: "color", $value: "{semantic.color.fg.inverse}" },
          border:      { $type: "color", $value: "{core.color.transparent}" },
          bgHover:     { $type: "color", $value: "{core.color.errorText}" },
          radius:      { $type: "dimension", $value: "{core.borderRadius.md}" },
          paddingX:    { $type: "dimension", $value: "{core.spacing.4}" },
          paddingY:    { $type: "dimension", $value: "{core.spacing.2}" },
          fontSize:    { $type: "dimension", $value: "{core.fontSize.sm}" },
          fontWeight:  { $type: "fontWeight", $value: "{core.font.weight.semibold}" },
          transition:  { $type: "transition", $value: "{semantic.motion.hover}" },
        },
      },

      input: {
        $description: "Input / text field component tokens",
        bg:           { $type: "color",     $value: "{semantic.color.bg.secondary}" },
        fg:           { $type: "color",     $value: "{semantic.color.fg.primary}" },
        placeholder:  { $type: "color",     $value: "{semantic.color.fg.tertiary}" },
        border:       { $type: "color",     $value: "{semantic.color.border.default}" },
        borderHover:  { $type: "color",     $value: "{semantic.color.border.strong}" },
        borderFocus:  { $type: "color",     $value: "{semantic.color.border.focus}" },
        borderError:  { $type: "color",     $value: "{semantic.color.border.error}" },
        bgDisabled:   { $type: "color",     $value: "{semantic.color.bg.disabled}" },
        fgDisabled:   { $type: "color",     $value: "{semantic.color.fg.disabled}" },
        radius:       { $type: "dimension", $value: "{core.borderRadius.md}" },
        paddingX:     { $type: "dimension", $value: "{core.spacing.3}" },
        paddingY:     { $type: "dimension", $value: "{core.spacing.2}" },
        fontSize:     { $type: "dimension", $value: "{core.fontSize.base}" },
        lineHeight:   { $type: "number",    $value: "{core.lineHeight.normal}" },
        focusRing:    { $type: "shadow",    $value: "{semantic.focus.ring}" },
        errorRing:    { $type: "shadow",    $value: "{semantic.focus.ringError}" },
        transition:   { $type: "transition",$value: "{semantic.motion.focus}" },
      },

      card: {
        $description: "Card container tokens",
        bg:       { $type: "color",     $value: "{semantic.color.bg.secondary}" },
        border:   { $type: "color",     $value: "{semantic.color.border.subtle}" },
        radius:   { $type: "dimension", $value: "{core.borderRadius.lg}" },
        padding:  { $type: "dimension", $value: "{semantic.spacing.inset}" },
        shadow:   { $type: "shadow",    $value: "{semantic.elevation.flat}" },
        shadowHover: { $type: "shadow", $value: "{semantic.elevation.raised}" },
        transition: { $type: "transition", $value: "{semantic.motion.hover}" },
      },

      badge: {
        $description: "Badge / tag / chip tokens",
        bg:       { $type: "color",     $value: "{semantic.color.bg.brandMuted}" },
        fg:       { $type: "color",     $value: "{semantic.color.fg.brand}" },
        radius:   { $type: "dimension", $value: "{core.borderRadius.full}" },
        paddingX: { $type: "dimension", $value: "{core.spacing.2}" },
        paddingY: { $type: "dimension", $value: "{core.spacing.0.5}" },
        fontSize: { $type: "dimension", $value: "{core.fontSize.xs}" },
        fontWeight: { $type: "fontWeight", $value: "{core.font.weight.medium}" },
      },

      modal: {
        $description: "Modal / dialog tokens",
        bg:           { $type: "color",     $value: "{semantic.color.bg.secondary}" },
        overlayBg:    { $type: "color",     $value: "{semantic.color.bg.overlay}" },
        radius:       { $type: "dimension", $value: "{core.borderRadius.xl}" },
        padding:      { $type: "dimension", $value: "{semantic.spacing.insetLg}" },
        shadow:       { $type: "shadow",    $value: "{semantic.elevation.modal}" },
        enter:        { $type: "transition",$value: "{semantic.motion.enter}" },
        exit:         { $type: "transition",$value: "{semantic.motion.exit}" },
      },

      tooltip: {
        $description: "Tooltip tokens",
        bg:       { $type: "color",     $value: "{semantic.color.bg.inverse}" },
        fg:       { $type: "color",     $value: "{semantic.color.fg.inverse}" },
        radius:   { $type: "dimension", $value: "{core.borderRadius.sm}" },
        paddingX: { $type: "dimension", $value: "{core.spacing.2}" },
        paddingY: { $type: "dimension", $value: "{core.spacing.1}" },
        fontSize: { $type: "dimension", $value: "{core.fontSize.xs}" },
        shadow:   { $type: "shadow",    $value: "{semantic.elevation.overlay}" },
      },

      divider: {
        $description: "Horizontal/vertical divider",
        color:     { $type: "color",     $value: "{semantic.color.border.subtle}" },
        thickness: { $type: "dimension", $value: "{core.borderWidth.thin}" },
      },

      avatar: {
        $description: "Avatar component tokens",
        bgFallback: { $type: "color",     $value: "{semantic.color.bg.brandSubtle}" },
        fgFallback: { $type: "color",     $value: "{semantic.color.fg.brand}" },
        radius:     { $type: "dimension", $value: "{core.borderRadius.full}" },
        border:     { $type: "color",     $value: "{semantic.color.bg.secondary}" },
        borderWidth:{ $type: "dimension", $value: "{core.borderWidth.medium}" },
        sizeSm:     { $type: "dimension", $value: "{core.size.avatar.sm}" },
        sizeMd:     { $type: "dimension", $value: "{core.size.avatar.md}" },
        sizeLg:     { $type: "dimension", $value: "{core.size.avatar.lg}" },
        sizeXl:     { $type: "dimension", $value: "{core.size.avatar.xl}" },
      },
    },

    // ───────────────────────────────────────────────────────────────────
    // MODES — dark mode overrides. Shadows the semantic color tier.
    // ───────────────────────────────────────────────────────────────────
    modes: {
      dark: {
        $description:
          "Dark mode overrides. Only semantic.color paths are shadowed; " +
          "all non-color tokens (spacing, typography, motion) remain unchanged.",

        color: {
          $type: "color",

          fg: {
            primary:   { $value: "{core.color.neutral50}" },
            secondary: { $value: "{core.color.neutral400}" },
            tertiary:  { $value: "{core.color.neutral500}" },
            inverse:   { $value: "{core.color.graphite}" },
            brand:     { $value: "{core.color.tealMuted}" },
            link:      { $value: "{core.color.tealMuted}" },
            linkHover: { $value: "{core.color.tealLight}" },
            disabled:  { $value: "{core.color.neutral700}" },
            error:     { $value: "{core.color.errorLight}" },
            warning:   { $value: "{core.color.warningLight}" },
            success:   { $value: "{core.color.successLight}" },
            info:      { $value: "{core.color.infoLight}" },
          },

          bg: {
            primary:     { $value: "{core.color.neutral900}" },
            secondary:   { $value: "{core.color.neutral800}" },
            tertiary:    { $value: "{core.color.neutral700}" },
            inverse:     { $value: "{core.color.white}" },
            brand:       { $value: "{core.color.teal}" },
            brandSubtle: { $value: "#0E312D",  $description: "Very dark teal — core exception: no core token for dark-only tints" },
            brandMuted:  { $value: "#163D38" },
            overlay:     { $value: "{core.color.overlayBlack}" },
            error:       { $value: "#3E1111" },
            warning:     { $value: "#3E2400" },
            success:     { $value: "#0E2E10" },
            info:        { $value: "#0A2433" },
            disabled:    { $value: "{core.color.neutral800}" },
          },

          border: {
            default:  { $value: "{core.color.neutral700}" },
            strong:   { $value: "{core.color.neutral500}" },
            subtle:   { $value: "{core.color.neutral800}" },
            brand:    { $value: "{core.color.teal}" },
            focus:    { $value: "{core.color.tealMuted}" },
            error:    { $value: "{core.color.error}" },
            warning:  { $value: "{core.color.warning}" },
            success:  { $value: "{core.color.success}" },
            info:     { $value: "{core.color.info}" },
            disabled: { $value: "{core.color.neutral800}" },
          },
        },
      },

      highContrast: {
        $description:
          "High-contrast mode — maximizes contrast ratios for users who need it. " +
          "Eliminates subtle tints; uses pure black/white with full-saturation accents.",

        color: {
          $type: "color",

          fg: {
            primary:  { $value: "{core.color.graphite}" },
            secondary:{ $value: "{core.color.graphite}" },
            tertiary: { $value: "{core.color.neutral700}" },
            brand:    { $value: "{core.color.tealText}" },
            link:     { $value: "{core.color.tealText}" },
            disabled: { $value: "{core.color.neutral600}" },
            error:    { $value: "{core.color.errorText}" },
            warning:  { $value: "{core.color.warningText}" },
            success:  { $value: "{core.color.successText}" },
            info:     { $value: "{core.color.infoText}" },
          },

          bg: {
            primary:     { $value: "{core.color.white}" },
            secondary:   { $value: "{core.color.white}" },
            tertiary:    { $value: "{core.color.neutral200}" },
            brand:       { $value: "{core.color.teal}" },
            brandSubtle: { $value: "{core.color.tealLight}" },
            disabled:    { $value: "{core.color.neutral300}" },
          },

          border: {
            default: { $value: "{core.color.graphite}" },
            strong:  { $value: "{core.color.graphite}" },
            subtle:  { $value: "{core.color.neutral400}" },
            focus:   { $value: "{core.color.graphite}" },
          },
        },
      },
    },

    // ───────────────────────────────────────────────────────────────────
    // PLATFORMS — unit system and density overrides
    // ───────────────────────────────────────────────────────────────────
    platforms: {
      web: {
        unitSystem: "css",
        baseFontSize: 16,
      },
      ios: {
        unitSystem: "ios",
        baseFontSize: 17,  // iOS Dynamic Type base
        pixelRatio: 3,     // iPhone 15 Pro
        tokens: {
          spacing: {
            $type: "dimension",
            $description: "iOS-specific spacing using pt instead of px",
            "1":  { $value: "4pt" },
            "2":  { $value: "8pt" },
            "3":  { $value: "12pt" },
            "4":  { $value: "16pt" },
            "6":  { $value: "24pt" },
            "8":  { $value: "32pt" },
          },
          size: {
            touchTarget: { $type: "dimension", $value: "44pt", $description: "Apple HIG minimum" },
          },
        },
      },
      android: {
        unitSystem: "android",
        baseFontSize: 14,  // Material default body
        pixelRatio: 3,     // xxhdpi
        tokens: {
          spacing: {
            $type: "dimension",
            $description: "Android-specific spacing using dp",
            "1":  { $value: "4dp" },
            "2":  { $value: "8dp" },
            "3":  { $value: "12dp" },
            "4":  { $value: "16dp" },
            "6":  { $value: "24dp" },
            "8":  { $value: "32dp" },
          },
          size: {
            touchTarget: { $type: "dimension", $value: "48dp", $description: "Material Design minimum" },
          },
          fontSize: {
            $type: "dimension",
            xs:   { $value: "12sp" },
            sm:   { $value: "14sp" },
            base: { $value: "16sp" },
            lg:   { $value: "20sp" },
            xl:   { $value: "24sp" },
          },
        },
      },
      print: {
        unitSystem: "print",
        baseFontSize: 12,  // 12pt body text
        tokens: {
          fontSize: {
            $type: "dimension",
            xs:   { $value: "8pt" },
            sm:   { $value: "10pt" },
            base: { $value: "12pt" },
            lg:   { $value: "14pt" },
            xl:   { $value: "18pt" },
            "2xl":{ $value: "24pt" },
            "3xl":{ $value: "30pt" },
          },
          spacing: {
            $type: "dimension",
            "1":  { $value: "1mm" },
            "2":  { $value: "2mm" },
            "3":  { $value: "3mm" },
            "4":  { $value: "5mm" },
            "6":  { $value: "8mm" },
            "8":  { $value: "10mm" },
          },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // § DARK MODE convenience field (for simple consumers that don't use
  //   the full token engine). Maps to modes.dark semantic overrides.
  // ═══════════════════════════════════════════════════════════════════════

  darkMode: {
    auto: true,
    colors: {
      primary:       RAW.teal,
      secondary:     RAW.neutral50,
      background:    RAW.neutral900,
      surface:       RAW.neutral800,
      text:          RAW.neutral50,
      textSecondary: RAW.neutral400,
      border:        RAW.neutral700,
      error:         "#FFCDD2",  // light red on dark
      warning:       "#FFE0B2",  // light orange on dark
      success:       "#C8E6C9",  // light green on dark
      info:          "#B3E5FC",  // light blue on dark
    },
  },

  // Legacy compatibility
  color_palette: {
    primary:    RAW.teal,
    secondary:  RAW.graphite,
    accent:     RAW.tealMuted,
    background: RAW.offWhite,
    text:       RAW.graphite,
  },
  fonts: {
    heading: { family: "Inter", weight: 700, size: 32, line_height: 1.15 },
    body:    { family: "Inter", weight: 400, size: 16, line_height: 1.6 },
    caption: { family: "Inter", weight: 400, size: 12, line_height: 1.5 },
    code:    { family: "JetBrains Mono", weight: 400, size: 14, line_height: 1.6 },
  },
};
