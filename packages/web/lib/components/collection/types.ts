/**
 * Collection / Magazine Issue Types
 *
 * Relocated from magazine/types.ts — collection components depend on these.
 * Magazine feature removed; types retained for the collection bookshelf feature.
 */

// Component types used by layout interpreter
export type ComponentType =
  | "hero-image"
  | "text-block"
  | "item-card"
  | "divider"
  | "quote"
  | "grid-gallery";

// Animation presets for GSAP timeline
export type AnimationType =
  | "fade-up"
  | "scale-in"
  | "slide-left"
  | "parallax"
  | "none";

/**
 * A single layout component with percentage-based positioning.
 * Coordinates are relative to viewport (0-100).
 */
export interface LayoutComponent {
  type: ComponentType;
  x: number; // percentage 0-100 from left
  y: number; // percentage 0-100 from top
  w: number; // percentage width
  h: number; // percentage height
  animation_type: AnimationType;
  animation_delay?: number; // seconds, for stagger timing
  data: Record<string, unknown>; // component-specific payload
}

/**
 * Root layout structure returned by magazine API.
 */
export interface LayoutJSON {
  version: 1;
  viewport: "mobile" | "desktop";
  components: LayoutComponent[];
}

/**
 * Theme palette for per-issue color customization.
 */
export interface ThemePalette {
  primary: string; // e.g. "#050505"
  accent: string; // e.g. "#eafd67"
  bg: string; // background color
  text: string; // text color
}

/**
 * A complete magazine issue with layout and theme data.
 */
export interface MagazineIssue {
  id: string;
  issue_number: number;
  title: string;
  subtitle?: string;
  cover_image_url: string;
  layout_json: LayoutJSON;
  theme_palette: ThemePalette;
  generated_at: string; // ISO date
  theme_keywords?: string[]; // For collection grouping
}

/** Personal issue generation status */
export type PersonalStatus =
  | "idle"
  | "checking"
  | "generating"
  | "ready"
  | "error";
