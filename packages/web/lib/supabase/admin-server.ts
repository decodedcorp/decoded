import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getEnv } from "./env";

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");

/**
 * Server-only Supabase client with service_role key.
 *
 * Bypasses RLS. Use ONLY in admin-authenticated route handlers
 * after `checkIsAdmin()` has verified the caller. Never import
 * from a Client Component or expose the returned client to the browser.
 */
export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Admin mutations require service_role."
    );
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
