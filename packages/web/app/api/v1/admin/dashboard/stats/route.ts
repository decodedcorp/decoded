import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchDashboardStats } from "@/lib/api/admin/dashboard";

/**
 * GET /api/v1/admin/dashboard/stats
 *
 * Returns KPI statistics for the admin dashboard overview cards.
 * Requires admin privileges.
 *
 * Response shape: KPIStats
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await checkIsAdmin(supabase, user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await fetchDashboardStats();
  return NextResponse.json(stats);
}
