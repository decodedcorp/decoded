"use client";

import { useState } from "react";
import { useAiCostKPI, useAiCostChart } from "@/lib/hooks/admin/useAiCost";
import {
  CostKPICards,
  CostKPICardsSkeleton,
} from "@/lib/components/admin/ai-cost/CostKPICards";
import {
  TokenUsageChart,
  TokenUsageChartSkeleton,
} from "@/lib/components/admin/ai-cost/TokenUsageChart";
import {
  ApiCallsChart,
  ApiCallsChartSkeleton,
} from "@/lib/components/admin/ai-cost/ApiCallsChart";
import {
  ModelCostTable,
  ModelCostTableSkeleton,
} from "@/lib/components/admin/ai-cost/ModelCostTable";
import { AdminEmptyState } from "@/lib/components/admin/common";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiCostPage() {
  const [period, setPeriod] = useState(30);

  const kpiQuery = useAiCostKPI(period);
  const chartQuery = useAiCostChart(period);

  const isEmpty =
    kpiQuery.data?.totalCalls === 0 && chartQuery.data?.daily.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Header with Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            AI Cost
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            API usage, token consumption, and cost estimation
          </p>
        </div>
        {!isEmpty && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={
                  period === p.value
                    ? "px-3 py-1 text-xs font-medium rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "px-3 py-1 text-xs font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {(kpiQuery.isLoading || chartQuery.isLoading) && (
        <>
          <CostKPICardsSkeleton />
          <TokenUsageChartSkeleton />
          <ApiCallsChartSkeleton />
          <ModelCostTableSkeleton />
        </>
      )}

      {/* Empty state */}
      {!kpiQuery.isLoading && !chartQuery.isLoading && isEmpty && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <AdminEmptyState
            icon={
              <svg
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="No AI cost data available"
            description="Cost tracking data will appear here when the AI pipeline processes requests."
          />
        </div>
      )}

      {/* Data loaded */}
      {!kpiQuery.isLoading && !chartQuery.isLoading && !isEmpty && (
        <>
          {kpiQuery.data && <CostKPICards data={kpiQuery.data} />}
          {chartQuery.data && (
            <>
              <TokenUsageChart data={chartQuery.data.daily} />
              <ApiCallsChart data={chartQuery.data.daily} />
              <ModelCostTable data={chartQuery.data.modelBreakdown} />
            </>
          )}
        </>
      )}
    </div>
  );
}
