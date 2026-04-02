"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useInfinitePosts, type PostGridItem } from "@/lib/hooks/useImages";
import ThiingsGrid, { type GridItem } from "@/lib/components/ThiingsGrid";
import { useSearchStore } from "@/lib/stores/searchStore";
import {
  ExploreCardCell,
  ExploreSkeletonCell,
  TrendingArtistsSection,
} from "@/lib/components/explore";
import { LoadingSpinner } from "@/lib/design-system";

type Props = {
  initialPosts?: PostGridItem[];
  /** magazine_id가 있는 post만 표시 (Editorial 탭용) */
  hasMagazine?: boolean;
};

/**
 * Explore Client Component - Pinterest-style Masonry Grid
 *
 * Uses REST API for data fetching:
 * - GET /api/v1/posts with pagination
 * - Supports category filtering via API params
 */
export function ExploreClient({ initialPosts: _initialPosts, hasMagazine }: Props) {
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);

  // Responsive grid size: smaller on mobile, larger on desktop
  const [gridSize, setGridSize] = useState({ width: 400, height: 500 });

  useEffect(() => {
    const updateGridSize = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      setGridSize(
        isMobile
          ? { width: 180, height: 225 } // Mobile: smaller cells
          : { width: 400, height: 500 } // Desktop: original size
      );
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  // Use the REST API hook for fetching posts
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
    limit: 40,
    hasMagazine: hasMagazine ?? false,
  });

  // Flatten pages into a single items array
  const items: PostGridItem[] = useMemo(() => {
    return data ? data.pages.flatMap((page) => page.items) : [];
  }, [data]);

  // Map PostGridItem to GridItem[]
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
        ...(hasMagazine &&
          item.title != null && { editorialTitle: item.title }),
        ...(item.spotCount != null &&
          item.spotCount > 0 && { spotCount: item.spotCount }),
      }));
  }, [items, hasMagazine]);

  // Render full-screen ThiingsGrid with filter bar
  return (
    <div className="relative h-[calc(100dvh-120px)] md:h-[calc(100dvh-72px)] flex flex-col">
      {/* Trending artists section — only shown on Explore tab, not Editorial */}
      {!hasMagazine && <TrendingArtistsSection />}

      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={debouncedQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {/* Loading state: show skeleton grid (only on initial load) */}
            {isLoading && !data && (
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

            {/* Error state: show error message with retry button */}
            {isError && (
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <div className="mb-4 text-4xl">⚠️</div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">
                    Failed to load posts
                  </h2>
                  <p className="mb-6 max-w-md text-sm text-muted-foreground">
                    {(() => {
                      // Log error for debugging
                      console.error(
                        "[ExploreClient] Posts fetch error:",
                        error
                      );
                      // Display appropriate error message
                      if (error instanceof Error) {
                        return error.message;
                      }
                      if (typeof error === "object" && error !== null) {
                        return JSON.stringify(error);
                      }
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

            {/* Empty state: show empty state message */}
            {!isError && !isLoading && items.length === 0 && (
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                  <div className="mb-4 text-4xl">📷</div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">
                    {debouncedQuery.trim().length > 0
                      ? "No posts found"
                      : "No posts found yet."}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {debouncedQuery.trim().length > 0
                      ? "Try adjusting your search query."
                      : "Check back later."}
                  </p>
                </div>
              </div>
            )}

            {/* Success state: show grid with actual posts */}
            {!isError && items.length > 0 && (
              <div className="absolute inset-0 z-0">
                <ThiingsGrid
                  gridSize={gridSize}
                  renderItem={(config) => <ExploreCardCell {...config} />}
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

                {/* Loading indicator for next page */}
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
