/**
 * React Query hooks for admin pipeline log data fetching.
 *
 * Two hooks correspond to two API routes:
 * - usePipelines       → /api/v1/admin/pipeline?status=X&page=N&pageSize=M
 * - usePipelineDetail  → /api/v1/admin/pipeline/{id}
 *
 * Both follow the same adminFetch + useQuery pattern as useAiCost.ts.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  PipelineExecution,
  PipelineListResponse,
} from "@/lib/api/admin/pipeline";

// ─── Shared fetcher ───────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of pipeline executions.
 * Supports optional status filtering.
 *
 * @param status  - Filter by pipeline status (undefined = all)
 * @param page    - 1-based page number (default 1)
 * @param pageSize - Items per page (default 15)
 */
export function usePipelines(
  status?: string,
  page: number = 1,
  pageSize: number = 15
): UseQueryResult<PipelineListResponse> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return useQuery<PipelineListResponse>({
    queryKey: ["admin", "pipeline", "list", status, page, pageSize],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      adminFetch<PipelineListResponse>(
        `/api/v1/admin/pipeline?${params.toString()}`,
        { signal }
      ),
    staleTime: 60_000,
  });
}

/**
 * Fetches the full detail of a single pipeline execution, including step data.
 *
 * @param id - Pipeline ID (e.g., "pipe-2001"), or null to disable the query
 */
export function usePipelineDetail(
  id: string | null
): UseQueryResult<PipelineExecution> {
  return useQuery<PipelineExecution>({
    queryKey: ["admin", "pipeline", "detail", id],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      adminFetch<PipelineExecution>(`/api/v1/admin/pipeline/${id}`, { signal }),
    enabled: !!id,
    staleTime: 60_000,
  });
}
