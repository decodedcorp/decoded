"use client";

/**
 * @deprecated Use Hotspot from @/lib/design-system instead
 *
 * This file is kept for backward compatibility only.
 * SpotMarker is now a re-export of the design system Hotspot component.
 *
 * Migration guide:
 * ```tsx
 * // Old:
 * import { SpotMarker } from "@/lib/components/request/SpotMarker";
 * <SpotMarker spot={spot} isSelected={true} />
 *
 * // New:
 * import { Hotspot } from "@/lib/design-system";
 * <Hotspot
 *   variant="numbered"
 *   number={spot.index}
 *   position={{ x: spot.center.x * 100, y: spot.center.y * 100 }}
 *   selected={true}
 *   glow={true}
 * />
 * ```
 */
export { Hotspot as SpotMarker } from "@/lib/design-system";
export type { HotspotProps as SpotMarkerProps } from "@/lib/design-system";
