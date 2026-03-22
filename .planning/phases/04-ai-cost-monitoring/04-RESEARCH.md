# Phase 04: AI Cost Monitoring - Research

**Researched:** 2026-02-19
**Domain:** Admin dashboard page — recharts charts, mock data, cost/token visualization
**Confidence:** HIGH

## Summary

Phase 04 builds the AI Cost Monitoring page inside the existing admin panel. It follows the identical structural pattern established in v3-02 (Dashboard): mock-data generator → API route → React Query hook → display component + skeleton variant → page composition. No new libraries are needed — recharts@3.7.0 is already installed and in use.

The domain is straightforward because the codebase already has working, well-established precedents for every sub-problem: deterministic mock generation, Recharts AreaChart with gradient fills, period selectors, KPI cards with deltas, and the admin component pattern. The main design decisions are which chart types to use and how to structure the mock data for AI cost metrics (API call counts, token usage, cost estimates).

The recommended approach is: stacked AreaChart for token usage (input vs output tokens), BarChart for API call counts (groups by day), and a cost breakdown table or card grid for per-model cost estimation. The page follows the single-scroll layout with a top period selector (matching the Dashboard pattern), 4 KPI cards (total calls, total tokens, estimated cost, avg cost per call), then the three data sections.

**Primary recommendation:** Mirror the v3-02 Dashboard architecture exactly — mock-data file → API route → React Query hook → display + skeleton — and use recharts AreaChart (stacked) for tokens and BarChart for API calls, all driven by a single page-level period selector.

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.7.0 | Charts — AreaChart, BarChart, ResponsiveContainer, Tooltip, Legend | Already in use for TrafficChart. Verified working in dark/light mode with gradient fills. |
| @tanstack/react-query | 5.90.11 | Data fetching with caching | Already in use for all admin hooks (useDashboard, useAudit). |
| lucide-react | 0.555.0 | Icons for KPI cards | Already in use across all admin components. |

### No new dependencies required

All required libraries are already installed. This phase is pure implementation using established patterns.

**Installation:**

```bash
# Nothing to install — recharts, react-query, and lucide-react are already present
```

## Architecture Patterns

### Recommended Project Structure

```
packages/web/
├── lib/
│   └── api/
│       └── admin/
│           ├── ai-cost-mock-data.ts    # NEW: Mock data generators for AI cost metrics
│           └── ai-cost.ts             # NEW: Server-side data fetching layer
│
├── app/
│   ├── api/v1/admin/
│   │   └── ai-cost/
│   │       ├── kpi/route.ts           # NEW: GET /api/v1/admin/ai-cost/kpi
│   │       └── chart/route.ts         # NEW: GET /api/v1/admin/ai-cost/chart?days=N
│   └── admin/
│       └── ai-cost/
│           └── page.tsx               # REPLACE: Currently a placeholder
│
└── lib/
    ├── hooks/admin/
    │   └── useAiCost.ts               # NEW: React Query hooks
    └── components/admin/
        └── ai-cost/
            ├── CostKPICards.tsx       # NEW: KPI cards + skeleton
            ├── TokenUsageChart.tsx    # NEW: AreaChart (stacked input/output) + skeleton
            ├── ApiCallsChart.tsx      # NEW: BarChart (daily API calls) + skeleton
            └── ModelCostTable.tsx     # NEW: Per-model cost breakdown table + skeleton
```

### Pattern 1: Deterministic Mock Data Generator (djb2 hash)

**What:** Use the same djb2-style hash seeding approach from `mock-data.ts` and `audit-mock-data.ts`. Seed with `date + ":metric"` string so values are stable across requests.

**When to use:** Always for mock data — prevents flickering across page refreshes and SSR/CSR hydration mismatches.

**Example (verified from existing `mock-data.ts`):**

```typescript
// Source: packages/web/lib/api/admin/mock-data.ts (established pattern)
function deterministicInt(seed: string, modulo: number): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash % modulo;
}
```

For AI cost mock data, realistic ranges to use:

