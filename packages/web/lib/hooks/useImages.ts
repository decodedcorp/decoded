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
import { getPost } from "@/lib/api/generated/posts/posts";
import { postDetailToImageDetail } from "@/lib/api/adapters/postDetailToImageDetail";
import { fetchPostWithSpotsAndSolutions } from "@/lib/supabase/queries/posts";
import { spotToItemRow } from "@/lib/components/detail/types";
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
  } = params;

  return useInfiniteQuery<PostsPage>({
    queryKey: [
      "posts",
      "infinite",
      { category, search, artistName, groupName, sort, limit, hasMagazine, mediaName, castName, contextType },
    ],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) ?? 1;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabaseBrowserClient
        .from("posts")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .not("image_url", "is", null);

      // category filter (flat) — skip if contextType is set (hierarchical takes precedence)
      if (category && category !== "all" && !contextType) {
        query = query.eq("context", category);
      }
      if (artistName) {
        query = query.ilike("artist_name", `%${artistName}%`);
      }
      if (groupName) {
        query = query.ilike("group_name", `%${groupName}%`);
      }
      if (hasMagazine) {
        query = query.not("post_magazine_id", "is", null);
      }

      // mediaName from hierarchical filter — matches group_name column
      if (mediaName) {
        query = query.ilike("group_name", `%${mediaName}%`);
      }
      // castName from hierarchical filter — matches artist_name column
      if (castName) {
        query = query.ilike("artist_name", `%${castName}%`);
      }
      // contextType from hierarchical filter — matches context column exactly
      if (contextType) {
        query = query.eq("context", contextType);
      }

      // Sort
      if (sort === "popular") {
        query = query.order("view_count", { ascending: false });
      } else if (sort === "trending") {
        query = query.order("trending_score", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const totalItems = count ?? 0;
      const totalPages = Math.ceil(totalItems / limit);
      const hasMore = page < totalPages;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: PostGridItem[] = (data ?? []).map((post: any) => ({
        id: post.id,
        imageUrl: post.image_url,
        postId: post.id,
        postSource: "post" as const,
        postAccount: post.artist_name ?? post.group_name ?? "",
        postCreatedAt: post.created_at,
        spotCount: post.spot_count ?? 0,
        viewCount: post.view_count,
        // editorial 오버레이: hasMagazine=true 시 post_magazine_title이 항상 non-null임
        // (Supabase 필터: .not("post_magazine_id", "is", null) 보장)
        // 방어적 fallback: post_magazine_title 없는 경우 post.title 사용, 둘 다 없으면 null
        title: post.post_magazine_title ?? post.title ?? null,
      }));

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
 * Tries REST API first (production), falls back to Supabase direct (dev without backend).
 */
export function usePostDetailForImage(postId: string) {
  return useQuery<ImageDetail | null>({
    queryKey: ["posts", "detail", "image", postId],
    queryFn: async () => {
      // 1. Try REST API (works when backend is running)
      try {
        const response = await getPost(postId);
        return postDetailToImageDetail(response, postId);
      } catch {
        // Backend unavailable — fall through to Supabase
      }

      // 2. Fallback: Supabase direct query
      try {
        const result = await fetchPostWithSpotsAndSolutions(postId);
        if (!result) return null;

        const { post, spots, solutions } = result;
        // DB has columns not in PostRow type (post_magazine_id, ai_summary, etc.)
        const postAny = post as Record<string, unknown>;

        const items = spots.map((spot) => {
          const topSolution = solutions.find((s) => s.spot_id === spot.id);
          return spotToItemRow(spot, topSolution);
        });

        return {
          id: post.id,
          image_hash: "",
          image_url: post.image_url,
          status: (post.status ?? "pending") as "pending" | "extracted" | "skipped" | "extracted_metadata",
          with_items: items.length > 0,
          created_at: post.created_at,
          items,
          posts: [
            {
              id: post.id,
              account: post.artist_name ?? post.group_name ?? "",
              article: post.media_title ?? null,
              created_at: post.created_at,
              item_ids: null,
              metadata: [],
              ts: post.created_at,
            } as any,
          ],
          postImages: [
            {
              post: {
                id: post.id,
                account: post.artist_name ?? post.group_name ?? "",
                article: post.media_title ?? null,
                created_at: post.created_at,
              } as any,
              created_at: post.created_at,
              item_locations: spots.map((s, idx) => ({
                item_id: idx + 1,
                center: [parseFloat(s.position_left), parseFloat(s.position_top)],
              })),
              item_locations_updated_at: post.updated_at,
            } as any,
          ],
          // Extended fields (exist in DB but not in PostRow type)
          post_owner_id: post.user_id ?? null,
          post_magazine_id: (postAny.post_magazine_id as string) ?? null,
          ai_summary: (postAny.ai_summary as string) ?? null,
          artist_name: post.artist_name ?? null,
          group_name: post.group_name ?? null,
          created_with_solutions: (postAny.created_with_solutions as boolean) ?? null,
          like_count: (postAny.like_count as number) ?? 0,
        } as ImageDetail;
      } catch {
        return null;
      }
    },
    enabled: !!postId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
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
