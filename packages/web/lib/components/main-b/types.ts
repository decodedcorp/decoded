/**
 * Main Page B — "No Section" Editorial Layout Types
 */

import type { GridItemData, GridItemSpot } from "../main-renewal/types";

export type { GridItemData, GridItemSpot };

/** Predefined position for a scattered item on the canvas */
export interface ScatteredPosition {
  top: string; // CSS value e.g. "12%"
  left: string;
  width: string; // e.g. "180px" or "15vw"
  rotate: number; // degrees
  zIndex: number;
}

/** Circular nav item */
export interface CircularNavItem {
  label: string;
  href: string;
  angle: number; // degrees around the circle
}

/** Re-export MainBData from shared for convenience */
export type {
  MainBData,
  MainBPost,
  MainBItem,
  MainBRelatedPost,
} from "@decoded/shared";
