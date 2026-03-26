/**
 * Supabase client for the `warehouse` schema.
 *
 * The warehouse schema stores ETL data: Instagram accounts, posts, images,
 * artists, groups, brands, and the seed publishing pipeline.
 *
 * Prerequisites:
 * - warehouse schema must be added to "Exposed schemas" in Supabase Dashboard
 *   → Project Settings > API > Exposed schemas > add "warehouse"
 */

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { WarehouseDatabase } from "./warehouse-types";
import { getEnv } from "./env";

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Browser client for warehouse schema (Client Components).
 */
let warehouseBrowserClient: ReturnType<
  typeof createClient<WarehouseDatabase, "warehouse">
> | null = null;

export function getWarehouseBrowserClient() {
  if (!warehouseBrowserClient) {
    warehouseBrowserClient = createClient<WarehouseDatabase, "warehouse">(
      supabaseUrl,
      supabaseAnonKey,
      { db: { schema: "warehouse" } }
    );
  }
  return warehouseBrowserClient;
}

/**
 * Server client for warehouse schema (Server Components / Route Handlers).
 */
export async function createWarehouseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<WarehouseDatabase, "warehouse">(
    supabaseUrl,
    supabaseAnonKey,
    {
      db: { schema: "warehouse" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Expected in Server Components (read-only cookies)
          }
        },
      },
    }
  );
}
