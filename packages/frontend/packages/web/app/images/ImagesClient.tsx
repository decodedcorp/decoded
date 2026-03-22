"use client";

import { useInfinitePosts } from "@/lib/hooks/usePosts";
import { ImageCard } from "./ImageCard";
import { ImageCardSkeleton } from "./ImageCardSkeleton";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";

/**
 * Client Component for images feed
 *
 * Uses post-based data fetching via REST API:
 * - Uses useInfinitePosts from @/lib/hooks/usePosts
 * - Displays posts from the posts table
 * - Cards link to /posts/[id] instead of /images/[id]
 */
export function ImagesClient() {
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
    perPage: 40,
    sort: "recent",
  });

  // Flatten pages
  const posts = data ? data.pages.flatMap((page) => page.items) : [];

  // Loading state: show skeleton grid
  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ImageCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // Error state: show error component with retry button
  if (isError) {
    return (
      <ErrorState
        error={error instanceof Error ? error : new Error("Unknown error")}
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state: show empty state component
  if (!posts || posts.length === 0) {
    return <EmptyState />;
  }

  // Success state: show post grid with infinite scroll
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {posts.map((post) => (
          <ImageCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load more button or auto-load */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            type="button"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
}
