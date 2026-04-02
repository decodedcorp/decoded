/**
 * Hero Section — Scatter Layout Engine
 *
 * 5-depth zigzag grid for the hero viewport (70-85vh).
 * Deterministic positioning via seeded PRNG (djb2). No Math.random().
 *
 * Depth layers:
 *  - macro:      최전경, 화면 가장자리, 크고 블러, 상호작용 불가
 *  - foreground:  메인 인터랙티브 레이어 (큰 카드)
 *  - midground:   중간 카드들
 *  - background:  작고 느리게 움직이는 배경
 *  - micro:       아주 작은 썸네일, 별가루 느낌
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

type Depth = "macro" | "foreground" | "midground" | "background" | "micro";

const CARD_SLOTS: {
  left: number;
  top: number;
  depth: Depth;
  baseRotate: number;
  aspectRatio: string;
}[] = [
  // ── Macro: 최전경 가장자리 (인터랙션 불가, 장식) ──
  { left: -8, top: -5, depth: "macro", baseRotate: -15, aspectRatio: "3 / 4" },
  { left: 90, top: 10, depth: "macro", baseRotate: 12, aspectRatio: "4 / 5" },
  { left: -5, top: 65, depth: "macro", baseRotate: 18, aspectRatio: "3 / 4" },
  { left: 92, top: 60, depth: "macro", baseRotate: -10, aspectRatio: "4 / 5" },
  { left: 40, top: -8, depth: "macro", baseRotate: 8, aspectRatio: "3 / 4" },
  { left: -6, top: 30, depth: "macro", baseRotate: -12, aspectRatio: "4 / 5" },
  { left: 94, top: 35, depth: "macro", baseRotate: 14, aspectRatio: "3 / 4" },
  { left: 45, top: 80, depth: "macro", baseRotate: -8, aspectRatio: "4 / 5" },

  // ── Foreground: 메인 인터랙티브 ──
  {
    left: 8,
    top: 8,
    depth: "foreground",
    baseRotate: -3,
    aspectRatio: "3 / 4",
  },
  {
    left: 55,
    top: 5,
    depth: "foreground",
    baseRotate: 3,
    aspectRatio: "3 / 4",
  },
  {
    left: 30,
    top: 30,
    depth: "foreground",
    baseRotate: -2,
    aspectRatio: "3 / 4",
  },
  {
    left: 70,
    top: 35,
    depth: "foreground",
    baseRotate: 4,
    aspectRatio: "3 / 4",
  },
  {
    left: 15,
    top: 55,
    depth: "foreground",
    baseRotate: 2,
    aspectRatio: "3 / 4",
  },
  {
    left: 60,
    top: 58,
    depth: "foreground",
    baseRotate: -5,
    aspectRatio: "3 / 4",
  },
  {
    left: 42,
    top: 50,
    depth: "foreground",
    baseRotate: 3,
    aspectRatio: "3 / 4",
  },
  {
    left: 80,
    top: 15,
    depth: "foreground",
    baseRotate: -4,
    aspectRatio: "3 / 4",
  },

  // ── Midground: 중간 크기 ──
  { left: 5, top: 20, depth: "midground", baseRotate: 5, aspectRatio: "4 / 5" },
  {
    left: 75,
    top: 15,
    depth: "midground",
    baseRotate: -6,
    aspectRatio: "4 / 5",
  },
  {
    left: 40,
    top: 18,
    depth: "midground",
    baseRotate: 4,
    aspectRatio: "3 / 4",
  },
  {
    left: 85,
    top: 42,
    depth: "midground",
    baseRotate: -8,
    aspectRatio: "4 / 5",
  },
  {
    left: -2,
    top: 40,
    depth: "midground",
    baseRotate: 7,
    aspectRatio: "3 / 4",
  },
  {
    left: 50,
    top: 45,
    depth: "midground",
    baseRotate: -3,
    aspectRatio: "4 / 5",
  },
  {
    left: 25,
    top: 70,
    depth: "midground",
    baseRotate: 6,
    aspectRatio: "3 / 4",
  },
  {
    left: 72,
    top: 72,
    depth: "midground",
    baseRotate: -4,
    aspectRatio: "4 / 5",
  },
  {
    left: 18,
    top: 35,
    depth: "midground",
    baseRotate: 3,
    aspectRatio: "3 / 4",
  },
  {
    left: 62,
    top: 22,
    depth: "midground",
    baseRotate: -5,
    aspectRatio: "4 / 5",
  },
  {
    left: 45,
    top: 65,
    depth: "midground",
    baseRotate: 7,
    aspectRatio: "3 / 4",
  },
  {
    left: 88,
    top: 70,
    depth: "midground",
    baseRotate: -6,
    aspectRatio: "4 / 5",
  },

  // ── Background: 작고 느림 ──
  {
    left: 18,
    top: 5,
    depth: "background",
    baseRotate: 8,
    aspectRatio: "1 / 1",
  },
  {
    left: 82,
    top: 8,
    depth: "background",
    baseRotate: -10,
    aspectRatio: "4 / 5",
  },
  {
    left: 45,
    top: 12,
    depth: "background",
    baseRotate: -5,
    aspectRatio: "1 / 1",
  },
  {
    left: 65,
    top: 25,
    depth: "background",
    baseRotate: 12,
    aspectRatio: "4 / 5",
  },
  {
    left: 10,
    top: 45,
    depth: "background",
    baseRotate: -14,
    aspectRatio: "1 / 1",
  },
  {
    left: 88,
    top: 30,
    depth: "background",
    baseRotate: 6,
    aspectRatio: "4 / 5",
  },
  {
    left: 38,
    top: 60,
    depth: "background",
    baseRotate: -8,
    aspectRatio: "1 / 1",
  },
  {
    left: 78,
    top: 55,
    depth: "background",
    baseRotate: 10,
    aspectRatio: "4 / 5",
  },
  {
    left: 5,
    top: 75,
    depth: "background",
    baseRotate: -6,
    aspectRatio: "3 / 4",
  },
  {
    left: 58,
    top: 78,
    depth: "background",
    baseRotate: 8,
    aspectRatio: "1 / 1",
  },
  {
    left: 28,
    top: 10,
    depth: "background",
    baseRotate: -7,
    aspectRatio: "4 / 5",
  },
  {
    left: 72,
    top: 48,
    depth: "background",
    baseRotate: 5,
    aspectRatio: "1 / 1",
  },
  {
    left: 15,
    top: 82,
    depth: "background",
    baseRotate: -10,
    aspectRatio: "4 / 5",
  },
  {
    left: 85,
    top: 85,
    depth: "background",
    baseRotate: 12,
    aspectRatio: "1 / 1",
  },

  // ── Micro: 별가루 수준 ──
  { left: 12, top: 15, depth: "micro", baseRotate: 15, aspectRatio: "1 / 1" },
  { left: 78, top: 5, depth: "micro", baseRotate: -18, aspectRatio: "1 / 1" },
  { left: 48, top: 32, depth: "micro", baseRotate: 12, aspectRatio: "1 / 1" },
  { left: 90, top: 50, depth: "micro", baseRotate: -20, aspectRatio: "1 / 1" },
  { left: -3, top: 55, depth: "micro", baseRotate: 16, aspectRatio: "1 / 1" },
  { left: 35, top: 75, depth: "micro", baseRotate: -12, aspectRatio: "1 / 1" },
  { left: 65, top: 68, depth: "micro", baseRotate: 14, aspectRatio: "1 / 1" },
  { left: 22, top: 85, depth: "micro", baseRotate: -8, aspectRatio: "1 / 1" },
  { left: 85, top: 80, depth: "micro", baseRotate: 10, aspectRatio: "1 / 1" },
  { left: 50, top: 88, depth: "micro", baseRotate: -15, aspectRatio: "1 / 1" },
  { left: 30, top: 2, depth: "micro", baseRotate: 10, aspectRatio: "1 / 1" },
  { left: 68, top: 42, depth: "micro", baseRotate: -14, aspectRatio: "1 / 1" },
  { left: 8, top: 60, depth: "micro", baseRotate: 18, aspectRatio: "1 / 1" },
  { left: 55, top: 52, depth: "micro", baseRotate: -10, aspectRatio: "1 / 1" },
  { left: 42, top: 90, depth: "micro", baseRotate: 8, aspectRatio: "1 / 1" },
  { left: 75, top: 88, depth: "micro", baseRotate: -16, aspectRatio: "1 / 1" },
];

/** Depth → visual properties */
const DEPTH_CONFIG: Record<
  Depth,
  {
    width: string;
    zBase: number;
    interactive: boolean;
    cssFilter?: string;
    opacity: number;
    floatAmplitude: number;
    floatSpeed: number;
  }
