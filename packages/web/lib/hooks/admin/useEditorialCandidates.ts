/**
 * React Query hooks for admin editorial candidate management.
 *
 * - useEditorialCandidates → GET /api/v1/admin/editorial-candidates
 * - useGenerateEditorial  → POST /api/v1/post-magazines/generate (via backend proxy)
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EditorialCandidateItem {
  id: string;
  image_url: string;
  title: string | null;
  artist_name: string | null;
  group_name: string | null;
  context: string | null;
  spot_count: number;
  min_solutions_per_spot: number;
  total_solution_count: number;
  view_count: number;
  created_at: string;
}

export interface EditorialCandidateListResponse {
  data: EditorialCandidateItem[];
  total: number;
  page: number;
  per_page: number;
}

interface GenerateEditorialResponse {
  post_magazine_id: string;
  status: string;
}

// ─── Shared fetcher ──────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

interface UseEditorialCandidatesParams {
  page: number;
  perPage?: number;
}

export function useEditorialCandidates(
  params: UseEditorialCandidatesParams
): UseQueryResult<EditorialCandidateListResponse> {
  const { page, perPage = 20 } = params;

  return useQuery<EditorialCandidateListResponse>({
    queryKey: ["admin", "editorial-candidates", page, perPage],
    queryFn: ({ signal }: { signal?: AbortSignal }) => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      return adminFetch<EditorialCandidateListResponse>(
        `/api/v1/admin/editorial-candidates?${searchParams.toString()}`,
        { signal }
      );
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useGenerateEditorial(): UseMutationResult<
  GenerateEditorialResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation<GenerateEditorialResponse, Error, string>({
    mutationFn: async (postId: string) => {
      const res = await fetch("/api/v1/post-magazines/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string }).message ??
            `Failed to generate editorial: ${res.status}`
        );
      }
      return res.json() as Promise<GenerateEditorialResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "editorial-candidates"],
      });
    },
  });
}
