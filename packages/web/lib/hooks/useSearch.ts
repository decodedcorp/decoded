/**
 * React Query hooks for search functionality
 *
 * Based on API spec: docs/api/search.md
 */

import {
  useQuery,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchUnifiedSearch,
  fetchPopularSearches,
  fetchPopularKeywords,
  groupSearchResults,
  getMockSearchResponse,
  getMockPopularSearches,
  getMockPopularKeywords,
} from "@decoded/shared/api/search";
import type {
  SearchParams,
  SearchResponse,
  PopularSearchesResponse,
  PopularKeywordsResponse,
  GroupedSearchResults,
  SearchTab,
} from "@decoded/shared/types/search";

// ============================================================
// Configuration
// ============================================================

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_SEARCH === "true";

// ============================================================
// Unified Search Hook
// ============================================================

export interface UseUnifiedSearchParams {
  query: string;
  tab?: SearchTab;
  category?: string;
  mediaType?: string;
  context?: string;
  hasAdopted?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook for unified search with all filters
 */
export function useUnifiedSearch({
  query,
  tab = "all",
  category,
  mediaType,
  context,
  hasAdopted,
  sort = "relevant",
  page = 1,
  limit = 20,
  enabled = true,
}: UseUnifiedSearchParams) {
  const isEnabled = enabled && query.length >= 2;

  return useQuery<SearchResponse>({
    queryKey: [
      "search",
      "unified",
      {
        query,
        tab,
        category,
        mediaType,
        context,
        hasAdopted,
        sort,
        page,
        limit,
      },
    ],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        return getMockSearchResponse(query);
      }

      const params: SearchParams = {
        q: query,
        page,
        limit,
        sort: sort as SearchParams["sort"],
      };

      if (category) params.category = category as SearchParams["category"];
      if (mediaType)
        params.media_type = mediaType as SearchParams["media_type"];
      if (context) params.context = context as SearchParams["context"];
      if (hasAdopted !== undefined) params.has_adopted = hasAdopted;

      return fetchUnifiedSearch(params);
    },
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================
// Grouped Search Results Hook
// ============================================================

/**
 * Hook for search with results grouped by type (for "All" tab)
 */
export function useGroupedSearch(params: UseUnifiedSearchParams) {
  const searchResult = useUnifiedSearch(params);

  const groupedData: GroupedSearchResults | undefined = searchResult.data
    ? groupSearchResults(searchResult.data.data)
    : undefined;

  return {
    ...searchResult,
    groupedData,
  };
}

// ============================================================
// Infinite Search Hook
// ============================================================

/**
 * Hook for infinite scroll search results
 */
export function useInfiniteSearch({
  query,
  tab = "all",
  category,
  mediaType,
  context,
  hasAdopted,
  sort = "relevant",
  limit = 20,
  enabled = true,
}: Omit<UseUnifiedSearchParams, "page">) {
  const isEnabled = enabled && query.length >= 2;

  return useInfiniteQuery<SearchResponse>({
    queryKey: [
      "search",
      "infinite",
      {
        query,
        tab,
        category,
        mediaType,
        context,
        hasAdopted,
        sort,
        limit,
      },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const mockResponse = getMockSearchResponse(query);
        return {
          ...mockResponse,
          pagination: {
            ...mockResponse.pagination,
            current_page: pageParam as number,
          },
        };
      }

      const params: SearchParams = {
        q: query,
        page: pageParam as number,
        limit,
        sort: sort as SearchParams["sort"],
      };

      if (category) params.category = category as SearchParams["category"];
      if (mediaType)
        params.media_type = mediaType as SearchParams["media_type"];
      if (context) params.context = context as SearchParams["context"];
      if (hasAdopted !== undefined) params.has_adopted = hasAdopted;

      return fetchUnifiedSearch(params);
    },
    getNextPageParam: (lastPage) => {
      const { current_page, total_pages } = lastPage.pagination;
      return current_page < total_pages ? current_page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isEnabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
}

// ============================================================
// Popular Searches Hook
// ============================================================

/**
 * Hook for fetching popular search terms
 */
export function usePopularSearches(enabled = true) {
  return useQuery<PopularSearchesResponse>({
    queryKey: ["search", "popular"],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return getMockPopularSearches();
      }
      return fetchPopularSearches();
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// ============================================================
// Popular Keywords Hook
// ============================================================

/**
 * Hook for fetching popular keywords (for empty state chips)
 */
export function usePopularKeywords(enabled = true) {
  return useQuery<PopularKeywordsResponse>({
    queryKey: ["search", "keywords", "popular"],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return getMockPopularKeywords();
      }
      return fetchPopularKeywords();
    },
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

// ============================================================
// Search Suggestions Hook
// ============================================================

/**
 * Hook for search suggestions/autocomplete
 * Uses lightweight search with small limit
 */
export function useSearchSuggestions(query: string, enabled = true) {
  const isEnabled = enabled && query.length >= 2;

  return useQuery<SearchResponse>({
    queryKey: ["search", "suggestions", query],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        const mockResponse = getMockSearchResponse(query);
        return {
          ...mockResponse,
          data: mockResponse.data.slice(0, 5),
        };
      }

      return fetchUnifiedSearch({
        q: query,
        limit: 5,
      });
    },
    enabled: isEnabled,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================================
// Re-export types
// ============================================================

export type {
  SearchParams,
  SearchResponse,
  PopularSearchesResponse,
  PopularKeywordsResponse,
  GroupedSearchResults,
  SearchTab,
};
