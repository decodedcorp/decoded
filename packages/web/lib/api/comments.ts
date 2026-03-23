import { apiClient } from "./client";

export interface CommentUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  rank: string;
}

export interface CommentResponse {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  user: CommentUser;
  created_at: number;
  updated_at: number;
  replies: CommentResponse[];
}

export interface CreateCommentDto {
  content: string;
  parent_id?: string | null;
}

export async function createComment(
  postId: string,
  dto: CreateCommentDto
): Promise<CommentResponse> {
  return apiClient<CommentResponse>({
    path: `/api/v1/posts/${postId}/comments`,
    method: "POST",
    body: dto,
    requiresAuth: true,
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  return apiClient<void>({
    path: `/api/v1/comments/${commentId}`,
    method: "DELETE",
    requiresAuth: true,
  });
}
