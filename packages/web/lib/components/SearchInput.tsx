"use client";

import React, { memo } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { useSearchStore } from "../stores/searchStore";

/**
 * SearchInput - Responsive search input
 *
 * Features:
 * - Debounced search (250ms)
 * - Clear button on input
 * - Responsive width (mobile/desktop)
 * - Escape key to clear
 */
export const SearchInput = memo(() => {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setDebouncedQuery = useSearchStore((s) => s.setDebouncedQuery);
  const debounced = useDebounce(query, 250);

  React.useEffect(() => {
    setDebouncedQuery(debounced);
  }, [debounced, setDebouncedQuery]);

  return (
    <div className="flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2 backdrop-blur-sm bg-muted/50 border border-input">
      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <input
        aria-label="Search"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQuery("");
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-20 md:w-40 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
        type="text"
      />
      {query && (
        <button
          className="rounded-full p-0.5 transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
          onClick={() => setQuery("")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = "SearchInput";
