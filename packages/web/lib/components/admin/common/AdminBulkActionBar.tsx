"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkAction {
  key: string;
  label: string;
  variant?: "default" | "danger";
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  loading?: boolean;
}

interface AdminBulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}

export function AdminBulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
}: AdminBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-30 mx-auto w-fit animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 shadow-lg">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount} selected
        </span>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              onClick={action.onClick}
              disabled={action.loading}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                action.variant === "danger"
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {action.loading ? "..." : action.label}
            </button>
          );
        })}

        <button
          onClick={onClearSelection}
          className="ml-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
