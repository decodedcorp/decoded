import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchTodaySummary } from "@/lib/api/admin/dashboard";

/**
 * GET /api/v1/admin/dashboard/today
 *
 * Returns today's activity summary for the dashboard.
 * Attempts to read today's real post count from Supabase;
 * other values are deterministic mock data.
 * Requires admin privileges.
 *
 * Response shape: TodaySummary
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

  const summary = await fetchTodaySummary();
  return NextResponse.json(summary);
}
