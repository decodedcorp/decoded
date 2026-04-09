"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render: (row: T, index: number) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string, dir: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  skeletonRows?: number;
}

export function AdminDataTable<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedIds,
  onSelectionChange,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = "No data found",
  isLoading = false,
  skeletonRows = 5,
}: AdminDataTableProps<T>) {
  const allIds = data.map(rowKey);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds?.has(id));

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allIds));
    }
  }, [allIds, allSelected, onSelectionChange]);

  const toggleOne = useCallback(
    (id: string) => {
      if (!onSelectionChange || !selectedIds) return;
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange]
  );

  const handleSort = (key: string) => {
    if (!onSort) return;
    const nextDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    onSort(key, nextDir);
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-left">
            <tr>
              {selectable && <th className="w-10 px-3 py-3" />}
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {selectable && <td className="px-3 py-3"><div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" /></td>}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 py-12 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900 text-left">
          <tr>
            {selectable && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                  aria-label="Select all"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500",
                  col.sortable && "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300",
                  col.className
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
          {data.map((row, i) => {
            const id = rowKey(row);
            return (
              <tr
                key={id}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900",
                  selectedIds?.has(id) && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(id) ?? false}
                      onChange={() => toggleOne(id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                      aria-label={`Select row ${id}`}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
