import type { Json, SolutionRow, SpotRow } from "@/lib/supabase/types";
import type { CSSProperties } from "react";

/**
 * Legacy ItemRow type for backward compatibility
 * This represents the old item structure, mapped from solutions
 */
export interface ItemRow {
  id: number;
  image_id: string;
  /** 스팟 ID – 솔루션 등록 링크용 (?spot=...) */
  spot_id?: string;
  /** 이미지 위 스팟 마커 번호 (1-based) – 표시용 */
  spot_index?: number;
  brand: string | null;
  brand_account_id?: string | null;
  product_name: string | null;
  cropped_image_path: string | null;
  price: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
  original_url?: string | null;
  thumbnail_url?: string | null;
  // Legacy fields (may be null)
  bboxes: Json | null;
  center: Json | null;
  scores: Json | null;
  ambiguity: boolean | null;
  citations: string[] | null;
  metadata: string[] | null;
  sam_prompt: string | null;
}

/**
 * Database item type (for backward compatibility)
 * @deprecated Use SolutionRow from types.ts instead
 */
export type DbItem = ItemRow;

/**
 * Normalized coordinate (0.0 ~ 1.0)
 * All coordinates should be normalized to this range for viewport-independent positioning
 */
export type NormalizedCoord = {
  x: number; // 0.0 (left) ~ 1.0 (right)
  y: number; // 0.0 (top) ~ 1.0 (bottom)
};

/**
 * Bounding box in normalized coordinates (0.0 ~ 1.0)
 */
export type BoundingBox = {
  top: number; // 0.0 ~ 1.0
  left: number; // 0.0 ~ 1.0
  width: number; // 0.0 ~ 1.0
  height: number; // 0.0 ~ 1.0
};

/**
 * Extended item type with normalized coordinates
 */
export type NormalizedItem = ItemRow & {
  normalizedBox: BoundingBox | null;
  normalizedCenter: NormalizedCoord | null;
};

/**
 * UI item type (for components)
 * This is the transformed version with camelCase field names and normalized coordinates
 */
export type UiItem = NormalizedItem & {
  imageUrl: string | null; // cropped_image_path mapped to camelCase
  bboxSource: "override" | "item" | "center"; // Source of the bounding box logic
};

/** SolutionListItem-like shape for solution-to-item conversion */
export interface SolutionLike {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  original_url?: string | null;
  affiliate_url?: string | null;
  metadata?: unknown;
}

/**
 * Convert solution + base item to UiItem for ShopGrid (Shop the Look)
 */
export function solutionToShopItem(
  solution: SolutionLike,
  baseItem: UiItem,
  _index?: number
): UiItem {
  const priceStr = (() => {
    const m = solution.metadata as
      | { price?: string | { amount?: string } }
      | undefined;
    if (!m?.price) return null;
    return typeof m.price === "string" ? m.price : (m.price?.amount ?? null);
  })();
  const citationUrl = solution.affiliate_url ?? solution.original_url ?? null;
  const idNum = parseInt(solution.id.replace(/-/g, "").slice(0, 8), 16) || 0;
  return {
    ...baseItem,
    id: idNum,
    product_name: solution.title,
    cropped_image_path: solution.thumbnail_url ?? null,
    imageUrl: solution.thumbnail_url ?? null,
    price: priceStr,
    citations: citationUrl ? [citationUrl] : null,
  };
}

/**
 * Convert a SpotRow to ItemRow for legacy compatibility
 */
export function spotToItemRow(spot: SpotRow, solution?: SolutionRow): ItemRow {
  return {
    id: parseInt(spot.id.substring(0, 8), 16) || 0,
    image_id: spot.post_id,
    spot_id: spot.id,
    brand: null, // SolutionRow doesn't have brand field
    product_name: solution?.title || null, // Use title as product_name
    cropped_image_path: solution?.thumbnail_url || null,
    price: solution?.price_amount?.toString() || null,
    description: solution?.description || null,
    status: solution?.status || spot.status || null,
    created_at: spot.created_at || null,
    bboxes: null,
    center: [
      normalizePos(parseFloat(spot.position_left)),
      normalizePos(parseFloat(spot.position_top)),
    ],
    scores: null,
    ambiguity: null,
    citations: null,
    metadata: null,
    sam_prompt: null,
  };
}

