"use client";

import { useState, useMemo, useCallback } from "react";
import { useInfinitePosts, type PostGridItem } from "@/lib/hooks/useImages";
import {
  VerticalFeed,
  VerticalFeedSkeleton,
} from "@/lib/components/VerticalFeed";
import type { FeedCardItem } from "@/lib/components/FeedCard";
import { useFilterStore } from "@/lib/stores/filterStore";
import { useSearchStore } from "@/lib/stores/searchStore";
import {
  FeedHeader,
  FeedTabs,
  NewPostsIndicator,
  type FeedTabValue,
} from "@/lib/components/feed";

/**
 * Feed Client Component - Instagram-style Vertical Feed
 *
 * Uses React Query infinite scroll pattern with REST API:
 * - React Query fetches via /api/v1/posts endpoint
 * - Infinite scroll appends data as user scrolls
 */
export function FeedClient() {
  const activeFilter = useFilterStore((state) => state.activeFilter);
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
  const [activeTab, setActiveTab] = useState<FeedTabValue>("foryou");
  const [newPostCount] = useState(0);

  // Use infinite query hook with REST API
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePosts({
    limit: 20, // Smaller batch for vertical feed (full-width cards)
    category: activeFilter !== "all" ? activeFilter : undefined,
    search: debouncedQuery || undefined,
    sort: "recent",
  });

  // Flatten pages into a single items array with cross-page deduplication
  const items: PostGridItem[] = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return data.pages
      .flatMap((page) => page.items)
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
  }, [data]);

  // Map PostGridItem[] to FeedCardItem[]
  const feedItems: FeedCardItem[] = useMemo(
    () =>
      items
        .filter((post) => post.imageUrl != null)
        .map((post) => ({
          id: post.id,
          imageUrl: post.imageUrl,
          status: undefined, // Posts from API don't have status
          hasItems: post.spotCount > 0,
          postId: post.postId,
          postSource: post.postSource,
          postAccount: post.postAccount,
          postCreatedAt: post.postCreatedAt,
          imageWidth: post.imageWidth ?? null,
          imageHeight: post.imageHeight ?? null,
        })),
    [items]
  );

  // Memoize onReachEnd callback to prevent unnecessary re-renders
  const handleReachEnd = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading state: show skeleton feed (only on initial load)
  if (isLoading && !data) {
    return (
      <div className="flex flex-col h-full">
        <FeedHeader />
        <div className="flex-1 relative">
          <div className="h-full">
            <VerticalFeedSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Error state: show error message with retry button
  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <FeedHeader />
        <div className="flex-1 relative">
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-4 text-4xl">Warning</div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Failed to load images
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong while loading images."}
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
        </div>
      </div>
    );
  }

  // Empty state: show empty state message
  if (!items || items.length === 0) {
    const hasActiveFilter = activeFilter !== "all";
    const hasSearchQuery = debouncedQuery.trim().length > 0;
    const hasFiltersApplied = hasActiveFilter || hasSearchQuery;

    const handleResetFilters = () => {
      useFilterStore.getState().setFilter("all");
      useSearchStore.getState().setQuery("");
      useSearchStore.getState().setDebouncedQuery("");
    };

    return (
      <div className="flex flex-col h-full">
        <FeedHeader />
        <div className="flex-1 relative">
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-8 w-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                {hasFiltersApplied ? "No results found" : "No images yet"}
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                {hasFiltersApplied
                  ? "Try different keywords or filters."
                  : "Check back later."}
              </p>
              {hasFiltersApplied && (
                <button
                  onClick={handleResetFilters}
                  className="rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  type="button"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state: show vertical feed with actual images
  return (
    <div className="flex flex-col h-full">
      <FeedHeader />
      <div className="px-4 md:px-12 lg:px-16">
        <FeedTabs value={activeTab} onChange={setActiveTab} />
      </div>
      <NewPostsIndicator
        count={newPostCount}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
      <div className="flex-1 relative">
        <div className="h-full">
          <VerticalFeed
            items={feedItems}
            onReachEnd={handleReachEnd}
            hasMore={!!hasNextPage}
            isLoadingMore={isFetchingNextPage}
          />
        </div>
      </div>
    </div>
  );
}
