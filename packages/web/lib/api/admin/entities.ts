import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Shared Types ───────────────────────────────────────

interface EntityListResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

// ─── Artists ─────────────────────────────────────────────

export interface Artist {
  id: string;
  name_en: string | null;
  name_ko: string | null;
  profile_image_url: string | null;
  primary_instagram_account_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useArtistList(page: number, perPage = 20, search = "") {
  return useQuery<EntityListResponse<Artist>>({
    queryKey: ["admin", "artists", "list", page, perPage, search],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (search) params.set("search", search);
      return adminFetch(`/api/admin/entities/artists?${params}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Artist>) =>
      adminFetch("/api/admin/entities/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "artists"] }),
  });
}

export function useUpdateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Artist> & { id: string }) =>
      adminFetch(`/api/admin/entities/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "artists"] }),
  });
}

export function useDeleteArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/entities/artists/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "artists"] }),
  });
}

// ─── Brands ──────────────────────────────────────────────

export interface Brand {
  id: string;
  name_en: string | null;
  name_ko: string | null;
  logo_image_url: string | null;
  primary_instagram_account_id: string | null;
  metadata: Record<string, unknown> | null;
}

export function useBrandList(page: number, perPage = 20, search = "") {
  return useQuery<EntityListResponse<Brand>>({
    queryKey: ["admin", "brands", "list", page, perPage, search],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (search) params.set("search", search);
      return adminFetch(`/api/admin/entities/brands?${params}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Brand>) =>
      adminFetch("/api/admin/entities/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Brand> & { id: string }) =>
      adminFetch(`/api/admin/entities/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/entities/brands/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

// ─── Group Members ───────────────────────────────────────

export interface GroupMember {
  artist_id: string;
  group_id: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
}

export function useGroupMemberList(page: number, perPage = 20) {
  return useQuery<EntityListResponse<GroupMember>>({
    queryKey: ["admin", "group-members", "list", page, perPage],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      return adminFetch(`/api/admin/entities/group-members?${params}`, {
        signal,
      });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
