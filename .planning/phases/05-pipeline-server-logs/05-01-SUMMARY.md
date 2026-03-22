---
phase: 05-pipeline-server-logs
plan: 01
subsystem: api
tags: [mock-data, pipeline, server-logs, admin, djb2, deterministic]

# Dependency graph
requires:
  - phase: 03-ai-audit
    provides: audit-mock-data.ts pattern (djb2 hash, module cache, Omit list pattern)
  - phase: 04-ai-cost
    provides: deterministicInt local reimplementation pattern, ai-cost-mock-data.ts structure

provides:
  - Pipeline execution mock data: 30 deterministic entries with upload→analyze→detect steps
  - Server log mock data: 200 deterministic entries with level/endpoint/status distributions
  - fetchPipelines: paginated list with status filter, Omit<steps> for performance
  - fetchPipelineDetail: full execution with 3 ordered steps
  - fetchServerLogs: paginated list with level/search/date-range filters
  - fetchLogStream: non-deterministic fresh entries for polling
  - 4 admin-protected API routes: GET /admin/pipeline, GET /admin/pipeline/[id], GET /admin/server-logs, GET /admin/server-logs/stream

affects:
  - 05-pipeline-server-logs plan 02 (UI components for both features consume these types and API routes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - deterministicInt reimplemented locally in each mock-data file (not shared import)
    - Module-level cache singleton for stable mock data across requests
    - PipelineListItem as Omit<PipelineExecution, 'steps'> for list performance
    - Types re-exported from data layer file as single-source import for UI consumers
    - Stream endpoint uses non-deterministic Math.random() for realistic polling simulation

key-files:
  created:
    - packages/web/lib/api/admin/pipeline-mock-data.ts
    - packages/web/lib/api/admin/pipeline.ts
    - packages/web/app/api/v1/admin/pipeline/route.ts
    - packages/web/app/api/v1/admin/pipeline/[pipelineId]/route.ts
    - packages/web/lib/api/admin/server-logs-mock-data.ts
    - packages/web/lib/api/admin/server-logs.ts
    - packages/web/app/api/v1/admin/server-logs/route.ts
    - packages/web/app/api/v1/admin/server-logs/stream/route.ts
  modified: []

key-decisions:
  - "Pipeline steps spread across 3 ordered stages: upload (1-5s), analyze (3-15s), detect (2-8s)"
  - "PipelineListItem = Omit<PipelineExecution, 'steps'> — list view omits step data for performance"
  - "Stream endpoint is intentionally non-deterministic (Date.now() + Math.random()) for realistic polling UX"
  - "Server log level distribution: 60% info / 20% warn / 12% error / 8% debug"
  - "Status distribution: 22 completed / 5 failed / 3 running (index-based, not hash-based)"

patterns-established:
  - "PipelineListItem Omit pattern: list endpoints strip heavy nested arrays for performance"
  - "Stream counter (_streamCounter) prevents duplicate IDs on rapid consecutive calls"
  - "generateStreamLogs returns 1-3 entries per call — same non-deterministic batch size as real log tailing"

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 5 Plan 1: Pipeline + Server Log Data Layer Summary

**Deterministic mock data layer and admin-protected API routes for pipeline execution logs (30 entries, upload→analyze→detect) and server request logs (200 entries, level/search/date filters + streaming endpoint)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-19T09:56:48Z
- **Completed:** 2026-02-19T09:59:54Z
- **Tasks:** 2/2
- **Files modified:** 8 created

## Accomplishments

- Pipeline mock data: 30 deterministic executions with 3-step progression (upload/analyze/detect), realistic status distribution (22 completed, 5 failed, 3 running), per-step timing and error messages
- Server log mock data: 200 deterministic entries with realistic level distribution (60% info, 20% warn, 12% error, 8% debug), 9 endpoint types, HTTP methods, status codes, and response times proportional to level
- 4 admin-protected API routes with checkIsAdmin guard: list + detail for pipeline, list + stream for server logs

## Task Commits

Each task was committed atomically:

1. **Task 1: Pipeline mock data + data layer + API routes** - `b66046f` (feat)
2. **Task 2: Server log mock data + data layer + API routes** - `972d6f6` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `packages/web/lib/api/admin/pipeline-mock-data.ts` - Types (PipelineExecution, PipelineStep, PipelineListItem) + generatePipelines() + getPipelineById()
- `packages/web/lib/api/admin/pipeline.ts` - Data layer with fetchPipelines/fetchPipelineDetail, re-exports types
- `packages/web/app/api/v1/admin/pipeline/route.ts` - GET /api/v1/admin/pipeline (list with status filter + pagination)
- `packages/web/app/api/v1/admin/pipeline/[pipelineId]/route.ts` - GET /api/v1/admin/pipeline/[id] (detail with 3 steps)
- `packages/web/lib/api/admin/server-logs-mock-data.ts` - Types (ServerLogEntry, LogLevel) + generateServerLogs() + generateStreamLogs()
- `packages/web/lib/api/admin/server-logs.ts` - Data layer with fetchServerLogs/fetchLogStream, re-exports types
- `packages/web/app/api/v1/admin/server-logs/route.ts` - GET /api/v1/admin/server-logs (level/search/date filter + pagination)
- `packages/web/app/api/v1/admin/server-logs/stream/route.ts` - GET /api/v1/admin/server-logs/stream (polling endpoint)

## Decisions Made

- Pipeline status distribution by index range (not hash) ensures exact 22/5/3 split: index 0-21 = completed, 22-24 = failed, 25-29 = running
- `generateStreamLogs` is intentionally non-deterministic (uses `Date.now()` + `Math.random()`) — stream entries must vary per call to simulate live tailing
- `_streamCounter` module variable ensures no ID collisions when stream endpoint is called rapidly
- Server log timestamps use non-linear distribution: first 50 entries spread over last 2 hours (higher density), remaining 150 spread over 24 hours
- `buildMessage()` produces level-appropriate messages: info shows method/endpoint/status/time, warn highlights slow queries or auth errors, error identifies root cause

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Pre-existing TypeScript error in `lib/components/admin/audit/ItemEditor.tsx` (line 69) was already present before this plan and is unrelated to the new files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 8 files ready for UI consumption in plan 05-02
- Type imports: `import type { PipelineExecution, PipelineListItem, PipelineStatus, PipelineStep, StepStatus } from "@/lib/api/admin/pipeline"`
- Type imports: `import type { ServerLogEntry, LogLevel } from "@/lib/api/admin/server-logs"`
- API endpoints verified to compile cleanly; admin auth guard consistent with phases 01-04

---
*Phase: 05-pipeline-server-logs*
*Completed: 2026-02-19*
