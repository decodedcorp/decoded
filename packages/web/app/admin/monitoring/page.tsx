"use client";

import { useMonitoringMetrics } from "@/lib/hooks/admin/useMonitoring";
import {
  MetricsKPICards,
  MetricsKPICardsSkeleton,
} from "@/lib/components/admin/monitoring/MetricsKPICards";
import {
  LatencyChart,
  LatencyChartSkeleton,
} from "@/lib/components/admin/monitoring/LatencyChart";
import {
  ThroughputChart,
  ThroughputChartSkeleton,
} from "@/lib/components/admin/monitoring/ThroughputChart";
import {
  EndpointTable,
  EndpointTableSkeleton,
} from "@/lib/components/admin/monitoring/EndpointTable";

export default function MonitoringPage() {
  const { data, isLoading, isError } = useMonitoringMetrics();

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-xl px-5 py-4 text-sm text-red-400">
          Failed to load monitoring metrics. Check that the backend is running.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-100">Monitoring</h1>
        {data && (
          <span className="text-xs text-gray-600">
            Auto-refreshes every 15s
          </span>
        )}
      </div>

      {/* KPI Cards */}
      {isLoading || !data ? (
        <MetricsKPICardsSkeleton />
      ) : (
        <MetricsKPICards data={data} />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading || !data ? (
          <>
            <LatencyChartSkeleton />
            <ThroughputChartSkeleton />
          </>
        ) : (
          <>
            <LatencyChart data={data.history} />
            <ThroughputChart data={data.history} />
          </>
        )}
      </div>

      {/* Endpoint Table */}
      {isLoading || !data ? (
        <EndpointTableSkeleton />
      ) : (
        <EndpointTable data={data.endpoints} />
      )}
    </div>
  );
}