```typescript
// API calls per day: realistic SaaS AI usage
// - base ~50 calls/day (small app), weekdays higher
// - Range: 30–120 calls/day depending on period

// Token usage per day:
// - input tokens: 50,000–200,000 / day
// - output tokens: 10,000–50,000 / day
// (Output tokens typically 20–30% of input for image analysis tasks)

// Cost per model (USD, realistic 2025 pricing for placeholder models):
// - Model A (GPT-4o level): $0.0025 / 1K input tokens, $0.010 / 1K output tokens
// - Model B (Claude Haiku level): $0.00025 / 1K input tokens, $0.00125 / 1K output tokens
// - Model C (Claude Sonnet level): $0.003 / 1K input tokens, $0.015 / 1K output tokens

// Placeholder model names (user will specify later — use generic labels):
// "Vision Model A", "Vision Model B", "Vision Model C"
```

### Pattern 2: Admin Data Layer (server-side)

**What:** Pure-mock data layer — no real Supabase queries needed since AI call data doesn't exist in the DB. Simpler than the dashboard pattern (no Supabase fallback needed).

```typescript
// Source: packages/web/lib/api/admin/dashboard.ts (established pattern — simplified for pure mock)

// ai-cost.ts exports:
export async function fetchAiCostKPI(days: number): Promise<AiCostKPI>
export async function fetchAiCostChart(days: number): Promise<AiCostDailyMetric[]>

// No Supabase calls needed — all AI cost data is mock
```

### Pattern 3: API Route with Admin Auth

**What:** Standard admin route pattern — auth check first, then return data. Identical to all existing admin routes.

```typescript
// Source: packages/web/app/api/v1/admin/dashboard/chart/route.ts (established pattern)
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = await checkIsAdmin(supabase, user.id);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // ... return data
}
```

### Pattern 4: React Query Hooks

**What:** Simple `useQuery` hooks with `queryKey` including period so changing the period refetches. Same as `useChartData(days)` pattern.

```typescript
// Source: packages/web/lib/hooks/admin/useDashboard.ts (established pattern)
export function useAiCostChart(days: number = 30): UseQueryResult<AiCostDailyMetric[]> {
  return useQuery<AiCostDailyMetric[]>({
    queryKey: ["admin", "ai-cost", "chart", days],
    queryFn: () => adminFetch(`/api/v1/admin/ai-cost/chart?days=${days}`),
    staleTime: 60_000,
  });
}
```

### Pattern 5: Recharts AreaChart with Gradient Fills

**What:** Stacked AreaChart for token usage. Already proven working with dark/light mode gradient fills in TrafficChart.

```typescript
// Source: packages/web/lib/components/admin/dashboard/TrafficChart.tsx (established pattern)
<defs>
  <linearGradient id="gradInput" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
  </linearGradient>
  <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.12} />
    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
  </linearGradient>
</defs>
<AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
  <Area
    type="monotone"
    dataKey="inputTokens"
    name="Input Tokens"
    stroke="#6366f1"
    strokeWidth={2}
    fill="url(#gradInput)"
    dot={false}
    activeDot={{ r: 4, strokeWidth: 0 }}
  />
  <Area
    type="monotone"
    dataKey="outputTokens"
    name="Output Tokens"
    stroke="#ec4899"
    strokeWidth={2}
    fill="url(#gradOutput)"
    dot={false}
    activeDot={{ r: 4, strokeWidth: 0 }}
  />
</AreaChart>
```

### Pattern 6: Recharts BarChart for API Call Counts

**What:** BarChart is available in recharts 3.7.0 (verified). Better visual metaphor for "count per day" than area chart. Single-series or grouped bars.

```typescript
// recharts BarChart verified available: packages/web/node_modules/recharts (exports: Bar, BarChart)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

<ResponsiveContainer width="100%" height={240}>
  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={formatDateLabel} interval={interval} />
    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={40} />
    <Tooltip content={<CustomTooltip />} />
    <Bar dataKey="apiCalls" name="API Calls" fill="#3b82f6" radius={[2, 2, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Pattern 7: KPI Card with Delta (established)

**What:** Same KPI card pattern from `KPICards.tsx` — label + value + delta with TrendingUp/TrendingDown icons.

For cost metrics, extend with currency formatting:

```typescript
// Currency formatter for USD display
function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

