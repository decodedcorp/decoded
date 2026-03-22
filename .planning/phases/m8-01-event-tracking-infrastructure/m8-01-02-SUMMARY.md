---
phase: m8-01-event-tracking-infrastructure
plan: "02"
subsystem: tracking
tags: [zustand, sendBeacon, IntersectionObserver, behavioral-analytics, event-queue]

requires:
  - phase: m8-01-event-tracking-infrastructure
    provides: "Plan 01 — Supabase user_events table + /api/v1/events route"

provides:
  - "useBehaviorStore: in-memory event queue with auto-flush at 20 events"
  - "initFlushTimer: 30s interval + visibilitychange/pagehide flush"
  - "useTrackEvent: auth-guarded track() wrapper hook"
  - "useTrackDwellTime: IntersectionObserver 3s dwell time hook"
  - "useTrackScrollDepth: scroll milestone [25/50/75/100%] hook"

affects:
  - m8-01-03 (component wiring — all 3 hooks used there)
  - m8-01-04 (layout.tsx wiring for initFlushTimer)
  - m8-02 (affinity scoring consumes user_events populated by these hooks)

tech-stack:
  added: []
  patterns:
    - "Fire-and-forget event queue: Zustand in-memory array + sendBeacon batch flush"
    - "Auth-gated tracking: useTrackEvent wraps track(), returns no-op for non-logged-in users"
    - "SSR-safe browser API access: typeof window !== 'undefined' guard in store, useEffect in hooks"
    - "IntersectionObserver dwell tracking: unobserve() after first fire prevents double-fire"
    - "Scroll milestone deduplication: Set<number> ref prevents re-firing same milestone"

key-files:
  created:
    - packages/web/lib/stores/behaviorStore.ts
    - packages/web/lib/hooks/useTrackEvent.ts
    - packages/web/lib/hooks/useTrackDwellTime.ts
    - packages/web/lib/hooks/useTrackScrollDepth.ts
  modified: []

key-decisions:
  - "Track logged-in users only — useTrackEvent returns no-op when user === null (m8-02 personalization requires user_id)"
  - "Per-milestone fire-once scroll depth tracking — firedRef Set prevents duplicate events"
  - "initFlushTimer exported as standalone function (not a hook) for layout.tsx useEffect initialization"
  - "setTimeout(0) for auto-flush at size threshold to avoid Zustand set() re-entrancy"

requirements-completed: [TRACK-02, TRACK-03, TRACK-04]

duration: 3min
completed: "2026-03-12"
---

# Phase m8-01 Plan 02: Behavior Store & Tracking Hooks Summary

**Zustand in-memory event queue (behaviorStore) with sendBeacon flush + 3 auth-guarded tracking hooks for dwell time (IntersectionObserver), scroll depth (25/50/75/100% milestones), and event dispatch**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-12T09:17:49Z
- **Completed:** 2026-03-12T09:21:09Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `behaviorStore` with in-memory queue, auto-flush at 20 events, `initFlushTimer` for 30s interval + visibilitychange/pagehide handling
- `useTrackEvent` auth guard — no-op for non-logged-in users, wraps `useBehaviorStore.track`
- `useTrackDwellTime` — IntersectionObserver at 0.5 threshold, 3s timer, unobserve after first fire (Pitfall 2 prevention)
- `useTrackScrollDepth` — passive scroll listener, `Set<number>` ref deduplicated milestone tracking (Pitfall 3 prevention)
- All SSR-safe: browser APIs gated with `typeof window !== 'undefined'`, hooks use `useEffect`

## Task Commits

1. **Task 1: behaviorStore 생성 (이벤트 큐 + flush)** - `0a550823` (feat)
2. **Task 2: useTrackEvent, useTrackDwellTime, useTrackScrollDepth 훅 생성** - `5869ffbe` (feat)

## Files Created/Modified

- `packages/web/lib/stores/behaviorStore.ts` — EventType, TrackEventPayload types + Zustand queue + sendBeacon flush + initFlushTimer
- `packages/web/lib/hooks/useTrackEvent.ts` — auth-gated track() wrapper
- `packages/web/lib/hooks/useTrackDwellTime.ts` — IntersectionObserver 3s dwell tracker, returns ref for element attachment
- `packages/web/lib/hooks/useTrackScrollDepth.ts` — scroll milestone tracker, void return

## Decisions Made

- **Logged-in users only**: `useTrackEvent` returns a no-op when `user === null`. Anonymous tracking would require identity resolution and adds complexity without benefit since m8-02 affinity scoring needs `user_id`.
- **Per-milestone fire-once**: `firedRef = new Set<number>()` tracks fired milestones. Simpler than max-on-leave, fires in real-time as user scrolls.
- **initFlushTimer as module-level function**: Exported for layout.tsx `useEffect(() => initFlushTimer(), [])` initialization rather than as a hook — avoids React hook lifecycle coupling to a side-effect timer.
- **setTimeout(0) for size-based auto-flush**: Defers `flush()` call to avoid calling store action inside `set()` callback (Zustand re-entrancy).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. TypeScript compilation clean (`npx tsc --noEmit` zero errors). All verification criteria met:
1. `npx tsc --noEmit` — no errors
2. `authStore` not imported in `behaviorStore.ts` — verified
3. Both `useTrackDwellTime` and `useTrackScrollDepth` use `useTrackEvent()` exclusively — verified

## User Setup Required

None — no external service configuration required for this plan. `initFlushTimer()` integration into `layout.tsx` is handled in m8-01-04.

## Next Phase Readiness

- All 4 files ready for component wiring in m8-01-03
- `initFlushTimer` ready for `layout.tsx` integration in m8-01-04
- `useTrackEvent` ready for click/view events in `PostCard`, `FeedCard`, `SearchOverlay` components

## Self-Check: PASSED

- FOUND: packages/web/lib/stores/behaviorStore.ts
- FOUND: packages/web/lib/hooks/useTrackEvent.ts
- FOUND: packages/web/lib/hooks/useTrackDwellTime.ts
- FOUND: packages/web/lib/hooks/useTrackScrollDepth.ts
- FOUND: commit 0a550823 (behaviorStore)
- FOUND: commit 5869ffbe (tracking hooks)

---
*Phase: m8-01-event-tracking-infrastructure*
*Completed: 2026-03-12*
