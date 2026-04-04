import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { AdminLayoutClient } from "@/lib/components/admin/AdminLayoutClient";

/**
 * Admin Layout - Server component
 *
 * Double-checks admin status server-side (middleware is the first check;
 * this is the second check at layout level as specified by AAUTH-03).
 *
 * - No session → redirect to /
 * - Not admin → redirect to /
 * - Is admin → render AdminLayoutClient with sidebar + content
 *
 * This layout is completely separate from the main app layout:
 * ConditionalNav, ConditionalFooter, and MainContentWrapper are hidden
 * on /admin/* routes (handled in their respective components).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const isAdmin = await checkIsAdmin(supabase, user.id);
  if (!isAdmin) {
    redirect("/admin/login");
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
