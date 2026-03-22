"use client";

import { memo } from "react";
import { Clock, X } from "lucide-react";
import { useRecentSearchesStore } from "@decoded/shared";

interface RecentSearchesProps {
  onSelect: (query: string) => void;
  maxItems?: number;
}

/**
 * Recent searches display with clear functionality
 *
 * Features:
 * - Shows up to maxItems recent searches
 * - Individual clear per item
 * - Clear all functionality
 * - Empty state message
 */
export const RecentSearches = memo(function RecentSearches({
  onSelect,
  maxItems = 8,
}: RecentSearchesProps) {
  const searches = useRecentSearchesStore((s) => s.searches);
  const removeSearch = useRecentSearchesStore((s) => s.removeSearch);
  const clearAll = useRecentSearchesStore((s) => s.clearAll);

  const displayedSearches = searches.slice(0, maxItems);

  if (displayedSearches.length === 0) {
    return (
      <div className="py-12 text-center">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No recent searches</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Recent Searches</h2>
        <button
          onClick={clearAll}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Search items */}
      <ul className="space-y-1">
        {displayedSearches.map((search, index) => (
          <li key={`${search}-${index}`}>
            <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
              <button
                onClick={() => onSelect(search)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground truncate">
                  {search}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearch(search);
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 md:opacity-100 hover:bg-accent transition-all"
                aria-label={`Remove ${search}`}
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
