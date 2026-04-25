"use client";

import { SupabaseClient } from "@supabase/supabase-js";
import { initSupabase } from "@decoded/shared";
import type { Database } from "./types";

// Environment variables — DATABASE_* only (legacy SUPABASE_* removed in #345).
const supabaseUrl = process.env.NEXT_PUBLIC_DATABASE_API_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_DATABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing auth environment variables. Please set NEXT_PUBLIC_DATABASE_API_URL and NEXT_PUBLIC_DATABASE_ANON_KEY in your .env.local file."
  );
}

/**
 * Typed Supabase client for browser use
 * Uses singleton pattern from @decoded/shared to prevent multiple instances
 */
export const supabaseBrowserClient: SupabaseClient<Database> = initSupabase(
  supabaseUrl,
  supabaseAnonKey
) as unknown as SupabaseClient<Database>;

/**
 * Get the Supabase client instance
 * @deprecated Use supabaseBrowserClient directly
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  return supabaseBrowserClient;
}
