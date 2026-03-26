/**
 * Hero Section — Scatter Layout Engine
 *
 * 5-row zigzag grid optimized for the hero viewport (70-85vh).
 * Deterministic positioning via seeded PRNG (djb2). No Math.random().
 * Ported from decoded-app/main-d/scatter.ts with hero-specific sizing.
 */

import type { ScatterPosition } from "./types";

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
 * 30 slots in zigzag (L→R→L→R) across 5 rows.
 * Balanced coverage even with partial fills.
 */
const CARD_SLOTS: {
  left: number;
  top: number;
  tier: "hero" | "medium" | "small";
  baseRotate: number;
  aspectRatio: string;
}[] = [
  // ── Row 1: top band (-2 to 10%) ──
  { left: 5, top: 0, tier: "medium", baseRotate: -3, aspectRatio: "3 / 4" },
  { left: 70, top: 2, tier: "small", baseRotate: 6, aspectRatio: "4 / 5" },
  { left: 32, top: 4, tier: "hero", baseRotate: 2, aspectRatio: "3 / 4" },
  { left: 85, top: 0, tier: "small", baseRotate: -8, aspectRatio: "3 / 4" },
  { left: -3, top: 6, tier: "small", baseRotate: 10, aspectRatio: "4 / 5" },
  { left: 54, top: 2, tier: "medium", baseRotate: -4, aspectRatio: "4 / 5" },

  // ── Row 2: upper band (18-28%) ──
  { left: 8, top: 20, tier: "hero", baseRotate: 3, aspectRatio: "3 / 4" },
  { left: 74, top: 22, tier: "medium", baseRotate: -5, aspectRatio: "3 / 4" },
  { left: 38, top: 24, tier: "small", baseRotate: 7, aspectRatio: "1 / 1" },
  { left: 86, top: 20, tier: "small", baseRotate: 12, aspectRatio: "4 / 5" },
  { left: -2, top: 22, tier: "small", baseRotate: -6, aspectRatio: "3 / 4" },
  { left: 56, top: 18, tier: "hero", baseRotate: -3, aspectRatio: "3 / 4" },

  // ── Row 3: middle band (38-48%) ──
  { left: 10, top: 40, tier: "small", baseRotate: -8, aspectRatio: "4 / 5" },
  { left: 72, top: 38, tier: "medium", baseRotate: 5, aspectRatio: "3 / 4" },
  { left: 34, top: 42, tier: "medium", baseRotate: -3, aspectRatio: "4 / 5" },
  { left: 84, top: 44, tier: "small", baseRotate: -10, aspectRatio: "1 / 1" },
  { left: -4, top: 38, tier: "small", baseRotate: 14, aspectRatio: "3 / 4" },
  { left: 52, top: 40, tier: "small", baseRotate: 4, aspectRatio: "4 / 5" },

  // ── Row 4: lower band (56-66%) ──
  { left: 6, top: 58, tier: "medium", baseRotate: 5, aspectRatio: "3 / 4" },
  { left: 70, top: 56, tier: "hero", baseRotate: -6, aspectRatio: "3 / 4" },
  { left: 36, top: 60, tier: "small", baseRotate: -4, aspectRatio: "4 / 5" },
  { left: 86, top: 58, tier: "small", baseRotate: 8, aspectRatio: "3 / 4" },
  { left: -1, top: 56, tier: "small", baseRotate: -12, aspectRatio: "4 / 5" },
  { left: 54, top: 62, tier: "medium", baseRotate: 3, aspectRatio: "4 / 5" },

  // ── Row 5: bottom band (74-84%) ──
  { left: 8, top: 76, tier: "small", baseRotate: -6, aspectRatio: "1 / 1" },
  { left: 72, top: 74, tier: "medium", baseRotate: 8, aspectRatio: "3 / 4" },
  { left: 32, top: 78, tier: "small", baseRotate: -10, aspectRatio: "4 / 5" },
  { left: 84, top: 76, tier: "small", baseRotate: 16, aspectRatio: "4 / 5" },
  { left: -2, top: 74, tier: "small", baseRotate: 10, aspectRatio: "3 / 4" },
  { left: 52, top: 78, tier: "medium", baseRotate: -5, aspectRatio: "3 / 4" },
];

export function computeScatterPosition(
  id: string,
  index: number,
): ScatterPosition {
  const slotIdx = index % CARD_SLOTS.length;
  const wrap = Math.floor(index / CARD_SLOTS.length);
  const slot = CARD_SLOTS[slotIdx];

  const jx = (seededRandom(id, 10) - 0.5) * 6;
  const jy = (seededRandom(id, 11) - 0.5) * 5;
  const left = slot.left + jx + wrap * 3;
  const top = slot.top + jy + wrap * 4;

  const rotate = slot.baseRotate + (seededRandom(id, 3) - 0.5) * 8;

  let zIndex: number;
  if (slot.tier === "hero") zIndex = 16 + (index % 4);
  else if (slot.tier === "medium") zIndex = 8 + (index % 6);
  else zIndex = 2 + (index % 4);

  // Reduced sizes for denser layout
  let width: string;
  if (slot.tier === "hero") {
    width = "clamp(130px, 17vw, 260px)";
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
