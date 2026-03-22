"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

/** Abbreviates large token counts for Y-axis ticks: K/M format */
function formatTokenTick(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
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
  name: string;
  value: number;
  color: string;
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
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label ? formatDateLabel(label) : ""}
      </p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-600 dark:text-gray-400">{item.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Token Usage Chart ────────────────────────────────────────────────────────

interface TokenUsageChartProps {
  data: AiCostDailyMetric[];
}

export function TokenUsageChart({ data }: TokenUsageChartProps) {
  const interval = tickInterval(data.length);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Token Usage
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Input and output tokens over time
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: -4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradInput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>

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
            width={55}
            tickFormatter={formatTokenTick}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "#6b7280",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          <Legend
            verticalAlign="bottom"
            height={32}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
          />

          <Area
            type="monotone"
            dataKey="inputTokens"
            name="Input Tokens"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradInput)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />

          <Area
            type="monotone"
            dataKey="outputTokens"
            name="Output Tokens"
            stroke="#ec4899"
            strokeWidth={2}
            fill="url(#gradOutput)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function TokenUsageChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header skeleton */}
      <div className="mb-5">
        <div className="h-4 w-28 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-2" />
        <div className="h-3 w-48 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
      {/* Chart area skeleton */}
      <div className="h-[260px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  );
}
