"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { EndpointMetrics } from "@/lib/api/admin/monitoring";

type SortKey = "rpm" | "error_rate" | "p95_ms";

function SortIcon({
  col,
  active,
  asc,
}: {
  col: SortKey;
  active: SortKey;
  asc: boolean;
}) {
  if (col !== active)
    return (
      <ChevronUp className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100" />
    );
  return asc ? (
    <ChevronUp className="w-3 h-3 text-gray-400" />
  ) : (
    <ChevronDown className="w-3 h-3 text-gray-400" />
  );
}

export function EndpointTable({ data }: { data: EndpointMetrics[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rpm");
  const [asc, setAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setAsc((v) => !v);
    } else {
      setSortKey(key);
      setAsc(false);
    }
  }

  const sorted = [...data].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return asc ? diff : -diff;
  });

  function HeaderCell({
    label,
    col,
    align = "right",
  }: {
    label: string;
    col: SortKey;
    align?: "left" | "right";
  }) {
    return (
      <th
        className={`group px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none text-${align}`}
        onClick={() => handleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon col={col} active={sortKey} asc={asc} />
        </span>
      </th>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Top Endpoints
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide text-left">
                Path
              </th>
              <HeaderCell label="RPM" col="rpm" />
              <HeaderCell label="Error %" col="error_rate" />
              <HeaderCell label="P95" col="p95_ms" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-600 text-xs"
                >
                  No requests recorded yet
                </td>
              </tr>
            ) : (
              sorted.map((ep) => (
                <tr
                  key={ep.path}
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-300 max-w-[300px] truncate">
                    {ep.path}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-200">
                    {ep.rpm}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-medium ${
                      ep.error_rate > 0.05
                        ? "text-red-400"
                        : ep.error_rate > 0.01
                          ? "text-yellow-400"
                          : "text-gray-400"
                    }`}
                  >
                    {(ep.error_rate * 100).toFixed(1)}%
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-medium ${
                      ep.p95_ms > 1000
                        ? "text-red-400"
                        : ep.p95_ms > 500
                          ? "text-yellow-400"
                          : "text-gray-400"
                    }`}
                  >
                    {ep.p95_ms}ms
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EndpointTableSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="h-3 w-32 bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-800/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4">
            <div className="h-3 flex-1 bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-12 bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-12 bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-12 bg-gray-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