// Token count formatter (abbreviated)
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("en-US");
}
```

### Pattern 8: Per-Model Cost Breakdown (table format)

**What:** A simple table or list showing cost per model for the selected period. More readable than cards for a list of items with multiple columns.

```typescript
// Recommended: simple table inside a card container (same card styling)
// Columns: Model name | API Calls | Input Tokens | Output Tokens | Est. Cost
// Rows: one per placeholder model (3 models)
// Footer row: totals
```

### Pattern 9: Page-Level Period Selector (established)

**What:** Single `useState(30)` at the page level, passed down to charts. Same as `AdminDashboardPage.tsx`.

```typescript
// Source: packages/web/app/admin/page.tsx (established pattern)
const [period, setPeriod] = useState(30);
const kpiQuery = useAiCostKPI(period);
const chartQuery = useAiCostChart(period);
// Both queries refetch when period changes (period is in queryKey)
```

**Period presets to use:** 7D / 30D / 90D (not 14D — 90D makes more sense for cost monitoring since billing is monthly).

### Pattern 10: Component + Skeleton Variant (established)

**What:** Every display component exports a `Component` and `ComponentSkeleton` pair. Skeleton uses `animate-pulse bg-gray-200 dark:bg-gray-800 rounded`.

```typescript
// Source: all existing admin components (established pattern)
export function TokenUsageChart({ data, ... }: TokenUsageChartProps) { ... }
export function TokenUsageChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-5">
        <div className="h-4 w-36 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-10 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md" />
          ))}
        </div>
      </div>
      <div className="h-[240px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Separate period selector per chart:** Dashboard uses page-level period state, not per-chart. Keep single period selector in page header for consistency.
- **Real Supabase queries for AI cost data:** No AI cost tables exist in DB. All data is mock. Don't attempt Supabase fallback — go pure mock like audit-mock-data.ts.
- **Module-level cache singleton for time-varying data:** The audit data uses `_cachedRequests` because data is static. AI cost data is time-varying (different days have different values) — use the date-seeded deterministic approach from mock-data.ts instead.
- **Recharts dark mode via className prop:** Recharts SVG elements don't support Tailwind dark: prefix directly. Use explicit color values in SVG attributes (as done in TrafficChart). The container div uses dark: prefix, but axis tick colors are specified as hex strings.
- **Custom date picker:** Period selector should use preset buttons only (7D/30D/90D) — consistent with Dashboard, no custom date range picker needed per CONTEXT.md.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart rendering | Custom SVG charts | recharts BarChart, AreaChart | Already installed, working, dark-mode compatible pattern exists |
| Deterministic mock | Math.random() | djb2 hash seeding (copy pattern from mock-data.ts) | Math.random() causes SSR/CSR hydration mismatches |
| KPI card component | New card component | Inline — same structure as KPICard in KPICards.tsx | No shared design system card needed for this page |
| Cost formatting | Custom number format | `toFixed(2)` with `$` prefix | Sufficient for USD cost display |
| Token abbreviation | Complex formatter | Simple K/M thresholds in a helper | Tokens rarely reach B range in small apps |
| Data fetching | useEffect + useState | useQuery from @tanstack/react-query | Consistent with all other admin pages, handles caching/loading/error |

**Key insight:** All "hard problems" on this page are already solved in the existing codebase. The work is additive pattern-following, not problem-solving.

## Common Pitfalls

### Pitfall 1: BarChart `radius` Prop Type

**What goes wrong:** `radius={[2, 2, 0, 0]}` is valid in recharts for rounded top corners on bars, but TypeScript may warn about array vs number. Use number array `[2, 2, 0, 0]` — top-left, top-right, bottom-right, bottom-left.

**Why it happens:** recharts types can be inconsistent between versions.

**How to avoid:** If TypeScript complains, cast as `radius={[2, 2, 0, 0] as [number, number, number, number]}` or use `radius={2}` (rounds all corners equally).

**Warning signs:** TS error `Type 'number[]' is not assignable to type 'number'`.

### Pitfall 2: Recharts `stroke` Attribute in Dark Mode

**What goes wrong:** CartesianGrid `stroke="#e5e7eb"` is a light gray that disappears on dark backgrounds. Cannot use Tailwind dark: on SVG attributes.

**Why it happens:** Recharts renders SVG, not HTML — Tailwind's class-based dark mode doesn't apply to SVG attributes.

**How to avoid:** The established solution (from TrafficChart.tsx) is to use `className="dark:stroke-gray-800"` on CartesianGrid. This works because recharts passes className through to the SVG element. Verified in the codebase.

```typescript
// Correct (from TrafficChart.tsx):
<CartesianGrid
  strokeDasharray="3 3"
  stroke="#e5e7eb"
  className="dark:stroke-gray-800"
  vertical={false}
/>
```

**Warning signs:** Grid lines invisible in dark mode.

### Pitfall 3: Large Y-Axis Token Numbers Causing Label Overflow

