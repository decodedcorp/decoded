/**
 * Server-side query for Main D experimental page (Sticker Canvas).
 * Uses shared Database type (pipeline schema: image, item, post, post_image).
 *
 * Key differences from main-b.server.ts:
 * - Returns MainDPost[] (array of posts), not a single MainBData
 * - Fetches full post images (image.image_url), NOT cropped item images
 * - Each polaroid card represents a post's image — not a cropped item
 * - Math.random() is used for server-side selection only (acceptable)
 * - Also exports fetchTrendingKeywordsServer for m9-03 wordmark consumption
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@decoded/shared";
import type { MainDPost } from "@/lib/components/main-d/types";

function getSharedClient() {
  // Use Shared/Pipeline DB (has image, item, post, post_image tables)
  // Falls back to PRD DB if shared env vars not set
  const url =
    process.env.SHARED_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SHARED_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "[main-d] Missing SHARED_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL"
    );
  }
  return createClient<Database>(url, key);
}

/**
 * Fetch 8-15 posts for the sticker canvas scatter layout.
 *
 * Strategy:
 * 1. Query image table for rows with image_url (limit 200 pool)
 * 2. Randomly pick up to 12 images (server-side Math.random is fine — only
 *    position/rotation must be deterministic, not data selection)
 * 3. For each image, fetch post metadata via post_image → post join
 * 4. Map to MainDPost[] (imageUrl + artistName from post.artists array)
 */
export async function fetchMainDPostsServer(): Promise<MainDPost[]> {
  const supabase = getSharedClient();

  // Step 1: Get pool of images with URLs
  const { data: images, error: imagesError } = await supabase
    .from("image")
    .select("id, image_url")
    .not("image_url", "is", null)
    .limit(200);

  if (imagesError || !images?.length) {
    console.error("[main-d] Failed to fetch image pool:", imagesError);
    return [];
  }

  // Step 2: Pick up to 40 — MAXIMUM sticker bomb coverage
  const shuffled = [...images].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, 40);

  // Step 3: For each chosen image, fetch post metadata in parallel
  const results = await Promise.all(
    chosen.map(async (image) => {
      // Look up post via post_image join
      const { data: postImageRow } = await supabase
        .from("post_image")
        .select("post_id")
        .eq("image_id", image.id)
        .limit(1)
        .single();

      let artistName: string | null = null;
      let postId: string = `image:${image.id}`;

      if (postImageRow) {
        postId = postImageRow.post_id;
        const { data: postData } = await supabase
          .from("post")
          .select("id, artists")
          .eq("id", postImageRow.post_id)
          .single();

        if (postData?.artists) {
          const artists = postData.artists as string[];
          artistName = Array.isArray(artists) ? (artists[0] ?? null) : null;
        }
      }

      // Fail-safe: skip images without a URL (satisfies non-null assertion)
      if (!image.image_url) return null;

      return {
        id: postId,
        imageUrl: image.image_url,
        artistName,
      } satisfies MainDPost;
    })
  );

  // Filter out failed resolves and deduplicate by ID
  const seen = new Set<string>();
  return results.filter((r): r is MainDPost => {
    if (!r) return false;
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/**
 * Fetch top trending keywords (artist names) for m9-03 wordmark consumption.
 *
 * Per CONTEXT.md: "trending keywords는 m9-03 워드마크에서 사용 — 이 Phase에서는 fetch만"
 *
 * Strategy:
 * - Query post table ordered by created_at DESC, limit 20 (recent posts = fresh content)
 * - Extract first artist from each post's artists array
 * - Deduplicate, return top 5-8 unique strings
 *
 * NOTE: The shared pipeline `post` table does not have view_count.
 * created_at DESC gives recent/fresh content which works as a proxy for trending.
 */
export async function fetchTrendingKeywordsServer(): Promise<string[]> {
  try {
    const supabase = getSharedClient();

    const { data: posts, error } = await supabase
      .from("post")
      .select("artists")
      .not("artists", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !posts?.length) {
      console.error("[main-d] fetchTrendingKeywordsServer error:", error);
      return [];
    }

    // Extract unique artist names from posts
    const seen = new Set<string>();
    const keywords: string[] = [];

    for (const post of posts) {
      if (keywords.length >= 8) break;
      const artists = post.artists as string[] | null;
      if (!Array.isArray(artists)) continue;
      const first = artists[0];
      if (first && !seen.has(first)) {
        seen.add(first);
        keywords.push(first);
      }
    }

    return keywords;
  } catch (err) {
    console.error("[main-d] fetchTrendingKeywordsServer threw:", err);
    return [];
  }
}
