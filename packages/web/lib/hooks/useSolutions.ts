/**
 * Solutions Hooks
 * React Query hooks for solution CRUD and metadata operations
 */

import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  fetchSolutions,
  createSolution,
  updateSolution,
  deleteSolution,
  adoptSolution,
  unadoptSolution,
  extractSolutionMetadata,
  convertAffiliate,
} from "@/lib/api/solutions";
import type {
  Solution,
  SolutionListItem,
  CreateSolutionDto,
  UpdateSolutionDto,
  ExtractMetadataResponse,
  ConvertAffiliateResponse,
} from "@/lib/api/types";

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
    UseQueryOptions<SolutionListItem[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: solutionKeys.list(spotId),
    queryFn: () => fetchSolutions(spotId),
    enabled: !!spotId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

// ============================================================
// useAllSolutionsForSpots - Fetch solutions for multiple spots
// ============================================================

/** Solutions grouped by spot ID */
export function useAllSolutionsForSpots(spotIds: string[]) {
  const results = useQueries({
    queries: spotIds.map((spotId) => ({
      queryKey: solutionKeys.list(spotId),
      queryFn: () => fetchSolutions(spotId),
      enabled: !!spotId,
      staleTime: 1000 * 60,
    })),
  });
  const isLoading = results.some((r) => r.isLoading);
  const spotSolutionsMap = new Map<string, SolutionListItem[]>();
  spotIds.forEach((spotId, i) => {
    const data = results[i]?.data;
    if (data?.length) spotSolutionsMap.set(spotId, data);
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
      createSolution(spotId, data),
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
      updateSolution(solutionId, data),
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
      deleteSolution(solutionId),
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
      adoptSolution(solutionId, { match_type: matchType }),
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
      unadoptSolution(solutionId),
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
  return useMutation<ExtractMetadataResponse, Error, string>({
    mutationFn: (url: string) => extractSolutionMetadata(url),
    onError: (error) => {
      console.error("[useExtractMetadata] Failed to extract metadata:", error);
    },
  });
}

// ============================================================
// useConvertAffiliate - Convert URL to affiliate link
// ============================================================

export function useConvertAffiliate() {
  return useMutation<ConvertAffiliateResponse, Error, string>({
    mutationFn: (url: string) => convertAffiliate(url),
    onError: (error) => {
      console.error(
        "[useConvertAffiliate] Failed to convert affiliate:",
        error
      );
    },
  });
}
