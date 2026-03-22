"use client";

import { useMemo, useCallback } from "react";
import { useInfinitePosts, type PostGridItem } from "@/lib/hooks/useImages";
import {
  VerticalFeed,
  VerticalFeedSkeleton,
} from "@/lib/components/VerticalFeed";
import type { FeedCardItem } from "@/lib/components/FeedCard";
import { useFilterStore } from "@/lib/stores/filterStore";
import { useSearchStore } from "@/lib/stores/searchStore";

type Props = {
  initialImages?: unknown[];
};

/**
 * Home Client Component - Instagram-style Vertical Feed
 *
 * Uses 백엔드 API (GET /api/v1/posts)
 */
export function HomeClient({ initialImages: _initialImages }: Props) {
  const activeFilter = useFilterStore((state) => state.activeFilter);
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);

  // Use REST API
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
    limit: 20,
    category: activeFilter !== "all" ? activeFilter : undefined,
    search: debouncedQuery || undefined,
    sort: "recent",
  });

  // Flatten pages with deduplication
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
          hasItems: post.spotCount > 0,
          postId: post.postId,
          postSource: post.postSource,
          postAccount: post.postAccount,
          postCreatedAt: post.postCreatedAt,
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
      <div className="absolute inset-0 z-0 pt-14 pb-16 md:pt-4 md:pb-0">
        <VerticalFeedSkeleton />
      </div>
    );
  }

  // Error state: show error message with retry button
  if (isError) {
    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center pt-14 pb-16 md:pt-4 md:pb-0">
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
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
    );
  }

  // Empty state: show empty state message
  if (!items || items.length === 0) {
    const hasActiveFilter = activeFilter !== "all";
    const hasSearchQuery = debouncedQuery.trim().length > 0;

    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center pt-14 pb-16 md:pt-4 md:pb-0">
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-4 text-4xl">📷</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            {hasActiveFilter || hasSearchQuery
              ? "No images found"
              : "No images found yet."}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasActiveFilter || hasSearchQuery
              ? "Try adjusting your filters or search query."
              : "Check back later or try adjusting your filters."}
          </p>
        </div>
      </div>
    );
  }

  // Success state: show vertical feed with actual images
  return (
    <div className="absolute inset-0 z-0 pt-14 pb-16 md:pt-4 md:pb-0">
      <VerticalFeed
        items={feedItems}
        onReachEnd={handleReachEnd}
        hasMore={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
      />
    </div>
  );
}
