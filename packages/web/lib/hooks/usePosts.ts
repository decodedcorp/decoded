import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getPost,
  listPosts,
  updatePost as updatePostGenerated,
  deletePost as deletePostGenerated,
} from "@/lib/api/generated/posts/posts";
import type {
  Post,
  PostsListResponse,
  PostsListParams,
} from "@/lib/api/mutation-types";
import type {
  UpdatePostDto,
  PostDetailResponse,
} from "@/lib/api/generated/models";

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
 * Uses backend REST API instead of direct Supabase queries
 *
 * @param id - Post ID to fetch
 * @returns React Query result with data, loading, error states
 */
export function usePostById(id: string) {
  return useQuery<PostDetailResponse>({
    queryKey: postKeys.detail(id),
    queryFn: () => getPost(id),
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
        items: response.data as unknown as Post[],
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
      updatePostGenerated(postId, data),
    onSuccess: (_, { postId }) => {
      // Invalidate detail — postKeys.detail holds Supabase PostDetail shape,
      // not PostResponse, so setQueryData would be a cross-boundary type mismatch
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
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
    mutationFn: (postId: string) => deletePostGenerated(postId),
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
export type { Post, PostsListResponse, PostsListParams, PostDetailResponse };
