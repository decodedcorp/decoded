import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types";
import { getEnv } from "./env";

const supabaseUrl = getEnv("NEXT_PUBLIC_DATABASE_API_URL");
const supabaseAnonKey = getEnv("NEXT_PUBLIC_DATABASE_ANON_KEY");

/**
 * Creates a Supabase client for Server Components and Route Handlers.
 * This client automatically handles cookie-based authentication state.
 *
 * Usage in Server Components:
 * ```tsx
 * const supabase = await createSupabaseServerClient();
 * const { data } = await supabase.from('table').select('*');
 * ```
 *
 * Usage in Route Handlers:
 * ```tsx
 * export async function GET() {
 *   const supabase = await createSupabaseServerClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return Response.json(data);
 * }
 * ```
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // In Next.js 15+, cookies() returns ReadonlyRequestCookies in Server Components
            // which doesn't have set() method. This is expected behavior.
            // Cookie setting should be handled in Route Handlers or Middleware.
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
