/**
 * React Query mutation hook for magazine status updates.
 *
 * PATCH /api/v1/admin/posts/magazines/:id/status
 * Invalidates the ["admin", "magazines"] query family on success.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MagazineStatus } from "@/lib/api/admin/magazines";

export interface UpdateMagazineStatusInput {
  id: string;
  status: MagazineStatus;
  rejectionReason?: string;
}

export function useUpdateMagazineStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMagazineStatusInput) => {
      const body: Record<string, unknown> = { status: input.status };
      if (input.rejectionReason !== undefined) {
        body.rejectionReason = input.rejectionReason;
      }

      const res = await fetch(
        `/api/v1/admin/posts/magazines/${input.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        throw new Error(
          errBody.error ?? errBody.message ?? `HTTP ${res.status}`
        );
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "magazines"] });
    },
  });
}
