---
phase: 02-dashboard
plan: 01
subsystem: api
tags: [recharts, supabase, mock-data, admin, dashboard, time-series]

# Dependency graph
requires:
  - phase: 01-admin-foundation
    provides: checkIsAdmin helper and createSupabaseServerClient for admin auth pattern

provides:
  - recharts@3.7.0 installed as dependency
  - react-is@19.2.4 installed as recharts peer dependency
  - DailyMetric, KPIStats, TodaySummary TypeScript interfaces
  - generateDailyMetrics, generateMockKPIStats, generateTodaySummary mock generators
  - fetchDashboardStats, fetchChartData, fetchTodaySummary server-side data fetchers
  - GET /api/v1/admin/dashboard/stats (admin-protected KPI endpoint)
  - GET /api/v1/admin/dashboard/chart?days=30 (admin-protected chart data endpoint)
  - GET /api/v1/admin/dashboard/today (admin-protected today summary endpoint)

affects:
  - 02-02 (dashboard UI components consume these API routes)
  - Any future analytics phase that replaces mock data with real tracking

# Tech tracking
tech-stack:
  added:
    - recharts@3.7.0 (React chart library for dashboard visualizations)
    - react-is@19.2.4 (recharts peer dependency)
  patterns:
    - Deterministic mock data via djb2 hash on date string (same date = same values)
    - Real-data-first with graceful mock fallback pattern
    - Admin auth check in every API route (createSupabaseServerClient + checkIsAdmin)
    - Type assertion `"tableName" as any` for Supabase queries using non-typed table names

key-files:
  created:
    - packages/web/lib/api/admin/mock-data.ts
    - packages/web/lib/api/admin/dashboard.ts
    - packages/web/app/api/v1/admin/dashboard/stats/route.ts
    - packages/web/app/api/v1/admin/dashboard/chart/route.ts
    - packages/web/app/api/v1/admin/dashboard/today/route.ts
  modified:
    - packages/web/package.json (added recharts, react-is)
    - yarn.lock

key-decisions:
  - "Deterministic hash-based mock data: same date always returns same values, no flickering on page refresh"
  - "Real-data-first for post/item counts from Supabase `post` and `item` tables using `as any` cast"
  - "react-is added explicitly to resolve recharts peer dependency warning"
  - "fetchChartData clamps days to 90 maximum to prevent excessive mock data generation"
  - "Types re-exported from dashboard.ts so consumers import from single module"

patterns-established:
  - "Admin route pattern: createSupabaseServerClient → getUser → checkIsAdmin → data fetch → NextResponse.json"
  - "Mock data seeding: deterministicInt(dateString + ':metric', range) for stable per-metric values"
  - "Real-data override: generate mock baseline then override fields with real counts when available"

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 02 Plan 01: Dashboard Data Layer Summary

**Recharts installed + 3 admin-protected dashboard API routes backed by deterministic mock time-series data and real Supabase post/item counts**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T05:19:41Z
- **Completed:** 2026-02-19T05:23:17Z
- **Tasks:** 4/4
- **Files modified:** 7 (2 modified, 5 created)

## Accomplishments

- Installed recharts@3.7.0 (and react-is peer dep) — chart library ready for dashboard UI
- Built deterministic mock data generators using djb2 hash seeding on date strings — no flickering between requests
- Created dashboard data layer that queries real post/item counts from Supabase and overlays mock time-series
- Three admin-protected API endpoints serving KPI stats, 30-day chart data, and today summary

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Recharts dependency** - `b6092a4` (chore)
2. **Task 2: Create mock data generators for time-series metrics** - `c80cf20` (feat)
3. **Task 3: Create dashboard data fetching layer** - `fa3310e` (feat)
4. **Task 4: Create admin dashboard API routes** - `b876554` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `packages/web/package.json` - Added recharts@3.7.0 and react-is@19.2.4
- `yarn.lock` - Updated with new packages
- `packages/web/lib/api/admin/mock-data.ts` - Types (DailyMetric, KPIStats, TodaySummary) and 3 generator functions
- `packages/web/lib/api/admin/dashboard.ts` - Server-side fetchers combining real Supabase data + mock
- `packages/web/app/api/v1/admin/dashboard/stats/route.ts` - GET KPI stats (admin-protected)
- `packages/web/app/api/v1/admin/dashboard/chart/route.ts` - GET chart data with ?days param (admin-protected)
- `packages/web/app/api/v1/admin/dashboard/today/route.ts` - GET today summary (admin-protected)

