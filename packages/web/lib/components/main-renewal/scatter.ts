/**
 * Hero Section — Scatter Layout Engine
 *
 * 3-row zigzag grid optimized for the hero viewport (70-85vh).
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
 * 18 slots in zigzag (L→R→L→R) across 3 rows.
 * Balanced coverage even with partial fills.
 */
const CARD_SLOTS: {
  left: number;
  top: number;
  tier: "hero" | "medium" | "small";
  baseRotate: number;
  aspectRatio: string;
}[] = [
  // ── Row 1: top band (4-18%) ──
  { left: 6, top: 4, tier: "hero", baseRotate: -3, aspectRatio: "3 / 4" },
  { left: 68, top: 6, tier: "medium", baseRotate: 5, aspectRatio: "4 / 5" },
  { left: 34, top: 8, tier: "medium", baseRotate: -2, aspectRatio: "3 / 4" },
  { left: 84, top: 4, tier: "small", baseRotate: 8, aspectRatio: "3 / 4" },
  { left: -2, top: 10, tier: "small", baseRotate: -10, aspectRatio: "4 / 5" },
  { left: 52, top: 5, tier: "hero", baseRotate: 3, aspectRatio: "3 / 4" },

  // ── Row 2: middle band (32-48%) ──
  { left: 10, top: 36, tier: "medium", baseRotate: 4, aspectRatio: "4 / 5" },
  { left: 72, top: 34, tier: "hero", baseRotate: -4, aspectRatio: "3 / 4" },
  { left: 38, top: 38, tier: "small", baseRotate: -6, aspectRatio: "1 / 1" },
  { left: 86, top: 40, tier: "small", baseRotate: 12, aspectRatio: "4 / 5" },
  { left: -4, top: 34, tier: "small", baseRotate: 8, aspectRatio: "3 / 4" },
  { left: 56, top: 36, tier: "medium", baseRotate: -5, aspectRatio: "4 / 5" },

  // ── Row 3: bottom band (62-78%) ──
  { left: 8, top: 66, tier: "medium", baseRotate: 6, aspectRatio: "3 / 4" },
  { left: 70, top: 64, tier: "medium", baseRotate: -8, aspectRatio: "3 / 4" },
  { left: 36, top: 68, tier: "small", baseRotate: -4, aspectRatio: "4 / 5" },
  { left: 84, top: 66, tier: "small", baseRotate: 14, aspectRatio: "1 / 1" },
  { left: -1, top: 64, tier: "small", baseRotate: -12, aspectRatio: "4 / 5" },
  { left: 52, top: 66, tier: "medium", baseRotate: 5, aspectRatio: "3 / 4" },
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

  let width: string;
  if (slot.tier === "hero") {
    width = "clamp(180px, 24vw, 340px)";
  } else if (slot.tier === "medium") {
    width = "clamp(120px, 16vw, 240px)";
  } else {
    width = "clamp(80px, 10vw, 150px)";
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
