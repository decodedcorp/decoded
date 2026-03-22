import { useQuery } from "@tanstack/react-query";

// ============================================================
// Types
// ============================================================

export interface TryPost {
  id: string;
  user_id: string;
  image_url: string;
  media_title: string | null;
  created_at: string;
  user: {
    display_name: string;
    avatar_url: string | null;
    username: string | null;
  };
}

export interface TriesResponse {
  tries: TryPost[];
  total: number;
}

// ============================================================
// Fetch Function
// ============================================================

/**
 * Fetch tries for a given post.
 * TODO: Replace placeholder with actual API call when backend is ready.
 * Will be: GET /api/v1/posts/:postId/tries?limit=N
 */
async function fetchTries(
  _postId: string,
  _limit: number
): Promise<TriesResponse> {
  return { tries: [], total: 0 };
}

// ============================================================
// Hook
// ============================================================

/**
 * React Query hook for fetching user "Try" posts linked to an original post.
 *
 * @param postId - The parent post ID
 * @param limit  - Max number of tries to fetch (default 6)
 */
export function useTries(postId: string, limit = 6) {
  return useQuery({
    queryKey: ["tries", postId, limit],
    queryFn: () => fetchTries(postId, limit),
    enabled: !!postId,
    staleTime: 1000 * 60, // 1 minute
  });
}
