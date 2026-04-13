/**
 * React Query hook for admin monitoring metrics.
 *
 * Polls /api/v1/admin/monitoring/metrics every 15 seconds
 * to provide near-realtime visibility into backend performance.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { MonitoringMetrics } from "@/lib/api/admin/monitoring";

async function fetchMonitoringMetrics(signal?: AbortSignal): Promise<MonitoringMetrics> {
  const res = await fetch("/api/v1/admin/monitoring/metrics", { signal });
  if (!res.ok) {
    throw new Error(`Monitoring API error: ${res.status}`);
  }
  return res.json() as Promise<MonitoringMetrics>;
}

export function useMonitoringMetrics(): UseQueryResult<MonitoringMetrics> {
  return useQuery<MonitoringMetrics>({
    queryKey: ["admin", "monitoring", "metrics"],
    queryFn: ({ signal }) => fetchMonitoringMetrics(signal),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
