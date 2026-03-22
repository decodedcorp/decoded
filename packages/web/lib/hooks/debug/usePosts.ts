/**
 * DEBUG ONLY: React Query hook for fetching latest posts
 *
 * This hook is for debugging/reference purposes only.
 * Production code should use the main hooks instead.
 *
 * Schema update (2026-01-29): 'post' table → 'posts' table
 */

import { useQuery } from "@tanstack/react-query";
import { fetchLatestPosts } from "@/lib/supabase/queries/debug/posts";
import type { PostRow } from "@/lib/supabase/types";

export function useLatestPosts(limit = 10) {
  return useQuery<PostRow[]>({
    queryKey: ["posts", "latest", limit],
    queryFn: () => fetchLatestPosts(limit),
  });
}
