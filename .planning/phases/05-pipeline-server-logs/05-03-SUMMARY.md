---
phase: 05-pipeline-server-logs
plan: "03"
subsystem: ui
tags: [react-query, next-js, tailwind, admin, server-logs, streaming, polling]

# Dependency graph
requires:
  - phase: 05-01
    provides: server-logs API routes and data layer (fetchServerLogs, fetchLogStream, ServerLogEntry types)
provides:
  - useServerLogs hook with paginated/filtered React Query fetch
  - useLogStream hook with custom interval-based streaming state management
  - LogFilters component with level button group, time range presets, debounced search
  - LogTable component with color-coded level badges, method colors, status codes
  - LogTableSkeleton component (10 shimmer rows)
  - LogStream terminal-style component with auto-scroll, pause/resume, clear, jump-to-bottom
  - /admin/server-logs page with two sections (log table + live stream terminal)
affects: [future admin pages, v4.0 documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Custom interval polling hook (useLogStream) with pause/resume/clear — NOT React Query wrapper"
    - "useRef for interval ID + latestId to avoid stale closure issues in polling loop"
    - "500-entry cap on streaming entries, trim oldest when exceeded"
    - "Scroll detection pattern: scrollTop + clientHeight >= scrollHeight - 50 for bottom detection"
    - "isAutoScrollActiveRef pattern: ref to track auto-scroll intent without triggering effect re-runs"
    - "timeRangeToFrom exported helper converts preset labels ('1h','6h','24h','7d','all') to ISO strings"
    - "URL sync for log filters: level, search, timeRange, page all stored in URL params"
    - "Suspense boundary wrapping useSearchParams for Next.js App Router compatibility"

key-files:
  created:
    - packages/web/lib/hooks/admin/useServerLogs.ts
    - packages/web/lib/components/admin/server-logs/LogFilters.tsx
    - packages/web/lib/components/admin/server-logs/LogTable.tsx
    - packages/web/lib/components/admin/server-logs/LogStream.tsx
  modified:
    - packages/web/app/admin/server-logs/page.tsx

key-decisions:
  - "useLogStream is a custom hook NOT a React Query wrapper — manages its own setInterval for realistic streaming UX"
  - "latestIdRef keeps interval polling closure current without re-creating interval on each render"
  - "500 max accumulated entries: trim from front (oldest) when exceeded — FIFO circular buffer behavior"
  - "Auto-scroll stops when user scrolled >50px from bottom; resumes when user manually scrolls back to bottom"
  - "timeRange stored in URL as label (24h, 7d) not ISO string — timeRangeToFrom() computes ISO at render time"
  - "LogStream is fully self-contained (no props) — uses useLogStream internally"
  - "Level dot colors in LogFilters mirror LogTable badge colors for visual consistency"
  - "Skeleton fallback on both loading AND error states (matches established admin pattern from 02-02)"

patterns-established:
  - "Terminal component pattern: bg-gray-950 container, bg-gray-900 header bar, monospace text-xs log lines"
  - "Streaming hook pattern: useRef for intervalId + latestId, auto-start on mount, cleanup on unmount"
  - "Jump-to-bottom pill: absolute positioned, centered, appears only when isUserScrolledUp=true"

# Metrics
duration: 25min
completed: "2026-02-19"
---

# Phase 05 Plan 03: Server Logs UI Summary

**Filterable API request log table with URL-synced filters + terminal-style tail -f streaming console polling every 2.5 seconds**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-19T00:00:00Z
- **Completed:** 2026-02-19
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Built `useServerLogs` hook following established adminFetch + React Query pattern with `keepPreviousData` for smooth pagination
- Built `useLogStream` custom interval polling hook (2500ms) with pause/resume/clear, 500-entry cap, and auto-start on mount
- LogFilters: level button group (All/Info/Warn/Error/Debug with color dots), time range presets (1h/6h/24h/7d/All), debounced search input (300ms)
- LogTable: compact table with level badges (blue/yellow/red/purple), HTTP method colors (green/blue/yellow/red), status code colors (2xx green, 4xx yellow, 5xx red), error row background highlight
- LogStream: dark bg-gray-950 terminal with monospace font, pulsing green dot, auto-scroll, manual-scroll detection, jump-to-bottom pill, pause/resume/clear controls
- Server logs page: two-section layout with URL-synced filters + pagination, plus self-contained terminal stream

## Task Commits

Each task was committed atomically:

1. **Task 1: Server log hooks, table, and filters** - `e5d294e` (feat)
2. **Task 2: Terminal streaming component and page assembly** - `bba515d` (feat)

## Files Created/Modified

- `packages/web/lib/hooks/admin/useServerLogs.ts` — Two hooks: `useServerLogs` (React Query paginated fetch) and `useLogStream` (custom interval streaming state)
- `packages/web/lib/components/admin/server-logs/LogFilters.tsx` — Filter bar with level/time-range button groups and debounced search; exports `timeRangeToFrom` helper
- `packages/web/lib/components/admin/server-logs/LogTable.tsx` — Compact log table with color-coded badges; exports `LogTableSkeleton`
- `packages/web/lib/components/admin/server-logs/LogStream.tsx` — Terminal-style streaming console with auto-scroll, pause/resume, clear, jump-to-bottom
- `packages/web/app/admin/server-logs/page.tsx` — Full page replacing placeholder; two sections with Suspense boundary for useSearchParams

## Decisions Made

- `useLogStream` is NOT a React Query wrapper. It uses `setInterval` directly for realistic tail-f polling UX. React Query's polling (refetchInterval) doesn't accumulate entries — it replaces them.
- `latestIdRef` keeps the polling closure in sync with current `latestId` without triggering interval recreation on each render.
- Scroll detection threshold of 50px from bottom allows minor scroll tolerance before disabling auto-scroll.
- `timeRange` stored in URL as human-readable label ("24h", "7d") rather than ISO string. `timeRangeToFrom()` computes ISO at render time — simpler URL, no staleness issues.
- Streaming hook auto-starts on mount (no user action needed) because SLOG-03 requires live monitoring out of the box.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SLOG-01 (API request log viewer), SLOG-02 (error log filtering), SLOG-03 (real-time streaming) all satisfied
- Server Logs page is fully functional with mock data from 05-01 data layer
- v3-05 phase is now complete (both 05-02 Pipeline Logs and 05-03 Server Logs done)
- Ready for v3.0 completion or v4.0 planning

---
*Phase: 05-pipeline-server-logs*
*Completed: 2026-02-19*
