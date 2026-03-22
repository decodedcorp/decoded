import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { checkIsAdmin } from "@/lib/supabase/admin";

/**
 * Admin route protection middleware.
 *
 * Protects all /admin/* routes server-side by verifying:
 * 1. User has an active Supabase session (authenticated)
 * 2. User record has is_admin === true in the users table
 *
 * Non-admin and unauthenticated users are silently redirected to home (/)
 * with no indication that an admin panel exists (AAUTH-01, AAUTH-02).
 *
 * The middleware client also propagates refreshed session cookies on every
 * request, keeping auth state consistent.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No session — silently redirect to home
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Session exists — verify admin status
  const isAdmin = await checkIsAdmin(supabase, session.user.id);

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin confirmed — allow request through with refreshed session cookies
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