> = {
  macro: {
    width: "clamp(160px, 20vw, 300px)",
    zBase: 1,
    interactive: false,
    cssFilter: "blur(4px) brightness(0.5)",
    opacity: 0.35,
    floatAmplitude: 3,
    floatSpeed: 6,
  },
  foreground: {
    width: "clamp(100px, 13vw, 200px)",
    zBase: 20,
    interactive: true,
    opacity: 1,
    floatAmplitude: 8,
    floatSpeed: 3.5,
  },
  midground: {
    width: "clamp(70px, 9vw, 140px)",
    zBase: 12,
    interactive: true,
    opacity: 0.9,
    floatAmplitude: 6,
    floatSpeed: 4,
  },
  background: {
    width: "clamp(45px, 6vw, 85px)",
    zBase: 5,
    interactive: false,
    cssFilter: "brightness(0.7)",
    opacity: 0.5,
    floatAmplitude: 4,
    floatSpeed: 5,
  },
  micro: {
    width: "clamp(30px, 3.5vw, 55px)",
    zBase: 2,
    interactive: false,
    cssFilter: "brightness(0.5) saturate(0.6)",
    opacity: 0.35,
    floatAmplitude: 2,
    floatSpeed: 7,
  },
};

export interface ScatterResult extends ScatterPosition {
  depth: Depth;
  interactive: boolean;
  cssFilter?: string;
  initialOpacity: number;
  floatAmplitude: number;
  floatSpeed: number;
}

