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
import type { DailyMetric } from "@/lib/api/admin/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrafficChartProps {
  data: DailyMetric[];
  currentPeriod: number;
  onPeriodChange: (days: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 },
];

/** Formats ISO date string "YYYY-MM-DD" to short "Feb 1" style */
function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Determines X-axis tick interval based on period to avoid crowding */
function tickInterval(period: number): number {
  if (period <= 7) return 1;
  if (period <= 14) return 2;
  return 4; // 30D: show every 5th label (interval=4 means show index 0,4,8,...)
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
          <span className="text-gray-600 dark:text-gray-400 capitalize">
            {item.name}:
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Traffic Chart ────────────────────────────────────────────────────────────

export function TrafficChart({
  data,
  currentPeriod,
  onPeriodChange,
}: TrafficChartProps) {
  // Format dates for display while keeping original as data key
  const chartData = data.map((d) => ({
    ...d,
    displayDate: formatDateLabel(d.date),
  }));

  const interval = tickInterval(currentPeriod);

  // Compute date range subtitle
  const startDate = data.length > 0 ? formatDateLabel(data[0].date) : "";
  const endDate =
    data.length > 0 ? formatDateLabel(data[data.length - 1].date) : "";
  const subtitle = startDate && endDate ? `${startDate} – ${endDate}` : "";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Traffic Overview
          </h2>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => onPeriodChange(period.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                currentPeriod === period.value
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradDau" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSearches" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
            width={40}
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
            dataKey="dau"
            name="DAU"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#gradDau)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />

          <Area
            type="monotone"
            dataKey="searches"
            name="Searches"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#gradSearches)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />

          <Area
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gradClicks)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function TrafficChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="h-4 w-32 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-2" />
          <div className="h-3 w-40 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        {/* Period selector skeleton */}
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-10 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md"
            />
          ))}
        </div>
      </div>
      {/* Chart area skeleton */}
      <div className="h-[300px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  );
}
