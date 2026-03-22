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
        {/* Period Selector — page level, same style as Dashboard */}
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
      </div>

      {/* KPI Cards */}
      {kpiQuery.isLoading || kpiQuery.isError ? (
        <CostKPICardsSkeleton />
      ) : kpiQuery.data ? (
        <CostKPICards data={kpiQuery.data} />
      ) : (
        <CostKPICardsSkeleton />
      )}

      {/* Token Usage Chart */}
      {chartQuery.isLoading || chartQuery.isError ? (
        <TokenUsageChartSkeleton />
      ) : chartQuery.data ? (
        <TokenUsageChart data={chartQuery.data.daily} />
      ) : (
        <TokenUsageChartSkeleton />
      )}

      {/* API Calls Chart */}
      {chartQuery.isLoading || chartQuery.isError ? (
        <ApiCallsChartSkeleton />
      ) : chartQuery.data ? (
        <ApiCallsChart data={chartQuery.data.daily} />
      ) : (
        <ApiCallsChartSkeleton />
      )}

      {/* Model Cost Breakdown */}
      {chartQuery.isLoading || chartQuery.isError ? (
        <ModelCostTableSkeleton />
      ) : chartQuery.data ? (
        <ModelCostTable data={chartQuery.data.modelBreakdown} />
      ) : (
        <ModelCostTableSkeleton />
      )}
    </div>
  );
}
