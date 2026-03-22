import { apiClient } from "./client";

export interface SavedPostStatsResponse {
  user_has_saved: boolean;
}

export async function fetchSavedPostStatus(
  postId: string
): Promise<SavedPostStatsResponse> {
  return apiClient<SavedPostStatsResponse>({
    path: `/api/v1/posts/${postId}/saved`,
    method: "GET",
    requiresAuth: false,
  });
}

export async function savePost(postId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/posts/${postId}/saved`,
    method: "POST",
    requiresAuth: true,
  });
}

export async function unsavePost(postId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/posts/${postId}/saved`,
    method: "DELETE",
    requiresAuth: true,
  });
}
