import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { checkIsAdmin } from "@/lib/supabase/admin";

/**
 * Route protection proxy (Next.js 16).
 *
 * Protects:
 * - /profile: requires active session — unauthenticated users are redirected
 *   to /login?redirect=/profile so they can return after login (AUTH-01, AUTH-02).
 * - /admin/*: requires session + is_admin role — unauthenticated/non-admin users
 *   are silently redirected to home (AAUTH-01, AAUTH-02).
 *
 * The middleware client propagates refreshed session cookies on every request,
 * keeping auth state consistent.
 */
export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Profile: require session, redirect to login with return URL
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  // Admin: require session + admin role — silently redirect to home on failure
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const isAdmin = await checkIsAdmin(supabase, session.user.id);

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin confirmed — allow request through with refreshed session cookies
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/profile"],
};
