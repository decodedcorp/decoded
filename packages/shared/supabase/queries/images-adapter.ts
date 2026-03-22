/**
 * Unified adapter layer for post-centric image fetching (shared across web and mobile)
 */

import { isSupabaseInitialized } from "../client";
import type {
  FetchFilteredImagesParams,
  ImagePageWithPostId,
  ImageWithPostId,
} from "./images";
import { fetchImagesByPostImage, encodeCursor } from "./images";
import { fetchOrphanImages } from "./images-orphan";

/**
 * Unified adapter: merges post-based and orphan images
 *
 * Post-based images (from post_image table) are prioritized.
 * Orphan images (images not linked to any post) fill remaining slots.
 * Uses RPC function for efficient orphan fetching (NOT EXISTS pattern).
 */
export async function fetchUnifiedImages(
  params: FetchFilteredImagesParams & { deduplicateByImageId?: boolean }
): Promise<ImagePageWithPostId> {
  // Check Supabase initialization before making queries
  if (!isSupabaseInitialized()) {
    throw new Error(
      "Supabase client not initialized. Ensure the app providers are loaded before fetching images."
    );
  }

  const { deduplicateByImageId = true, ...queryParams } = params;
  const finalLimit = queryParams.limit || 50;

  // Fetch post-based images first (primary source)
  let postBasedResult: ImagePageWithPostId;
  try {
    postBasedResult = await fetchImagesByPostImage(queryParams);
  } catch (error) {
    // Log detailed error for debugging
    console.error("[fetchUnifiedImages] Caught error from fetchImagesByPostImage:");
    console.error("[fetchUnifiedImages] Error type:", typeof error);
    console.error("[fetchUnifiedImages] Error constructor:", error?.constructor?.name);
    if (error instanceof Error) {
      console.error("[fetchUnifiedImages] Error message:", error.message);
      console.error("[fetchUnifiedImages] Error stack:", error.stack);
    } else {
      console.error("[fetchUnifiedImages] Non-Error object:", error);
      console.error("[fetchUnifiedImages] JSON:", JSON.stringify(error));
    }
    // Re-throw with context
    throw new Error(
      `Failed to fetch images: ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }

  // Initialize orphan result
  let orphanResult: ImagePageWithPostId = {
    items: [],
    nextCursor: null,
    hasMore: false,
    stats: { fromPostImage: 0, fromOrphans: 0 },
  };

  // Fetch orphan images to fill remaining slots if needed
  // Only fetch orphans when filter is "all" and no search query
  const shouldFetchOrphans =
    (!queryParams.filter || queryParams.filter === "all") &&
    (!queryParams.search || queryParams.search.trim() === "") &&
    postBasedResult.items.length < finalLimit;

  if (shouldFetchOrphans) {
    const remainingSlots = finalLimit - postBasedResult.items.length;
    try {
      orphanResult = await fetchOrphanImages({
        limit: remainingSlots,
        cursor: null, // Always start fresh for orphans in unified context
      });
    } catch (error) {
      // Log error but don't fail the entire request
      console.warn("Failed to fetch orphan images:", error);
    }
  }

  // Merge results
  let allItems = [...postBasedResult.items, ...orphanResult.items];

  // Deduplicate by image ID if requested
  if (deduplicateByImageId) {
    const seen = new Map<string, ImageWithPostId>();
    allItems.forEach((item) => {
      if (!seen.has(item.id)) {
        seen.set(item.id, item);
      }
    });
    allItems = Array.from(seen.values());
  }

  // Sort by time (newest first)
  allItems.sort((a, b) => {
    const timeA = new Date(a.postImageCreatedAt || a.created_at).getTime();
    const timeB = new Date(b.postImageCreatedAt || b.created_at).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.id.localeCompare(a.id);
  });

  // Slice to final limit
  const items = allItems.slice(0, finalLimit);

  // Determine hasMore - prioritize post-based pagination
  const hasMore =
    allItems.length > finalLimit ||
    postBasedResult.hasMore ||
    orphanResult.hasMore;

  // Generate next cursor
  let nextCursor = null;
  if (hasMore) {
    if (postBasedResult.hasMore && postBasedResult.nextCursor) {
      // Continue with post-based pagination
      nextCursor = postBasedResult.nextCursor;
    } else if (items.length > 0) {
      // Generate cursor from last item
      const lastItem = items[items.length - 1];
      nextCursor = encodeCursor(
        lastItem.postImageCreatedAt || lastItem.created_at,
        lastItem.id
      );
    }
  }

  return {
    items,
    nextCursor,
    hasMore,
    stats: {
      fromPostImage:
        postBasedResult.stats?.fromPostImage || postBasedResult.items.length,
      fromOrphans: orphanResult.stats?.fromOrphans || orphanResult.items.length,
    },
  };
}
