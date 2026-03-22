"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useSearchStore } from "@decoded/shared";
import type { SearchTab } from "@decoded/shared/types/search";
import { useSearchURLSync } from "../../lib/hooks/useSearchURLSync";
import { useGroupedSearch } from "../../lib/hooks/useSearch";
import {
  SearchInput,
  SearchTabs,
  SearchResults,
  RecentSearches,
  TrendingSearches,
} from "../../lib/components/search";

interface SearchPageClientProps {
  initialQuery: string;
  initialTab: string;
}

export function SearchPageClient({
  initialQuery,
  initialTab,
}: SearchPageClientProps) {
  const router = useRouter();

  // Initialize store with URL params on mount
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setDebouncedQuery = useSearchStore((s) => s.setDebouncedQuery);
  const setActiveTab = useSearchStore((s) => s.setActiveTab);
  const debouncedQuery = useSearchStore((s) => s.debouncedQuery);
  const activeTab = useSearchStore((s) => s.activeTab);
  const filters = useSearchStore((s) => s.filters);

  // Sync URL with store
  useSearchURLSync({ skipInitialSync: true });

  // Initialize from props on mount
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
    if (
      initialTab &&
      ["all", "people", "media", "items"].includes(initialTab)
    ) {
      setActiveTab(initialTab as SearchTab);
    }
  }, []); // Only run once on mount

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
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header: back button + search input */}
      <header className="flex items-center gap-4 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <SearchInput
            autoFocus={!initialQuery}
            showSuggestions={false}
            placeholder="Search people, shows, items..."
          />
        </div>
      </header>

      {/* Content: recent searches or results */}
      <div className="overflow-y-auto" style={{ height: "calc(100vh - 72px)" }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {!query ? (
            // Show recent searches + trending when no query
            <div className="space-y-8">
              <RecentSearches onSelect={handleRecentSelect} />
              <TrendingSearches onSelect={handleRecentSelect} />
            </div>
          ) : (
            <>
              {/* Query Display */}
              {debouncedQuery && (
                <div className="mb-4">
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
                className="mb-4"
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
    </div>
  );
}
