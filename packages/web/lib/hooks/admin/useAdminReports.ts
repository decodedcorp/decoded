/**
 * React Query hooks for admin report management.
 *
 * - useAdminReportList → GET /api/v1/admin/reports
 * - useUpdateReportStatus → PATCH /api/v1/admin/reports/:reportId
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  AdminReportListResponse,
  ReportStatus,
} from "@/lib/api/admin/reports";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface UseAdminReportListParams {
  page: number;
  perPage?: number;
  status?: ReportStatus;
  targetType?: string;
}

export function useAdminReportList(
  params: UseAdminReportListParams
): UseQueryResult<AdminReportListResponse> {
  const { page, perPage = 20, status, targetType } = params;

  return useQuery<AdminReportListResponse>({
    queryKey: ["admin", "reports", "list", page, perPage, status, targetType],
    queryFn: ({ signal }: { signal?: AbortSignal }) => {
      const searchParams = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (status !== undefined) {
        searchParams.set("status", status);
      }
      if (targetType !== undefined) {
        searchParams.set("target_type", targetType);
      }
      return adminFetch<AdminReportListResponse>(
        `/api/v1/admin/reports?${searchParams.toString()}`,
        { signal }
      );
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      resolution,
    }: {
      reportId: string;
      status: ReportStatus;
      resolution?: string;
    }) => {
      const res = await fetch(`/api/v1/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update report: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
}
