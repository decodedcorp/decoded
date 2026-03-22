"use client";

import {
  Users,
  UserCheck,
  UsersRound,
  FileImage,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { KPIStats } from "@/lib/api/admin/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPICardData {
  label: string;
  value: number;
  delta?: number;
  icon: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// ─── Single KPI Card ─────────────────────────────────────────────────────────

function KPICard({ label, value, delta, icon }: KPICardData) {
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
        {formatNumber(value)}
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

interface KPICardsProps {
  data: KPIStats;
}

export function KPICards({ data }: KPICardsProps) {
  const cards: KPICardData[] = [
    {
      label: "Daily Active Users",
      value: data.dau,
      delta: data.dauDelta,
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      label: "Monthly Active Users",
      value: data.mau,
      delta: data.mauDelta,
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    {
      label: "Total Users",
      value: data.totalUsers,
      delta: data.totalUsersDelta,
      icon: <UsersRound className="w-3.5 h-3.5" />,
    },
    {
      label: "Total Posts",
      value: data.totalPosts,
      delta: data.totalPostsDelta,
      icon: <FileImage className="w-3.5 h-3.5" />,
    },
    {
      label: "Total Solutions",
      value: data.totalSolutions,
      delta: data.totalSolutionsDelta,
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KPICardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Label row skeleton */}
      <div className="h-3 w-28 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-4" />
      {/* Value skeleton */}
      <div className="h-7 w-20 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-3" />
      {/* Delta skeleton */}
      <div className="h-3 w-14 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
  );
}

export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}
