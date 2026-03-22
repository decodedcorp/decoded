import { useQuery } from "@tanstack/react-query";
import {
  fetchItemsByImageId,
  type ItemRow,
} from "@/lib/supabase/queries/items";

/**
 * React Query hook for fetching items by image ID
 *
 * @param imageId - Image ID to fetch items for
 * @returns React Query result with data, loading, error states
 */
export function useItemsByImageId(imageId: string | undefined) {
  return useQuery<ItemRow[]>({
    queryKey: ["items", "by-image", imageId],
    queryFn: () => fetchItemsByImageId(imageId!),
    enabled: !!imageId,
  });
}
