"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Search, X } from "lucide-react";
import {
  useSearchStore,
  useRecentSearchesStore,
  useDebounce,
} from "@decoded/shared";
import { useSearchNavigation } from "../../hooks/useSearchURLSync";
import { SearchSuggestions } from "./SearchSuggestions";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";

interface SearchInputProps {
  placeholder?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

/**
 * Enhanced search input with suggestions dropdown
 *
 * Features:
 * - Debounced input
 * - Recent/popular searches dropdown
 * - Keyboard navigation
 * - Enter to search
 */
export const SearchInput = memo(function SearchInput({
  placeholder = "Search people, shows, items...",
  autoFocus = false,
  showSuggestions = true,
  onSearch,
  className = "",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Store state
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setDebouncedQuery = useSearchStore((s) => s.setDebouncedQuery);
  const addRecentSearch = useRecentSearchesStore((s) => s.addSearch);
  const track = useTrackEvent();

  const debouncedQuery = useDebounce(query, 250);
  const { navigateToSearch } = useSearchNavigation();

  // Sync debounced query to store
  useEffect(() => {
    setDebouncedQuery(debouncedQuery);
  }, [debouncedQuery, setDebouncedQuery]);

  // Handle search execution
  const handleSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      // Save to recent searches
      addRecentSearch(trimmed);

      // Track search_query event (submitted queries — not debounced typing)
      track({ event_type: "search_query", metadata: { query: trimmed } });

      if (onSearch) {
        onSearch(trimmed);
      } else {
        navigateToSearch(trimmed);
      }

      // Close suggestions
      setIsFocused(false);
      inputRef.current?.blur();
    },
    [onSearch, navigateToSearch, addRecentSearch, track]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            // Selected suggestion - handled by SearchSuggestions
          } else {
            handleSearch(query);
          }
          break;
        case "Escape":
          if (query) {
            setQuery("");
          } else {
            setIsFocused(false);
            inputRef.current?.blur();
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => prev + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(-1, prev - 1));
          break;
      }
    },
    [query, selectedIndex, setQuery, handleSearch]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, [setQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    if (isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isFocused]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const showDropdown = showSuggestions && isFocused;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input container */}
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 bg-accent/50 border transition-colors ${
          isFocused
            ? "border-primary/50 ring-1 ring-primary/20"
            : "border-transparent"
        }`}
      >
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-label="Search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <SearchSuggestions
          query={query}
          selectedIndex={selectedIndex}
          onSelect={handleSearch}
          onClose={() => setIsFocused(false)}
        />
      )}
    </div>
  );
});