/** Normalize position: if 0-100 percentage → divide by 100, then clamp to 0-1 */
function normalizePos(v: number): number {
  const n = v > 1 ? v / 100 : v;
  return Math.max(0, Math.min(1, n));
}

/**
 * Helper: Convert pixel value to relative position (0.0 ~ 1.0)
 */
export function getRelativePos(val: number, max: number): number {
  if (max === 0) return 0;
  return Math.max(0, Math.min(1, val / max));
}

/**
 * Convert bbox array [x1, y1, x2, y2] to BoundingBox with validation
 * Assumption: bbox is normalized (0~1) relative to ORIGINAL IMAGE DIMENSIONS
 *
 * @param bbox - Array format [x1, y1, x2, y2] (normalized 0-1)
 */
export function bboxArrayToBoundingBox(bbox: number[]): BoundingBox | null {
  if (!Array.isArray(bbox) || bbox.length < 4) return null;

  const [x1, y1, x2, y2] = bbox;

  // 1. Ordering Validation (x2 must be > x1, y2 must be > y1)
  if (x2 <= x1 || y2 <= y1) return null;

  // 2. Boundary Clamp (0.0 ~ 1.0)
  const left = Math.max(0, Math.min(1, x1));
  const top = Math.max(0, Math.min(1, y1));
  const right = Math.max(0, Math.min(1, x2));
  const bottom = Math.max(0, Math.min(1, y2));

  const width = right - left;
  const height = bottom - top;

  // 3. Min Size Guardrail (UX Protection)
  // If too small (e.g., < 2%), return null to trigger center fallback
  if (width < 0.02 || height < 0.02) return null;

  return { left, top, width, height };
}

/**
 * Select best bbox from item.bboxes array based on scores
 */
export function selectBestBbox(
  bboxes: Json | null,
  scores: Json | null
): number[] | null {
  if (!Array.isArray(bboxes) || bboxes.length === 0) return null;

  // If scores missing or length mismatch, safely return first bbox
  if (!Array.isArray(scores) || scores.length !== bboxes.length) {
    return bboxes[0] as number[];
  }

  // Find index of highest score
  let maxIndex = 0;
  let maxScore = -1;

  scores.forEach((score, i) => {
    if (typeof score === "number" && score > maxScore) {
      maxScore = score;
      maxIndex = i;
    }
  });

  // Return bbox at max index (or fallback to first if something went wrong)
  return (bboxes[maxIndex] as number[]) || (bboxes[0] as number[]);
}

/**
 * Normalize coordinates from various formats to BoundingBox (0.0 ~ 1.0)
 *
 * Supports multiple input formats:
 * - [x, y] - Array format with normalized coordinates (0.0-1.0)
 * - { x: 0.5, y: 0.3 } - Already normalized center point
 * - { top: 22, left: 33.5, width: 21, height: 13 } - Percentage values (0-100)
 * - { x: 500, y: 300, width: 200, height: 150 } - Pixel values (requires imageSize)
 */
