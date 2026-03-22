/**
 * Admin dashboard data fetching layer (server-side only).
 *
 * Combines real Supabase aggregate counts with mock time-series data.
 * The real database contains only bulk-imported static data (no analytics),
 * so all time-series metrics use the deterministic mock data generators.
 *
 * Real data queried:
 * - post count  → used for totalPosts KPI
 * - item count  → used for totalSolutions KPI (items = detected products)
 *
 * Mock data for:
 * - DAU, MAU, totalUsers (no user analytics tables)
 * - All chart time-series (no event tracking)
 * - Today summary (no per-day activity tracking)
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateDailyMetrics,
  generateMockKPIStats,
  generateTodaySummary,
  type DailyMetric,
  type KPIStats,
  type TodaySummary,
} from "./mock-data";

// Re-export types so consumers only need to import from this module
export type { DailyMetric, KPIStats, TodaySummary };

// ─── Data fetchers ────────────────────────────────────────────────────────────

/**
 * Fetches KPI statistics for the dashboard overview cards.
 *
 * Attempts to read real post and item counts from Supabase.
 * Falls back to fully mock data if Supabase queries fail.
 */
export async function fetchDashboardStats(): Promise<KPIStats> {
  try {
    const supabase = await createSupabaseServerClient();

    // Query real counts using the actual table names in the database.
    // The typed Database type uses "posts"/"items" but the real schema uses
    // "post"/"item", so we cast to `any` for the table name.
    const [{ count: postCount }, { count: itemCount }] = await Promise.all([
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("post" as any)
        .select("*", { count: "exact", head: true }),
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("item" as any)
        .select("*", { count: "exact", head: true }),
    ]);

    const stats = generateMockKPIStats(postCount ?? undefined);

    // Override totalSolutions with real item count when available.
    // Items in the DB are detected fashion products — semantically "solutions".
    if (itemCount !== null) {
      return { ...stats, totalSolutions: itemCount };
    }

    return stats;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchDashboardStats] Supabase error, using mock:", err);
    }
    return generateMockKPIStats();
  }
}

/**
 * Fetches time-series chart data.
 *
 * All data is mock because no analytics event tables exist in the database.
 *
 * @param days - Number of days to return (default 30, max 90)
 */
export async function fetchChartData(
  days: number = 30
): Promise<DailyMetric[]> {
  const clampedDays = Math.min(Math.max(1, days), 90);
  return generateDailyMetrics(clampedDays);
}

/**
 * Fetches today's activity summary.
 *
 * Attempts to query today's real post count from Supabase.
 * All other values are deterministic mock data.
 */
export async function fetchTodaySummary(): Promise<TodaySummary> {
  const summary = generateTodaySummary();

  try {
    const supabase = await createSupabaseServerClient();

    // Get today's date in ISO format (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count: todayPostCount } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("post" as any)
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    if (todayPostCount !== null) {
      return { ...summary, newPosts: todayPostCount };
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchTodaySummary] Supabase error, using mock:", err);
    }
  }

  return summary;
}