**What goes wrong:** Token counts like "150,000" on the Y-axis are too wide for the default YAxis width, pushing the chart area into the negative.

**Why it happens:** recharts YAxis default width is too narrow for 6-digit numbers.

**How to avoid:** Use token abbreviation formatter on the YAxis tickFormatter, same as the custom tooltip. Or set `width={55}` instead of `width={40}` on YAxis, or set `left: -20` in margin.

```typescript
<YAxis
  tick={{ fontSize: 11, fill: "#9ca3af" }}
  tickLine={false}
  axisLine={false}
  width={55}
  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
/>
```

**Warning signs:** Chart area is clipped or overlapping with Y-axis labels.

### Pitfall 4: Period Change Not Refetching

**What goes wrong:** Changing period selector doesn't refetch data because the queryKey wasn't updated.

**Why it happens:** If `days` is not included in the `queryKey`, React Query treats all periods as the same cache entry.

**How to avoid:** Include `days` in the query key: `queryKey: ["admin", "ai-cost", "chart", days]`. This is the established pattern from `useChartData`.

**Warning signs:** Chart shows same data regardless of period selected.

### Pitfall 5: Cost Calculation Precision

**What goes wrong:** Cost calculated as `(tokens / 1000) * pricePerK` loses precision for sub-cent amounts, or shows ugly floats like `$0.123456`.

**Why it happens:** JavaScript floating point arithmetic.

**How to avoid:** Calculate in integer microdollars, then format. Or simply use `toFixed(4)` for display when cost < $0.01, `toFixed(2)` otherwise. For totals, `toFixed(2)` is fine.

**Warning signs:** Displayed costs have many decimal places or round to $0.00 unexpectedly.

## Code Examples

Verified patterns from the codebase:

### Page-Level Period State and Query (from app/admin/page.tsx)

```typescript
// Source: packages/web/app/admin/page.tsx
"use client";
import { useState } from "react";

export default function AiCostPage() {
  const [period, setPeriod] = useState(30);

  const kpiQuery = useAiCostKPI(period);
  const chartQuery = useAiCostChart(period);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          AI Cost
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          API usage, token consumption, and cost estimation
        </p>
      </div>
      {/* Period selector at page level */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {PERIODS.map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={period === p.value
              ? "px-3 py-1 text-xs font-medium rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
              : "px-3 py-1 text-xs font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }>{p.label}</button>
        ))}
      </div>
      {/* Components */}
    </div>
  );
}
```

### Deterministic Mock Data for AI Cost (new pattern, follows existing convention)

```typescript
// Source: pattern from packages/web/lib/api/admin/mock-data.ts

export interface AiCostDailyMetric {
  date: string;           // YYYY-MM-DD
  apiCalls: number;       // Number of AI API calls
  inputTokens: number;    // Input token count
  outputTokens: number;   // Output token count
  estimatedCost: number;  // USD cost for this day
}

export interface AiCostKPI {
  totalCalls: number;
  totalCallsDelta?: number;       // % change vs previous period
  totalTokens: number;
  totalTokensDelta?: number;
  totalCost: number;              // USD
  totalCostDelta?: number;
  avgCostPerCall: number;         // USD
}

export interface ModelCostBreakdown {
  model: string;                  // e.g., "Vision Model A"
  calls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;          // USD
}

export function generateAiCostMetrics(days: number = 30): AiCostDailyMetric[] {
  // Use deterministicInt seeded on date + metric name
  // Realistic ranges: 30-120 API calls/day, 50K-200K input tokens/day
}

export function generateAiCostKPI(days: number = 30): AiCostKPI {
  // Sum the daily metrics and compute period-over-period delta
}

export function generateModelCostBreakdown(days: number = 30): ModelCostBreakdown[] {
  // 3 placeholder models with realistic distribution (one dominant model)
}
```

### Custom Tooltip for Cost Data

