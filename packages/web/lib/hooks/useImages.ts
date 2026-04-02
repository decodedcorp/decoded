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
      if (hasMagazine) {
        query = query.not("post_magazine_id", "is", null);
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

      const items: PostGridItem[] = (data ?? []).map((post: any) => ({
        id: post.id,
        imageUrl: post.image_url,
        postId: post.id,
        postSource: "post" as const,
        postAccount: post.artist_name ?? post.group_name ?? "",
        postCreatedAt: post.created_at,
        spotCount: 0,
        viewCount: post.view_count,
        // editorial 오버레이: hasMagazine=true 시 post_magazine_title이 항상 non-null임
        // (Supabase 필터: .not("post_magazine_id", "is", null) 보장)
        // 방어적 fallback: post_magazine_title 없는 경우 post.title 사용, 둘 다 없으면 null
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

/**
 * Fetch post detail via REST API and convert to ImageDetail for ImageDetailContent
 */
export function usePostDetailForImage(postId: string) {
  return useQuery<ImageDetail | null>({
    queryKey: ["posts", "detail", "image", postId],
    queryFn: async () => {
      try {
        const response = await getPost(postId);
        return postDetailToImageDetail(response, postId);
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
