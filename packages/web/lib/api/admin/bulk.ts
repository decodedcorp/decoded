import { useMutation, useQueryClient } from "@tanstack/react-query";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

interface BulkResult {
  succeeded: number;
  failed: number;
  results: { id: string; success: boolean; error?: string }[];
}

export function useBulkAction() {
  const qc = useQueryClient();
  return useMutation<
    BulkResult,
    Error,
    { action: string; table: string; ids: string[] }
  >({
    mutationFn: (body) =>
      adminFetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}
