import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPostLike,
  deletePostLike,
} from "@/lib/api/postLikes";

const postDetailKey = (postId: string) =>
  ["posts", "detail", "image", postId] as const;

export function usePostLike(postId: string) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => createPostLike(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postDetailKey(postId) });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: () => deletePostLike(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postDetailKey(postId) });
    },
  });

  return {
    like: likeMutation.mutateAsync,
    unlike: unlikeMutation.mutateAsync,
    isLiking: likeMutation.isPending,
    isUnliking: unlikeMutation.isPending,
    isPending: likeMutation.isPending || unlikeMutation.isPending,
  };
}
