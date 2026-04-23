import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Checks whether the given user ID has admin privileges.
 *
 * Queries the `users` table for the `is_admin` field. Returns `true` only
 * when the record exists and `is_admin === true`. Returns `false` on any
 * error, missing record, or when the field is false/null.
 *
 * Separated from middleware.ts so it can be reused in layout-level server
 * components for double-checking admin access without re-importing middleware
 * utilities.
 *
 * @param supabase - Typed Supabase client (middleware or server variant)
 * @param userId - Auth user ID to check
 * @returns `true` if the user is an admin, `false` otherwise
 */
export async function checkIsAdmin(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  try {
    // maybeSingle() returns null (no error) when the row is absent — a
    // legitimate state for auth users whose public.users profile has not yet
    // been created (see migration 20260423170000).
    const { data, error } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[checkIsAdmin] Supabase query error:", error.message);
      }
      return false;
    }

    return data?.is_admin === true;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[checkIsAdmin] Unexpected error:", err);
    }
    return false;
  }
}
