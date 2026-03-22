"use client";

import { useState } from "react";
import {
  useDashboardStats,
  useChartData,
  useTodaySummary,
} from "@/lib/hooks/admin/useDashboard";
import {
  KPICards,
  KPICardsSkeleton,
} from "@/lib/components/admin/dashboard/KPICards";
import {
  TrafficChart,
  TrafficChartSkeleton,
} from "@/lib/components/admin/dashboard/TrafficChart";
import {
  TodaySummary as TodaySummaryComponent,
  TodaySummarySkeleton,
} from "@/lib/components/admin/dashboard/TodaySummary";

/**
 * Admin Dashboard Page
 *
 * Composes KPI stat cards, traffic trend chart, and today's activity summary.
 * All data fetched client-side via React Query from admin API routes.
 * Each section has a skeleton fallback for loading and error states.
 */
export default function AdminDashboardPage() {
  const [chartPeriod, setChartPeriod] = useState(30);

  const statsQuery = useDashboardStats();
  const chartQuery = useChartData(chartPeriod);
  const todayQuery = useTodaySummary();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Service overview and key metrics
        </p>
      </div>

      {/* KPI Cards */}
      {statsQuery.isLoading ? (
        <KPICardsSkeleton />
      ) : statsQuery.data ? (
        <KPICards data={statsQuery.data} />
      ) : (
        <KPICardsSkeleton />
      )}

      {/* Traffic Chart */}
      {chartQuery.isLoading ? (
        <TrafficChartSkeleton />
      ) : chartQuery.data ? (
        <TrafficChart
          data={chartQuery.data}
          currentPeriod={chartPeriod}
          onPeriodChange={setChartPeriod}
        />
      ) : (
        <TrafficChartSkeleton />
      )}

      {/* Today Summary */}
      {todayQuery.isLoading ? (
        <TodaySummarySkeleton />
      ) : todayQuery.data ? (
        <TodaySummaryComponent data={todayQuery.data} />
      ) : (
        <TodaySummarySkeleton />
      )}
    </div>
  );
}
