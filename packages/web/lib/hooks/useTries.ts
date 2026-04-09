import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { createTryPost } from "@/lib/api/posts";
import type {
  CreateTryPostRequest,
  TryListResponse,
  TryCountResponse,
  TryPostListItem,
} from "@/lib/api/mutation-types";

// ============================================================
// Types (re-export for consumers)
// ============================================================

export type TryPost = TryPostListItem;

export interface TriesResponse {
  tries: TryPost[];
  total: number;
}

// ============================================================
// Query Keys
// ============================================================

export const tryKeys = {
  all: ["tries"] as const,
  list: (postId: string, limit?: number) =>
    [...tryKeys.all, "list", postId, limit] as const,
  count: (postId: string) => [...tryKeys.all, "count", postId] as const,
  bySpot: (spotId: string) => [...tryKeys.all, "spot", spotId] as const,
};

// ============================================================
// Fetch Functions
// ============================================================

async function fetchTries(
  postId: string,
  limit: number
): Promise<TriesResponse> {
  const data = await apiClient<TryListResponse>({
    path: `/api/v1/posts/${postId}/tries?per_page=${limit}`,
    method: "GET",
  });
  return { tries: data.tries, total: data.total };
}

async function fetchTryCount(postId: string): Promise<number> {
  const data = await apiClient<TryCountResponse>({
    path: `/api/v1/posts/${postId}/tries/count`,
    method: "GET",
  });
  return data.count;
}

// ============================================================
// Hooks
// ============================================================

/**
 * React Query hook for fetching user "Try" posts linked to an original post.
 */
export function useTries(postId: string, limit = 6) {
  return useQuery({
    queryKey: tryKeys.list(postId, limit),
    queryFn: () => fetchTries(postId, limit),
    enabled: !!postId,
    staleTime: 1000 * 60,
  });
}

/**
 * React Query hook for fetching try count for a post.
 */
export function useTryCount(postId: string) {
  return useQuery({
    queryKey: tryKeys.count(postId),
    queryFn: () => fetchTryCount(postId),
    enabled: !!postId,
    staleTime: 1000 * 60,
  });
}

/**
 * Mutation hook for creating a try post.
 */
export function useCreateTryPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTryPostRequest) => createTryPost(request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: tryKeys.list(variables.parent_post_id),
      });
      queryClient.invalidateQueries({
        queryKey: tryKeys.count(variables.parent_post_id),
      });
    },
  });
}
