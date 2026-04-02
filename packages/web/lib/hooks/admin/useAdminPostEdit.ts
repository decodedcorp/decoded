/**
 * Hook for admin post metadata editing.
 *
 * PATCH /api/v1/admin/posts/:postId
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdatePostParams {
  postId: string;
  group_name?: string;
  artist_name?: string;
  context?: string;
}

export function useAdminUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, ...body }: UpdatePostParams) => {
      const res = await fetch(`/api/v1/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Failed to update post: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}
