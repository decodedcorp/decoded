"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// ─── Page range calculator ────────────────────────────────────────────────────

/**
 * Returns the list of items to render in the pagination row.
 * Items can be page numbers (number) or ellipsis markers ("...").
 *
 * Strategy:
 * - If totalPages <= 7: show all pages
 * - Otherwise: show first, last, current ± 1 neighbor, with "..." for gaps
 */
function getPageItems(
  currentPage: number,
  totalPages: number
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | "...")[] = [];
  const neighbors = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  // Clamp to valid range
  const sorted = Array.from(neighbors)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  sorted.forEach((page, idx) => {
    if (idx > 0 && page - sorted[idx - 1] > 1) {
      items.push("...");
    }
    items.push(page);
  });

  return items;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Generic page number pagination with ellipsis for large page counts.
 * Reusable across admin pages.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const pageItems = getPageItems(currentPage, totalPages);

  const baseBtn =
    "w-8 h-8 rounded-md text-sm flex items-center justify-center transition-colors";
  const activeBtn = `${baseBtn} bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium`;
  const inactiveBtn = `${baseBtn} text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800`;
  const disabledBtn = `${baseBtn} text-gray-300 dark:text-gray-600 opacity-40 cursor-not-allowed`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center gap-1"
        role="navigation"
        aria-label="Pagination"
      >
        {/* Previous */}
        <button
          type="button"
          onClick={() => !isFirst && onPageChange(currentPage - 1)}
          disabled={isFirst}
          aria-label="Previous page"
          className={isFirst ? disabledBtn : inactiveBtn}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pageItems.map((item, idx) =>
          item === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-sm text-gray-400 dark:text-gray-600"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
              className={item === currentPage ? activeBtn : inactiveBtn}
            >
              {item}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => !isLast && onPageChange(currentPage + 1)}
          disabled={isLast}
          aria-label="Next page"
          className={isLast ? disabledBtn : inactiveBtn}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page info */}
      <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}
