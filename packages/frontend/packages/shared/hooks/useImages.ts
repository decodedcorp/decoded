import {
  useQuery,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchLatestImages,
  fetchFilteredImages,
  fetchImageById,
  fetchUnifiedImages,
  fetchRelatedImagesByAccount,
  type CategoryFilter,
  type ImagePage,
  type ImagePageWithPostId,
  type ImageDetail,
  type ImageRow,
} from "../supabase/queries/images";

/**
 * @deprecated Use useInfiniteFilteredImages with unified adapter instead.
 */
export function useLatestImages(limit = 20) {
  return useQuery<ImageRow[]>({
    queryKey: ["images", "latest", limit],
    queryFn: () => fetchLatestImages(limit),
  });
}

/**
 * React Query hook for fetching a single image by ID
 */
export function useImageById(id: string) {
  return useQuery<ImageDetail | null>({
    queryKey: ["images", "detail", id],
    queryFn: () => fetchImageById(id),
    enabled: !!id,
  });
}

/**
 * @deprecated Use useInfiniteFilteredImages instead for infinite scrolling
 */
export function useFilteredImages(
  filter: CategoryFilter = "all",
  searchQuery: string = "",
  limit: number = 50
) {
  return useQuery<ImagePage>({
    queryKey: ["images", "filtered", { filter, searchQuery, limit }],
    queryFn: () => fetchFilteredImages({ filter, search: searchQuery, limit }),
    placeholderData: keepPreviousData,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * React Query hook for fetching infinite filtered images with cursor-based pagination
 */
export function useInfiniteFilteredImages(params: {
  limit: number;
  filter?: CategoryFilter;
  search?: string;
  deduplicateByImageId?: boolean;
}) {
  const {
    limit,
    filter = "all",
    search = "",
    deduplicateByImageId = false,
  } = params;

  return useInfiniteQuery<ImagePageWithPostId>({
    queryKey: [
      "images",
      "infinite",
      { filter, search, limit, deduplicateByImageId },
    ],
    queryFn: ({ pageParam }) =>
      fetchUnifiedImages({
        limit,
        cursor: (pageParam as string) ?? null,
        filter,
        search,
        deduplicateByImageId,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: null,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * React Query hook for fetching related images from the same account
 */
export function useRelatedImagesByAccount(
  imageId: string,
  account: string | null | undefined,
  limit: number = 24
) {
  return useQuery<ImageRow[]>({
    queryKey: ["images", "related", account, imageId],
    queryFn: () => fetchRelatedImagesByAccount(imageId, account!, limit),
    enabled: !!account && !!imageId,
    staleTime: 1000 * 60 * 5,
  });
}

// Re-export types
export type { CategoryFilter, ImagePage, ImagePageWithPostId, ImageDetail, ImageRow };
