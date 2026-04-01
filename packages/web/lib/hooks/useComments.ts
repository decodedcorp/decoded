import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListComments as useListCommentsGenerated,
  createComment as createCommentGenerated,
  deleteComment as deleteCommentGenerated,
} from "@/lib/api/generated/comments/comments";
import type {
  CommentResponse,
  CreateCommentDto,
} from "@/lib/api/generated/models";

export const commentKeys = {
  all: ["comments"] as const,
  list: (postId: string) => [...commentKeys.all, "list", postId] as const,
};

export function useComments(postId: string) {
  return useListCommentsGenerated(postId, {
    query: {
      queryKey: commentKeys.list(postId),
      enabled: !!postId,
    },
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCommentDto) => createCommentGenerated(postId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteCommentGenerated(commentId),
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
