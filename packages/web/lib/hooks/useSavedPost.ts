import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savePost, unsavePost } from "@/lib/api/savedPosts";

const postDetailKey = (postId: string) =>
  ["posts", "detail", "image", postId] as const;

export function useSavedPost(postId: string) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => savePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postDetailKey(postId) });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => unsavePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postDetailKey(postId) });
    },
  });

  return {
    save: saveMutation.mutateAsync,
    unsave: unsaveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isUnsaving: unsaveMutation.isPending,
    isPending: saveMutation.isPending || unsaveMutation.isPending,
  };
}
