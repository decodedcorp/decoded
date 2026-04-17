/**
 * Admin dashboard data fetching layer (server-side only).
 *
 * Queries real Supabase tables:
 * - post / item → content counts
 * - users → total user count
 * - user_events → DAU / MAU (distinct user_id)
 * - view_logs, click_logs, search_logs → time-series chart data
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DailyMetric {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Daily Active Users */
  dau: number;
  /** Search count */
  searches: number;
  /** Click count */
  clicks: number;
}

export interface KPIStats {
  dau: number;
  mau: number;
  totalUsers: number;
  totalPosts: number;
  totalSolutions: number;
  /** Percentage change from previous period (positive = growth) */
  dauDelta?: number;
  mauDelta?: number;
  totalUsersDelta?: number;
  totalPostsDelta?: number;
  totalSolutionsDelta?: number;
}

export interface TodaySummary {
  newPosts: number;
  newSolutions: number;
  clicks: number;
  /** ISO timestamp of data generation */
  timestamp: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStartUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgoUTC(days: number): Date {
  const d = todayStartUTC();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ─── Data fetchers ───────────────────────────────────────────────────────────

/**
 * Fetches KPI statistics for the dashboard overview cards.
 * All values come from real Supabase tables.
 */
export async function fetchDashboardStats(): Promise<KPIStats> {
  const supabase = await createSupabaseServerClient();

  const today = todayStartUTC();
  const tomorrow = daysAgoUTC(-1);
  const yesterday = daysAgoUTC(1);
  const d30ago = daysAgoUTC(30);
  const d60ago = daysAgoUTC(60);

  const ranges = {
    dau: { from: today, to: tomorrow },
    mau: { from: d30ago, to: tomorrow },
    prevDau: { from: yesterday, to: today },
    prevMau: { from: d60ago, to: d30ago },
  } as const;

  try {
    const [
      { count: postCount },
      { count: itemCount },
      { count: userCount },
      { data: dau, error: e1 },
      { data: mau, error: e2 },
      { data: prevDau, error: e3 },
      { data: prevMau, error: e4 },
    ] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from("post" as any).select("*", { count: "exact", head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from("item" as any).select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.rpc("admin_distinct_user_count", {
        p_from_ts: ranges.dau.from.toISOString(),
        p_to_ts: ranges.dau.to.toISOString(),
      }),
      supabase.rpc("admin_distinct_user_count", {
        p_from_ts: ranges.mau.from.toISOString(),
        p_to_ts: ranges.mau.to.toISOString(),
      }),
      supabase.rpc("admin_distinct_user_count", {
        p_from_ts: ranges.prevDau.from.toISOString(),
        p_to_ts: ranges.prevDau.to.toISOString(),
      }),
      supabase.rpc("admin_distinct_user_count", {
        p_from_ts: ranges.prevMau.from.toISOString(),
        p_to_ts: ranges.prevMau.to.toISOString(),
      }),
    ]);

    if (e1 || e2 || e3 || e4) throw e1 ?? e2 ?? e3 ?? e4;

    const dauN = (dau as number | null) ?? 0;
    const mauN = (mau as number | null) ?? 0;
    const prevDauN = (prevDau as number | null) ?? 0;
    const prevMauN = (prevMau as number | null) ?? 0;

    return {
      dau: dauN,
      mau: mauN,
      totalUsers: userCount ?? 0,
      totalPosts: postCount ?? 0,
      totalSolutions: itemCount ?? 0,
      dauDelta: calcDelta(dauN, prevDauN),
      mauDelta: calcDelta(mauN, prevMauN),
      totalUsersDelta: 0,
      totalPostsDelta: 0,
      totalSolutionsDelta: 0,
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchDashboardStats] Supabase error:", err);
    }
    return {
      dau: 0,
      mau: 0,
      totalUsers: 0,
      totalPosts: 0,
      totalSolutions: 0,
    };
  }
}

/**
 * Fetches time-series chart data from real log tables.
 *
 * Queries view_logs, click_logs, search_logs, and user_events
 * grouped by date for the last N days.
 *
 * @param days - Number of days to return (default 30, max 90)
 */
export async function fetchChartData(
  days: number = 30
): Promise<DailyMetric[]> {
  const clampedDays = Math.min(Math.max(1, days), 90);
  const from = daysAgoUTC(clampedDays - 1);
  const to = daysAgoUTC(-1);

  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase.rpc("admin_daily_metrics", {
      p_from_ts: from.toISOString(),
      p_to_ts: to.toISOString(),
    });
    if (error) throw error;

    return (data ?? []).map((r) => ({
      date: r.day,
      dau: r.dau ?? 0,
      searches: r.searches ?? 0,
      clicks: r.clicks ?? 0,
    }));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchChartData] Supabase error:", err);
    }
    return [];
  }
}

/**
 * Fetches today's activity summary from real tables.
 */
export async function fetchTodaySummary(): Promise<TodaySummary> {
  const todayIso = todayStartUTC().toISOString();
  const supabase = await createSupabaseServerClient();

  try {
    const [{ count: newPosts }, { count: newSolutions }, { count: clicks }] =
      await Promise.all([
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("post" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayIso),
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("item" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayIso),
        supabase
          .from("click_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayIso),
      ]);

    return {
      newPosts: newPosts ?? 0,
      newSolutions: newSolutions ?? 0,
      clicks: clicks ?? 0,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchTodaySummary] Supabase error:", err);
    }
    return {
      newPosts: 0,
      newSolutions: 0,
      clicks: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
