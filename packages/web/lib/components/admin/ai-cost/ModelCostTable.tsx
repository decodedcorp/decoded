"use client";

import type { ModelCostBreakdown } from "@/lib/api/admin/ai-cost";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Abbreviates token counts: >= 1M → "X.XM", >= 1K → "XK", else raw */
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString();
}

/** Formats a USD cost to 2 decimal places: $XX.XX */
function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

// ─── Model Cost Table ─────────────────────────────────────────────────────────

interface ModelCostTableProps {
  data: ModelCostBreakdown[];
}

export function ModelCostTable({ data }: ModelCostTableProps) {
  const totalCost = data.reduce((sum, row) => sum + row.estimatedCost, 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Cost by Model
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Estimated cost breakdown
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2.5 pr-4">
                Model
              </th>
              <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 pb-2.5 px-4">
                Calls
              </th>
              <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 pb-2.5 px-4">
                Input Tokens
              </th>
              <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 pb-2.5 px-4">
                Output Tokens
              </th>
              <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 pb-2.5 pl-4">
                Est. Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.model}
                className="border-b border-gray-50 dark:border-gray-800/50"
              >
                <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200 font-medium">
                  {row.model}
                </td>
                <td className="py-2.5 px-4 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                  {row.calls.toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                  {formatTokens(row.inputTokens)}
                </td>
                <td className="py-2.5 px-4 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                  {formatTokens(row.outputTokens)}
                </td>
                <td className="py-2.5 pl-4 text-right text-gray-800 dark:text-gray-200 tabular-nums font-medium">
                  {formatCost(row.estimatedCost)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 pr-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Total
              </td>
              <td className="pt-3 px-4" />
              <td className="pt-3 px-4" />
              <td className="pt-3 px-4" />
              <td className="pt-3 pl-4 text-right text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatCost(totalCost)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ModelCostRowSkeleton() {
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800/50">
      <td className="py-2.5 pr-4">
        <div className="h-3 w-32 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
      </td>
      <td className="py-2.5 px-4">
        <div className="h-3 w-12 animate-pulse bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
      </td>
      <td className="py-2.5 px-4">
        <div className="h-3 w-16 animate-pulse bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
      </td>
      <td className="py-2.5 px-4">
        <div className="h-3 w-16 animate-pulse bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
      </td>
      <td className="py-2.5 pl-4">
        <div className="h-3 w-14 animate-pulse bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
      </td>
    </tr>
  );
}

export function ModelCostTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header skeleton */}
      <div className="mb-4">
        <div className="h-4 w-24 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-2" />
        <div className="h-3 w-40 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
      {/* Table skeleton */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {[
              "Model",
              "Calls",
              "Input Tokens",
              "Output Tokens",
              "Est. Cost",
            ].map((col) => (
              <th key={col} className="pb-2.5">
                <div className="h-3 w-16 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 3 }).map((_, i) => (
            <ModelCostRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
