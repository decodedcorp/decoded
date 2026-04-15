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
import type { HistoryBucket } from "@/lib/api/admin/monitoring";

function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 space-y-1">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}: <span className="font-semibold">{item.value}ms</span>
        </p>
      ))}
    </div>
  );
}

export function LatencyChart({ data }: { data: HistoryBucket[] }) {
  const chartData = data.map((b) => ({
    time: formatTimestamp(b.timestamp),
    p50: b.p50_ms,
    p95: b.p95_ms,
    p99: b.p99_ms,
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
        Latency (ms) — 1h rolling
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="p50g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="p95g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="p99g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            unit="ms"
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#9ca3af" }}
            iconType="circle"
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="p50"
            stroke="#6366f1"
            fill="url(#p50g)"
            strokeWidth={1.5}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="p95"
            stroke="#f59e0b"
            fill="url(#p95g)"
            strokeWidth={1.5}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="p99"
            stroke="#ef4444"
            fill="url(#p99g)"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LatencyChartSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="h-3 w-40 bg-gray-800 rounded animate-pulse mb-4" />
      <div className="h-[220px] bg-gray-800/50 rounded animate-pulse" />
    </div>
  );
}
