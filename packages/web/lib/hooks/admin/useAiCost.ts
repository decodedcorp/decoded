/**
 * React Query hooks for admin AI cost data fetching.
 *
 * Two hooks correspond to two API routes:
 * - useAiCostKPI    → /api/v1/admin/ai-cost/kpi?days=N
 * - useAiCostChart  → /api/v1/admin/ai-cost/chart?days=N
 *
 * Both hooks include `days` in the query key so changing the period
 * triggers a separate fetch (established pattern from useDashboard).
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { AiCostKPI, AiCostChartResponse } from "@/lib/api/admin/ai-cost";

// ─── Shared fetcher ───────────────────────────────────────────────────────────

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches AI cost KPI summary cards data (total calls, tokens, cost, avg cost/call).
 * Includes delta percentages vs the previous period of equal length.
 *
 * @param days - Number of days in the period (default 30)
 */
export function useAiCostKPI(days: number = 30): UseQueryResult<AiCostKPI> {
  return useQuery<AiCostKPI>({
    queryKey: ["admin", "ai-cost", "kpi", days],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      adminFetch<AiCostKPI>(`/api/v1/admin/ai-cost/kpi?days=${days}`, {
        signal,
      }),
    staleTime: 60_000,
  });
}

/**
 * Fetches AI cost chart data: daily time-series + per-model breakdown.
 * Both datasets bundled in a single response to minimize API calls.
 *
 * @param days - Number of days of history to return (default 30)
 */
export function useAiCostChart(
  days: number = 30
): UseQueryResult<AiCostChartResponse> {
  return useQuery<AiCostChartResponse>({
    queryKey: ["admin", "ai-cost", "chart", days],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      adminFetch<AiCostChartResponse>(
        `/api/v1/admin/ai-cost/chart?days=${days}`,
        { signal }
      ),
    staleTime: 60_000,
  });
}
