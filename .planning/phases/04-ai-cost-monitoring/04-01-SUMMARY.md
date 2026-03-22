---
phase: 04-ai-cost-monitoring
plan: 01
subsystem: api
tags: [mock-data, djb2-hash, deterministic, admin, api-routes, typescript, ai-cost]

# Dependency graph
requires:
  - phase: 01-admin-foundation
    provides: checkIsAdmin helper and createSupabaseServerClient for route auth
  - phase: 02-dashboard
    provides: djb2 hash deterministic mock data pattern (mock-data.ts)
provides:
  - Deterministic AI cost mock data generators (daily metrics, KPI, model breakdown)
  - AiCostDailyMetric, AiCostKPI, ModelCostBreakdown types
  - fetchAiCostKPI and fetchAiCostChart server-side data fetching functions
  - GET /api/v1/admin/ai-cost/kpi endpoint (admin-protected, ?days param)
  - GET /api/v1/admin/ai-cost/chart endpoint (admin-protected, bundled daily+breakdown)
affects:
  - 04-02 (AI Cost UI components — COST-01, COST-02, COST-03)
  - 04-03 (any further AI cost features)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - djb2 hash seeding for deterministic mock data (same date = same values)
    - Blended weighted model pricing for estimated cost computation
    - Bundled chart response (daily + model breakdown in one API call)
    - Admin-protected route pattern with 401/403 guards

key-files:
  created:
    - packages/web/lib/api/admin/ai-cost-mock-data.ts
    - packages/web/lib/api/admin/ai-cost.ts
    - packages/web/app/api/v1/admin/ai-cost/kpi/route.ts
    - packages/web/app/api/v1/admin/ai-cost/chart/route.ts
  modified: []

key-decisions:
  - "Blended weighted pricing: sum(model.inputPricePerK * model.weight) for daily cost estimation"
  - "Chart endpoint bundles daily metrics + model breakdown in one AiCostChartResponse to minimize UI API calls"
  - "Previous period computed by shifting date window back by `days` — same deterministic formula, different date seeds"
  - "Model traffic weights: Vision Model A 50%, B 35%, C 15% reflecting realistic API usage distribution"

patterns-established:
  - "deterministicInt local reimplementation: copy djb2 hash into each mock-data file (not shared import)"
  - "Re-export types from fetching layer (ai-cost.ts) as single-source import for UI consumers"
  - "days clamped to 7-90 range in API routes; generators accept any positive integer"

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 04 Plan 01: AI Cost Monitoring Data Layer Summary

**Deterministic AI cost mock data layer with djb2 hash seeding, 3-model pricing breakdown, and two admin-protected API routes for KPI and chart data**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-19T08:48:06Z
- **Completed:** 2026-02-19T08:52:10Z
- **Tasks:** 2/2
- **Files modified:** 4 created

## Accomplishments
- `generateAiCostMetrics` produces deterministic daily metrics (API calls, input/output tokens, USD cost) via djb2 hash seeding — identical output on every request for the same date
- `generateAiCostKPI` aggregates period totals and computes percentage deltas vs previous period (same-length window shifted back)
- `generateModelCostBreakdown` distributes calls/tokens across 3 model tiers with realistic pricing per 1K tokens (Vision Model A/B/C)
- Two admin-protected API routes: `/api/v1/admin/ai-cost/kpi` and `/api/v1/admin/ai-cost/chart`
- Chart endpoint bundles daily time-series + model breakdown in one response to minimize UI fetch calls

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AI cost mock data types and generators** - `56c8867` (feat)
2. **Task 2: Create AI cost data fetching layer and API routes** - `0c8214f` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `packages/web/lib/api/admin/ai-cost-mock-data.ts` - Types and deterministic generators (djb2 hash, 3-model pricing, weekday/weekend splits, period deltas)
- `packages/web/lib/api/admin/ai-cost.ts` - Server-side fetching layer; re-exports types for UI consumers; AiCostChartResponse bundles daily+breakdown
- `packages/web/app/api/v1/admin/ai-cost/kpi/route.ts` - GET endpoint: KPI stats with ?days param (7-90), admin auth
- `packages/web/app/api/v1/admin/ai-cost/chart/route.ts` - GET endpoint: daily metrics + model breakdown with ?days param (7-90), admin auth

## Decisions Made
- **Blended pricing for daily cost:** Used weighted average of model prices (`sum(model.inputPricePerK * model.weight)`) rather than tracking per-model for daily metrics — simpler and sufficient for chart display
- **Bundled chart response:** `AiCostChartResponse` returns `{ daily, modelBreakdown }` together so the AI cost page can render both chart and breakdown table from one fetch
- **Previous period computation:** Shifted date window back by `days` using `dateOffset(today, days)` as the new reference point, applying the same deterministic formula to prior-period date strings — avoids need for a separate generator function
- **Model weights:** Vision Model A (50%), B (35%), C (15%) — matches plausible production traffic distribution for tiered vision models

## Deviations from Plan

None - plan executed exactly as written.

Minor cleanup: removed unnecessary `void originalToday` line during implementation (cleaned before commit). Auto-formatted all files with Prettier to pass lint.

## Issues Encountered
- Pre-existing TypeScript error in `lib/components/admin/audit/ItemEditor.tsx` (not introduced by this plan, verified with `git stash`)
- Pre-existing Prettier violations in `FeedCard.tsx`, `ImageDetailModal.tsx`, `ImageDetailContent.tsx`, `types.ts` (not our files)
- New files had Prettier violations on inline object literals — resolved by running `yarn prettier --write` before commit

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API endpoints ready for the AI Cost UI (04-02)
- Types `AiCostDailyMetric`, `AiCostKPI`, `ModelCostBreakdown` importable from `@/lib/api/admin/ai-cost`
- Chart data structure matches recharts AreaChart expectations (date + numeric fields per day)
- No blockers for UI implementation

---
*Phase: 04-ai-cost-monitoring*
*Completed: 2026-02-19*
