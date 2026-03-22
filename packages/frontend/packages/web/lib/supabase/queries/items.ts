/**
 * Query layer for items (solutions) table (client-side)
 *
 * Schema update (2026-01-29):
 * - 'item' table → 'solutions' table
 * - Items are now linked through spots (item locations in images)
 */

import { supabaseBrowserClient } from "../client";
import type { SolutionRow, SpotRow } from "../types";

/**
 * Legacy ItemRow type for backward compatibility
 */
export interface ItemRow {
  id: number;
  image_id: string;
  brand: string | null;
  product_name: string | null;
  cropped_image_path: string | null;
  price: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
}

/**
 * Converts a SolutionRow to legacy ItemRow format
 */
function solutionToItemRow(solution: SolutionRow, spotId: string): ItemRow {
  return {
    id: parseInt(solution.id.substring(0, 8), 16) || 0, // Generate numeric ID from UUID
    image_id: spotId, // Use spot_id as proxy for image_id
    brand: null, // SolutionRow doesn't have brand field
    product_name: solution.title || null, // Use title as product_name
    cropped_image_path: solution.thumbnail_url || null,
    price: solution.price_amount?.toString() || null,
    description: solution.description || null,
    status: solution.status || null,
    created_at: solution.created_at || null,
  };
}

/**
 * Fetches solutions for a specific spot (client-side)
 *
 * @param spotId - Spot ID to fetch solutions for
 * @returns Array of SolutionRow
 */
export async function fetchSolutionsBySpotId(
  spotId: string
): Promise<SolutionRow[]> {
  const { data, error } = await supabaseBrowserClient
    .from("solutions")
    .select("*")
    .eq("spot_id", spotId)
    .eq("status", "active")
    .order("accurate_count", { ascending: false });

  if (error) {
    console.error(
      "Error fetching solutions by spot:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return data || [];
}

/**
 * Fetches solutions for a specific post via spots (client-side)
 *
 * @param postId - Post ID to fetch solutions for
 * @returns Array of SolutionRow
 */
export async function fetchSolutionsByPostId(
  postId: string
): Promise<SolutionRow[]> {
  // First get spots for this post
  const { data: spots, error: spotsError } = await supabaseBrowserClient
    .from("spots")
    .select("id")
    .eq("post_id", postId);

  if (spotsError || !spots || spots.length === 0) {
    return [];
  }

  const spotIds = spots.map((s) => s.id);

  // Then get solutions for these spots
  const { data, error } = await supabaseBrowserClient
    .from("solutions")
    .select("*")
    .in("spot_id", spotIds)
    .eq("status", "active")
    .order("accurate_count", { ascending: false });

  if (error) {
    console.error(
      "Error fetching solutions by post:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return data || [];
}

/**
 * Legacy function - Fetches items by image ID
 *
 * @deprecated Use fetchSolutionsByPostId instead
 * Maps new schema to old structure for backward compatibility
 *
 * @param imageId - Image/Post ID to fetch items for
 * @returns Array of ItemRow (legacy format)
 */
export async function fetchItemsByImageId(imageId: string): Promise<ItemRow[]> {
  const solutions = await fetchSolutionsByPostId(imageId);

  return solutions.map((solution) =>
    solutionToItemRow(solution, solution.spot_id)
  );
}

/**
 * Fetches spots for a specific post (client-side)
 *
 * @param postId - Post ID to fetch spots for
 * @returns Array of SpotRow
 */
export async function fetchSpotsByPostId(postId: string): Promise<SpotRow[]> {
  const { data, error } = await supabaseBrowserClient
    .from("spots")
    .select("*")
    .eq("post_id", postId);

  if (error) {
    console.error(
      "Error fetching spots by post:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return data || [];
}

/**
 * Fetches a single solution by ID (client-side)
 *
 * @param solutionId - Solution ID to fetch
 * @returns SolutionRow or null if not found
 */
export async function fetchSolutionById(
  solutionId: string
): Promise<SolutionRow | null> {
  const { data, error } = await supabaseBrowserClient
    .from("solutions")
    .select("*")
    .eq("id", solutionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error(
      "Error fetching solution by id:",
      JSON.stringify(error, null, 2)
    );
    return null;
  }

  return data;
}
