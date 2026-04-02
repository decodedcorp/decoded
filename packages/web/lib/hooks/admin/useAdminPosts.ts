/**
 * React Query hooks for admin post management.
 *
 * - useAdminPostList → GET /api/v1/admin/posts
 * - useUpdatePostStatus → PATCH /api/v1/admin/posts/:postId/status
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  AdminPostListResponse,
  PostStatus,
} from "@/lib/api/admin/posts";

// ─── Shared fetcher ───────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

interface UseAdminPostListParams {
  page: number;
  perPage?: number;
  status?: PostStatus;
}

/**
 * Fetches a paginated, filterable list of admin posts.
 */
export function useAdminPostList(
  params: UseAdminPostListParams
): UseQueryResult<AdminPostListResponse> {
  const { page, perPage = 20, status } = params;

  return useQuery<AdminPostListResponse>({
    queryKey: ["admin", "posts", "list", page, perPage, status],
    queryFn: ({ signal }: { signal?: AbortSignal }) => {
      const searchParams = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (status !== undefined) {
        searchParams.set("status", status);
      }
      return adminFetch<AdminPostListResponse>(
        `/api/v1/admin/posts?${searchParams.toString()}`,
        { signal }
      );
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Mutation to update a post's status.
 * Invalidates the admin posts list on success.
 */
export function useUpdatePostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      status,
    }: {
      postId: string;
      status: PostStatus;
    }) => {
      const res = await fetch(`/api/v1/admin/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}
