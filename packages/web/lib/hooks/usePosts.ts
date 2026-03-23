import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchPostWithSpotsAndSolutions,
  fetchPostWithImagesAndItems,
  type PostDetail,
  type LegacyPostDetail,
} from "@/lib/supabase/queries/posts";
import { listPosts } from "@/lib/api/generated/posts/posts";
import { updatePost, deletePost } from "@/lib/api/posts";
import type {
  Post,
  PostsListResponse,
  PostsListParams,
  UpdatePostDto,
  PostResponse,
} from "@/lib/api/types";

// ============================================================
// Query Keys
// ============================================================

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (params: UseInfinitePostsParams) =>
    [...postKeys.lists(), params] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// ============================================================
// Query Hooks
// ============================================================

/**
 * React Query hook for fetching a single post with its spots and solutions
 *
 * @param id - Post ID to fetch
 * @returns React Query result with data, loading, error states
 */
export function usePostById(id: string) {
  return useQuery<PostDetail | null>({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPostWithSpotsAndSolutions(id),
    enabled: !!id,
  });
}

/**
 * React Query hook for fetching a single post in legacy format
 * @deprecated Use usePostById instead
 *
 * @param id - Post ID to fetch
 * @returns React Query result with legacy data format
 */
export function usePostByIdLegacy(id: string) {
  return useQuery<LegacyPostDetail | null>({
    queryKey: ["posts", "detail", "legacy", id],
    queryFn: () => fetchPostWithImagesAndItems(id),
    enabled: !!id,
  });
}

// ============================================================
// Infinite Posts Hook (REST API)
// ============================================================

export interface UseInfinitePostsParams {
  perPage?: number;
  sort?: "recent" | "popular" | "trending";
  artistName?: string;
  groupName?: string;
  context?: string;
  category?: string;
  userId?: string;
}

export interface PostsPage {
  items: Post[];
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * React Query hook for fetching infinite posts with page-based pagination
 * Uses REST API instead of direct Supabase queries
 */
export function useInfinitePosts(params: UseInfinitePostsParams = {}) {
  const {
    perPage = 20,
    sort = "recent",
    artistName,
    groupName,
    context,
    category,
    userId,
  } = params;

  return useInfiniteQuery<PostsPage>({
    queryKey: [
      "posts",
      "infinite",
      { perPage, sort, artistName, groupName, context, category, userId },
    ],
    queryFn: async ({ pageParam }): Promise<PostsPage> => {
      const page = (pageParam as number) ?? 1;

      const response = await listPosts({
        page,
        per_page: perPage,
        sort,
        artist_name: artistName,
        group_name: groupName,
        context,
        category,
        user_id: userId,
      });

      return {
        items: response.data as any as Post[],
        currentPage: response.pagination.current_page,
        totalPages: response.pagination.total_pages,
        hasMore:
          response.pagination.current_page < response.pagination.total_pages,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================
// Mutation Hooks
// ============================================================

/**
 * Mutation hook for updating a post
 * Invalidates both post detail and lists after success
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: UpdatePostDto }) =>
      updatePost(postId, data),
    onSuccess: (updatedPost, { postId }) => {
      // Update cache with new data
      queryClient.setQueryData(postKeys.detail(postId), updatedPost);
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
    onError: (error) => {
      console.error("[useUpdatePost] Failed to update post:", error);
    },
  });
}

/**
 * Mutation hook for deleting a post
 * Invalidates lists after success, removes detail from cache
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (_, postId) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: postKeys.detail(postId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
    onError: (error) => {
      console.error("[useDeletePost] Failed to delete post:", error);
    },
  });
}

// Re-export types for convenience
export type {
  Post,
  PostsListResponse,
  PostsListParams,
  PostDetail,
  LegacyPostDetail,
};
