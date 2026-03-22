/**
 * Mock data generators for AI cost monitoring metrics.
 *
 * No real AI cost tracking tables exist in the database — all cost data is
 * generated deterministically so that the same date always produces the same
 * values across server restarts and requests.
 *
 * Uses the same djb2-style hashing as mock-data.ts.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiCostDailyMetric {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Number of AI API calls made */
  apiCalls: number;
  /** Input token count */
  inputTokens: number;
  /** Output token count */
  outputTokens: number;
  /** Estimated USD cost for this day */
  estimatedCost: number;
}

export interface AiCostKPI {
  totalCalls: number;
  /** Percentage change vs previous period */
  totalCallsDelta?: number;
  totalTokens: number;
  totalTokensDelta?: number;
  /** Total estimated cost in USD */
  totalCost: number;
  totalCostDelta?: number;
  /** Average cost per API call in USD */
  avgCostPerCall: number;
}

export interface ModelCostBreakdown {
  /** Model display name (e.g., "Vision Model A") */
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  /** Estimated cost in USD */
  estimatedCost: number;
}

// ─── Model pricing constants ───────────────────────────────────────────────────

/**
 * AI model definitions with pricing per 1K tokens and traffic weight.
 * Weight represents the fraction of total calls routed to each model.
 */
const AI_MODELS = [
  {
    name: "Vision Model A",
    inputPricePerK: 0.0025,
    outputPricePerK: 0.01,
    weight: 0.5,
  },
  {
    name: "Vision Model B",
    inputPricePerK: 0.00025,
    outputPricePerK: 0.00125,
    weight: 0.35,
  },
  {
    name: "Vision Model C",
    inputPricePerK: 0.003,
    outputPricePerK: 0.015,
    weight: 0.15,
  },
] as const;

// Pre-computed blended prices (weighted average across models)
const WEIGHTED_INPUT_PRICE_PER_K = AI_MODELS.reduce(
  (sum, m) => sum + m.inputPricePerK * m.weight,
  0
);
const WEIGHTED_OUTPUT_PRICE_PER_K = AI_MODELS.reduce(
  (sum, m) => sum + m.outputPricePerK * m.weight,
  0
);

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

/**
 * Generates a date string `offsetDays` before today (UTC).
 * offset 0 = today, offset 1 = yesterday, etc.
 */
function dateOffset(today: Date, offsetDays: number): Date {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d;
}

// ─── Generators ───────────────────────────────────────────────────────────────

/**
 * Generates `days` days of AI cost daily metrics ending at today (UTC).
 *
 * Data characteristics:
 * - API calls: weekday range 50–120, weekend dip 30–60, slight upward trend
 * - Input tokens: 50K–200K per day
 * - Output tokens: 10K–50K per day (roughly 20–30% of input)
 * - Estimated cost: computed from blended model pricing (USD)
 *
 * Results are sorted chronologically (oldest first) for chart display.
 * The same date always returns the same values (deterministic seed).
 */
export function generateAiCostMetrics(days: number = 30): AiCostDailyMetric[] {
  const metrics: AiCostDailyMetric[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = dateOffset(today, i);
    const date = formatDate(d);

    // dayIndex 0 = oldest day, days-1 = today (for upward trend)
    const dayIndex = days - 1 - i;

    const isWeekend = [0, 6].includes(dayOfWeek(date));

    // API calls: weekday 50–120, weekend 30–60, slight upward trend
    const trendBoost = Math.floor(dayIndex * 0.3);
    const apiCalls = isWeekend
      ? deterministicInt(date + ":calls", 31) + 30 + trendBoost
      : deterministicInt(date + ":calls", 71) + 50 + trendBoost;

    // Token counts: deterministic per day
    const inputTokens = deterministicInt(date + ":input", 150001) + 50000;
    const outputTokens = deterministicInt(date + ":output", 40001) + 10000;

    // Estimated cost: blended pricing across models
    const inputCost = (inputTokens / 1000) * WEIGHTED_INPUT_PRICE_PER_K;
    const outputCost = (outputTokens / 1000) * WEIGHTED_OUTPUT_PRICE_PER_K;
    const estimatedCost = Math.round((inputCost + outputCost) * 10000) / 10000;

    metrics.push({ date, apiCalls, inputTokens, outputTokens, estimatedCost });
  }

  // Already chronological (oldest first) due to loop direction
  return metrics;
}

/**
 * Generates KPI summary statistics for a period.
 *
 * Computes current-period totals and compares them to the previous period
 * of equal length to produce delta percentages.
 *
 * @param days - Number of days in the current period (default 30)
 */
