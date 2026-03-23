/**
 * Spots Hooks
 * React Query hooks for spot CRUD operations
 */

import {
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  useListSpots as useListSpotsGenerated,
  createSpot as createSpotGenerated,
  updateSpot as updateSpotGenerated,
  deleteSpot as deleteSpotGenerated,
} from "@/lib/api/generated/spots/spots";
import type { SpotListItem, CreateSpotDto, UpdateSpotDto } from "@/lib/api/generated/models";

// ============================================================
// Query Keys
// ============================================================

export const spotKeys = {
  all: ["spots"] as const,
  lists: () => [...spotKeys.all, "list"] as const,
  list: (postId: string) => [...spotKeys.lists(), postId] as const,
};

// ============================================================
// useSpots - Fetch spots for a post
// ============================================================

export function useSpots(
  postId: string,
  options?: Omit<UseQueryOptions<SpotListItem[], Error>, "queryKey" | "queryFn">
) {
  return useListSpotsGenerated(postId, {
    query: {
      queryKey: spotKeys.list(postId),
      enabled: !!postId,
      staleTime: 1000 * 60, // 1 minute
      ...options,
    },
  });
}

// ============================================================
// useCreateSpot - Create a new spot
// ============================================================

interface CreateSpotVariables {
  postId: string;
  data: CreateSpotDto;
}

export function useCreateSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: CreateSpotVariables) =>
      createSpotGenerated(postId, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: spotKeys.list(postId) });
    },
    onError: (error) => {
      console.error("[useCreateSpot] Failed to create spot:", error);
    },
  });
}

// ============================================================
// useUpdateSpot - Update an existing spot
// ============================================================

interface UpdateSpotVariables {
  spotId: string;
  postId: string; // Needed for cache invalidation
  data: UpdateSpotDto;
}

export function useUpdateSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spotId, data }: UpdateSpotVariables) =>
      updateSpotGenerated(spotId, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: spotKeys.list(postId) });
    },
    onError: (error) => {
      console.error("[useUpdateSpot] Failed to update spot:", error);
    },
  });
}

// ============================================================
// useDeleteSpot - Delete a spot
// ============================================================

interface DeleteSpotVariables {
  spotId: string;
  postId: string; // Needed for cache invalidation
}

export function useDeleteSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spotId }: DeleteSpotVariables) => deleteSpotGenerated(spotId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: spotKeys.list(postId) });
    },
    onError: (error) => {
      console.error("[useDeleteSpot] Failed to delete spot:", error);
    },
  });
}
