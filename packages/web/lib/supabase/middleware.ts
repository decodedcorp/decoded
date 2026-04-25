import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "./types";
import { getEnv } from "./env";

const supabaseUrl = getEnv("NEXT_PUBLIC_DATABASE_API_URL");
const supabaseAnonKey = getEnv("NEXT_PUBLIC_DATABASE_ANON_KEY");

/**
 * Creates a Supabase client for use in Next.js middleware.
 *
 * Unlike the server client (which uses `cookies()` from `next/headers`),
 * middleware receives a NextRequest and must read/write cookies directly
 * on the request and response objects.
 *
 * Usage in middleware:
 * ```ts
 * export async function middleware(req: NextRequest) {
 *   const res = NextResponse.next();
 *   const supabase = createSupabaseMiddlewareClient(req, res);
 *   const { data: { session } } = await supabase.auth.getSession();
 * }
 * ```
 */
export function createSupabaseMiddlewareClient(
  req: NextRequest,
  res: NextResponse
) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });
}
