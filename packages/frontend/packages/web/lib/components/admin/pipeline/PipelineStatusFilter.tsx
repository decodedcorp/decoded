"use client";

import type { PipelineStatus } from "@/lib/api/admin/pipeline";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineStatusFilterProps {
  value: PipelineStatus | undefined; // undefined = "All"
  onChange: (status: PipelineStatus | undefined) => void;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  label: string;
  value: PipelineStatus | undefined;
  dotColor: string | null;
}[] = [
  { label: "All", value: undefined, dotColor: null },
  { label: "Completed", value: "completed", dotColor: "bg-emerald-400" },
  { label: "Running", value: "running", dotColor: "bg-blue-400" },
  { label: "Failed", value: "failed", dotColor: "bg-red-400" },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pill-shaped filter buttons for pipeline execution statuses.
 * Follows the same pattern as audit StatusFilter.tsx.
 */
export function PipelineStatusFilter({
  value,
  onChange,
}: PipelineStatusFilterProps) {
  return (
    <div
      className="flex gap-2 flex-wrap"
      role="group"
      aria-label="Filter by pipeline status"
    >
      {STATUS_OPTIONS.map(({ label, value: optionValue, dotColor }) => {
        const isActive = value === optionValue;

        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={isActive}
            className={[
              "px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5",
              isActive
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            ].join(" ")}
          >
            {dotColor && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
                aria-hidden="true"
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
