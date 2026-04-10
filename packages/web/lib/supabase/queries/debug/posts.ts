/**
 * DEBUG ONLY: Client-side query functions for posts table
 */

import { supabaseBrowserClient } from "../../client";
import type { PostRow } from "../../types";

export async function fetchLatestPosts(limit = 10): Promise<PostRow[]> {
  const { data, error } = await supabaseBrowserClient
    .from("posts")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as PostRow[];
}