export function normalizeCoordinates(
  center: Json | null,
  imageSize?: { width: number; height: number }
): BoundingBox | null {
  if (!center) {
    return null;
  }

  // Case 0: Array format [x, y] - normalized coordinates
  if (Array.isArray(center) && center.length >= 2) {
    const x = typeof center[0] === "number" ? center[0] : null;
    const y = typeof center[1] === "number" ? center[1] : null;

    if (x !== null && y !== null) {
      const normalizedX = Math.max(0, Math.min(1, x));
      const normalizedY = Math.max(0, Math.min(1, y));

      // Default box size: 10% width and height
      const width = 0.1;
      const height = 0.1;

      return {
        top: Math.max(0, Math.min(1, normalizedY - height / 2)),
        left: Math.max(0, Math.min(1, normalizedX - width / 2)),
        width,
        height,
      };
    }
  }

  if (typeof center !== "object") {
    return null;
  }

  const obj = center as Record<string, unknown>;

  // Case 1: Already normalized center point { x: 0.5, y: 0.3 }
  if (typeof obj.x === "number" && typeof obj.y === "number") {
    const x = Math.max(0, Math.min(1, obj.x));
    const y = Math.max(0, Math.min(1, obj.y));

    // If width/height are provided, use them; otherwise create a small box around center
    const width =
      typeof obj.width === "number" ? Math.max(0, Math.min(1, obj.width)) : 0.1; // Default 10% width
    const height =
      typeof obj.height === "number"
        ? Math.max(0, Math.min(1, obj.height))
        : 0.1; // Default 10% height

    return {
      top: Math.max(0, Math.min(1, y - height / 2)),
      left: Math.max(0, Math.min(1, x - width / 2)),
      width,
      height,
    };
  }

  // Case 2: Percentage values (0-100) { top: 22, left: 33.5, width: 21, height: 13 }
  if (
    typeof obj.top === "number" &&
    typeof obj.left === "number" &&
    typeof obj.width === "number" &&
    typeof obj.height === "number"
  ) {
    // Check if values are in 0-100 range (percentage) or 0-1 range (normalized)
    const maxVal = Math.max(
      obj.top,
      obj.left,
      obj.top + obj.height,
      obj.left + obj.width
    );

    if (maxVal > 1) {
      // Percentage values (0-100), convert to 0-1
      return {
        top: Math.max(0, Math.min(1, obj.top / 100)),
        left: Math.max(0, Math.min(1, obj.left / 100)),
        width: Math.max(0, Math.min(1, obj.width / 100)),
        height: Math.max(0, Math.min(1, obj.height / 100)),
      };
    } else {
      // Already normalized (0-1)
      return {
        top: Math.max(0, Math.min(1, obj.top)),
        left: Math.max(0, Math.min(1, obj.left)),
        width: Math.max(0, Math.min(1, obj.width)),
        height: Math.max(0, Math.min(1, obj.height)),
      };
    }
  }

  // Case 3: Pixel values (requires imageSize)
  if (
    imageSize &&
    typeof obj.x === "number" &&
    typeof obj.y === "number" &&
    typeof obj.width === "number" &&
    typeof obj.height === "number"
  ) {
    return {
      top: getRelativePos(obj.y, imageSize.height),
      left: getRelativePos(obj.x, imageSize.width),
      width: getRelativePos(obj.width, imageSize.width),
      height: getRelativePos(obj.height, imageSize.height),
    };
  }

  return null;
}

/**
 * Get CSS style properties for highlighting a bounding box
 */
export function getHighlightStyle(box: BoundingBox): CSSProperties {
  return {
    top: `${box.top * 100}%`,
    left: `${box.left * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  };
}

/**
 * Get center point from bounding box
 */
export function getBoxCenter(box: BoundingBox): NormalizedCoord {
  return {
    x: box.left + box.width / 2,
    y: box.top + box.height / 2,
  };
}

/**
 * Normalize an item with its coordinates and map DB fields to UI fields
 *
 * This is the single source of truth for transforming DbItem → UiItem
 *
 * Field mappings:
 * - cropped_image_path (DB) → imageUrl (UI)
 *
 * @param item - Raw item from database (DbItem)
 * @param imageSize - Optional image dimensions for coordinate normalization
 * @param overrideLocation - Optional coordinate override (e.g. from post_image.item_locations)
 *                          Can be { bbox, center, score } or just center/bbox data
 * @returns Normalized item with UI-friendly field names (UiItem)
 */
export function normalizeItem(
  item: DbItem,
  imageSize?: { width: number; height: number },
  overrideLocation?: Json | null
): UiItem {
  // User requested to revert to Center-based logic
  // Bbox data is currently unreliable for positioning

  let centerToUse = item.center;

  // Check override for center
  if (overrideLocation !== undefined && overrideLocation !== null) {
    if (
      typeof overrideLocation === "object" &&
      !Array.isArray(overrideLocation)
    ) {
      const loc = overrideLocation as Record<string, unknown>;
      if (loc.center) {
        centerToUse = loc.center as Json;
      } else if (typeof loc.x === "number" && typeof loc.y === "number") {
        centerToUse = overrideLocation; // The object itself is the center
      }
    } else if (Array.isArray(overrideLocation)) {
      centerToUse = overrideLocation; // Array [x, y]
    }
  }

  const normalizedBox = normalizeCoordinates(centerToUse, imageSize);
  const normalizedCenter = normalizedBox ? getBoxCenter(normalizedBox) : null;

  return {
    ...item,
    normalizedBox,
    normalizedCenter,
    imageUrl: item.cropped_image_path || null,
    bboxSource: "center", // Always center
  };
}
