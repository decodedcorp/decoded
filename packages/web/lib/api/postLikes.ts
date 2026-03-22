import { apiClient } from "./client";

export interface PostLikeStatsResponse {
  like_count: number;
  user_has_liked: boolean;
}

export async function fetchPostLikeStats(
  postId: string
): Promise<PostLikeStatsResponse> {
  return apiClient<PostLikeStatsResponse>({
    path: `/api/v1/posts/${postId}/likes`,
    method: "GET",
    requiresAuth: false,
  });
}

export async function createPostLike(postId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/posts/${postId}/likes`,
    method: "POST",
    requiresAuth: true,
  });
}

export async function deletePostLike(postId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/posts/${postId}/likes`,
    method: "DELETE",
    requiresAuth: true,
  });
}
