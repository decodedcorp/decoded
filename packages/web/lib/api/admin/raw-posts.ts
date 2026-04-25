/**
 * Admin hooks for the raw_posts verification queue (#333).
 *
 * Lists / verifies items collected by ai-server's pipeline. Backend lives in the
 * **assets** Supabase project; the api-server proxy(`/api/v1/raw-posts/items*`)
 * handles the cross-project call. This file only sees the prod admin session.
 */

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

/** assets.public.pipeline_status enum (#333). */
export type PipelineStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "VERIFIED"
  | "ERROR";

export interface RawPost {
  id: string;
  source_id: string;
  platform: string;
  external_id: string;
  external_url: string;
  image_url: string;
  r2_key: string | null;
  r2_url: string | null;
  image_hash: string | null;
  caption: string | null;
  author_name: string | null;
  status: PipelineStatus;
  parse_status: string;
  parse_attempts: number;
  verified_at: string | null;
  verified_by: string | null;
  platform_metadata: unknown;
  dispatch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawPostsItemsPage {
  items: RawPost[];
  total: number;
  limit: number;
  offset: number;
}

interface ListFilters {
  status?: PipelineStatus;
  platform?: string;
  source_id?: string;
  limit?: number;
  offset?: number;
}

export function useRawPostsList(filters: ListFilters = {}) {
  return useQuery<RawPostsItemsPage>({
    queryKey: ["admin", "raw-posts", "items", filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters.status) qs.set("status", filters.status);
      if (filters.platform) qs.set("platform", filters.platform);
      if (filters.source_id) qs.set("source_id", filters.source_id);
      if (filters.limit !== undefined) qs.set("limit", String(filters.limit));
      if (filters.offset !== undefined)
        qs.set("offset", String(filters.offset));
      return adminFetch<RawPostsItemsPage>(
        `/api/admin/raw-posts/items${qs.toString() ? `?${qs}` : ""}`
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/** verify body — admin override fields (모두 optional). */
export interface VerifyRawPostInput {
  title?: string;
  artist_name?: string;
  group_name?: string;
  context?: string;
}

/** verify 응답 — prod.posts 의 PostResponse 일부 (관심 필드만). */
export interface VerifyResponse {
  id: string;
  user_id: string;
  image_url: string;
  title: string | null;
  status: string;
  created_at: string;
}

export function useVerifyRawPost() {
  const qc = useQueryClient();
  return useMutation<
    VerifyResponse,
    Error,
    { id: string; input?: VerifyRawPostInput }
  >({
    mutationFn: ({ id, input }) =>
      adminFetch<VerifyResponse>(
        `/api/admin/raw-posts/items/${encodeURIComponent(id)}/verify`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input ?? {}),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "raw-posts", "items"] });
    },
  });
}
