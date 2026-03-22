/**
 * Orphan image fallback query (shared across web and mobile)
 *
 * Uses RPC function for efficient database-level filtering with NOT EXISTS pattern.
 * This avoids loading entire tables into memory.
 */

import { getSupabaseClient } from "../client";
import type { ImagePageWithPostId, ImageWithPostId } from "./images";
import { encodeCursor, decodeCursor } from "./images";

type OrphanImageRow = {
  id: string;
  image_url: string | null;
  status: string | null;
  with_items: boolean;
  image_hash: string | null;
  created_at: string;
};

/**
 * Fallback query for images without post_image entries
 *
 * Uses the get_orphan_images RPC function for efficient DB-level filtering.
 * The function uses NOT EXISTS pattern which is optimized by PostgreSQL.
 */
export async function fetchOrphanImages(params: {
  limit: number;
  cursor?: string | null;
}): Promise<ImagePageWithPostId> {
  const supabase = getSupabaseClient();
  const { limit, cursor } = params;

  // Decode cursor for pagination
  let cursorCreatedAt: string | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      cursorCreatedAt = decoded.createdAt;
      cursorId = decoded.id;
    }
  }

  // Call RPC function - cast to any to bypass strict typing for custom RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_orphan_images", {
    p_limit: limit,
    p_cursor_created_at: cursorCreatedAt,
    p_cursor_id: cursorId,
  });

  if (error) {
    throw error;
  }

  const orphanImages = (data as OrphanImageRow[]) || [];

  // hasMore is determined by receiving more than limit items
  // (the RPC function requests limit + 1)
  const hasMore = orphanImages.length > limit;

  // Transform to ImageWithPostId format
  // Filter out items with null image_url since they can't be displayed
  const items: ImageWithPostId[] = orphanImages
    .slice(0, limit)
    .filter((img): img is OrphanImageRow & { image_url: string } => img.image_url != null)
    .map((img) => ({
      id: img.id,
      image_url: img.image_url,
      status: (img.status as "pending" | "extracted" | "skipped" | "extracted_metadata") || "pending",
      with_items: img.with_items,
      image_hash: img.image_hash || "",
      created_at: img.created_at,
      postId: `legacy:${img.id}`,
      postSource: "legacy" as const,
      postAccount: "Legacy",
      postImageCreatedAt: img.created_at,
      postCreatedAt: img.created_at,
    }));

  // Generate next cursor if there are more items
  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
  }

  return {
    items,
    nextCursor,
    hasMore,
    stats: {
      fromPostImage: 0,
      fromOrphans: items.length,
    },
  };
}
