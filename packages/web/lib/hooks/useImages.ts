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
import { fetchPostMagazine } from "@/lib/api/posts";
import { listPosts, getPost } from "@/lib/api/generated/posts/posts";
import { postDetailToImageDetail } from "@/lib/api/adapters/postDetailToImageDetail";
import type {
  CategoryFilter,
  ImagePage,
  ImagePageWithPostId,
  ImageDetail,
  ImageRow,
} from "@decoded/shared/supabase/queries/images";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { fetchPostWithSpotsAndSolutions } from "@/lib/supabase/queries/posts";
import type { ItemRow } from "@/lib/components/detail/types";
import type { Post, PostsListParams, PostMagazineResponse } from "@/lib/api/types";

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
}) {
  const {
    limit = 40,
    category,
    search,
    artistName,
    groupName,
    sort = "recent",
    hasMagazine,
  } = params;

  return useInfiniteQuery<PostsPage>({
    queryKey: [
      "posts",
      "infinite",
      { category, search, artistName, groupName, sort, limit, hasMagazine },
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

      if (category && category !== "all") {
        query = query.eq("context", category);
      }
      if (artistName) {
        query = query.ilike("artist_name", `%${artistName}%`);
      }
      if (groupName) {
        query = query.ilike("group_name", `%${groupName}%`);
      }
      // Note: hasMagazine filter not yet supported via Supabase query

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

      const items: PostGridItem[] = (data ?? []).map((post: any) => ({
        id: post.id,
        imageUrl: post.image_url,
        postId: post.id,
        postSource: "post" as const,
        postAccount: post.artist_name ?? post.group_name ?? "",
        postCreatedAt: post.created_at,
        spotCount: 0,
        viewCount: post.view_count,
        // editorial 오버레이: 매거진 타이틀 우선, 없으면 post.title
        title:
          post.post_magazine_title ?? post.title ?? null,
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

function parsePosition(val: string): number {
  const num = parseFloat(val.replace("%", ""));
  return num > 1 ? num / 100 : num;
}

/**
 * Fetch post detail via Supabase and convert to ImageDetail for ImageDetailContent
 */
export function usePostDetailForImage(postId: string) {
  return useQuery<ImageDetail | null>({
    queryKey: ["posts", "detail", "image", postId],
    queryFn: async () => {
      const result = await fetchPostWithSpotsAndSolutions(postId);
      if (!result) return null;

      const { post, spots, solutions } = result;

      const items: ItemRow[] = spots.map((spot, idx) => {
        const sol = solutions.find((s) => s.spot_id === spot.id);
        const citationUrl = sol?.affiliate_url ?? sol?.original_url ?? null;
        const citations = citationUrl ? [citationUrl] : null;
        return {
          id: idx + 1,
          image_id: post.id,
          spot_id: spot.id,
          spot_index: idx + 1,
          brand: null,
          product_name: sol?.title ?? null,
          cropped_image_path: sol?.thumbnail_url ?? null,
          price: (() => {
            const m = sol?.metadata as
              | { price?: string | { amount?: string } }
              | undefined;
            if (!m?.price) return null;
            return typeof m.price === "string"
              ? m.price
              : (m.price?.amount ?? null);
          })(),
          description: null,
          status: spot.status ?? null,
          created_at: spot.created_at ?? null,
          bboxes: null,
          center: [
            parsePosition(spot.position_left),
            parsePosition(spot.position_top),
          ] as [number, number],
          scores: null,
          ambiguity: null,
          citations,
          metadata: null,
          sam_prompt: null,
        };
      });

      return {
        id: postId,
        image_hash: "",
        image_url: post.image_url,
        status: post.status as
          | "pending"
          | "extracted"
          | "skipped"
          | "extracted_metadata",
        with_items: items.length > 0,
        created_at: post.created_at,
        items,
        posts: [
          {
            id: post.id,
            account: post.artist_name ?? post.group_name ?? "",
            article: post.context ?? null,
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
              article: post.context ?? null,
              created_at: post.created_at,
              item_ids: null,
              metadata: [],
              ts: post.created_at,
            } as any,
            created_at: post.created_at,
            item_locations: spots.map((s, idx) => ({
              item_id: idx + 1,
              center: [
                parsePosition(s.position_left),
                parsePosition(s.position_top),
              ],
            })),
            item_locations_updated_at: post.updated_at,
          } as any,
        ],
      };
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
      return fetchPostMagazine(magazineId);
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
