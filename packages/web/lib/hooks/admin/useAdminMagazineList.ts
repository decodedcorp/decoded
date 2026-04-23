/**
 * React Query hook for admin magazine list.
 *
 * GET /api/v1/admin/posts/magazines?status=&page=&limit=
 */
import {
  useQuery,
  keepPreviousData,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  AdminMagazineListResponse,
  MagazineStatus,
} from "@/lib/api/admin/magazines";

interface UseAdminMagazineListParams {
  status?: MagazineStatus;
  page?: number;
  limit?: number;
}

export function useAdminMagazineList(
  params: UseAdminMagazineListParams = {}
): UseQueryResult<AdminMagazineListResponse> {
  const { status, page = 1, limit = 20 } = params;

  return useQuery<AdminMagazineListResponse>({
    queryKey: ["admin", "magazines", "list", { status, page, limit }],
    queryFn: async ({ signal }) => {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      qs.set("page", String(page));
      qs.set("limit", String(limit));

      const res = await fetch(`/api/v1/admin/posts/magazines?${qs}`, {
        credentials: "include",
        signal,
      });
      if (!res.ok) {
        throw new Error(`Admin magazines fetch failed: HTTP ${res.status}`);
      }
      return (await res.json()) as AdminMagazineListResponse;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