## Decisions Made

1. **Deterministic hash-based mock data**: Used djb2-style hash on `dateString + ":metric"` seed so the same date always produces the same DAU/searches/clicks values. This prevents the dashboard from flickering different numbers on each page refresh while still looking realistic.

2. **Real-data-first for post/item counts**: `fetchDashboardStats` attempts to query real `post` and `item` table counts from Supabase. The actual DB tables use singular names (`post`, `item`, `image`) while the TypeScript types use plural (`posts`, `items`), so `as any` cast is used for the table name. Falls back to fully mock data on any Supabase error.

3. **react-is added explicitly**: Recharts requires `react-is` as a peer dependency but it was not in the project. Added explicitly to eliminate the YN0002 peer dependency warning.

4. **Days clamped to 90**: `fetchChartData` clamps the `days` parameter to [1, 90] to prevent excessive memory usage from generating very long mock series.

5. **Types re-exported from dashboard.ts**: `DailyMetric`, `KPIStats`, `TodaySummary` are imported from `mock-data.ts` and re-exported from `dashboard.ts` so UI components only need one import location.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added react-is to resolve recharts peer dependency warning**

- **Found during:** Task 1 (Install Recharts dependency)
- **Issue:** yarn install completed but reported `YN0002: @decoded/web doesn't provide react-is (pbe40b), requested by recharts`. This is a peer dependency warning that would surface in builds.
- **Fix:** Added `react-is` explicitly via `yarn add react-is`
- **Files modified:** packages/web/package.json, yarn.lock
- **Verification:** Subsequent yarn install no longer reports the pbe40b warning
- **Committed in:** b6092a4 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed prettier formatting and removed unused function**

- **Found during:** Task 4 verification (yarn lint)
- **Issue 1:** Prettier expected multi-line formatting for `fetchChartData(days: number = 30)` parameter
- **Issue 2:** `deterministicFloat` helper in mock-data.ts was defined but never used (unused-vars lint error)
- **Fix:** Reformatted function signature to multi-line; removed `deterministicFloat` (was originally planned for float variance but djb2 integer approach was sufficient)
- **Files modified:** lib/api/admin/dashboard.ts, lib/api/admin/mock-data.ts
- **Verification:** `npx eslint app/api/v1/admin/dashboard/ lib/api/admin/` passes with no errors
- **Committed in:** b876554 (Task 4 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking peer-dep, 1 lint bug)
**Impact on plan:** Both auto-fixes necessary for clean build. No scope creep.

## Issues Encountered

- The Supabase `Database` type uses plural table names (`posts`, `items`) but the actual database schema uses singular (`post`, `item`). This mismatch required `as any` type assertions for the Supabase queries. The `eslint-disable` comments are included inline to satisfy the `@typescript-eslint/no-explicit-any` rule while making the intent clear.

## Next Phase Readiness

- All 3 API endpoints are ready for consumption by dashboard UI components (plan 02-02)
- Recharts is installed and available for `LineChart`, `BarChart`, `AreaChart`, `ResponsiveContainer` imports
- Types `DailyMetric`, `KPIStats`, `TodaySummary` can be imported from `@/lib/api/admin/dashboard`
- No blockers for proceeding to dashboard UI implementation

---
*Phase: 02-dashboard*
*Completed: 2026-02-19*
