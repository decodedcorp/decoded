"use client";

import type { PostStatus } from "@/lib/api/admin/posts";

interface PostStatusFilterProps {
  currentStatus: PostStatus | undefined;
  onStatusChange: (status: PostStatus | undefined) => void;
}

const STATUS_OPTIONS: {
  label: string;
  value: PostStatus | undefined;
  dotColor: string | null;
}[] = [
  { label: "All", value: undefined, dotColor: null },
  { label: "Active", value: "active", dotColor: "bg-emerald-400" },
  { label: "Hidden", value: "hidden", dotColor: "bg-yellow-400" },
  { label: "Deleted", value: "deleted", dotColor: "bg-red-400" },
];

export function PostStatusFilter({
  currentStatus,
  onStatusChange,
}: PostStatusFilterProps) {
  return (
    <div
      className="flex gap-2 flex-wrap"
      role="group"
      aria-label="Filter by status"
    >
      {STATUS_OPTIONS.map(({ label, value, dotColor }) => {
        const isActive = currentStatus === value;

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
