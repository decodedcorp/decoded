/**
 * Hook for submitting content reports.
 *
 * POST /api/v1/reports
 */

import { useMutation } from "@tanstack/react-query";

interface SubmitReportParams {
  target_type: string;
  target_id: string;
  reason: string;
  details?: string;
}

export function useSubmitReport() {
  return useMutation({
    mutationFn: async (params: SubmitReportParams) => {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || `Failed to submit report: ${res.status}`
        );
      }
      return res.json();
    },
  });
}
