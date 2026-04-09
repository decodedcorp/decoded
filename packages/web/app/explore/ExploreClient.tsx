"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X, ChevronDown } from "lucide-react";
import { useDebounce, useRecentSearchesStore } from "@decoded/shared";
import { useExploreData } from "@/lib/hooks/useExploreData";
import type { PostGridItem } from "@/lib/hooks/useImages";
import { FilterChip } from "@/lib/components/explore/FilterChip";
import ThiingsGrid, { type GridItem } from "@/lib/components/ThiingsGrid";
import { useSearchStore } from "@/lib/stores/searchStore";
import { ExploreCardCell, ExploreSkeletonCell } from "@/lib/components/explore";
import { LoadingSpinner } from "@/lib/design-system/loading-spinner";
import { SearchSuggestions } from "@/lib/components/search/SearchSuggestions";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "relevant", label: "Relevant" },
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Popular" },
  { value: "solution_count", label: "Most Solutions" },
] as const;

type Props = {
  initialPosts?: PostGridItem[];
  hasMagazine?: boolean;
  initialQuery?: string;
};

export function ExploreClient({
  initialPosts: _initialPosts,
  hasMagazine,
  initialQuery = "",
}: Props) {
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
  const query = useSearchStore((state) => state.query);
  const setQuery = useSearchStore((state) => state.setQuery);
  const setDebouncedQuery = useSearchStore((state) => state.setDebouncedQuery);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const debouncedValue = useDebounce(query, 300);
  useEffect(() => {
    setDebouncedQuery(debouncedValue);
  }, [debouncedValue, setDebouncedQuery]);

  // Initialize from server-provided URL query

  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, []);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const addRecentSearch = useRecentSearchesStore((s) => s.addSearch);

  useEffect(() => {
    if (query.length > 0) {
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  const handleSuggestionSelect = useCallback(
    (selectedQuery: string) => {
      setQuery(selectedQuery);
      setDebouncedQuery(selectedQuery);
      setShowSuggestions(false);
      addRecentSearch(selectedQuery);
      inputRef.current?.blur();
    },
    [setQuery, setDebouncedQuery, addRecentSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => prev + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(-1, prev - 1));
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [showSuggestions]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [setQuery, setDebouncedQuery]);

  // Responsive grid size
  const [gridSize, setGridSize] = useState({ width: 400, height: 500 });

  useEffect(() => {
    const updateGridSize = () => {
      const isMobile = window.innerWidth < 768;
      setGridSize(
        isMobile ? { width: 180, height: 225 } : { width: 400, height: 500 }
      );
    };
    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  const {
    items,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    mode,
    artistFacets,
    contextFacets,
    selectedArtists,
    toggleArtist,
    clearArtistFilters,
    activeContext,
    setContext,
    activeSort,
    setSort,
  } = useExploreData({
    hasMagazine: hasMagazine ?? false,
  });

  // Force card visibility — ThiingsGrid's IntersectionObserver may not fire on initial mount
  useEffect(() => {
    if (!gridRef.current) return;
    const timer = setTimeout(() => {
      const cards = gridRef.current?.querySelectorAll(".js-observe");
      cards?.forEach((el) => {
        el.classList.add("is-visible");
        el.classList.remove("is-hidden");
      });
    }, 800); // Wait for physics engine to settle
    return () => clearTimeout(timer);
  }, [items.length]); // Re-run when items change

  const gridItems: GridItem[] = useMemo(() => {
    return items
      .filter((item) => item.imageUrl != null)
      .map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        postId: item.postId,
        postSource: item.postSource,
        postAccount: item.postAccount,
        postCreatedAt: item.postCreatedAt,
        ...(item.title != null && { editorialTitle: item.title }),
        ...(item.spotCount != null &&
          item.spotCount > 0 && { spotCount: item.spotCount }),
        ...(item.highlight && { highlight: item.highlight }),
      }));
  }, [items, hasMagazine]);

  // Context dropdown options from facets
  const contextOptions = useMemo(() => {
    return Object.entries(contextFacets)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [contextFacets]);

  // Artist badges sorted by count
  const artistBadges = useMemo(() => {
    return Object.entries(artistFacets)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [artistFacets]);

  const hasActiveFilters =
    selectedArtists.length > 0 ||
    activeContext !== null ||
    activeSort !== "relevant";

  return (
    <div className="relative h-[calc(100dvh-120px)] md:h-[calc(100dvh-72px)] flex flex-col">
      {/* Search input */}
      <div ref={containerRef} className="relative px-4 pt-3 pb-1 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search people, shows, items..."
            className="w-full rounded-full border border-border bg-card/80 py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query.length > 0 && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {showSuggestions && (
          <div className="absolute left-4 right-4 top-full z-50 mt-1 rounded-xl border border-border bg-card shadow-lg">
            <SearchSuggestions
              query={query}
              selectedIndex={selectedIndex}
              onSelect={handleSuggestionSelect}
              onClose={() => setShowSuggestions(false)}
            />
          </div>
        )}
      </div>

      {/* Filter bar — Sort always visible, Context + artist badges in search mode */}
      <div className="px-4 py-2 shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Sort dropdown — always visible */}
        <div className="relative flex-shrink-0">
          <select
            value={activeSort}
            onChange={(e) => setSort(e.target.value)}
            className={cn(
              "appearance-none rounded-full pl-3 pr-7 py-1 text-xs font-medium border transition-colors cursor-pointer bg-transparent",
              activeSort !== "relevant"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
        </div>

        {/* Context dropdown — search mode only */}
        {mode === "search" && contextOptions.length > 0 && (
          <div className="relative flex-shrink-0">
            <select
              value={activeContext ?? ""}
              onChange={(e) =>
                setContext(e.target.value === "" ? null : e.target.value)
              }
              className={cn(
                "appearance-none rounded-full pl-3 pr-7 py-1 text-xs font-medium border transition-colors cursor-pointer bg-transparent",
                activeContext
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <option value="">Context</option>
              {contextOptions.map(([value, count]) => (
                <option key={value} value={value}>
                  {value} ({count})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
          </div>
        )}

        {/* Artist badges — search mode only */}
        {mode === "search" &&
          artistBadges.map(([name, count]) => (
            <FilterChip
              key={name}
              label={name}
              count={count}
              active={selectedArtists.includes(name)}
              onClick={() => toggleArtist(name)}
              onRemove={() => toggleArtist(name)}
            />
          ))}

        {/* Clear all — when any filter is active */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              clearArtistFilters();
              setContext(null);
              setSort("relevant");
            }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-1"
            type="button"
          >
            Clear all
          </button>
        )}
      </div>

      <div ref={gridRef} className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={debouncedQuery}
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {/* Loading state */}
            {isLoading && items.length === 0 && (
              <div className="absolute inset-0 z-0">
                <ThiingsGrid
                  gridSize={gridSize}
                  renderItem={() => <ExploreSkeletonCell />}
                  initialPosition={{ x: 0, y: 0 }}
                  items={[]}
                  hasMore={true}
                />
              </div>
            )}

            {/* Error state — browse mode only (search mode falls through to fallback) */}
            {isError && mode !== "search" && (
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <div className="mb-4 text-4xl">⚠️</div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">
                    Failed to load posts
                  </h2>
                  <p className="mb-6 max-w-md text-sm text-muted-foreground">
                    {(() => {
                      console.error(
                        "[ExploreClient] Posts fetch error:",
                        error
                      );
                      if (error instanceof Error) return error.message;
                      if (typeof error === "object" && error !== null)
                        return JSON.stringify(error);
                      return "Something went wrong while loading posts.";
                    })()}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    type="button"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Empty/error state with search suggestions */}
            {((!isError && !isLoading && items.length === 0) || (isError && mode === "search")) && (
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center max-w-md">
                  <div className="mb-4 text-4xl">
                    {debouncedQuery.trim().length > 0 ? "🔍" : "📷"}
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">
                    {debouncedQuery.trim().length > 0
                      ? `'${debouncedQuery}'에 대한 결과가 없습니다`
                      : "No posts found yet."}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {debouncedQuery.trim().length > 0
                      ? "검색어를 변경하거나 아래 추천 검색어를 시도해보세요."
                      : "Check back later."}
                  </p>
                  {debouncedQuery.trim().length > 0 && (
                    <>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {["BLACKPINK", "NewJeans", "Lisa", "Jennie", "Minji", "Hanni"].map(
                          (tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleSuggestionSelect(tag)}
                              className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:border-primary/30"
                            >
                              {tag}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      >
                        검색어 지우기
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Grid */}
            {!isError && items.length > 0 && (
              <div className="absolute inset-0 z-0">
                <ThiingsGrid
                  gridSize={gridSize}
                  renderItem={(config) => (
                    <ExploreCardCell
                      {...config}
                    />
                  )}
                  initialPosition={{ x: 0, y: 0 }}
                  items={gridItems}
                  onReachEnd={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                      fetchNextPage();
                    }
                  }}
                  hasMore={!!hasNextPage}
                  isLoadingMore={isFetchingNextPage}
                />

                {isFetchingNextPage && (
                  <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 shadow-lg">
                    <LoadingSpinner text="Loading more..." />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