```typescript
// Extends the custom tooltip pattern from TrafficChart.tsx
function CostTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label ? formatDateLabel(label) : ""}
      </p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-gray-600 dark:text-gray-400">{item.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {item.name === "Est. Cost"
              ? `$${Number(item.value).toFixed(4)}`
              : Number(item.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Model Cost Table

```typescript
// Simple table inside the standard card container
export function ModelCostTable({ data }: { data: ModelCostBreakdown[] }) {
  const total = data.reduce((acc, m) => acc + m.estimatedCost, 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Cost by Model
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
            <th className="pb-2 font-medium">Model</th>
            <th className="pb-2 font-medium text-right">Calls</th>
            <th className="pb-2 font-medium text-right">Tokens</th>
            <th className="pb-2 font-medium text-right">Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          {data.map((model) => (
            <tr key={model.model} className="border-b border-gray-50 dark:border-gray-800/50">
              <td className="py-2.5 text-gray-900 dark:text-gray-100 font-medium">{model.model}</td>
              <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">{model.calls.toLocaleString()}</td>
              <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">{formatTokens(model.inputTokens + model.outputTokens)}</td>
              <td className="py-2.5 text-right text-gray-900 dark:text-gray-100 font-medium">${model.estimatedCost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            <td className="pt-2.5">Total</td>
            <td />
            <td />
            <td className="pt-2.5 text-right">${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Random mock data | Deterministic djb2 hash seeding | v3-02 (02-01) | No flickering across requests/refreshes |
| Per-chart period selectors | Page-level period selector | v3-02 (02-02) | Consistent filtering across all sections |
| Skeleton only on loading | Skeleton on both loading AND error | v3-02 (02-02) | Graceful degradation |
| Static recharts stroke colors | `className="dark:stroke-gray-800"` on CartesianGrid | v3-02 (02-02) | Dark mode grid lines |

**Deprecated/outdated for this codebase:**
- Module-level `_cachedRequests` singleton: used in audit (static list), NOT appropriate for time-varying daily metrics.

## Open Questions

1. **Placeholder model names**
   - What we know: User said "AI model list will be specified by user later — use placeholder models during planning/research"
   - What's unclear: Final names (GPT-4o, Claude 3.5 Sonnet, etc.) not yet decided
   - Recommendation: Use "Vision Model A", "Vision Model B", "Vision Model C" as placeholder names in mock data. Make the model list a constant array so the user can swap names in one place. The plan should note where to update.

2. **Plan count (1 plan vs 2 plans)**
   - What we know: v3-02 Dashboard split into 2 plans (data layer + UI). v3-03 Audit also 2 plans.
   - What's unclear: Whether AI Cost warrants 2 plans or can be done in 1.
   - Recommendation: Use 2 plans. Plan 01 = mock data + API routes (autonomous). Plan 02 = UI components + page (checkpoint:human-verify). This matches the established rhythm and keeps tasks to a reasonable size.

3. **Chart height on the API calls BarChart**
   - What we know: TrafficChart uses height={300}, but API calls is a simpler single-series chart.
   - Recommendation: Use height={240} for BarChart and height={260} for token AreaChart to differentiate visual weight. No validation needed.

## Sources

### Primary (HIGH confidence)

- Codebase — `packages/web/lib/api/admin/mock-data.ts` — djb2 hash pattern, realistic value ranges
- Codebase — `packages/web/lib/components/admin/dashboard/TrafficChart.tsx` — recharts AreaChart usage, dark mode solution, custom tooltip
- Codebase — `packages/web/lib/components/admin/dashboard/KPICards.tsx` — KPI card structure, delta display
- Codebase — `packages/web/lib/hooks/admin/useDashboard.ts` — React Query hook pattern
- Codebase — `packages/web/app/api/v1/admin/dashboard/chart/route.ts` — API route pattern
- Codebase — `packages/web/app/admin/page.tsx` — Page composition pattern, period selector at page level
- Codebase — `packages/web/app/admin/layout.tsx` — Admin auth pattern
- Shell inspection — `node -e "require('./packages/web/node_modules/recharts')"` — confirmed BarChart, AreaChart available in recharts 3.7.0

### Secondary (MEDIUM confidence)

- Package inspection — recharts@3.7.0 — confirmed installed, confirmed BarChart, Area, AreaChart, ComposedChart available
- Codebase — `packages/web/lib/api/admin/audit-mock-data.ts` — module-level cache pattern (NOT used for time-varying data)

### Tertiary (LOW confidence)

- None. All findings are verified against the actual codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts already in use, no new dependencies
- Architecture: HIGH — direct pattern match from v3-02 and v3-03, verified in codebase
- Mock data design: HIGH — djb2 pattern verified, realistic value ranges are LOW (informed estimates)
- Pitfalls: HIGH — all from actual codebase observation (CartesianGrid dark mode, YAxis width)

**Research date:** 2026-02-19
**Valid until:** 2026-04-01 (stable stack — recharts, react-query, lucide won't change significantly)
