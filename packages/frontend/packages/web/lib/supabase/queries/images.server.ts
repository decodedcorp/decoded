/**
 * Server-side query functions for posts (images)
 *
 * This module contains server-only query functions that use createSupabaseServerClient.
 * These functions can only be used in Server Components and Route Handlers.
 *
 * Note: The 'image' table has been replaced with 'posts' table in the new schema.
 * Each post contains an image_url field directly.
 */

import { createSupabaseServerClient } from "../server";
import type { PostRow } from "../types";

/**
 * Legacy ImageRow type for backward compatibility
 * Maps PostRow to the old ImageRow structure
 */
export interface ImageRow {
  id: string;
  image_url: string | null;
  created_at: string;
  image_hash: string;
  status: "pending" | "extracted" | "skipped" | "extracted_metadata";
  with_items: boolean;
}

/**
 * Converts a PostRow to legacy ImageRow format
 */
function postToImageRow(post: PostRow): ImageRow {
  return {
    id: post.id,
    image_url: post.image_url,
    created_at: post.created_at,
    image_hash: "", // Not available in new schema
    status: "extracted", // Default value
    with_items: false, // Not available in new schema
  };
}

/**
 * Fetches the latest images (posts) from the database (server-side)
 *
 * Use this function in Server Components and Route Handlers.
 *
 * @param limit - Maximum number of images to fetch (default: 20)
 * @returns Array of image rows, ordered by created_at descending (empty array on error)
 */
export async function fetchLatestImagesServer(limit = 20): Promise<ImageRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .not("image_url", "is", null)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(
      "Error fetching latest images:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return (data ?? []).map(postToImageRow);
}

/**
 * Fetches a single image (post) by ID from the database (server-side)
 *
 * Use this function in Server Components and Route Handlers.
 *
 * @param id - Image/Post ID to fetch
 * @returns Image row or null if not found (null on error)
 */
export async function fetchImageByIdServer(
  id: string
): Promise<ImageRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error(
      "Error fetching image by id:",
      JSON.stringify(error, null, 2)
    );
    return null;
  }

  return data ? postToImageRow(data) : null;
}

/**
 * Fetches the latest posts with full post data (server-side)
 *
 * @param limit - Maximum number of posts to fetch (default: 20)
 * @returns Array of PostRow
 */
export async function fetchLatestPostsServer(limit = 20): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .not("image_url", "is", null)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(
      "Error fetching latest posts:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return data ?? [];
}

/**
 * Fetches a single post by ID (server-side)
 *
 * @param id - Post ID to fetch
 * @returns PostRow or null if not found
 */
export async function fetchPostByIdServer(id: string): Promise<PostRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching post by id:", JSON.stringify(error, null, 2));
    return null;
  }

  return data;
}
