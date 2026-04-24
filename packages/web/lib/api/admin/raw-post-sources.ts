import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return body as T;
}

export interface RawPostSource {
  id: string;
  platform: string;
  source_type: string;
  source_identifier: string;
  label: string | null;
  is_active: boolean;
  fetch_interval_seconds: number;
  last_enqueued_at: string | null;
  last_scraped_at: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export interface RawPostSourcesPage {
  items: RawPostSource[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateRawPostSourceInput {
  platform: string;
  source_type: string;
  source_identifier: string;
  label?: string | null;
  fetch_interval_seconds: number;
  metadata?: unknown;
  is_active?: boolean;
}

export interface UpdateRawPostSourceInput {
  label?: string | null;
  is_active?: boolean;
  fetch_interval_seconds?: number;
  metadata?: unknown;
}

interface ListFilters {
  platform?: string;
  isActive?: boolean | null;
  limit?: number;
  offset?: number;
}

export function useRawPostSources(filters: ListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.isActive !== undefined && filters.isActive !== null) {
    params.set("is_active", String(filters.isActive));
  }
  params.set("limit", String(filters.limit ?? 50));
  params.set("offset", String(filters.offset ?? 0));

  return useQuery<RawPostSourcesPage>({
    queryKey: [
      "admin",
      "raw-post-sources",
      "list",
      filters.platform ?? "",
      filters.isActive ?? null,
      filters.limit ?? 50,
      filters.offset ?? 0,
    ],
    queryFn: ({ signal }) =>
      adminFetch(`/api/admin/raw-post-sources?${params.toString()}`, {
        signal,
      }),
    staleTime: 15_000,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateRawPostSource() {
  const qc = useQueryClient();
  return useMutation<RawPostSource, Error, CreateRawPostSourceInput>({
    mutationFn: (input) =>
      adminFetch("/api/admin/raw-post-sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "raw-post-sources"] }),
  });
}

export function useUpdateRawPostSource() {
  const qc = useQueryClient();
  return useMutation<
    RawPostSource,
    Error,
    { id: string; input: UpdateRawPostSourceInput }
  >({
    mutationFn: ({ id, input }) =>
      adminFetch(`/api/admin/raw-post-sources/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "raw-post-sources"] }),
  });
}

export function useDeleteRawPostSource() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      adminFetch(`/api/admin/raw-post-sources/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "raw-post-sources"] }),
  });
}

export function useTriggerRawPostSource() {
  const qc = useQueryClient();
  return useMutation<{ triggered: boolean; source_id: string }, Error, string>({
    mutationFn: (id) =>
      adminFetch(`/api/admin/raw-post-sources/${id}/trigger`, {
        method: "POST",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "raw-post-sources"] }),
  });
}
