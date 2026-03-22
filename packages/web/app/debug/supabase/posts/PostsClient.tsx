/**
 * DEBUG ONLY: Client Component version using React Query
 *
 * This component is for debugging/reference purposes only.
 * Production code should use image-based components instead.
 *
 * This demonstrates the React Query pattern:
 * Supabase query function → React Query hook → Component
 */
"use client";

import { useLatestPosts } from "@/lib/hooks/debug/usePosts";

export function PostsClient() {
  const { data: posts, isLoading, error, isFetching } = useLatestPosts(10);

  return (
    <div className="mt-8 p-6 border-t-2 border-blue-200">
      <h2 className="text-xl font-semibold mb-2 text-blue-700">
        Client Component (React Query)
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        This section uses React Query hook (useLatestPosts) for client-side data
        fetching. Data is cached and shared across components using the same
        query key.
      </p>

      {isLoading && (
        <div className="text-sm text-gray-500 mb-4">Loading posts...</div>
      )}

      {isFetching && !isLoading && (
        <div className="text-sm text-blue-500 mb-4">Refetching...</div>
      )}

      {error && (
        <div className="text-sm text-red-600 mb-4">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {posts && (
        <>
          <div className="bg-blue-50 p-4 rounded mb-4">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(posts, null, 2)}
            </pre>
          </div>
          <div className="text-sm text-gray-500">
            Total posts fetched: {posts.length}
          </div>
        </>
      )}
    </div>
  );
}
