"use client";

import { Clock, FileImage, ShoppingBag, MousePointerClick } from "lucide-react";
import type { TodaySummary as TodaySummaryData } from "@/lib/api/admin/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodaySummaryProps {
  data: TodaySummaryData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats ISO timestamp to "HH:MM" in local time */
function formatTime(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Metric Item ──────────────────────────────────────────────────────────────

interface MetricItemProps {
  icon: React.ReactNode;
  iconBgClass: string;
  label: string;
  value: number;
}

function MetricItem({ icon, iconBgClass, label, value }: MetricItemProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Icon circle */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgClass}`}
      >
        {icon}
      </div>
      {/* Text */}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {value.toLocaleString("en-US")}
        </p>
      </div>
    </div>
  );
}

// ─── Today Summary ────────────────────────────────────────────────────────────

export function TodaySummary({ data }: TodaySummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Today&apos;s Activity
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          Updated at {formatTime(data.timestamp)}
        </span>
      </div>

      {/* Metrics row */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
        <MetricItem
          icon={<FileImage className="w-4 h-4 text-blue-500" />}
          iconBgClass="bg-blue-50 dark:bg-blue-950"
          label="New Posts"
          value={data.newPosts}
        />
        <MetricItem
          icon={<ShoppingBag className="w-4 h-4 text-emerald-500" />}
          iconBgClass="bg-emerald-50 dark:bg-emerald-950"
          label="New Solutions"
          value={data.newSolutions}
        />
        <MetricItem
          icon={<MousePointerClick className="w-4 h-4 text-amber-500" />}
          iconBgClass="bg-amber-50 dark:bg-amber-950"
          label="Clicks"
          value={data.clicks}
        />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MetricItemSkeleton() {
  return (
    <div className="flex items-center gap-3">
      {/* Icon circle skeleton */}
      <div className="w-8 h-8 rounded-full animate-pulse bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
      {/* Text skeletons */}
      <div>
        <div className="h-3 w-20 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-1.5" />
        <div className="h-4 w-12 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}

export function TodaySummarySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-3 w-28 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-3 w-24 animate-pulse bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
      </div>
      {/* Metrics skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
        <MetricItemSkeleton />
        <MetricItemSkeleton />
        <MetricItemSkeleton />
      </div>
    </div>
  );
}