export function computeScatterPosition(
  id: string,
  index: number
): ScatterResult {
  const slotIdx = index % CARD_SLOTS.length;
  const wrap = Math.floor(index / CARD_SLOTS.length);
  const slot = CARD_SLOTS[slotIdx];
  const config = DEPTH_CONFIG[slot.depth];

  const jx = (seededRandom(id, 10) - 0.5) * 6;
  const jy = (seededRandom(id, 11) - 0.5) * 5;
  const left = slot.left + jx + wrap * 3;
  const top = slot.top + jy + wrap * 4;

  const rotate = slot.baseRotate + (seededRandom(id, 3) - 0.5) * 8;
  const zIndex = config.zBase + (index % 4);

  // Map depth to legacy tier for backward compat
  const tier: "hero" | "medium" | "small" =
    slot.depth === "foreground"
      ? "hero"
      : slot.depth === "midground"
        ? "medium"
        : "small";

  return {
    top: `${top.toFixed(1)}%`,
    left: `${left.toFixed(1)}%`,
    width: config.width,
    rotate: parseFloat(rotate.toFixed(1)),
    zIndex,
    tier,
    aspectRatio: slot.aspectRatio,
    depth: slot.depth,
    interactive: config.interactive,
    cssFilter: config.cssFilter,
    initialOpacity: config.opacity,
    floatAmplitude: config.floatAmplitude,
    floatSpeed: config.floatSpeed,
  };
}
