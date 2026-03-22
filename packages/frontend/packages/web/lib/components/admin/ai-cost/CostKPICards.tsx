"use client";

import {
  Zap,
  Hash,
  DollarSign,
  Calculator,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { AiCostKPI } from "@/lib/api/admin/ai-cost";

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

/** Formats a USD cost to 4 decimal places for sub-cent precision: $X.XXXX */
function formatCostPrecise(n: number): string {
  return `$${n.toFixed(4)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CostKPICardData {
  label: string;
  value: string;
  delta?: number;
  icon: React.ReactNode;
}

// ─── Single KPI Card ─────────────────────────────────────────────────────────

function CostKPICard({ label, value, delta, icon }: CostKPICardData) {
  const hasDelta = delta !== undefined && delta !== 0;
  const isPositive = (delta ?? 0) > 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Label row */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {value}
      </div>

      {/* Delta indicator */}
      {hasDelta ? (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            isPositive ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {delta!.toFixed(1)}%
          </span>
        </div>
      ) : (
        <div className="text-xs text-gray-400 dark:text-gray-600">
          No change
        </div>
      )}
    </div>
  );
}

// ─── KPI Cards Grid ───────────────────────────────────────────────────────────

interface CostKPICardsProps {
  data: AiCostKPI;
}

export function CostKPICards({ data }: CostKPICardsProps) {
  const cards: CostKPICardData[] = [
    {
      label: "Total API Calls",
      value: data.totalCalls.toLocaleString(),
      delta: data.totalCallsDelta,
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    {
      label: "Total Tokens",
      value: formatTokens(data.totalTokens),
      delta: data.totalTokensDelta,
      icon: <Hash className="w-3.5 h-3.5" />,
    },
    {
      label: "Estimated Cost",
      value: formatCost(data.totalCost),
      delta: data.totalCostDelta,
      icon: <DollarSign className="w-3.5 h-3.5" />,
    },
    {
      label: "Avg Cost / Call",
      value: formatCostPrecise(data.avgCostPerCall),
      icon: <Calculator className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <CostKPICard key={card.label} {...card} />
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CostKPICardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Label row skeleton */}
      <div className="h-3 w-28 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-4" />
      {/* Value skeleton */}
      <div className="h-7 w-24 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-3" />
      {/* Delta skeleton */}
      <div className="h-3 w-14 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
  );
}

export function CostKPICardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CostKPICardSkeleton key={i} />
      ))}
    </div>
  );
}
