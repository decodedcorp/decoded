/**
 * React Query hooks for admin decoded pick management.
 *
 * - useAdminPickList → GET /api/v1/admin/picks
 * - useCreatePick   → POST /api/v1/admin/picks
 * - useUpdatePick   → PATCH /api/v1/admin/picks/:pickId
 * - useDeletePick   → DELETE /api/v1/admin/picks/:pickId
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  DecodedPickListResponse,
  CreatePickPayload,
  UpdatePickPayload,
} from "@/lib/api/admin/picks";

// ─── Shared fetcher ───────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Query keys ──────────────────────────────────────────────────────────────

const PICKS_KEY = ["admin", "picks"] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

interface UseAdminPickListParams {
  page: number;
  perPage?: number;
}

export function useAdminPickList(
  params: UseAdminPickListParams
): UseQueryResult<DecodedPickListResponse> {
  const { page, perPage = 20 } = params;

  return useQuery<DecodedPickListResponse>({
    queryKey: [...PICKS_KEY, "list", page, perPage],
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      return adminFetch<DecodedPickListResponse>(
        `/api/v1/admin/picks?${searchParams.toString()}`,
        { signal }
      );
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreatePick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePickPayload) => {
      return adminFetch<Record<string, unknown>>("/api/v1/admin/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICKS_KEY });
    },
  });
}

export function useUpdatePick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pickId,
      ...payload
    }: UpdatePickPayload & { pickId: string }) => {
      return adminFetch<Record<string, unknown>>(
        `/api/v1/admin/picks/${pickId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICKS_KEY });
    },
  });
}

export function useDeletePick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pickId: string) => {
      return adminFetch<{ success: boolean }>(
        `/api/v1/admin/picks/${pickId}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICKS_KEY });
    },
  });
}
