/**
 * Design Tokens
 *
 * Single source of truth for design values.
 * Based on decoded.pen and design system documentation.
 *
 * @see docs/design-system/decoded.pen
 * @see docs/design-system/typography.md
 * @see docs/design-system/spacing.md
 */

/**
 * Typography System
 */
export const typography = {
  fonts: {
    serif: ["Playfair Display", "Georgia", "serif"],
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "Consolas", "monospace"],
  },
  sizes: {
    // Hero and display sizes (from decoded.pen)
    hero: {
      fontSize: "64px",
      lineHeight: "1.1",
      fontWeight: "700",
      fontFamily: "serif",
      letterSpacing: "-0.025em",
    },
    h1: {
      fontSize: "48px",
      lineHeight: "1.15",
      fontWeight: "600",
      fontFamily: "serif",
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "36px",
      lineHeight: "1.2",
      fontWeight: "600",
      fontFamily: "serif",
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "28px",
      lineHeight: "1.25",
      fontWeight: "600",
      fontFamily: "serif",
      letterSpacing: "-0.02em",
    },
    h4: {
      fontSize: "24px",
      lineHeight: "1.3",
      fontWeight: "600",
      fontFamily: "serif",
      letterSpacing: "-0.02em",
    },
    // Body text styles
    body: {
      fontSize: "16px",
      lineHeight: "1.5",
      fontWeight: "400",
      fontFamily: "sans",
      letterSpacing: "0",
    },
    small: {
      fontSize: "14px",
      lineHeight: "1.5",
      fontWeight: "400",
      fontFamily: "sans",
      letterSpacing: "0",
    },
    caption: {
      fontSize: "12px",
      lineHeight: "1.4",
      fontWeight: "400",
      fontFamily: "sans",
      letterSpacing: "0",
    },
  },
} as const;

/**
 * Responsive Typography Scales
 *
 * @see docs/design-system/typography.md - Responsive Sizes section
 */
export const responsiveTypography = {
  pageTitle: {
    mobile: "text-2xl", // 24px
    tablet: "text-3xl", // 30px
    desktop: "text-4xl", // 36px
  },
  sectionTitle: {
    mobile: "text-xl", // 20px
    tablet: "text-2xl", // 24px
    desktop: "text-2xl", // 24px
  },
  cardTitle: {
    mobile: "text-base", // 16px
    tablet: "text-lg", // 18px
    desktop: "text-lg", // 18px
  },
  body: {
    mobile: "text-sm", // 14px
    tablet: "text-base", // 16px
    desktop: "text-base", // 16px
  },
  caption: {
    mobile: "text-xs", // 12px
    tablet: "text-xs", // 12px
    desktop: "text-sm", // 14px
  },
} as const;

/**
 * Semantic Color Tokens
 *
 * Reference CSS variables from globals.css
 * Light/dark mode handled by CSS custom properties
 */
export const colors = {
  // Base colors
  background: "var(--background)",
  foreground: "var(--foreground)",

  // Component colors
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  popover: "var(--popover)",
  popoverForeground: "var(--popover-foreground)",

  // Semantic colors
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  secondaryForeground: "var(--secondary-foreground)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  destructive: "var(--destructive)",
  destructiveForeground: "var(--destructive-foreground)",

  // UI colors
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",

  // Chart colors
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",

  // Sidebar colors
  sidebar: "var(--sidebar)",
  sidebarForeground: "var(--sidebar-foreground)",
  sidebarPrimary: "var(--sidebar-primary)",
  sidebarPrimaryForeground: "var(--sidebar-primary-foreground)",
  sidebarAccent: "var(--sidebar-accent)",
  sidebarAccentForeground: "var(--sidebar-accent-foreground)",
  sidebarBorder: "var(--sidebar-border)",
  sidebarRing: "var(--sidebar-ring)",

  // Main page specific colors (from globals.css)
  mainBg: "var(--main-bg)",
  mainCtaBg: "var(--main-cta-bg)",
  mainAccent: "var(--main-accent)",
  mainTextWhite: "var(--main-text-white)",
  mainTextGray: "var(--main-text-gray)",
} as const;

/**
 * Spacing Scale
 *
 * Based on 4px base unit
 * @see docs/design-system/spacing.md
 */
export const spacing = {
  0: "0px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
} as const;

/**
 * Breakpoints
 *
 * Standard Tailwind breakpoints
 */
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/**
 * Shadow Tokens
 *
 * @see globals.css - CSS custom properties
 */
export const shadows = {
  "2xs": "var(--shadow-2xs)",
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  "2xl": "var(--shadow-2xl)",
} as const;

/**
 * Border Radius
 *
 * @see globals.css - --radius variable
 */
export const borderRadius = {
  none: "0",
  sm: "calc(var(--radius) - 4px)",
  md: "var(--radius)",
  lg: "calc(var(--radius) + 4px)",
  xl: "calc(var(--radius) + 8px)",
  "2xl": "calc(var(--radius) + 12px)",
  full: "9999px",
  // Main page specific
  main: "var(--main-border-radius)",
} as const;

/**
 * Z-Index Scale
 *
 * @see docs/design-system/spacing.md - Z-Index Scale section
 */
export const zIndex = {
  base: 0,
  floating: 10,
  dropdown: 20,
  header: 40,
  sidebar: 40,
  modalBackdrop: 50,
  modal: 60,
  toast: 70,
  tooltip: 100,
} as const;

/**
 * Type exports for TypeScript consumers
 */
export type TypographySize = keyof typeof typography.sizes;
export type ResponsiveTypography = keyof typeof responsiveTypography;
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type BreakpointToken = keyof typeof breakpoints;
export type ShadowToken = keyof typeof shadows;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ZIndexToken = keyof typeof zIndex;
