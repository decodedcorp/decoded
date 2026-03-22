/**
 * DEBUG ONLY: Query layer for posts table (client-side)
 *
 * This module is for debugging/reference purposes only.
 * Production code should use the main queries module instead.
 *
 * Schema update (2026-01-29): 'post' table → 'posts' table
 */

import { supabaseBrowserClient } from "../../client";
import type { PostRow } from "../../types";

/**
 * Fetches the latest posts from the database (client-side)
 *
 * @param limit - Maximum number of posts to fetch (default: 10)
 * @returns Array of post rows, ordered by created_at descending
 * @throws Error if the query fails
 */
export async function fetchLatestPosts(limit = 10): Promise<PostRow[]> {
  const { data, error } = await supabaseBrowserClient
    .from("posts")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
