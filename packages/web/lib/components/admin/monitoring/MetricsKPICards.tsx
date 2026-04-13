"use client";

import { Activity, AlertTriangle, Clock, Database } from "lucide-react";
import type { MonitoringMetrics } from "@/lib/api/admin/monitoring";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  highlight?: "ok" | "warn" | "error";
}) {
  const borderColor =
    highlight === "error"
      ? "border-red-500/40"
      : highlight === "warn"
        ? "border-yellow-500/40"
        : "border-gray-800";

  return (
    <div
      className={`bg-gray-900 border ${borderColor} rounded-xl p-5 flex flex-col gap-3`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export function MetricsKPICards({ data }: { data: MonitoringMetrics }) {
  const cur = data.current;
  const errorPct = cur ? (cur.error_rate * 100).toFixed(1) : "—";
  const errorHighlight =
    cur && cur.error_rate > 0.05
      ? "error"
      : cur && cur.error_rate > 0.01
        ? "warn"
        : "ok";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Requests / min"
        value={cur ? String(cur.rpm) : "—"}
        sub={`Total: ${data.total_requests.toLocaleString()}`}
        icon={<Activity className="w-4 h-4" />}
      />
      <MetricCard
        label="Error Rate"
        value={`${errorPct}%`}
        sub={`${data.total_errors.toLocaleString()} total errors`}
        icon={<AlertTriangle className="w-4 h-4" />}
        highlight={errorHighlight}
      />
      <MetricCard
        label="P95 Latency"
        value={cur ? `${cur.p95_ms}ms` : "—"}
        sub={cur ? `p50: ${cur.p50_ms}ms · p99: ${cur.p99_ms}ms` : undefined}
        icon={<Clock className="w-4 h-4" />}
        highlight={
          cur && cur.p95_ms > 1000
            ? "error"
            : cur && cur.p95_ms > 500
              ? "warn"
              : "ok"
        }
      />
      <MetricCard
        label="Uptime"
        value={formatUptime(data.uptime_seconds)}
        sub={`Server running`}
        icon={<Database className="w-4 h-4" />}
      />
    </div>
  );
}

export function MetricsKPICardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3"
        >
          <div className="h-3 w-24 bg-gray-800 rounded animate-pulse" />
          <div className="h-7 w-20 bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-32 bg-gray-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
