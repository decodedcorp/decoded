import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { AdminLayoutClient } from "@/lib/components/admin/AdminLayoutClient";

/**
 * Admin Layout - Server component
 *
 * Auth strategy:
 * - proxy.ts is the first line of defense: redirects unauthenticated/non-admin
 *   users to /admin/login (except /admin/login itself which is exempt).
 * - This layout is the second check (AAUTH-03): if no user or not admin,
 *   renders children WITHOUT the admin chrome (sidebar) instead of redirecting.
 *   This avoids redirect loops for /admin/login while keeping the security check.
 *
 * - No session → render children only (login page shows without admin chrome)
 * - Not admin → render children only
 * - Is admin → render AdminLayoutClient with sidebar + content
 *
 * Performance: uses `auth.getSession()` (cookie-cached, ~5–50ms) instead of
 * `auth.getUser()` (Supabase Auth network call, ~100–500ms). proxy.ts already
 * validated the cookie chain for every /admin/* request, and `checkIsAdmin`
 * (DB) remains the source of truth for admin role — so dropping the extra
 * auth-server roundtrip is safe and shaves perceptible latency off the
 * post-login first paint.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No session: render children directly (proxy.ts handles redirecting
  // non-login admin routes to /admin/login)
  if (!session) {
    return <>{children}</>;
  }

  const user = session.user;
  const isAdmin = await checkIsAdmin(supabase, user.id);
  if (!isAdmin) {
    return <>{children}</>;
  }

  // Extract display name from user metadata
  const metadata = user.user_metadata || {};
  const adminName =
    metadata.full_name ||
    metadata.name ||
    metadata.nickname ||
    user.email?.split("@")[0] ||
    "Admin";

  return (
    <AdminLayoutClient adminName={adminName}>{children}</AdminLayoutClient>
  );
}
