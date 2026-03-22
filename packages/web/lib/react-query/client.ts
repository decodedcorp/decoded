import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

/**
 * Gets or creates a singleton QueryClient instance
 *
 * This ensures we use the same QueryClient instance across the app,
 * which is important for cache sharing and consistency.
 *
 * @returns QueryClient instance
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Stale time: how long data is considered fresh
          // Data won't be refetched until this time passes
          staleTime: 60 * 1000, // 1 minute
          // Cache time: how long unused data stays in cache
          gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
          // Retry failed requests once
          retry: 1,
          // Refetch on window focus (useful for keeping data fresh)
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return queryClient;
}
