import { useQuery, keepPreviousData } from "@tanstack/react-query";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface AuditLogListResponse {
  data: AuditLogEntry[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export function useAuditLogList(
  page: number,
  perPage = 30,
  filters: {
    action?: string;
    targetTable?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  return useQuery<AuditLogListResponse>({
    queryKey: ["admin", "audit-log", "list", page, perPage, filters],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (filters.action) params.set("action", filters.action);
      if (filters.targetTable) params.set("target_table", filters.targetTable);
      if (filters.dateFrom) params.set("date_from", filters.dateFrom);
      if (filters.dateTo) params.set("date_to", filters.dateTo);
      return adminFetch(`/api/admin/audit-log?${params}`, { signal });
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
