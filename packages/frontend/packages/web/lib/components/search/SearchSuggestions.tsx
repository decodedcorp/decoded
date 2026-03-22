"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { Clock, TrendingUp, X } from "lucide-react";
import { useRecentSearchesStore } from "@decoded/shared";
import { usePopularSearches } from "../../hooks/useSearch";

interface SearchSuggestionsProps {
  query: string;
  selectedIndex: number;
  onSelect: (query: string) => void;
  onClose: () => void;
}

/**
 * Search suggestions dropdown
 *
 * Features:
 * - Recent searches section
 * - Popular searches section
 * - Keyboard navigation support
 * - Click to select
 */
export const SearchSuggestions = memo(function SearchSuggestions({
  query,
  selectedIndex,
  onSelect,
  onClose: _onClose,
}: SearchSuggestionsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Recent searches from localStorage
  const recentSearches = useRecentSearchesStore((s) => s.searches);
  const removeRecentSearch = useRecentSearchesStore((s) => s.removeSearch);
  const clearAllRecent = useRecentSearchesStore((s) => s.clearAll);

  // Popular searches from API
  const { data: popularData } = usePopularSearches();
  const popularSearches = popularData?.data || [];

  // Filter recent searches based on query
  const filteredRecent = query
    ? recentSearches.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      )
    : recentSearches;

  // Build items array for keyboard navigation
  const items: Array<{ type: "recent" | "popular"; value: string }> = [
    ...filteredRecent.slice(0, 5).map((value) => ({
      type: "recent" as const,
      value,
    })),
    ...popularSearches.slice(0, 5).map(({ query }) => ({
      type: "popular" as const,
      value: query,
    })),
  ];

  // Handle keyboard selection
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      const handleEnter = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSelect(items[selectedIndex].value);
        }
      };

      document.addEventListener("keydown", handleEnter);
      return () => document.removeEventListener("keydown", handleEnter);
    }
  }, [selectedIndex, items, onSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleRemoveRecent = useCallback(
    (e: React.MouseEvent, searchQuery: string) => {
      e.stopPropagation();
      removeRecentSearch(searchQuery);
    },
    [removeRecentSearch]
  );

  const handleClearAllRecent = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearAllRecent();
    },
    [clearAllRecent]
  );

  const hasContent = filteredRecent.length > 0 || popularSearches.length > 0;

  if (!hasContent) {
    return null;
  }

  let itemIndex = 0;

  return (
    <div
      ref={listRef}
      role="listbox"
      className="absolute top-full left-0 right-0 mt-1 py-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto"
    >
      {/* Recent Searches Section */}
      {filteredRecent.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent Searches
            </span>
            <button
              onClick={handleClearAllRecent}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          {filteredRecent.slice(0, 5).map((searchQuery) => {
            const currentIndex = itemIndex++;
            const isSelected = currentIndex === selectedIndex;

            return (
              <button
                key={`recent-${searchQuery}`}
                data-index={currentIndex}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(searchQuery)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                  isSelected
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate">{searchQuery}</span>
                <button
                  onClick={(e) => handleRemoveRecent(e, searchQuery)}
                  className="p-0.5 rounded hover:bg-accent transition-colors"
                  aria-label={`Remove ${searchQuery} from recent searches`}
                >
                  <X className="h-3 w-3" />
                </button>
              </button>
            );
          })}
        </div>
      )}

      {/* Divider */}
      {filteredRecent.length > 0 && popularSearches.length > 0 && (
        <div className="border-t border-border my-2" />
      )}

      {/* Popular Searches Section */}
      {popularSearches.length > 0 && (
        <div>
          <div className="px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Popular
            </span>
          </div>
          {popularSearches.slice(0, 5).map(({ rank, query: searchQuery }) => {
            const currentIndex = itemIndex++;
            const isSelected = currentIndex === selectedIndex;

            return (
              <button
                key={`popular-${searchQuery}`}
                data-index={currentIndex}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(searchQuery)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                  isSelected
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <TrendingUp className="h-4 w-4 flex-shrink-0 text-orange-500" />
                <span className="flex-1 truncate">{searchQuery}</span>
                <span className="text-xs text-muted-foreground">#{rank}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
