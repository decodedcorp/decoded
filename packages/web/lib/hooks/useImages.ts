/**
 * React Query hooks for images
 *
 * These hooks are defined in web package to avoid QueryClient context issues
 * in monorepo setup. They use query functions from shared package.
 */

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
} from "@decoded/shared/supabase/queries/images";
import { getPost, listPosts } from "@/lib/api/generated/posts/posts";
import { postDetailToImageDetail } from "@/lib/api/adapters/postDetailToImageDetail";
import type {
  CategoryFilter,
  ImagePage,
  ImagePageWithPostId,
  ImageDetail,
  ImageRow,
} from "@decoded/shared/supabase/queries/images";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import type { PostMagazineResponse } from "@/lib/api/mutation-types";

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
 * @deprecated Supabase 직접 조회. usePostDetailForImage(백엔드 API) 사용 권장
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
    deduplicateByImageId = true,
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

// ============================================================
// Posts API Hook (Replaces Supabase direct queries)
// ============================================================

/**
 * Post mapped to grid-compatible format
 */
export type PostGridItem = {
  id: string;
  imageUrl: string;
  postId: string;
  postSource: "post";
  postAccount: string;
  postCreatedAt: string;
  spotCount: number;
  viewCount: number;
  /** 에디토리얼 그리드 오버레이용 (post.title 또는 post_magazine_title) */
  title?: string | null;
  /** Meilisearch highlight (검색 결과에서만) */
  highlight?: Record<string, string> | null;
  /** DB-stored dimensions for CLS prevention */
  imageWidth?: number | null;
  imageHeight?: number | null;
};

/**
 * Infinite query result for posts
 */
export type PostsPage = {
  items: PostGridItem[];
  nextPage: number | null;
  hasMore: boolean;
};

/**
 * React Query hook for fetching infinite posts via Supabase
 */
export function useInfinitePosts(params: {
  limit?: number;
  category?: string;
  search?: string;
  artistName?: string;
  groupName?: string;
  sort?: "recent" | "popular" | "trending";
  hasMagazine?: boolean;
  /** Display name from hierarchical filter (e.g., "NewJeans") — matched via ilike on group_name */
  mediaName?: string;
  /** Display name from hierarchical filter (e.g., "Minji") — matched via ilike on artist_name */
  castName?: string;
  contextType?: string;
  enabled?: boolean;
}) {
  const {
    limit = 40,
    category,
    search,
    artistName,
    groupName,
    sort = "recent",
    hasMagazine,
    mediaName,
    castName,
    contextType,
    enabled = true,
  } = params;

  return useInfiniteQuery<PostsPage>({
    queryKey: [
      "posts",
      "infinite",
      {
        category,
        search,
        artistName,
        groupName,
        sort,
        limit,
        hasMagazine,
        mediaName,
        castName,
        contextType,
      },
    ],
    enabled,
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) ?? 1;

      // REST API
      const response = await listPosts({
        page,
        per_page: limit,
        sort,
        has_magazine: true,
        artist_name: mediaName ?? artistName,
        group_name: castName ? undefined : groupName,
        context:
          contextType ??
          (category && category !== "all" ? category : undefined),
      });

      const items: PostGridItem[] = response.data.map((post) => ({
        id: post.id,
        imageUrl: post.image_url,
        postId: post.id,
        postSource: "post" as const,
        postAccount: post.artist_name ?? post.group_name ?? "",
        postCreatedAt: post.created_at,
        spotCount: post.spot_count ?? 0,
        viewCount: post.view_count,
        title: post.post_magazine_title ?? post.title ?? null,
        imageWidth: (post as Record<string, unknown>).image_width as
          | number
          | null,
        imageHeight: (post as Record<string, unknown>).image_height as
          | number
          | null,
      }));

      const totalPages = response.pagination.total_pages;
      const hasMore = page < totalPages;
      return { items, nextPage: hasMore ? page + 1 : null, hasMore };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    retry: 2,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch post detail and convert to ImageDetail for ImageDetailContent.
 *
 * When `serverData` is provided (prefetched by RSC), the query starts with
 * that data immediately — no client-side fetch waterfall.
 */
export function usePostDetailForImage(
  postId: string,
  serverData?: ImageDetail
) {
  return useQuery<ImageDetail | null>({
    queryKey: ["posts", "detail", "image", postId],
    queryFn: async () => {
      const response = await getPost(postId);
      return postDetailToImageDetail(response, postId);
    },
    enabled: !!postId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    initialData: serverData ?? undefined,
  });
}

// ============================================================
// Post Magazine hooks
// ============================================================

export function usePostMagazine(magazineId: string | null | undefined) {
  return useQuery<PostMagazineResponse | null>({
    queryKey: ["post-magazines", magazineId],
    queryFn: async () => {
      if (!magazineId) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseBrowserClient as any)
        .from("post_magazines")
        .select("*")
        .eq("id", magazineId)
        .single();

      if (error || !data) {
        if (process.env.NODE_ENV === "development") {
          console.error("[usePostMagazine] Error:", error);
        }
        return null;
      }

      return data as unknown as PostMagazineResponse;
    },
    enabled: !!magazineId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// Re-export types for convenience
export type {
  CategoryFilter,
  ImagePage,
  ImagePageWithPostId,
  ImageDetail,
  ImageRow,
};
