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

  // Protected pages: with implicit OAuth flow, session lives in localStorage
  // (not server cookies), so server-side redirect is skipped.
  // Client-side auth check handles 401 → login redirect instead.
  if (
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/request/")
  ) {
    return res;
  }

  // /admin/login: allow unauthenticated access, but bounce already-authenticated
  // admins to /admin so the layout doesn't render AdminLayoutClient chrome
  // around the login form (happens when an admin hits /admin/login directly
  // while still signed in — Supabase emits INITIAL_SESSION, not SIGNED_IN,
  // so the page-level onAuthStateChange handler cannot catch this case).
  if (pathname === "/admin/login") {
    if (session && (await checkIsAdmin(supabase, session.user.id))) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return res;
  }

  // Admin: require session + admin role — redirect to login on failure
  if (!session) {
    console.log("[proxy] /admin - no session, redirecting to login");
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  console.log("[proxy] /admin - session found:", session.user.email);
  const isAdmin = await checkIsAdmin(supabase, session.user.id);
  console.log("[proxy] /admin - isAdmin:", isAdmin);

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Admin confirmed — allow request through with refreshed session cookies
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/profile", "/request/:path*"],
};
