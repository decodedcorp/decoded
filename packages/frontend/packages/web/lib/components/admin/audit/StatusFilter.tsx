"use client";

import type { AuditStatus } from "@/lib/api/admin/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusFilterProps {
  currentStatus: AuditStatus | undefined; // undefined = "All"
  onStatusChange: (status: AuditStatus | undefined) => void;
  /** Optional counts per status for badge display */
  counts?: Record<AuditStatus | "all", number>;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  label: string;
  value: AuditStatus | undefined;
  dotColor: string | null;
}[] = [
  { label: "All", value: undefined, dotColor: null },
  { label: "Pending", value: "pending", dotColor: "bg-yellow-400" },
  { label: "Completed", value: "completed", dotColor: "bg-emerald-400" },
  { label: "Error", value: "error", dotColor: "bg-red-400" },
  { label: "Modified", value: "modified", dotColor: "bg-blue-400" },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pill-shaped filter buttons for audit request statuses.
 * Matches the Vercel admin style from the dashboard.
 */
export function StatusFilter({
  currentStatus,
  onStatusChange,
  counts,
}: StatusFilterProps) {
  return (
    <div
      className="flex gap-2 flex-wrap"
      role="group"
      aria-label="Filter by status"
    >
      {STATUS_OPTIONS.map(({ label, value, dotColor }) => {
        const isActive = currentStatus === value;
        const countKey = value ?? "all";
        const count = counts?.[countKey];

        return (
          <button
            key={label}
            type="button"
            onClick={() => onStatusChange(value)}
            aria-pressed={isActive}
            className={[
              "px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5",
              isActive
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            ].join(" ")}
          >
            {/* Colored status dot (all status options except "All") */}
            {dotColor && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
                aria-hidden="true"
              />
            )}
            {label}
            {/* Optional count badge */}
            {count !== undefined && (
              <span
                className={[
                  "ml-0.5 text-xs tabular-nums",
                  isActive
                    ? "text-white/70 dark:text-gray-900/70"
                    : "text-gray-400 dark:text-gray-500",
                ].join(" ")}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
