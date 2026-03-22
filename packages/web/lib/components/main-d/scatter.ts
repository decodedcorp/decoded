/**
 * Main Page D — STICKER BOMB OVERFLOW Layout Engine
 *
 * Slots ordered in ZIGZAG (left→right→left→right) so partial fills
 * are always balanced. Even with 20 cards, both sides get coverage.
 *
 * Pure functions. No Math.random(). Deterministic.
 */

import type { ScatterPosition } from "./types";
export type { ScatterPosition } from "./types";

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

function seededRandom(seed: string, salt: number): number {
  return (djb2(seed + "~" + String(salt)) % 10000) / 10000;
}

/**
 * Slots in ZIGZAG order: left side → right side → left → right...
 * This guarantees balanced coverage regardless of how many cards load.
 *
 * Row 1: top band (-14 to -8%)
 * Row 2: upper (6 to 14%)
 * Row 3: middle (30 to 38%)
 * Row 4: lower (54 to 60%)
 * Row 5: bottom (76 to 82%)
 */
const CARD_SLOTS: {
  left: number;
  top: number;
  tier: "hero" | "medium" | "small";
  baseRotate: number;
  aspectRatio: string;
}[] = [
  // Zigzag L→R. Right slots pushed to 82-86% (small cards: 8vw ≈ 110px, so 86%+110px ≈ 92%)

  // ── Row 1: top band ──
  { left: 8, top: -14, tier: "medium", baseRotate: 5, aspectRatio: "4 / 5" },
  { left: 82, top: -10, tier: "small", baseRotate: 12, aspectRatio: "3 / 4" },
  { left: 34, top: -12, tier: "medium", baseRotate: -3, aspectRatio: "2 / 3" },
  { left: 60, top: -10, tier: "medium", baseRotate: 6, aspectRatio: "3 / 4" },
  { left: -3, top: -12, tier: "small", baseRotate: -16, aspectRatio: "3 / 4" },
  { left: 72, top: -12, tier: "medium", baseRotate: -5, aspectRatio: "4 / 5" },
  { left: 22, top: -10, tier: "small", baseRotate: -6, aspectRatio: "3 / 4" },
  { left: 48, top: -14, tier: "medium", baseRotate: 8, aspectRatio: "4 / 5" },

  // ── Row 2: upper ──
  { left: 10, top: 8, tier: "hero", baseRotate: 2, aspectRatio: "3 / 4" },
  { left: 72, top: 10, tier: "hero", baseRotate: -3, aspectRatio: "3 / 4" },
  { left: 35, top: 10, tier: "medium", baseRotate: 7, aspectRatio: "4 / 5" },
  { left: 84, top: 12, tier: "small", baseRotate: -7, aspectRatio: "4 / 5" },
  { left: -1, top: 10, tier: "small", baseRotate: -8, aspectRatio: "3 / 4" },
  { left: 60, top: 14, tier: "medium", baseRotate: -10, aspectRatio: "4 / 5" },
  { left: 24, top: 12, tier: "medium", baseRotate: 4, aspectRatio: "4 / 5" },
  { left: 48, top: 8, tier: "hero", baseRotate: -3, aspectRatio: "3 / 4" },

  // ── Row 3: middle ──
  { left: 9, top: 36, tier: "small", baseRotate: -12, aspectRatio: "2 / 3" },
  { left: 72, top: 34, tier: "medium", baseRotate: 10, aspectRatio: "2 / 3" },
  { left: 33, top: 32, tier: "small", baseRotate: -8, aspectRatio: "1 / 1" },
  { left: 84, top: 36, tier: "small", baseRotate: 16, aspectRatio: "1 / 1" },
  { left: -2, top: 32, tier: "small", baseRotate: 14, aspectRatio: "1 / 1" },
  { left: 60, top: 36, tier: "medium", baseRotate: 5, aspectRatio: "3 / 4" },
  { left: 23, top: 34, tier: "medium", baseRotate: -8, aspectRatio: "2 / 3" },
  { left: 48, top: 34, tier: "small", baseRotate: 4, aspectRatio: "2 / 3" },

  // ── Row 4: lower ──
  { left: 11, top: 58, tier: "medium", baseRotate: 8, aspectRatio: "3 / 4" },
  { left: 72, top: 56, tier: "medium", baseRotate: -12, aspectRatio: "3 / 4" },
  { left: 36, top: 54, tier: "medium", baseRotate: 6, aspectRatio: "3 / 4" },
  { left: 84, top: 58, tier: "small", baseRotate: -4, aspectRatio: "3 / 4" },
  { left: -4, top: 54, tier: "small", baseRotate: -6, aspectRatio: "4 / 5" },
  { left: 60, top: 58, tier: "medium", baseRotate: -8, aspectRatio: "2 / 3" },
  { left: 21, top: 56, tier: "small", baseRotate: 10, aspectRatio: "4 / 5" },
  { left: 48, top: 56, tier: "medium", baseRotate: -5, aspectRatio: "3 / 4" },

  // ── Row 5: bottom ──
  { left: 7, top: 80, tier: "small", baseRotate: -10, aspectRatio: "1 / 1" },
  { left: 72, top: 78, tier: "medium", baseRotate: 6, aspectRatio: "3 / 4" },
  { left: 32, top: 76, tier: "small", baseRotate: -14, aspectRatio: "4 / 5" },
  { left: 84, top: 80, tier: "small", baseRotate: 18, aspectRatio: "4 / 5" },
  { left: -1, top: 76, tier: "small", baseRotate: 12, aspectRatio: "3 / 4" },
  { left: 60, top: 80, tier: "medium", baseRotate: 14, aspectRatio: "4 / 5" },
  { left: 25, top: 78, tier: "medium", baseRotate: -4, aspectRatio: "3 / 4" },
  { left: 48, top: 78, tier: "small", baseRotate: 12, aspectRatio: "1 / 1" },
];

export function computeScatterPosition(
  id: string,
  index: number,
  total: number = 40
): ScatterPosition {
  const slotIdx = index % CARD_SLOTS.length;
  const wrap = Math.floor(index / CARD_SLOTS.length);
  const slot = CARD_SLOTS[slotIdx];

  const jx = (seededRandom(id, 10) - 0.5) * 5;
  const jy = (seededRandom(id, 11) - 0.5) * 4;
  const left = slot.left + jx + wrap * 3;
  const top = slot.top + jy + wrap * 4;

  const rotate = slot.baseRotate + (seededRandom(id, 3) - 0.5) * 8;

  let zIndex: number;
  if (slot.tier === "hero") zIndex = 18 + (index % 4);
  else if (slot.tier === "medium") zIndex = 8 + (index % 8);
  else zIndex = 2 + (index % 5);

  let width: string;
  if (slot.tier === "hero") {
    width = "clamp(150px, 20vw, 280px)";
  } else if (slot.tier === "medium") {
    width = "clamp(90px, 12vw, 180px)";
  } else {
    width = "clamp(60px, 8vw, 110px)";
  }

  return {
    top: `${top.toFixed(1)}%`,
    left: `${left.toFixed(1)}%`,
    width,
    rotate: parseFloat(rotate.toFixed(1)),
    zIndex,
    tier: slot.tier,
    aspectRatio: slot.aspectRatio,
  };
}
