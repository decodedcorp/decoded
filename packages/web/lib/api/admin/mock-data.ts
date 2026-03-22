/**
 * Mock data generators for admin dashboard time-series metrics.
 *
 * The actual database contains only bulk-imported static data:
 * - post: ~2,215 records (all created 2025-12-02)
 * - item: ~12,362 records
 * - image: ~12,429 records
 * - NO analytics, session, search, or click tracking tables
 *
 * Therefore all time-series and user-related metrics are generated here
 * using a deterministic algorithm based on the date string, so the same
 * date always produces the same values across requests.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Deterministic hash ───────────────────────────────────────────────────────

/**
 * Simple deterministic hash of a string → integer in [0, modulo).
 * Uses djb2-style hashing so the same input always returns the same output.
 */
function deterministicInt(seed: string, modulo: number): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash % modulo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the day of week (0 = Sunday, 6 = Saturday) for an ISO date string.
 */
function dayOfWeek(isoDate: string): number {
  return new Date(isoDate + "T00:00:00Z").getUTCDay();
}

/**
 * Formats a Date to YYYY-MM-DD in UTC.
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─── Generators ───────────────────────────────────────────────────────────────

/**
 * Generates `days` days of mock time-series data ending at today (UTC).
 *
 * Data characteristics:
 * - DAU: base ~120, weekend dip (~80), weekday range 100–160, slight trend
 * - Searches: base ~350, range 250–500, loosely correlated with DAU
 * - Clicks: base ~180, range 120–280, ~50% of searches
 *
 * The same date always returns the same values (deterministic seed).
 */
export function generateDailyMetrics(days: number = 30): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const date = formatDate(d);

    const isWeekend = [0, 6].includes(dayOfWeek(date));

    // Slight upward trend: days closer to today get a small boost
    const trendBoost = Math.floor(((days - 1 - i) / (days - 1)) * 20);

    // Deterministic variance per metric
    const dauVariance = deterministicInt(date + ":dau", 61) - 30; // [-30, +30]
    const searchVariance = deterministicInt(date + ":srch", 101) - 50; // [-50, +50]
    const clickVariance = deterministicInt(date + ":clk", 61) - 30; // [-30, +30]

    const baseDau = isWeekend ? 80 : 120;
    const dau = Math.max(10, baseDau + trendBoost + dauVariance);

    // Searches correlate with DAU (roughly 3× DAU), with some independent noise
    const baseSearches = Math.round(dau * 2.8);
    const searches = Math.max(50, baseSearches + searchVariance);

    // Clicks ~50% of searches with variance
    const baseClicks = Math.round(searches * 0.5);
    const clicks = Math.max(20, baseClicks + clickVariance);

    metrics.push({ date, dau, searches, clicks });
  }

  return metrics;
}

/**
 * Generates KPI card values. Pass `realPostCount` to override the mock post
 * total with the actual database count.
 */
export function generateMockKPIStats(realPostCount?: number): KPIStats {
  return {
    dau: 132,
    mau: 891,
    totalUsers: 1_243,
    totalPosts: realPostCount ?? 2_215,
    totalSolutions: 680,
    dauDelta: 3.2,
    mauDelta: 8.7,
    totalUsersDelta: 5.1,
    totalPostsDelta: 0, // Static bulk import — no real growth
    totalSolutionsDelta: -1.5,
  };
}

/**
 * Generates today's activity summary.
 * Values are deterministic based on today's date so they don't flicker on
 * each request within the same day.
 */
export function generateTodaySummary(): TodaySummary {
  const today = formatDate(new Date());

  // newPosts: 3–8 range
  const newPosts = 3 + deterministicInt(today + ":np", 6);
  // newSolutions: 5–15 range
  const newSolutions = 5 + deterministicInt(today + ":ns", 11);
  // clicks: 150–300 range
  const clicks = 150 + deterministicInt(today + ":cl", 151);

  return {
    newPosts,
    newSolutions,
    clicks,
    timestamp: new Date().toISOString(),
  };
}
