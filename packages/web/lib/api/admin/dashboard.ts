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
  const yesterday = daysAgoUTC(1);
  const thirtyDaysAgo = daysAgoUTC(30);
  const sixtyDaysAgo = daysAgoUTC(60);

  try {
    // Parallel queries for current stats
    const [
      { count: postCount },
      { count: itemCount },
      { count: userCount },
      { data: dauData },
      { data: mauData },
      // Previous period for deltas
      { data: prevDauData },
      { data: prevMauData },
    ] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from("post" as any).select("*", { count: "exact", head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from("item" as any).select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
      // DAU: distinct user_id today
      supabase
        .from("user_events")
        .select("user_id")
        .gte("created_at", today.toISOString()),
      // MAU: distinct user_id last 30 days
      supabase
        .from("user_events")
        .select("user_id")
        .gte("created_at", thirtyDaysAgo.toISOString()),
      // Previous DAU: yesterday
      supabase
        .from("user_events")
        .select("user_id")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString()),
      // Previous MAU: 60-30 days ago
      supabase
        .from("user_events")
        .select("user_id")
        .gte("created_at", sixtyDaysAgo.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString()),
    ]);

    const dau = new Set(dauData?.map((r) => r.user_id)).size;
    const mau = new Set(mauData?.map((r) => r.user_id)).size;
    const prevDau = new Set(prevDauData?.map((r) => r.user_id)).size;
    const prevMau = new Set(prevMauData?.map((r) => r.user_id)).size;

    return {
      dau,
      mau,
      totalUsers: userCount ?? 0,
      totalPosts: postCount ?? 0,
      totalSolutions: itemCount ?? 0,
      dauDelta: calcDelta(dau, prevDau),
      mauDelta: calcDelta(mau, prevMau),
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
  const since = daysAgoUTC(clampedDays);
  const sinceIso = since.toISOString();

  const supabase = await createSupabaseServerClient();

  try {
    const [
      { data: viewRows },
      { data: clickRows },
      { data: searchRows },
      { data: eventRows },
    ] = await Promise.all([
      supabase
        .from("view_logs")
        .select("created_at")
        .gte("created_at", sinceIso),
      supabase
        .from("click_logs")
        .select("created_at")
        .gte("created_at", sinceIso),
      supabase
        .from("search_logs")
        .select("created_at")
        .gte("created_at", sinceIso),
      supabase
        .from("user_events")
        .select("created_at, user_id")
        .gte("created_at", sinceIso),
    ]);

    // Build date → counts map
    const dateMap = new Map<
      string,
      { views: number; clicks: number; searches: number; userIds: Set<string> }
    >();

    // Initialize all dates
    for (let i = clampedDays - 1; i >= 0; i--) {
      const d = daysAgoUTC(i);
      dateMap.set(formatDate(d), {
        views: 0,
        clicks: 0,
        searches: 0,
        userIds: new Set(),
      });
    }

    const getDate = (ts: string) => ts.slice(0, 10);

    viewRows?.forEach((r) => {
      const key = getDate(r.created_at);
      const entry = dateMap.get(key);
      if (entry) entry.views++;
    });

    clickRows?.forEach((r) => {
      const key = getDate(r.created_at);
      const entry = dateMap.get(key);
      if (entry) entry.clicks++;
    });

    searchRows?.forEach((r) => {
      const key = getDate(r.created_at);
      const entry = dateMap.get(key);
      if (entry) entry.searches++;
    });

    eventRows?.forEach((r) => {
      const key = getDate(r.created_at);
      const entry = dateMap.get(key);
      if (entry) entry.userIds.add(r.user_id);
    });

    // Convert to sorted array
    const metrics: DailyMetric[] = [];
    for (const [date, data] of dateMap) {
      metrics.push({
        date,
        dau: data.userIds.size,
        searches: data.searches,
        clicks: data.clicks,
      });
    }

    metrics.sort((a, b) => a.date.localeCompare(b.date));
    return metrics;
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
