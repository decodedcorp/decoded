import { useQuery, keepPreviousData } from "@tanstack/react-query";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface PostImage {
  id: string;
  image_url: string | null;
  created_at: string;
  image_hash: string;
  status: string;
  with_items: boolean;
}

export interface PostSpot {
  id: string;
  seed_post_id: string;
  position_left: string;
  position_top: string;
  request_order: number;
  created_at: string;
  updated_at: string;
}

interface ListResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
  stats?: Record<string, number>;
}

export function usePostImageList(
  page: number,
  perPage = 20,
  status = "",
  withItems = ""
) {
  return useQuery<ListResponse<PostImage>>({
    queryKey: [
      "admin",
      "post-images",
      "list",
      page,
      perPage,
      status,
      withItems,
    ],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (status) params.set("status", status);
      if (withItems) params.set("with_items", withItems);
      return adminFetch(`/api/admin/post-images?${params}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function usePostSpotList(page: number, perPage = 20) {
  return useQuery<ListResponse<PostSpot>>({
    queryKey: ["admin", "post-spots", "list", page, perPage],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      return adminFetch(`/api/admin/post-spots?${params}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
