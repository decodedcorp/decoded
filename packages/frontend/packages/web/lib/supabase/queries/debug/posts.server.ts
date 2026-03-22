/**
 * DEBUG ONLY: Server-side query functions for posts table
 *
 * This module is for debugging/reference purposes only.
 * Production code should use the main queries module instead.
 *
 * Schema update (2026-01-29): 'post' table → 'posts' table
 */

import { createSupabaseServerClient } from "../../server";
import type { PostRow } from "../../types";

/**
 * Fetches the latest posts from the database (server-side)
 *
 * Use this function in Server Components and Route Handlers.
 *
 * @param limit - Maximum number of posts to fetch (default: 10)
 * @returns Array of post rows, ordered by created_at descending
 * @throws Error if the query fails
 */
export async function fetchLatestPostsServer(limit = 10): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
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
