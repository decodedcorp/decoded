/**
 * Main Page D — Sticker Canvas Layout Types
 *
 * SINGLE SOURCE OF TRUTH for all main-d types.
 * Do NOT import ScatterPosition from scatter.ts — it's defined here.
 */

/** A post displayed as a polaroid sticker card on the canvas */
export interface MainDPost {
  id: string;
  imageUrl: string;
  artistName: string | null;
}

/**
 * Deterministic scatter position for a polaroid card on the canvas.
 * All values are CSS percentage strings (top/left) or CSS expressions (width).
 * Computed by djb2 seeded PRNG — identical on SSR and client.
 */
export interface ScatterPosition {
  /** CSS percentage value, e.g. "12%" */
  top: string;
  /** CSS percentage value, e.g. "34%" */
  left: string;
  /** CSS clamp() expression, e.g. "clamp(85px, 15vw, 187px)" */
  width: string;
  /** Rotation in degrees, range -25 to +25 */
  rotate: number;
  /** z-index value, range 1-30 */
  zIndex: number;
  /**
   * Card tier — determines size and visual weight.
   * "hero"    — 1 or 2 dominant cards, large size
   * "medium"  — standard cards
   * "small"   — small accent cards
   */
  tier: "hero" | "medium" | "small";
  /** CSS aspect-ratio value, e.g. "3 / 4" or "4 / 3" */
  aspectRatio: string;
}
