"use client";

import { useEffect, useRef, memo } from "react";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchStore } from "@decoded/shared";
import { SearchInput } from "./SearchInput";
import { SearchTabs } from "./SearchTabs";
import { SearchResults } from "./SearchResults";
import { RecentSearches } from "./RecentSearches";
import { useGroupedSearch } from "../../hooks/useSearch";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

/**
 * Full-screen search overlay with slide-in animation
 *
 * Features:
 * - Slides in from top with smooth animation
 * - Shows recent searches when no query
 * - Shows tabbed results when query exists
 * - Multiple close behaviors: back button, escape key, backdrop click
 */
export const SearchOverlay = memo(function SearchOverlay({
  isOpen,
  onClose,
  initialQuery = "",
}: SearchOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Store state
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const debouncedQuery = useSearchStore((s) => s.debouncedQuery);
  const activeTab = useSearchStore((s) => s.activeTab);
  const filters = useSearchStore((s) => s.filters);

  // Initialize query from prop
  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
    }
  }, [isOpen, initialQuery, setQuery]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when overlay is open
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Handle recent search selection
  const handleRecentSelect = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  // Fetch search results
  const { data, groupedData, isLoading, isError } = useGroupedSearch({
    query: debouncedQuery,
    tab: activeTab,
    category: filters.category,
    mediaType: filters.mediaType,
    context: filters.context,
    hasAdopted: filters.hasAdopted,
    sort: filters.sort,
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 bg-background overflow-y-auto"
        >
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Header */}
            <header className="flex items-center gap-4 mb-6">
              <button
                onClick={onClose}
                className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Close search"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="flex-1">
                <SearchInput
                  autoFocus
                  showSuggestions={false}
                  placeholder="Search people, shows, items..."
                />
              </div>
            </header>

            {/* Content */}
            <div className="space-y-4">
              {!query ? (
                // Show recent searches when no query
                <RecentSearches onSelect={handleRecentSelect} />
              ) : (
                // Show results when query exists
                <>
                  {/* Query Display */}
                  {debouncedQuery && (
                    <div>
                      <h1 className="text-xl font-semibold text-foreground">
                        Results for &ldquo;{debouncedQuery}&rdquo;
                      </h1>
                      {data?.pagination && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {data.pagination.total_items} results found
                          {data.took_ms && ` in ${data.took_ms}ms`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tabs */}
                  <SearchTabs
                    facets={data?.facets}
                    totalCount={data?.pagination?.total_items}
                  />

                  {/* Results */}
                  <SearchResults
                    data={data}
                    groupedData={groupedData}
                    isLoading={isLoading}
                    isError={isError}
                    query={debouncedQuery}
                  />
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
