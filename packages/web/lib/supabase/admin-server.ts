import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getEnvWithAlias } from "./env";

/**
 * Server-only Supabase client with service_role key.
 *
 * Bypasses RLS. Use ONLY in admin-authenticated route handlers
 * after `checkIsAdmin()` has verified the caller. Never import
 * from a Client Component or expose the returned client to the browser.
 *
 * @throws Error if DATABASE_SERVICE_ROLE_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)
 *   or NEXT_PUBLIC_DATABASE_API_URL (or legacy NEXT_PUBLIC_SUPABASE_URL) is missing.
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = getEnvWithAlias("NEXT_PUBLIC_DATABASE_API_URL");
  const serviceRoleKey =
    process.env.DATABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "DATABASE_SERVICE_ROLE_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) is not set. Admin mutations require service_role."
    );
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
