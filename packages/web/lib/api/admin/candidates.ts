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

export interface Candidate {
  id: string;
  image_url: string;
  status: string;
  context: string | null;
  artist_account_id: string | null;
  group_account_id: string | null;
  source_post_id: string | null;
  source_image_id: string | null;
  backend_post_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CandidateListResponse {
  data: Candidate[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export function useCandidateList(
  page: number,
  perPage = 20,
  status = "",
  search = ""
) {
  return useQuery<CandidateListResponse>({
    queryKey: ["admin", "candidates", "list", page, perPage, status, search],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      return adminFetch(`/api/admin/candidates?${params}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCandidate(id: string) {
  return useQuery<{ data: Candidate }>({
    queryKey: ["admin", "candidates", "detail", id],
    queryFn: ({ signal }) =>
      adminFetch(`/api/admin/candidates/${id}`, { signal }),
    enabled: !!id,
  });
}

export function useApproveCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/candidates/${id}/approve`, { method: "POST" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "candidates"] }),
  });
}

export function useRejectCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/candidates/${id}/reject`, { method: "POST" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "candidates"] }),
  });
}
