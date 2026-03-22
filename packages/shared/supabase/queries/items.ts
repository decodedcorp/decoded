/**
 * Query layer for items table (shared across web and mobile)
 */

import { getSupabaseClient } from "../client";
import type { Database } from "../types";

export type ItemRow = Database["public"]["Tables"]["item"]["Row"];

/**
 * Fetches all items for a given image ID
 */
export async function fetchItemsByImageId(imageId: string): Promise<ItemRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("item")
    .select("*")
    .eq("image_id", imageId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
