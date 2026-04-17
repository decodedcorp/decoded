"use client";

import {
  MAGAZINE_STATUSES,
  type MagazineStatus,
} from "@/lib/api/admin/magazines";

interface Props {
  value: MagazineStatus | undefined;
  onChange: (next: MagazineStatus | undefined) => void;
}

const STATUS_DOT: Record<MagazineStatus, string> = {
  draft: "bg-gray-400",
  pending: "bg-yellow-400",
  published: "bg-emerald-400",
  rejected: "bg-red-400",
};

export function MagazineStatusFilter({ value, onChange }: Props) {
  return (
    <div
      className="flex gap-2 flex-wrap"
      role="group"
      aria-label="Filter by magazine status"
    >
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-pressed={value === undefined}
        className={[
          "px-3 py-1.5 rounded-full text-sm transition-colors",
          value === undefined
            ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
        ].join(" ")}
      >
        All
      </button>
      {MAGAZINE_STATUSES.map((s) => {
        const isActive = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={isActive}
            className={[
              "px-3 py-1.5 rounded-full text-sm capitalize transition-colors flex items-center gap-1.5",
              isActive
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            ].join(" ")}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s]}`}
              aria-hidden="true"
            />
            {s}
          </button>
        );
      })}
    </div>
  );
}
