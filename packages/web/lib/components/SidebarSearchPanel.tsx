"use client";

import { memo, useEffect, useRef, useCallback } from "react";
import { X, Search, Clock, TrendingUp } from "lucide-react";
import {
  useSearchStore,
  useRecentSearchesStore,
  useDebounce,
} from "@decoded/shared";
import { useSearchNavigation } from "../hooks/useSearchURLSync";
import { usePopularSearches } from "../hooks/useSearch";

interface SidebarSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SidebarSearchPanel - Slide-out search panel for desktop sidebar
 *
 * Features:
 * - Slides out from sidebar on Search click
 * - Integrated search input with debounce
 * - Recent and popular searches
 * - Enter to navigate to /search page
 * - Click outside / ESC to close
 */
export const SidebarSearchPanel = memo(
  ({ isOpen, onClose }: SidebarSearchPanelProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Search store
    const query = useSearchStore((s) => s.query);
    const setQuery = useSearchStore((s) => s.setQuery);
    const setDebouncedQuery = useSearchStore((s) => s.setDebouncedQuery);
    const debounced = useDebounce(query, 250);

    // Recent searches
    const recentSearches = useRecentSearchesStore((s) => s.searches);
    const clearRecentSearches = useRecentSearchesStore((s) => s.clearAll);

    // Popular searches
    const { data: popularData } = usePopularSearches(isOpen);
    const popularSearches = popularData?.data || [];

    // Navigation
    const { navigateToSearch } = useSearchNavigation();

    // Update debounced query
    useEffect(() => {
      setDebouncedQuery(debounced);
    }, [debounced, setDebouncedQuery]);

    // Focus input when panel opens
    useEffect(() => {
      if (isOpen && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 200);
      }
    }, [isOpen]);

    // Click outside handler
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const sidebar = document.querySelector(
          '[aria-label="Main navigation"]'
        );
        if (sidebar?.contains(e.target as Node)) {
          return;
        }

        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      };

      if (isOpen) {
        const timeoutId = setTimeout(() => {
          document.addEventListener("mousedown", handleClickOutside);
        }, 0);

        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isOpen, onClose]);

    // Escape key handler
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
      }
    }, [isOpen, onClose]);

    const handleClearSearch = useCallback(() => {
      setQuery("");
      inputRef.current?.focus();
    }, [setQuery]);

    const handleSearch = useCallback(
      (searchQuery: string) => {
        if (searchQuery.trim()) {
          navigateToSearch(searchQuery.trim());
          onClose();
        }
      },
      [navigateToSearch, onClose]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && query.trim()) {
          handleSearch(query);
        } else if (e.key === "Escape") {
          if (query) {
            setQuery("");
          } else {
            onClose();
          }
        }
      },
      [query, handleSearch, setQuery, onClose]
    );

    return (
      <div
        ref={panelRef}
        className={`fixed top-0 h-screen z-40 hidden md:block
                    left-14 lg:left-[200px]
                    w-[300px] bg-background border-r border-border
                    shadow-lg
                    transition-transform duration-200 ease-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"}`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Search</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Close search panel"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 rounded-md px-3 py-2 bg-accent/50">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              aria-label="Search"
              placeholder="Search people, shows, items..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
              type="text"
            />
            {query && (
              <button
                className="rounded p-0.5 transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
                onClick={handleClearSearch}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recent
              </h3>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-0.5">
              {recentSearches.slice(0, 5).map((search) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Searches */}
        {popularSearches.length > 0 && (
          <div className="p-3">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2 uppercase tracking-wide">
              Popular
            </h3>
            <div className="space-y-0.5">
              {popularSearches
                .slice(0, 5)
                .map(({ rank, query: searchQuery }) => (
                  <button
                    key={searchQuery}
                    onClick={() => handleSearch(searchQuery)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                  >
                    <TrendingUp className="h-4 w-4 flex-shrink-0 text-orange-500" />
                    <span className="flex-1 truncate">{searchQuery}</span>
                    <span className="text-xs text-muted-foreground">
                      #{rank}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SidebarSearchPanel.displayName = "SidebarSearchPanel";
