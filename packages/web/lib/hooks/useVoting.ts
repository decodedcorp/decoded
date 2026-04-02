/**
 * Solution Voting Hooks
 * React Query hooks for solution vote CRUD with optimistic updates
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

// ============================================================
// Types
// ============================================================

export interface VoteStats {
  solution_id: string;
  upvotes: number;
  downvotes: number;
  user_vote: "up" | "down" | null;
  is_verified: boolean;
}

export type VoteType = "up" | "down";

// ============================================================
// Query Keys
// ============================================================

export const voteKeys = {
  all: ["votes"] as const,
  stats: (solutionId: string) => [...voteKeys.all, "stats", solutionId] as const,
};

// ============================================================
// useVoteStats - Fetch vote stats for a solution
// ============================================================

export function useVoteStats(solutionId: string) {
  return useQuery({
    queryKey: voteKeys.stats(solutionId),
    queryFn: () =>
      apiClient<VoteStats>({
        path: `/api/v1/solutions/${solutionId}/votes`,
        method: "GET",
      }),
    enabled: !!solutionId,
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================================
// useCreateVote - Create or change vote (optimistic)
// ============================================================

interface CreateVoteVariables {
  solutionId: string;
  voteType: VoteType;
}

export function useCreateVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId, voteType }: CreateVoteVariables) =>
      apiClient<VoteStats>({
        path: `/api/v1/solutions/${solutionId}/votes`,
        method: "POST",
        body: { vote_type: voteType },
        requiresAuth: true,
      }),
    onMutate: async ({ solutionId, voteType }) => {
      await queryClient.cancelQueries({
        queryKey: voteKeys.stats(solutionId),
      });

      const previous = queryClient.getQueryData<VoteStats>(
        voteKeys.stats(solutionId)
      );

      if (previous) {
        const updated = { ...previous };
        // Remove previous vote
        if (previous.user_vote === "up") updated.upvotes--;
        if (previous.user_vote === "down") updated.downvotes--;
        // Add new vote
        if (voteType === "up") updated.upvotes++;
        if (voteType === "down") updated.downvotes++;
        updated.user_vote = voteType;

        queryClient.setQueryData(voteKeys.stats(solutionId), updated);
      }

      return { previous };
    },
    onError: (_err, { solutionId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          voteKeys.stats(solutionId),
          context.previous
        );
      }
    },
    onSettled: (_, __, { solutionId }) => {
      queryClient.invalidateQueries({
        queryKey: voteKeys.stats(solutionId),
      });
    },
  });
}

// ============================================================
// useDeleteVote - Remove vote (optimistic)
// ============================================================

interface DeleteVoteVariables {
  solutionId: string;
}

export function useDeleteVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId }: DeleteVoteVariables) =>
      apiClient<void>({
        path: `/api/v1/solutions/${solutionId}/votes`,
        method: "DELETE",
        requiresAuth: true,
      }),
    onMutate: async ({ solutionId }) => {
      await queryClient.cancelQueries({
        queryKey: voteKeys.stats(solutionId),
      });

      const previous = queryClient.getQueryData<VoteStats>(
        voteKeys.stats(solutionId)
      );

      if (previous) {
        const updated = { ...previous };
        if (previous.user_vote === "up") updated.upvotes--;
        if (previous.user_vote === "down") updated.downvotes--;
        updated.user_vote = null;

        queryClient.setQueryData(voteKeys.stats(solutionId), updated);
      }

      return { previous };
    },
    onError: (_err, { solutionId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          voteKeys.stats(solutionId),
          context.previous
        );
      }
    },
    onSettled: (_, __, { solutionId }) => {
      queryClient.invalidateQueries({
        queryKey: voteKeys.stats(solutionId),
      });
    },
  });
}
