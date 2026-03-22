/**
 * Main Page D — Sticker Canvas
 * Barrel exports for types, scatter engine, and UI components.
 */

// Types (single source of truth)
export type { MainDPost, ScatterPosition } from "./types";

// Scatter engine
export { computeScatterPosition } from "./scatter";

// UI components (added in Plan 02)
export { MainPageD } from "./MainPageD";
export { PolaroidCard } from "./PolaroidCard";
export { BottomNav } from "./BottomNav";
export { NeonDoodles } from "./NeonDoodles";
export { StickerPeel } from "./StickerPeel";
export { DraggableDoodle } from "./DraggableDoodle";
