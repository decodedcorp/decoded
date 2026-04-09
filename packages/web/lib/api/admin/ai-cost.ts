/**
 * AI cost monitoring data fetching layer (server-side only).
 *
 * No AI cost tracking tables exist in the database yet.
 * Returns empty data — UI shows an empty state placeholder.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AiCostDailyMetric {
  date: string;
  apiCalls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export interface AiCostKPI {
  totalCalls: number;
  totalCallsDelta?: number;
  totalTokens: number;
  totalTokensDelta?: number;
  totalCost: number;
  totalCostDelta?: number;
  avgCostPerCall: number;
}

export interface ModelCostBreakdown {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export interface AiCostChartResponse {
  daily: AiCostDailyMetric[];
  modelBreakdown: ModelCostBreakdown[];
}

// ─── Data fetchers (empty — no tables yet) ───────────────────────────────────

export async function fetchAiCostKPI(_days: number = 30): Promise<AiCostKPI> {
  return {
    totalCalls: 0,
    totalCallsDelta: 0,
    totalTokens: 0,
    totalTokensDelta: 0,
    totalCost: 0,
    totalCostDelta: 0,
    avgCostPerCall: 0,
  };
}

export async function fetchAiCostChart(
  _days: number = 30
): Promise<AiCostChartResponse> {
  return {
    daily: [],
    modelBreakdown: [],
  };
}
