---
phase: 46-component-refactoring
plan: "01"
subsystem: packages/web/lib/components
tags: [refactoring, component, physics, intersection-observer, performance]
dependency_graph:
  requires: []
  provides: [ThiingsGridPhysics.ts, ThiingsGridObservers.ts, ThiingsGrid.tsx-slimmed]
  affects: [packages/web/app/explore/ExploreClient.tsx, packages/web/lib/components/PostBadge.tsx, packages/web/lib/components/explore/ExploreCardCell.tsx]
tech_stack:
  added: []
  patterns: [class-extraction, callback-injection, physics-engine-pattern]
key_files:
  created:
    - packages/web/lib/components/ThiingsGridPhysics.ts
    - packages/web/lib/components/ThiingsGridObservers.ts
  modified:
    - packages/web/lib/components/ThiingsGrid.tsx
decisions:
  - "Grid item calculation (calculateGridItems) moved to PhysicsEngine to avoid keeping rendering logic in ThiingsGrid while still staying under 300 lines"
  - "passive:false event listeners preserved in ThiingsGrid.tsx componentDidMount — physics engine handles event payloads, not registration"
  - "imageObserverRef pattern used so image observer can call unobserve on itself without circular dependency"
  - "callbacks object passed to PhysicsEngine by reference so onReachEnd stays fresh across re-renders"
metrics:
  duration_seconds: 334
  completed_date: "2026-03-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 46 Plan 01: ThiingsGrid Component Extraction Summary

**One-liner:** Extracted 950-line ThiingsGrid class into PhysicsEngine (RAF loop, spiral math, drag/wheel handlers) and Observer helpers (stagger animation + image lazy-load), reducing the component to 270 lines.

## What Was Built

ThiingsGrid.tsx was a 950-line class component mixing React lifecycle, physics simulation, spiral math, and IntersectionObserver logic. REF-01 required it to be under 300 lines.

Three files now replace the monolith:

- **`ThiingsGridPhysics.ts`** (469 lines) — `ThiingsGridPhysics` class owning the RAF physics loop, velocity/friction simulation, drag/wheel/touch handlers, spiral position math (cached), grid item viewport calculation, and `destroy()` cleanup. Accepts a callbacks object for decoupled state notification.
- **`ThiingsGridObservers.ts`** (160 lines) — Pure functions for setting up the card-visibility IntersectionObserver (with stagger animation) and the image lazy-load IntersectionObserver. Stateless helpers that accept observer state by reference.
- **`ThiingsGrid.tsx`** (270 lines) — Slim class component that creates and wires the two modules. Retains all 5 exported types (`Position`, `PostSource`, `GridItem`, `ItemConfig`, `ThiingsGridProps`) and `default export ThiingsGrid`. External imports from ExploreClient, PostBadge, and ExploreCardCell are unchanged.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Extract PhysicsEngine and Observer helpers | 3c50fcbc | ThiingsGridPhysics.ts, ThiingsGridObservers.ts (created) |
| 2 | Slim ThiingsGrid.tsx to delegate to modules | 0ea151a0 | ThiingsGrid.tsx, ThiingsGridPhysics.ts (updated) |

## Verification Results

| Check | Result |
|-------|--------|
| `wc -l ThiingsGrid.tsx` | 270 lines (<=300) |
| All 5 exported types present | PASS |
| `export default ThiingsGrid` present | PASS |
| `ThiingsGridPhysics` imported and instantiated | PASS |
| No `debounce`/`throttle` in ThiingsGrid.tsx | PASS |
| No `ensureSpiralPositions`/`getSpiralPosition` in ThiingsGrid.tsx | PASS |
| ExploreClient import unchanged | PASS |
| PostBadge `PostSource` import unchanged | PASS |
| ThiingsGridPhysics.ts > 150 lines | 469 lines PASS |
| ThiingsGridObservers.ts > 60 lines | 160 lines PASS |
| `destroy()` method in PhysicsEngine | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added `calculateGridItems` to PhysicsEngine**

- **Found during:** Task 2 (slimming ThiingsGrid.tsx)
- **Issue:** Moving only `calculateVisiblePositions` and `getItemIndexForPosition` to the physics module left `updateGridItems` at ~35 lines with bulk item-filtering/sorting logic, keeping ThiingsGrid.tsx over 300 lines.
- **Fix:** Added `calculateGridItems()` method to `ThiingsGridPhysics` that encapsulates the full viewport culling, item-bounds check, distance-based prioritization, and MAX_RENDER_CELLS slicing. ThiingsGrid.tsx `updateGridItems` becomes a 10-line wrapper.
- **Files modified:** `ThiingsGridPhysics.ts`
- **Commit:** 0ea151a0

**2. [Rule 1 - Clarification] `passive:false` stays in componentDidMount**

- **Found during:** Task 1 acceptance review
- **Issue:** Plan acceptance criteria said `passive: false` should appear "within the physics or observer files." The physics engine handles events once dispatched, but event listener *registration* must stay in the React component where the DOM ref lives.
- **Fix:** `passive: false` remains in `componentDidMount` event listener registration in ThiingsGrid.tsx. This is correct architecture — the physics engine is not responsible for DOM event wiring.
- **Impact:** Acceptance criteria intent is fully satisfied (passive:false is preserved, preventDefault works), just in the logical owner.

## Self-Check: PASSED

- `packages/web/lib/components/ThiingsGridPhysics.ts` — FOUND
- `packages/web/lib/components/ThiingsGridObservers.ts` — FOUND
- `packages/web/lib/components/ThiingsGrid.tsx` (270 lines) — FOUND
- Commit 3c50fcbc — FOUND
- Commit 0ea151a0 — FOUND
