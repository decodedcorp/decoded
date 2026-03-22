import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { fetchAiCostChart } from "@/lib/api/admin/ai-cost";

/**
 * GET /api/v1/admin/ai-cost/chart
 *
 * Returns daily AI cost time-series and per-model cost breakdown.
 * Bundles both datasets so the UI can fetch everything in one request.
 * Requires admin privileges.
 *
 * Query params:
 *   days - Period length in days (default 30, clamped to 7–90)
 *
 * Response shape: AiCostChartResponse
 *   { daily: AiCostDailyMetric[], modelBreakdown: ModelCostBreakdown[] }
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

  const { searchParams } = request.nextUrl;
  const days = Math.min(
    90,
    Math.max(7, parseInt(searchParams.get("days") ?? "30", 10))
  );

  const data = await fetchAiCostChart(days);
  return NextResponse.json(data);
}
