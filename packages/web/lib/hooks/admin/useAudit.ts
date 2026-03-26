/**
 * React Query hooks for admin AI audit data fetching.
 *
 * Two hooks correspond to two API routes:
 * - useAuditList   → /api/v1/admin/audit?page=N&perPage=N&status=S
 * - useAuditDetail → /api/v1/admin/audit/:requestId
 *
 * Uses keepPreviousData to avoid layout shift during page navigation.
 */

import {
  useQuery,
  keepPreviousData,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  AuditListResponse,
  AuditDetailResponse,
  AuditStatus,
} from "@/lib/api/admin/audit";

// ─── Shared fetcher ───────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

interface UseAuditListParams {
  page: number;
  perPage?: number;
  status?: AuditStatus;
}

/**
 * Fetches a paginated, filterable list of AI audit requests.
 * Uses keepPreviousData so the previous page remains visible while the next
 * page loads — prevents table flicker during pagination.
 *
 * @param params - page, perPage, and optional status filter
 */
export function useAuditList(
  params: UseAuditListParams
): UseQueryResult<AuditListResponse> {
  const { page, perPage = 10, status } = params;

  return useQuery<AuditListResponse>({
    queryKey: ["admin", "audit", "list", page, perPage, status],
    queryFn: ({ signal }: { signal?: AbortSignal }) => {
      const searchParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      // Only include status param when filtering (omit for "all")
      if (status !== undefined) {
        searchParams.set("status", status);
      }
      return adminFetch<AuditListResponse>(
        `/api/v1/admin/audit?${searchParams.toString()}`,
        { signal }
      );
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches a single audit request with full item details.
 * Only fires when a requestId is provided (enabled: !!requestId).
 *
 * @param requestId - Audit request ID (e.g., "audit-1001"), or null to skip
 */
export function useAuditDetail(
  requestId: string | null
): UseQueryResult<AuditDetailResponse> {
  return useQuery<AuditDetailResponse>({
    queryKey: ["admin", "audit", "detail", requestId],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      adminFetch<AuditDetailResponse>(`/api/v1/admin/audit/${requestId}`, { signal }),
    enabled: !!requestId,
    staleTime: 60_000,
  });
}
