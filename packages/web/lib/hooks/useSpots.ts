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
} from "@/lib/api/generated/spots/spots";
import type { SpotListItem } from "@/lib/api/generated/models";
import {
  createSpot,
  updateSpot,
  deleteSpot,
} from "@/lib/api/spots";
import type { Spot, CreateSpotDto, UpdateSpotDto } from "@/lib/api/types";

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
      createSpot(postId, data),
    onSuccess: (newSpot, { postId }) => {
      // Add to cache
      queryClient.setQueryData<any>(spotKeys.list(postId), (old: Spot[] | undefined) =>
        old ? [...old, newSpot] : [newSpot]
      );
      // Invalidate to ensure fresh data
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
      updateSpot(spotId, data),
    onSuccess: (updatedSpot, { postId }) => {
      // Update in cache
      queryClient.setQueryData<any>(spotKeys.list(postId), (old: Spot[] | undefined) =>
        old
          ? old.map((spot) => (spot.id === updatedSpot.id ? updatedSpot : spot))
          : [updatedSpot]
      );
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
    mutationFn: ({ spotId }: DeleteSpotVariables) => deleteSpot(spotId),
    onSuccess: (_, { spotId, postId }) => {
      // Remove from cache
      queryClient.setQueryData<any>(spotKeys.list(postId), (old: Spot[] | undefined) =>
        old ? old.filter((spot) => spot.id !== spotId) : []
      );
    },
    onError: (error) => {
      console.error("[useDeleteSpot] Failed to delete spot:", error);
    },
  });
}
