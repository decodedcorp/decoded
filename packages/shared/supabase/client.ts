import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Initialize the Supabase client with URL and anon key.
 * This should be called once at app startup (web or mobile).
 */
export function initSupabase(
  url: string,
  anonKey: string
): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(url, anonKey);
  }
  return supabaseClient;
}

/**
 * Get the initialized Supabase client.
 * Throws if client has not been initialized.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    throw new Error(
      "Supabase client not initialized. Call initSupabase() first."
    );
  }
  return supabaseClient;
}

/**
 * Check if Supabase client is initialized
 */
export function isSupabaseInitialized(): boolean {
  return supabaseClient !== null;
}

// Re-export types for convenience
export type { Database };
