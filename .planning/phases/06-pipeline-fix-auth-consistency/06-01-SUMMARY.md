---
phase: 06-pipeline-fix-auth-consistency
plan: 01
subsystem: api
tags: [nextjs, admin, auth, pipeline, api-routes]

# Dependency graph
requires:
  - phase: 05-pipeline-server-logs
    provides: Pipeline admin UI and API routes that this fixes

provides:
  - Pipeline detail endpoint returns bare PipelineExecution (no data wrapper)
  - All admin API routes enforce auth identically — no dev bypass in API layer
  - PIPE-02 and PIPE-03 gaps closed; auth inconsistency gap closed

affects:
  - v4.0 spec overhaul phases (codebase now consistent for documentation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin API auth pattern: getUser -> 401 check -> checkIsAdmin -> 403 check (flat, no env conditional)"
    - "API response shape: bare object (no { data: } wrapper) for typed hook consumers"

key-files:
  created: []
  modified:
    - packages/web/app/api/v1/admin/pipeline/[pipelineId]/route.ts
    - packages/web/app/api/v1/admin/ai-cost/kpi/route.ts
    - packages/web/app/api/v1/admin/dashboard/stats/route.ts

key-decisions:
  - "Return bare PipelineExecution from pipeline detail route (no { data: } wrapper) — hook type declaration requires it"
  - "API routes enforce auth in all environments; middleware/layout dev bypasses remain (page-level only)"

patterns-established:
  - "Admin API response: NextResponse.json(entity) — not NextResponse.json({ data: entity })"
  - "Admin API auth: always flat (getUser, 401, checkIsAdmin, 403) — never gated by NODE_ENV"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 06 Plan 01: Pipeline Fix + Auth Consistency Summary

**Pipeline detail route now returns bare `PipelineExecution` (fixing `data.steps` crash), and all admin API routes enforce auth identically with no dev-only bypass**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T10:37:42Z
- **Completed:** 2026-02-19T10:39:11Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed `{ data: pipeline }` wrapper from pipeline detail route — `usePipelineDetail` hook now receives `PipelineExecution` directly, so `data.steps` resolves and the accordion renders correctly (PIPE-02 closed)
- PIPE-03 unblocked: error-state retry button is now reachable since pipeline detail renders correctly
- Removed `NODE_ENV !== "development"` conditional from `ai-cost/kpi` and `dashboard/stats` routes — auth is now enforced consistently in all environments across all admin API routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix pipeline detail response shape (PIPE-02, PIPE-03)** - `9db0b6d` (fix)
2. **Task 2: Remove dev auth bypass from ai-cost/kpi and dashboard/stats routes** — files already matched correct state in HEAD; local modifications reverted to broken state were restored to correct state by this execution (no new commit needed — state was already correct in git)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `packages/web/app/api/v1/admin/pipeline/[pipelineId]/route.ts` — Changed `NextResponse.json({ data: pipeline })` to `NextResponse.json(pipeline)` on line 44
- `packages/web/app/api/v1/admin/ai-cost/kpi/route.ts` — Removed `NODE_ENV !== "development"` conditional wrapper around auth checks
- `packages/web/app/api/v1/admin/dashboard/stats/route.ts` — Removed `NODE_ENV !== "development"` conditional wrapper around auth checks

## Decisions Made

- API routes must enforce auth in all environments — middleware and admin layout dev bypasses are intentional (page-level access) and were explicitly left unchanged
- Response shape from detail routes must match the TypeScript generic on the hook (`adminFetch<PipelineExecution>`) — no wrapper object

## Deviations from Plan

None - plan executed exactly as written.

**Note on Task 2:** The `ai-cost/kpi` and `dashboard/stats` files had already been corrected in a prior commit (HEAD) but had local unstaged modifications that reverted them to the broken state. This execution restored the working tree to match the correct HEAD state. TypeScript check passed with zero errors; NODE_ENV grep confirmed zero matches across all admin API routes.

## Issues Encountered

Task 2 files had local unstaged modifications (visible in git status at session start as ` M`) that had reverted them back to the broken dev-bypass pattern. The edits in this execution restored them to the correct state already present in HEAD. Git commit was not required because working tree matched HEAD after the fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 3 gaps from `v3.0-MILESTONE-AUDIT.md` are closed (PIPE-02, PIPE-03, AUTH-CONSISTENCY)
- v3.0 Admin Panel milestone is clean — no outstanding audit findings
- Codebase is consistent and ready for v4.0 Spec Overhaul documentation work

---
*Phase: 06-pipeline-fix-auth-consistency*
*Completed: 2026-02-19*
