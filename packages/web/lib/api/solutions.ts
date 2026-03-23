/**
 * Solutions API Functions
 * - List solutions on a spot
 * - Create solution on a spot
 * - Update solution
 * - Delete solution
 * - Extract metadata from product URL
 * - Convert URL to affiliate link
 */

import { apiClient } from "./client";
import type {
  Solution,
  CreateSolutionDto,
  UpdateSolutionDto,
  ExtractMetadataRequest,
  ExtractMetadataResponse,
  ConvertAffiliateRequest,
  ConvertAffiliateResponse,
} from "./types";

// ============================================================
// Create Solution
// POST /api/v1/spots/{spot_id}/solutions
// Requires authentication
// ============================================================

/**
 * Create a new solution on a spot
 */
export async function createSolution(
  spotId: string,
  data: CreateSolutionDto
): Promise<Solution> {
  return apiClient<Solution>({
    path: `/api/v1/spots/${spotId}/solutions`,
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Update Solution
// PATCH /api/v1/solutions/{solution_id}
// Requires authentication
// ============================================================

/**
 * Update an existing solution
 */
export async function updateSolution(
  solutionId: string,
  data: UpdateSolutionDto
): Promise<Solution> {
  return apiClient<Solution>({
    path: `/api/v1/solutions/${solutionId}`,
    method: "PATCH",
    body: data,
    requiresAuth: true,
  });
}

// ============================================================
// Delete Solution
// DELETE /api/v1/solutions/{solution_id}
// Requires authentication
// ============================================================

/**
 * Delete a solution
 */
export async function deleteSolution(solutionId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/solutions/${solutionId}`,
    method: "DELETE",
    requiresAuth: true,
  });
}

// ============================================================
// Adopt Solution (Post/Spot owner only)
// POST /api/v1/solutions/{solution_id}/adopt
// DELETE /api/v1/solutions/{solution_id}/adopt
// ============================================================

export interface AdoptSolutionDto {
  match_type: "perfect" | "close";
}

export interface AdoptResponse {
  solution_id: string;
  is_adopted: boolean;
  match_type: string;
  adopted_at: number;
  updated_spot?: {
    spot_id: string;
    title: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Adopt a solution (post owner picks one solution among many)
 */
export async function adoptSolution(
  solutionId: string,
  data: AdoptSolutionDto
): Promise<AdoptResponse> {
  return apiClient<AdoptResponse>({
    path: `/api/v1/solutions/${solutionId}/adopt`,
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

/**
 * Unadopt a solution
 */
export async function unadoptSolution(solutionId: string): Promise<void> {
  await apiClient<void>({
    path: `/api/v1/solutions/${solutionId}/adopt`,
    method: "DELETE",
    requiresAuth: true,
  });
}

// ============================================================
// Extract Metadata
// POST /api/v1/solutions/extract-metadata
// Requires authentication
// ============================================================

/**
 * Extract product metadata from a URL
 */
export async function extractSolutionMetadata(
  url: string
): Promise<ExtractMetadataResponse> {
  const request: ExtractMetadataRequest = { url };
  return apiClient<ExtractMetadataResponse>({
    path: "/api/v1/solutions/extract-metadata",
    method: "POST",
    body: request,
    requiresAuth: true,
  });
}

// ============================================================
// Convert to Affiliate Link
// POST /api/v1/solutions/convert-affiliate
// Requires authentication
// ============================================================

/**
 * Convert a product URL to an affiliate link
 */
export async function convertAffiliate(
  url: string
): Promise<ConvertAffiliateResponse> {
  const request: ConvertAffiliateRequest = { url };
  return apiClient<ConvertAffiliateResponse>({
    path: "/api/v1/solutions/convert-affiliate",
    method: "POST",
    body: request,
    requiresAuth: true,
  });
}
