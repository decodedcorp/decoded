import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchChartData } from "@/lib/api/admin/dashboard";

/**
 * GET /api/v1/admin/dashboard/chart?days=30
 *
 * Returns time-series chart data for the dashboard activity chart.
 * All data is deterministic mock data (no analytics tables in DB).
 * Requires admin privileges.
 *
 * Query params:
 *   days - Number of days to return (default: 30, max: 90)
 *
 * Response shape: DailyMetric[]
 */
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 30;

  if (isNaN(days) || days < 1) {
    return NextResponse.json(
      { error: "Invalid days parameter. Must be a positive integer." },
      { status: 400 }
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const data = await fetchChartData(days, session?.access_token);
  return NextResponse.json(data);
}
