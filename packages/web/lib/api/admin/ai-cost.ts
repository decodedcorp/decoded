/**
 * AI cost monitoring data fetching layer (server-side only).
 *
 * All data is pure mock — no AI cost tracking tables exist in the database.
 * Uses deterministic generators so the same date always produces the same values.
 */

import {
  generateAiCostMetrics,
  generateAiCostKPI,
  generateModelCostBreakdown,
  type AiCostDailyMetric,
  type AiCostKPI,
  type ModelCostBreakdown,
} from "./ai-cost-mock-data";

// Re-export types so UI consumers only need one import
export type { AiCostDailyMetric, AiCostKPI, ModelCostBreakdown };

// ─── Response types ────────────────────────────────────────────────────────────

/**
 * Combined chart response: daily time-series + per-model breakdown.
 * Bundled so the UI page can fetch both in a single request.
 */
export interface AiCostChartResponse {
  daily: AiCostDailyMetric[];
  modelBreakdown: ModelCostBreakdown[];
}

// ─── Data fetchers ─────────────────────────────────────────────────────────────

/**
 * Fetches KPI summary statistics for the AI cost overview cards.
 *
 * Returns total calls, tokens, cost, and average cost per call for the period,
 * along with percentage deltas vs the previous period of equal length.
 *
 * @param days - Number of days in the period (default 30)
 */
export async function fetchAiCostKPI(days: number = 30): Promise<AiCostKPI> {
  return generateAiCostKPI(days);
}

/**
 * Fetches daily AI cost time-series and per-model cost breakdown.
 *
 * Returns both datasets in a single response to minimize API calls from the UI.
 * The daily array is sorted chronologically (oldest first).
 *
 * @param days - Number of days to include (default 30)
 */
export async function fetchAiCostChart(
  days: number = 30
): Promise<AiCostChartResponse> {
  return {
    daily: generateAiCostMetrics(days),
    modelBreakdown: generateModelCostBreakdown(days),
  };
}
