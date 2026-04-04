"use client";

import { useMemo, useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useInfinitePosts, type PostGridItem } from "./useImages";
import { search } from "@/lib/api/generated/search/search";
import type { SearchResultItem } from "@/lib/api/generated/models";

interface UseExploreDataOptions {
  hasMagazine?: boolean;
}

type FacetMap = Record<string, number>;

interface UseExploreDataReturn {
  items: PostGridItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  mode: "search" | "browse";
  // Facets (client-side aggregated)
  artistFacets: FacetMap;
  contextFacets: FacetMap;
  // Artist filter (client-side, multi-select)
  selectedArtists: string[];
  toggleArtist: (name: string) => void;
  clearArtistFilters: () => void;
  // Context filter (server-side via API)
  activeContext: string | null;
  setContext: (ctx: string | null) => void;
  // Sort (server-side via API)
  activeSort: string;
  setSort: (sort: string) => void;
  refetch: () => void;
}

function mapSearchResultToGridItem(item: SearchResultItem): PostGridItem {
  return {
    id: item.id,
    imageUrl: item.image_url,
    postId: item.id,
    postSource: "post" as const,
    postAccount: item.artist_name ?? item.group_name ?? "",
    postCreatedAt: "",
    spotCount: item.spot_count ?? 0,
    viewCount: item.view_count ?? 0,
    title: null,
    highlight: item.highlight ?? null,
  };
}

/** Build artist + context facets from search results */
function buildFacets(items: SearchResultItem[]): {
  artist: FacetMap;
  context: FacetMap;
} {
  const artist: FacetMap = {};
  const context: FacetMap = {};

  for (const item of items) {
    const name = item.artist_name ?? item.group_name;
    if (name) {
      artist[name] = (artist[name] || 0) + 1;
    }
    if (item.context) {
      context[item.context] = (context[item.context] || 0) + 1;
    }
  }

  return { artist, context };
}

export function useExploreData(
  options: UseExploreDataOptions = {},
): UseExploreDataReturn {
  const { hasMagazine = false } = options;

  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);
  const isSearchMode = debouncedQuery.trim().length > 0;

  // Multi-select artist filter (client-side)
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const toggleArtist = useCallback((name: string) => {
    setSelectedArtists((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }, []);
  const clearArtistFilters = useCallback(() => setSelectedArtists([]), []);

  // Context filter (server-side via API)
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const setContext = useCallback((ctx: string | null) => {
    setActiveContext((prev) => (prev === ctx ? null : ctx));
  }, []);

  // Sort (server-side via API)
  const [activeSort, setActiveSort] = useState("relevant");
  const setSort = useCallback((sort: string) => setActiveSort(sort), []);

  // Browse mode: Supabase via useInfinitePosts
  const browseResult = useInfinitePosts({
    enabled: !isSearchMode,
    limit: 40,
    hasMagazine,
    sort: (activeSort === "recent" ? "recent" : activeSort === "popular" ? "popular" : "recent") as "recent" | "popular" | "trending",
  });

  // Search mode: Meilisearch with API filters
  const searchResult = useInfiniteQuery({
    queryKey: [
      "search",
      "infinite",
      { q: debouncedQuery, context: activeContext, sort: activeSort },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      return search({
        q: debouncedQuery,
        context: activeContext ?? undefined,
        sort: activeSort !== "relevant" ? activeSort : undefined,
        page: pageParam,
        limit: 40,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current_page, total_pages } = lastPage.pagination;
      return current_page < total_pages ? current_page + 1 : undefined;
    },
    enabled: isSearchMode,
  });

  // Build facets from all loaded search results
  const { artistFacets, contextFacets } = useMemo(() => {
    if (!isSearchMode || !searchResult.data?.pages?.length)
      return { artistFacets: {} as FacetMap, contextFacets: {} as FacetMap };
    const allItems = searchResult.data.pages.flatMap((page) => page.data);
    const { artist, context } = buildFacets(allItems);
    return { artistFacets: artist, contextFacets: context };
  }, [isSearchMode, searchResult.data]);

  // Map items + client-side artist filter
  const items: PostGridItem[] = useMemo(() => {
    if (isSearchMode) {
      const allItems = (searchResult.data?.pages ?? []).flatMap((page) =>
        page.data.map(mapSearchResultToGridItem),
      );
      if (selectedArtists.length > 0) {
        return allItems.filter((item) =>
          selectedArtists.includes(item.postAccount),
        );
      }
      return allItems;
    }
    return browseResult.data
      ? browseResult.data.pages.flatMap((page) => page.items)
      : [];
  }, [isSearchMode, searchResult.data, browseResult.data, selectedArtists]);

  const shared = {
    artistFacets,
    contextFacets,
    selectedArtists,
    toggleArtist,
    clearArtistFilters,
    activeContext,
    setContext,
    activeSort,
    setSort,
  };

  if (isSearchMode) {
    return {
      items,
      isLoading: searchResult.isLoading,
      isError: searchResult.isError,
      error: searchResult.error as Error | null,
      fetchNextPage: searchResult.fetchNextPage,
      hasNextPage: !!searchResult.hasNextPage,
      isFetchingNextPage: searchResult.isFetchingNextPage,
      mode: "search",
      ...shared,
      refetch: searchResult.refetch,
    };
  }

  return {
    items,
    isLoading: browseResult.isLoading,
    isError: browseResult.isError,
    error: browseResult.error as Error | null,
    fetchNextPage: browseResult.fetchNextPage,
    hasNextPage: !!browseResult.hasNextPage,
    isFetchingNextPage: browseResult.isFetchingNextPage,
    mode: "browse",
    ...shared,
    refetch: browseResult.refetch,
  };
}
