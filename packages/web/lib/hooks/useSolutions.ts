/**
 * Solutions Hooks
 * React Query hooks for solution CRUD and metadata operations
 */

import {
  useQueries,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  useListSolutions as useListSolutionsGenerated,
  listSolutions,
  createSolution as createSolutionGenerated,
  updateSolution as updateSolutionGenerated,
  deleteSolution as deleteSolutionGenerated,
  extractMetadata as extractMetadataGenerated,
  convertAffiliate as convertAffiliateGenerated,
} from "@/lib/api/generated/solutions/solutions";
import {
  adoptSolution as adoptSolutionGenerated,
  unadoptSolution as unadoptSolutionGenerated,
} from "@/lib/api/generated/votes/votes";
import type {
  SolutionListItem as GeneratedSolutionListItem,
  CreateSolutionDto,
  UpdateSolutionDto,
  MetadataResponse,
  AffiliateLinkResponse,
} from "@/lib/api/generated/models";
/**
 * Cache Invalidation Boundaries
 *
 * REST API cache (Orval generated hooks):
 *   Keys: solutionKeys, spotKeys, commentKeys, postKeys.lists()
 *   Invalidated by: REST mutations below
 *
 * Server-side fetches (fetchPostsServer):
 *   No React Query cache — uses Next.js revalidate header only.
 */

// ============================================================
// Query Keys
// ============================================================

export const solutionKeys = {
  all: ["solutions"] as const,
  lists: () => [...solutionKeys.all, "list"] as const,
  list: (spotId: string) => [...solutionKeys.lists(), spotId] as const,
};

// ============================================================
// useSolutions - Fetch solutions for a spot
// ============================================================

export function useSolutions(
  spotId: string,
  options?: Omit<
    UseQueryOptions<GeneratedSolutionListItem[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useListSolutionsGenerated(spotId, {
    query: {
      queryKey: solutionKeys.list(spotId),
      enabled: !!spotId,
      staleTime: 1000 * 60, // 1 minute
      ...options,
    },
  });
}

// ============================================================
// useAllSolutionsForSpots - Fetch solutions for multiple spots
// ============================================================

export function useAllSolutionsForSpots(spotIds: string[]) {
  const results = useQueries({
    queries: spotIds.map((spotId) => ({
      queryKey: solutionKeys.list(spotId),
      queryFn: () => listSolutions(spotId),
      enabled: !!spotId,
      staleTime: 1000 * 60,
    })),
  });
  const isLoading = results.some((r) => r.isLoading);
  const spotSolutionsMap = new Map<string, GeneratedSolutionListItem[]>();
  spotIds.forEach((spotId, i) => {
    const data = results[i]?.data;
    if (data?.length)
      spotSolutionsMap.set(spotId, data as GeneratedSolutionListItem[]);
  });
  const allSolutionsWithSpot = spotIds.flatMap((spotId) => {
    const sols = spotSolutionsMap.get(spotId) ?? [];
    return sols.map((sol) => ({ spotId, solution: sol }));
  });
  return { isLoading, allSolutionsWithSpot, spotSolutionsMap, results };
}

// ============================================================
// useCreateSolution - Create a new solution
// ============================================================

interface CreateSolutionVariables {
  spotId: string;
  data: CreateSolutionDto;
}

export function useCreateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spotId, data }: CreateSolutionVariables) =>
      createSolutionGenerated(spotId, data),
    onSuccess: (_, { spotId }) => {
      // Invalidate to refetch list (backend returns SolutionListItem, create returns Solution)
      queryClient.invalidateQueries({ queryKey: solutionKeys.list(spotId) });
    },
    onError: (error) => {
      console.error("[useCreateSolution] Failed to create solution:", error);
    },
  });
}

// ============================================================
// useUpdateSolution - Update an existing solution
// ============================================================

interface UpdateSolutionVariables {
  solutionId: string;
  spotId: string; // Needed for cache invalidation
  data: UpdateSolutionDto;
}

export function useUpdateSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId, data }: UpdateSolutionVariables) =>
      updateSolutionGenerated(solutionId, data),
    onSuccess: (_, { spotId }) => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.list(spotId) });
    },
    onError: (error) => {
      console.error("[useUpdateSolution] Failed to update solution:", error);
    },
  });
}

// ============================================================
// useDeleteSolution - Delete a solution
// ============================================================

interface DeleteSolutionVariables {
  solutionId: string;
  spotId: string; // Needed for cache invalidation
}

export function useDeleteSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId }: DeleteSolutionVariables) =>
      deleteSolutionGenerated(solutionId),
    onSuccess: (_, { spotId }) => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.list(spotId) });
    },
    onError: (error) => {
      console.error("[useDeleteSolution] Failed to delete solution:", error);
    },
  });
}

// ============================================================
// useAdoptSolution - Adopt a solution (post/spot owner only)
// ============================================================

export interface AdoptSolutionVariables {
  solutionId: string;
  spotId: string;
  matchType: "perfect" | "close";
}

export function useAdoptSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId, matchType }: AdoptSolutionVariables) =>
      adoptSolutionGenerated(solutionId, { match_type: matchType }),
    onSuccess: (_, { spotId }) => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.list(spotId) });
      queryClient.invalidateQueries({ queryKey: ["posts", "detail"] });
    },
    onError: (error) => {
      console.error("[useAdoptSolution] 채택 실패:", error);
    },
  });
}

// ============================================================
// useUnadoptSolution - Unadopt a solution
// ============================================================

interface UnadoptSolutionVariables {
  solutionId: string;
  spotId: string;
}

export function useUnadoptSolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ solutionId }: UnadoptSolutionVariables) =>
      unadoptSolutionGenerated(solutionId),
    onSuccess: (_, { spotId }) => {
      queryClient.invalidateQueries({ queryKey: solutionKeys.list(spotId) });
      queryClient.invalidateQueries({ queryKey: ["posts", "detail"] });
    },
  });
}

// ============================================================
// useExtractMetadata - Extract metadata from URL
// ============================================================

export function useExtractMetadata() {
  return useMutation<MetadataResponse, Error, string>({
    mutationFn: (url: string) => extractMetadataGenerated({ url }),
    onError: (error) => {
      console.error("[useExtractMetadata] Failed to extract metadata:", error);
    },
  });
}

// ============================================================
// useConvertAffiliate - Convert URL to affiliate link
// ============================================================

export function useConvertAffiliate() {
  return useMutation<AffiliateLinkResponse, Error, string>({
    mutationFn: (url: string) => convertAffiliateGenerated({ url }),
    onError: (error) => {
      console.error(
        "[useConvertAffiliate] Failed to convert affiliate:",
        error
      );
    },
  });
}
