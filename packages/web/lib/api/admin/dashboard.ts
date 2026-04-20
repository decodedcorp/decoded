/**
 * Admin dashboard data fetching — served by api-server.
 *
 * Previously queried Supabase directly from Next.js server routes; after the
 * #265 refactor all reads go through api-server (`/api/v1/admin/dashboard`
 * family). The same function interface is preserved so existing Next.js
 * route handlers stay unchanged.
 *
 * Auth: Next.js route handlers validate admin session first, then forward the
 * access token to api-server for service-role enforcement.
 */

import { API_BASE_URL } from "@/lib/server-env";

// ─── Types (unchanged public interface) ─────────────────────────────────────

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
  /**
   * Percentage change from previous period.
   * Currently returned as 0 — api-server does not compute deltas yet.
   * Follow-up: expose delta fields on DashboardStatsResponse.
   */
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

// ─── api-server wire types ──────────────────────────────────────────────────

interface BackendDashboardStats {
  dau: number;
  mau: number;
  total_users: number;
  total_posts: number;
  total_solutions: number;
  total_clicks: number;
  today_posts: number;
  today_solutions: number;
  today_clicks: number;
}

interface BackendDailyTraffic {
  date: string;
  dau: number;
  search_count: number;
  click_count: number;
}

interface BackendTrafficAnalysis {
  daily_traffic: BackendDailyTraffic[];
  total_searches: number;
  total_clicks: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function backendFetch<T>(
  path: string,
  accessToken: string | undefined
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[admin/dashboard] ${path} failed: ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[admin/dashboard] ${path} error:`, err);
    return null;
  }
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Data fetchers (preserved public API) ───────────────────────────────────

/**
 * Fetches KPI statistics. Delta fields are currently 0 — extend api-server's
 * DashboardStatsResponse to return deltas when needed.
 */
export async function fetchDashboardStats(
  accessToken?: string
): Promise<KPIStats> {
  const stats = await backendFetch<BackendDashboardStats>(
    "/api/v1/admin/dashboard",
    accessToken
  );
  if (!stats) {
    return {
      dau: 0,
      mau: 0,
      totalUsers: 0,
      totalPosts: 0,
      totalSolutions: 0,
    };
  }
  return {
    dau: stats.dau,
    mau: stats.mau,
    totalUsers: stats.total_users,
    totalPosts: stats.total_posts,
    totalSolutions: stats.total_solutions,
    // Deltas are placeholders — compute server-side when the metric becomes actionable
    dauDelta: 0,
    mauDelta: 0,
    totalUsersDelta: 0,
    totalPostsDelta: 0,
    totalSolutionsDelta: 0,
  };
}

/**
 * Fetches daily traffic metrics for the last N days (max 90).
 */
export async function fetchChartData(
  days: number = 30,
  accessToken?: string
): Promise<DailyMetric[]> {
  const clampedDays = Math.min(Math.max(1, days), 90);
  const start = daysAgoIso(clampedDays - 1); // inclusive range
  const end = todayIso();
  const traffic = await backendFetch<BackendTrafficAnalysis>(
    `/api/v1/admin/dashboard/traffic?start_date=${start}&end_date=${end}`,
    accessToken
  );
  if (!traffic) return [];
  return traffic.daily_traffic.map((d) => ({
    date: d.date,
    dau: d.dau,
    searches: d.search_count,
    clicks: d.click_count,
  }));
}

/**
 * Today-only activity summary — derived from the main dashboard stats endpoint
 * (today_posts/today_solutions/today_clicks fields).
 */
export async function fetchTodaySummary(
  accessToken?: string
): Promise<TodaySummary> {
  const stats = await backendFetch<BackendDashboardStats>(
    "/api/v1/admin/dashboard",
    accessToken
  );
  if (!stats) {
    return {
      newPosts: 0,
      newSolutions: 0,
      clicks: 0,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    newPosts: stats.today_posts,
    newSolutions: stats.today_solutions,
    clicks: stats.today_clicks,
    timestamp: new Date().toISOString(),
  };
}
