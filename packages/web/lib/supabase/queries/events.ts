/**
 * Query layer for behavioral event tracking (server-side)
 *
 * Used exclusively by the /api/v1/events route handler.
 * Events are immutable — insert only, no update/delete.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserEventInsert } from "../types";

export type EventRow = UserEventInsert;

/**
 * Inserts a batch of behavioral events into public.user_events.
 * Error handling is delegated to the caller (API route).
 *
 * @param supabase - Server-side Supabase client (auth-aware)
 * @param events   - Array of event rows to insert
 * @returns { error } from Supabase — null on success
 */
export async function insertEvents(
  supabase: SupabaseClient<Database>,
  events: EventRow[]
): Promise<{ error: unknown }> {
  const { error } = await supabase.from("user_events").insert(events);
  return { error };
}
