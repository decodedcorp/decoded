import { useMemo } from "react";
import type { ImageDetail } from "@/lib/supabase/queries/images";
import type { ImageRow, Json } from "@/lib/supabase/types";
import { normalizeItem, type UiItem } from "@/lib/components/detail/types";

/**
 * Hook to normalize items with their locations from post metadata
 * Centralizes the logic used in both ImageDetailContent and ImageDetailModal
 */
export function useNormalizedItems(
  image: ImageDetail | ImageRow | null | undefined
): UiItem[] {
  return useMemo(() => {
    if (!image) return [];

    // Cast to ImageDetail to access relations safely (runtime check via optional chaining handles missing props)
    const img = image as ImageDetail;
    const items = img.items || [];

    // Check for postImages and locations
    const firstPostImage = img.postImages?.[0];
    const itemLocations = firstPostImage?.item_locations;

    const itemLocationsMap: Record<string, unknown> = {};

    if (Array.isArray(itemLocations)) {
      itemLocations.forEach((loc: Record<string, unknown>) => {
        if (loc && loc.item_id) {
          // Extract center/box from location object
          // Data format: { item_id: 123, center: [...], bbox: [...] }
          itemLocationsMap[(loc.item_id as number | string).toString()] =
            loc.center || loc;
        }
      });
    } else if (itemLocations && typeof itemLocations === "object") {
      Object.assign(itemLocationsMap, itemLocations);
    }

    return items.map((item) => {
      // Check if we have an override for this item ID
      const overrideLocation = itemLocationsMap[item.id.toString()];
      return normalizeItem(item, undefined, overrideLocation as Json | null);
    });
  }, [image]);
}
