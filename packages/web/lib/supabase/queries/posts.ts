/**
 * Query layer for posts table (client-side)
 *
 * This module establishes the pattern: "Supabase direct access only happens in this layer"
 * When RLS policies change, only these query functions need to be updated,
 * keeping frontend code changes minimal.
 *
 * Schema update (2026-01-29):
 * - 'post' table → 'posts' table
 * - 'item' table → 'solutions' table
 * - 'post_image' junction → spots (item locations in images)
 */

import { supabaseBrowserClient } from "../client";
import type { PostRow, SpotRow, SolutionRow } from "../types";

/**
 * Post detail including spots and solutions
 */
export type PostDetail = {
  post: PostRow;
  spots: SpotRow[];
  solutions: SolutionRow[];
};

/**
 * Legacy compatible post detail type
 * Maps new schema to old structure for backward compatibility
 */
export type LegacyPostDetail = {
  post: {
    id: string;
    account: string;
    article: string | null;
    created_at: string;
    item_ids: unknown[] | null;
    metadata: string[] | null;
    ts: string;
  };
  items: Array<{
    id: number;
    image_id: string;
    brand: string | null;
    product_name: string | null;
    cropped_image_path: string | null;
    price: string | null;
    description: string | null;
    status: string | null;
    created_at: string | null;
  }>;
  images: Array<{
    id: string;
    image_url: string | null;
    created_at: string;
    image_hash: string;
    status: string;
    with_items: boolean;
  }>;
};

/**
 * Fetches a post with its associated spots and solutions (client-side)
 *
 * New schema structure:
 * 1. Fetch post
 * 2. Fetch spots (item locations) for the post
 * 3. Fetch solutions for each spot
 *
 * @param postId - Post ID to fetch
 * @returns PostDetail object or null if post not found
 */
export async function fetchPostWithSpotsAndSolutions(
  postId: string
): Promise<PostDetail | null> {
  // 1. Fetch post
  const { data: post, error: postError } = await supabaseBrowserClient
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[fetchPostWithSpotsAndSolutions] Error fetching post:",
        JSON.stringify(postError, null, 2)
      );
    }
    return null;
  }

  // 2. Fetch spots for this post
  const { data: spots, error: spotsError } = await supabaseBrowserClient
    .from("spots")
    .select("*")
    .eq("post_id", postId);

  if (spotsError) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[fetchPostWithSpotsAndSolutions] Error fetching spots:",
        JSON.stringify(spotsError, null, 2)
      );
    }
    return { post, spots: [], solutions: [] };
  }

  // 3. Fetch solutions for all spots
  const spotIds = (spots || []).map((s) => s.id);
  let solutions: SolutionRow[] = [];

  if (spotIds.length > 0) {
    const { data: solutionsData, error: solutionsError } =
      await supabaseBrowserClient
        .from("solutions")
        .select("*")
        .in("spot_id", spotIds)
        .eq("status", "active");

    if (solutionsError) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[fetchPostWithSpotsAndSolutions] Error fetching solutions:",
          JSON.stringify(solutionsError, null, 2)
        );
      }
    } else {
      solutions = solutionsData || [];
    }
  }

  return {
    post,
    spots: spots || [],
    solutions,
  };
}

/**
 * Legacy function - Fetches a post with its associated items and images
 *
 * @deprecated Use fetchPostWithSpotsAndSolutions instead
 * This function maps new schema to old structure for backward compatibility
 *
 * @param postId - Post ID to fetch
 * @returns LegacyPostDetail object or null if post not found
 */
export async function fetchPostWithImagesAndItems(
  postId: string
): Promise<LegacyPostDetail | null> {
  const result = await fetchPostWithSpotsAndSolutions(postId);
  if (!result) return null;

  // Map new schema to legacy structure
  return {
    post: {
      id: result.post.id,
      account: result.post.artist_name || result.post.group_name || "",
      article: result.post.title,
      created_at: result.post.created_at,
      item_ids: result.solutions.map((s) => s.id),
      metadata: null,
      ts: result.post.created_at,
    },
    items: result.solutions.map((solution, index) => ({
      id: index + 1, // Generate sequential ID
      image_id: result.post.id,
      brand: null, // SolutionRow doesn't have brand field
      product_name: solution.title || null, // Use title as product_name
      cropped_image_path: solution.thumbnail_url || null,
      price: solution.price_amount?.toString() || null,
      description: solution.description || null,
      status: solution.status || null,
      created_at: solution.created_at || null,
    })),
    images: [
      {
        id: result.post.id,
        image_url: result.post.image_url,
        created_at: result.post.created_at,
        image_hash: "",
        status: "extracted",
        with_items: result.spots.length > 0,
      },
    ],
  };
}

/**
 * Fetches posts by user ID (client-side)
 *
 * @param userId - User ID to filter by
 * @param limit - Maximum number of posts to fetch (default: 20)
 * @returns Array of PostRow
 */
export async function fetchPostsByUser(
  userId: string,
  limit = 20
): Promise<PostRow[]> {
  const { data, error } = await supabaseBrowserClient
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[fetchPostsByUser] Error:",
        JSON.stringify(error, null, 2)
      );
    }
    return [];
  }

  return data || [];
}

/**
 * Fetches a single post by ID (client-side)
 *
 * @param postId - Post ID to fetch
 * @returns PostRow or null if not found
 */
export async function fetchPostById(postId: string): Promise<PostRow | null> {
  const { data, error } = await supabaseBrowserClient
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchPostById] Error:", JSON.stringify(error, null, 2));
    }
    return null;
  }

  return data;
}
