"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { AiCostDailyMetric } from "@/lib/api/admin/ai-cost";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats ISO date string "YYYY-MM-DD" to short "Feb 1" style */
function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Determines X-axis tick interval to avoid label crowding.
 * Every 2nd for 7D, every 5th for 30D, every 10th for 90D.
 */
function tickInterval(dataLength: number): number {
  if (dataLength <= 7) return 1;
  if (dataLength <= 30) return 4;
  return 9;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label ? formatDateLabel(label) : ""}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: "#3b82f6" }}
        />
        <span className="text-gray-600 dark:text-gray-400">API Calls:</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {payload[0].value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── API Calls Chart ──────────────────────────────────────────────────────────

interface ApiCallsChartProps {
  data: AiCostDailyMetric[];
}

export function ApiCallsChart({ data }: ApiCallsChartProps) {
  const interval = tickInterval(data.length);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          API Calls
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Daily AI API requests
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-800"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval={interval}
            tickFormatter={formatDateLabel}
          />

          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(107, 114, 128, 0.08)" }}
          />

          <Bar
            dataKey="apiCalls"
            name="API Calls"
            fill="#3b82f6"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ApiCallsChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header skeleton */}
      <div className="mb-5">
        <div className="h-4 w-20 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-2" />
        <div className="h-3 w-36 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
      {/* Chart area skeleton */}
      <div className="h-[240px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  );
}
