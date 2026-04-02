/**
 * React Query hooks for admin dashboard data fetching.
 *
 * Three hooks correspond to three API routes:
 * - useDashboardStats  → /api/v1/admin/dashboard/stats
 * - useChartData       → /api/v1/admin/dashboard/chart?days=N
 * - useTodaySummary    → /api/v1/admin/dashboard/today
 *
 * All hooks use staleTime to avoid unnecessary refetches.
 * Stats and today's summary auto-refetch at different intervals.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  KPIStats,
  DailyMetric,
  TodaySummary,
} from "@/lib/api/admin/dashboard";

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
 * Fetches KPI stat cards data (DAU, MAU, total users/posts/solutions + deltas).
 * Auto-refreshes every 5 minutes.
 */
export function useDashboardStats(): UseQueryResult<KPIStats> {
  return useQuery<KPIStats>({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      adminFetch<KPIStats>("/api/v1/admin/dashboard/stats", { signal }),
    staleTime: 60_000,
    refetchInterval: 300_000,
  });
}

/**
 * Fetches time-series chart data for the given number of days.
 * Query key includes `days` so changing the period triggers a separate fetch.
 * No auto-refetch (chart data changes slowly).
 *
 * @param days - Number of days of history to return (default 30)
 */
export function useChartData(days: number = 30): UseQueryResult<DailyMetric[]> {
  return useQuery<DailyMetric[]>({
    queryKey: ["admin", "dashboard", "chart", days],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      adminFetch<DailyMetric[]>(`/api/v1/admin/dashboard/chart?days=${days}`, {
        signal,
      }),
    staleTime: 60_000,
  });
}

/**
 * Fetches today's activity summary (new posts, solutions, clicks).
 * Auto-refreshes every 2 minutes since today's data changes more frequently.
 */
export function useTodaySummary(): UseQueryResult<TodaySummary> {
  return useQuery<TodaySummary>({
    queryKey: ["admin", "dashboard", "today"],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      adminFetch<TodaySummary>("/api/v1/admin/dashboard/today", { signal }),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}
