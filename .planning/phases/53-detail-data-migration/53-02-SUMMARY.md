---
phase: 53-detail-data-migration
plan: "02"
subsystem: web-animation
tags: [gsap, navigation, router, animation, history]
dependency_graph:
  requires: []
  provides: [handleMaximize-gsap-exit, isMaximizing-guard]
  affects: [packages/web/lib/hooks/useImageModalAnimation.ts]
tech_stack:
  added: []
  patterns: [gsap-exit-animation, router-push-spa, double-navigation-guard]
key_files:
  modified:
    - packages/web/lib/hooks/useImageModalAnimation.ts
decisions:
  - "Use router.push (not router.replace) to preserve browser history stack for correct back-button behavior"
  - "Cross-guard isClosing and isMaximizing so neither animation triggers while the other is in progress"
  - "Simple opacity fade for floating image on maximize (no fly-back animation needed — navigating forward, not back to card)"
metrics:
  duration: 3min
  completed: "2026-04-02"
  tasks_completed: 1
  files_modified: 1
---

# Phase 53 Plan 02: handleMaximize GSAP Exit + router.push Summary

**One-liner:** Replaced `window.location.href` in `handleMaximize` with GSAP fade-out animation followed by `router.push` for smooth SPA navigation that preserves React Query cache and browser history.

## What Was Built

The `handleMaximize` function in `useImageModalAnimation.ts` previously used `window.location.href` for navigation, causing a full browser reload. This cleared the React Query cache, corrupted the browser history stack, and produced a jarring visual transition with no animation.

The fix mirrors the existing `handleClose` GSAP exit pattern: fade out backdrop, drawer, and floating image simultaneously, then navigate via `router.push` in the `onComplete` callback after a 50ms safety delay.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace handleMaximize with GSAP exit + router.push | e6821225 | packages/web/lib/hooks/useImageModalAnimation.ts |

## Changes Made

**`packages/web/lib/hooks/useImageModalAnimation.ts`**
- Added `isMaximizing` state alongside existing `isClosing`
- Updated `UseImageModalAnimationReturn` interface to include `isMaximizing: boolean`
- Replaced `window.location.href = /posts/${imageId}` with full GSAP timeline:
  - Fades backdrop + drawer to opacity 0 (300ms, power3.in ease)
  - On desktop: also fades floating image container to opacity 0
  - `onComplete`: calls `reset()` then `router.push(/posts/${imageId})`
- Updated `handleClose` guard from `if (isClosing || ...)` to `if (isClosing || isMaximizing || ...)`
- Added `isMaximizing` to return object

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript compilation: PASS (bunx tsc --noEmit returned zero errors)
- No `window.location.href` in handleMaximize: CONFIRMED
- GSAP exit animation plays before navigation: CONFIRMED (router.push in onComplete)
- router.push used (not router.replace): CONFIRMED
- isMaximizing + isClosing cross-guard: CONFIRMED
- isMaximizing added to interface and return: CONFIRMED

## Self-Check: PASSED

- File exists: CONFIRMED — packages/web/lib/hooks/useImageModalAnimation.ts
- Commit exists: CONFIRMED — e6821225
