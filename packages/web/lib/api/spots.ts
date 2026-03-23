/**
 * Spots API Functions
 * - List spots on a post
 * - Create spot on a post
 * - Update spot
 * - Delete spot
 */

import { apiClient } from "./client";
import type {
  Spot,
  CreateSpotDto,
  UpdateSpotDto,
} from "./types";

// ============================================================
// Create Spot
// POST /api/v1/posts/{post_id}/spots
// Requires authentication
// ============================================================

/**
 * Create a new spot on a post
 */
export async function createSpot(
  postId: string,
  data: CreateSpotDto
): Promise<Spot> {
  return apiClient<Spot>({
    path: `/api/v1/posts/${postId}/spots`,
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Update Spot
// PATCH /api/v1/spots/{spot_id}
// Requires authentication
// ============================================================

/**
 * Update an existing spot
 */
export async function updateSpot(
  spotId: string,
  data: UpdateSpotDto
): Promise<Spot> {
  return apiClient<Spot>({
    path: `/api/v1/spots/${spotId}`,
    method: "PATCH",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Delete Spot
// DELETE /api/v1/spots/{spot_id}
// Requires authentication
// ============================================================

/**
 * Delete a spot
 */
export async function deleteSpot(spotId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/spots/${spotId}`,
    method: "DELETE",
    requiresAuth: true,
  });
}
