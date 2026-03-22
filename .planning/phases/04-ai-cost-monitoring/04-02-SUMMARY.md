---
phase: 04-ai-cost-monitoring
plan: 02
subsystem: ui
tags: [recharts, react-query, admin, ai-cost, charts, skeleton, dark-mode, responsive, tailwind]

# Dependency graph
requires:
  - phase: 04-ai-cost-monitoring (plan 01)
    provides: AiCostKPI, AiCostDailyMetric, ModelCostBreakdown types and /api/v1/admin/ai-cost/{kpi,chart} routes
  - phase: 02-dashboard
    provides: admin component pattern (data hook + display component + skeleton), period selector UI pattern, TrafficChart recharts template
provides:
  - useAiCostKPI and useAiCostChart React Query hooks (staleTime 60s, period-keyed)
  - CostKPICards component with 4 stat cards and delta indicators (+ skeleton)
  - TokenUsageChart stacked AreaChart for input/output tokens (+ skeleton)
  - ApiCallsChart BarChart for daily API call counts (+ skeleton)
  - ModelCostTable per-model cost breakdown table with totals (+ skeleton)
  - AI Cost Monitoring page at /admin/ai-cost with page-level 7D/30D/90D period selector
affects:
  - v3-05 (Pipeline & Server Logs — can reuse chart and table component patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Page-level period selector updating all sections via React Query queryKey
    - Skeleton fallback on both loading and error states (established v3-02 pattern)
    - Recharts AreaChart stacked for tokens, BarChart for API calls (visual metaphor match)
    - CartesianGrid dark mode via className="dark:stroke-gray-800"
    - formatTokens K/M abbreviation helper for large token counts
    - formatCostPrecise $X.XXXX for sub-cent precision (avg cost per call)

key-files:
  created:
    - packages/web/lib/hooks/admin/useAiCost.ts
    - packages/web/lib/components/admin/ai-cost/CostKPICards.tsx
    - packages/web/lib/components/admin/ai-cost/TokenUsageChart.tsx
    - packages/web/lib/components/admin/ai-cost/ApiCallsChart.tsx
    - packages/web/lib/components/admin/ai-cost/ModelCostTable.tsx
  modified:
    - packages/web/app/admin/ai-cost/page.tsx

key-decisions:
  - "Page-level period selector (7D/30D/90D) updates all sections simultaneously via React Query queryKey — period in key causes automatic refetch on change"
  - "Skeleton fallback on both loading AND error states — consistent with v3-02 dashboard pattern, avoids empty/broken states"
  - "Chart endpoint response (AiCostChartResponse) bundles daily + modelBreakdown so both TokenUsageChart and ModelCostTable share one useAiCostChart fetch"
  - "formatCostPrecise uses 4 decimal places for avg cost per call — sub-cent values require higher precision than standard $XX.XX"
  - "Recharts stacked AreaChart for tokens (shows composition of input vs output), BarChart for API calls (counts are discrete, not cumulative)"

patterns-established:
  - "Admin chart page pattern: page-level period useState, single queryKey includes period, all sections refresh together"
  - "formatTokens helper: >= 1M shows X.XM, >= 1K shows XK — reusable for any large integer display"
  - "Skeleton variant co-located in same file as component — same card wrapper, animate-pulse skeleton shapes"

# Metrics
duration: ~15min
completed: 2026-02-19
---

# Phase 04 Plan 02: AI Cost Monitoring UI Summary

**Recharts AI Cost Monitoring page with 4 KPI cards (delta indicators), stacked AreaChart for input/output tokens, BarChart for daily API calls, model cost breakdown table, and page-level 7D/30D/90D period selector**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-19
- **Completed:** 2026-02-19
- **Tasks:** 3 auto + 1 checkpoint (approved)
- **Files modified:** 6 (1 modified, 5 created)

## Accomplishments
- Full AI Cost Monitoring page at `/admin/ai-cost` replaces placeholder with live data UI
- 4 KPI stat cards showing total calls, total tokens, estimated cost, and avg cost/call — each with colored delta percentage vs previous period
- Stacked AreaChart (indigo/pink gradient fills) visualizes input vs output token composition over time
- BarChart shows daily API call counts with rounded-top bars in blue
- Model cost breakdown table with Vision Model A/B/C rows and footer total, formatted tokens and USD costs
- Page-level period selector (7D/30D/90D) syncs all four sections via React Query query key — period change triggers simultaneous refetch
- All sections have skeleton loading variants that also show on error (no empty/broken states)
- Dark mode and mobile-responsive layout verified by user

## Task Commits

Each task was committed atomically:

1. **Task 1: Create React Query hooks for AI cost data** - `a1c2197` (feat)
2. **Task 2: Create AI cost UI components with skeleton variants** - `33f1ad3` (feat)
3. **Task 3: Assemble AI Cost Monitoring page** - `db6b1b2` (feat)
4. **Task 4: Checkpoint human-verify** - APPROVED (no commit)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `packages/web/lib/hooks/admin/useAiCost.ts` - useAiCostKPI and useAiCostChart React Query hooks with period-keyed queryKeys and 60s staleTime
- `packages/web/lib/components/admin/ai-cost/CostKPICards.tsx` - 4 KPI cards grid with TrendingUp/TrendingDown delta indicators and formatTokens/formatCost helpers
- `packages/web/lib/components/admin/ai-cost/TokenUsageChart.tsx` - Recharts stacked AreaChart with gradient fills (indigo input, pink output), custom tooltip, dark mode grid
- `packages/web/lib/components/admin/ai-cost/ApiCallsChart.tsx` - Recharts BarChart with rounded-top blue bars, custom tooltip, matching axis styling
- `packages/web/lib/components/admin/ai-cost/ModelCostTable.tsx` - Per-model cost table with thead/tbody/tfoot, formatTokens and $XX.XX cost formatting
- `packages/web/app/admin/ai-cost/page.tsx` - Client component assembling all sections with useState period, conditional skeleton/data rendering

## Decisions Made
- **Period selector scope:** Page-level (not per-section) so all charts and KPIs always show the same period — avoids confusing mixed-period comparisons
- **Skeleton on error:** Using skeleton instead of error UI matches v3-02 dashboard pattern — admin panels rarely surface raw errors to internal users; a skeleton is less disruptive
- **Single chart hook:** `useAiCostChart` returns both `daily` and `modelBreakdown` from one fetch — TokenUsageChart, ApiCallsChart, and ModelCostTable all consume `chartQuery.data` without separate requests
- **formatCostPrecise:** Avg cost per call often < $0.01 so 4 decimal places (`$0.0012`) are more informative than 2 (`$0.00`)
- **Visual metaphor:** Stacked area for tokens (accumulated composition), bar chart for API calls (discrete counts) — intentional distinction, not arbitrary

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AI Cost Monitoring page is complete and approved — phase v3-04 is fully done (both plans)
- Chart component patterns (stacked AreaChart + BarChart) established and ready to reuse in v3-05 (Pipeline & Server Logs)
- Admin page pattern (period selector + React Query + skeleton fallback) is now consistent across Dashboard and AI Cost pages
- No blockers for v3-05

---
*Phase: 04-ai-cost-monitoring*
*Completed: 2026-02-19*
