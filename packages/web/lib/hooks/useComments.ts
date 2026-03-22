import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchComments,
  createComment,
  deleteComment,
  type CommentResponse,
  type CreateCommentDto,
} from "@/lib/api/comments";

export const commentKeys = {
  all: ["comments"] as const,
  list: (postId: string) => [...commentKeys.all, "list", postId] as const,
};

export function useComments(postId: string) {
  return useQuery({
    queryKey: commentKeys.list(postId),
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCommentDto) => createComment(postId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
    },
  });
}

function flatCount(comments: CommentResponse[]): number {
  return comments.reduce(
    (acc, c) => acc + 1 + (c.replies ? flatCount(c.replies) : 0),
    0
  );
}

export function useCommentCount(postId: string) {
  const { data } = useComments(postId);
  return data ? flatCount(data) : 0;
}
