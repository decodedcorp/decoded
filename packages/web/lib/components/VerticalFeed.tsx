"use client";

import { useEffect, useRef, memo } from "react";
import { FeedCard, FeedCardSkeleton, type FeedCardItem } from "./FeedCard";

interface VerticalFeedProps {
  items: FeedCardItem[];
  onReachEnd?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

/**
 * VerticalFeed - Responsive grid feed with vertical scrolling
 *
 * Features:
 * - Responsive grid layout (1 col mobile, 2 cols sm, 3 cols lg, 4 cols xl)
 * - Full-width layout with responsive padding
 * - Vertical scroll with native browser scrolling
 * - Infinite scroll with IntersectionObserver
 * - Smooth loading states
 */
export const VerticalFeed = memo(
  ({
    items,
    onReachEnd,
    hasMore = false,
    isLoadingMore = false,
  }: VerticalFeedProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Infinite scroll using IntersectionObserver
    useEffect(() => {
      const sentinel = sentinelRef.current;
      const scrollContainer = scrollContainerRef.current;

      if (!sentinel || !onReachEnd || !hasMore) return;
      if (!scrollContainer) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !isLoadingMore) {
            onReachEnd();
          }
        },
        {
          root: scrollContainer,
          rootMargin: "200px",
          threshold: 0,
        }
      );

      observer.observe(sentinel);

      return () => {
        observer.disconnect();
      };
    }, [onReachEnd, hasMore, isLoadingMore]);

    return (
      <div ref={scrollContainerRef} className="h-full overflow-y-auto">
        <div className="w-full px-4 md:px-6 lg:px-8 py-4 pb-20 md:pb-4">
          {/* Feed cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {items.map((item, index) => (
              <FeedCard
                key={item.id}
                item={item}
                index={index}
                priority={index < 3} // First 3 cards get priority loading
              />
            ))}
          </div>

          {/* Loading indicator */}
          {isLoadingMore && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <FeedCardSkeleton />
              <FeedCardSkeleton />
              <FeedCardSkeleton />
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />
          )}

          {/* End of feed message */}
          {!hasMore && items.length > 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              You&apos;ve reached the end
            </div>
          )}
        </div>
      </div>
    );
  }
);

VerticalFeed.displayName = "VerticalFeed";

/**
 * VerticalFeedSkeleton - Loading state for entire feed
 */
export const VerticalFeedSkeleton = memo(() => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 md:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <FeedCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
});

VerticalFeedSkeleton.displayName = "VerticalFeedSkeleton";