export function generateAiCostKPI(days: number = 30): AiCostKPI {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Current period: last `days` days
  const currentMetrics = generateAiCostMetrics(days);

  // Previous period: the `days` days before the current period
  // Shift reference point back by `days` to get prior period dates
  const previousToday = dateOffset(today, days);

  // Generate previous period metrics using the same deterministic logic
  const previousMetrics: AiCostDailyMetric[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dateOffset(previousToday, i);
    const date = formatDate(d);
    const dayIndex = days - 1 - i;
    const isWeekend = [0, 6].includes(dayOfWeek(date));
    const trendBoost = Math.floor(dayIndex * 0.3);
    const apiCalls = isWeekend
      ? deterministicInt(date + ":calls", 31) + 30 + trendBoost
      : deterministicInt(date + ":calls", 71) + 50 + trendBoost;
    const inputTokens = deterministicInt(date + ":input", 150001) + 50000;
    const outputTokens = deterministicInt(date + ":output", 40001) + 10000;
    const inputCost = (inputTokens / 1000) * WEIGHTED_INPUT_PRICE_PER_K;
    const outputCost = (outputTokens / 1000) * WEIGHTED_OUTPUT_PRICE_PER_K;
    const estimatedCost = Math.round((inputCost + outputCost) * 10000) / 10000;
    previousMetrics.push({
      date,
      apiCalls,
      inputTokens,
      outputTokens,
      estimatedCost,
    });
  }

  // Sum current period
  const totalCalls = currentMetrics.reduce((s, m) => s + m.apiCalls, 0);
  const totalTokens = currentMetrics.reduce(
    (s, m) => s + m.inputTokens + m.outputTokens,
    0
  );
  const totalCost = currentMetrics.reduce((s, m) => s + m.estimatedCost, 0);
  const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

  // Sum previous period
  const prevTotalCalls = previousMetrics.reduce((s, m) => s + m.apiCalls, 0);
  const prevTotalTokens = previousMetrics.reduce(
    (s, m) => s + m.inputTokens + m.outputTokens,
    0
  );
  const prevTotalCost = previousMetrics.reduce(
    (s, m) => s + m.estimatedCost,
    0
  );

  // Compute percentage deltas rounded to 1 decimal
  const calcDelta = (current: number, previous: number): number =>
    previous > 0
      ? Math.round(((current - previous) / previous) * 1000) / 10
      : 0;

  return {
    totalCalls,
    totalCallsDelta: calcDelta(totalCalls, prevTotalCalls),
    totalTokens,
    totalTokensDelta: calcDelta(totalTokens, prevTotalTokens),
    totalCost: Math.round(totalCost * 10000) / 10000,
    totalCostDelta: calcDelta(totalCost, prevTotalCost),
    avgCostPerCall: Math.round(avgCostPerCall * 10000) / 10000,
  };
}

/**
 * Generates per-model cost breakdown for a period.
 *
 * Distributes the total period metrics proportionally across AI_MODELS
 * using each model's traffic weight, with slight deterministic variance
 * applied to token distribution.
 *
 * @param days - Number of days to aggregate (default 30)
 */
export function generateModelCostBreakdown(
  days: number = 30
): ModelCostBreakdown[] {
  const metrics = generateAiCostMetrics(days);

  // Aggregate period totals
  const periodTotalCalls = metrics.reduce((s, m) => s + m.apiCalls, 0);
  const periodTotalInput = metrics.reduce((s, m) => s + m.inputTokens, 0);
  const periodTotalOutput = metrics.reduce((s, m) => s + m.outputTokens, 0);

  return AI_MODELS.map((model) => {
    // Distribute calls proportionally by weight
    const calls = Math.round(periodTotalCalls * model.weight);

    // Distribute tokens proportionally with slight variance
    // Variance seed uses model name + period start date for stability
    const periodStartDate = metrics[0]?.date ?? "2026-01-01";
    const inputVarianceFactor =
      0.95 + deterministicInt(model.name + periodStartDate + ":iv", 11) / 100;
    const outputVarianceFactor =
      0.95 + deterministicInt(model.name + periodStartDate + ":ov", 11) / 100;

    const inputTokens = Math.round(
      periodTotalInput * model.weight * inputVarianceFactor
    );
    const outputTokens = Math.round(
      periodTotalOutput * model.weight * outputVarianceFactor
    );

    // Compute cost using model-specific pricing
    const estimatedCost =
      Math.round(
        ((inputTokens / 1000) * model.inputPricePerK +
          (outputTokens / 1000) * model.outputPricePerK) *
          100
      ) / 100;

    return {
      model: model.name,
      calls,
      inputTokens,
      outputTokens,
      estimatedCost,
    };
  });
}
