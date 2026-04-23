/**
 * Admin — raw_posts API client (#289)
 *
 * Hooks for `/admin/seed/raw-posts` curator review pages. All requests go
 * through `/api/admin/raw-posts/*` Next.js proxy routes (auth-gated).
 */
import {
  useMutation,
  useQuery,
  keepPreviousData,
  useQueryClient,
} from "@tanstack/react-query";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface RawPostRow {
  id: string;
  source_id: string;
  platform: string;
  external_id: string;
  external_url: string;
  image_url: string;
  r2_url: string | null;
  caption: string | null;
  author_name: string | null;
  parse_status: string;
  original_status: string;
  parse_attempts: number;
  seed_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceMediaOriginal {
  id: string;
  raw_post_id: string;
  origin_url: string;
  origin_domain: string;
  r2_key: string;
  r2_url: string;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  image_hash: string | null;
  search_provider: string;
  is_primary: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SeedPostRow {
  id: string;
  image_url: string;
  status: string;
  metadata: Record<string, unknown> | null;
  media_source: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SeedSpotRow {
  id: string;
  seed_post_id: string;
  request_order: number;
  position_left: string;
  position_top: string;
  status: string;
  solutions: Array<Record<string, unknown>>;
  subcategory_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ListResponse {
  data: RawPostRow[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

interface DetailResponse {
  raw_post: RawPostRow & { parse_result: unknown };
  originals: SourceMediaOriginal[];
  seed_post: SeedPostRow | null;
  seed_spots: SeedSpotRow[];
}

export function useRawPostsList(params: {
  page: number;
  perPage?: number;
  parseStatus?: string;
  originalStatus?: string;
  platform?: string;
}) {
  const {
    page,
    perPage = 20,
    parseStatus = "",
    originalStatus = "",
    platform = "",
  } = params;
  return useQuery<ListResponse>({
    queryKey: [
      "admin",
      "raw-posts",
      "list",
      page,
      perPage,
      parseStatus,
      originalStatus,
      platform,
    ],
    queryFn: ({ signal }) => {
      const qs = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (parseStatus) qs.set("parse_status", parseStatus);
      if (originalStatus) qs.set("original_status", originalStatus);
      if (platform) qs.set("platform", platform);
      return adminFetch(`/api/admin/raw-posts?${qs}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useRawPostDetail(id: string | null) {
  return useQuery<DetailResponse>({
    queryKey: ["admin", "raw-posts", "detail", id],
    enabled: !!id,
    queryFn: ({ signal }) =>
      adminFetch(`/api/admin/raw-posts/${id}`, { signal }),
    staleTime: 10_000,
  });
}

export function useReparse() {
  const qc = useQueryClient();
  return useMutation<
    { triggered: boolean; raw_post_id: string; status: string },
    Error,
    string
  >({
    mutationFn: (id) =>
      adminFetch(`/api/admin/raw-posts/${id}/reparse`, { method: "POST" }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["admin", "raw-posts", "detail", id] });
      qc.invalidateQueries({ queryKey: ["admin", "raw-posts", "list"] });
    },
  });
}

export function useUpdateSeedStatus() {
  const qc = useQueryClient();
  return useMutation<
    { raw_post_id: string; seed_post_id: string; status: string },
    Error,
    { id: string; status: "draft" | "approved" | "rejected" }
  >({
    mutationFn: ({ id, status }) =>
      adminFetch(`/api/admin/raw-posts/${id}/seed-status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin", "raw-posts", "detail", id] });
      qc.invalidateQueries({ queryKey: ["admin", "raw-posts", "list"] });
    },
  });
}
