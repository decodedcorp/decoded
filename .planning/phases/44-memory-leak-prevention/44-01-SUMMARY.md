---
phase: 44-memory-leak-prevention
plan: 01
subsystem: frontend-animations
tags: [gsap, memory-leak, contextSafe, setTimeout, useEffect, cleanup]
dependency_graph:
  requires: []
  provides: [contextSafe-gsap-pattern, requestAnimationFrame-init-pattern]
  affects:
    - packages/web/lib/components/main/TrendingListSection.tsx
    - packages/web/lib/components/main-renewal/MasonryGridItem.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
    - packages/web/lib/components/main-d/DraggableDoodle.tsx
    - packages/web/lib/components/main-d/PolaroidCard.tsx
    - packages/web/lib/components/main-d/StickerPeel.tsx
    - packages/web/lib/components/detail/ItemDetailCard.tsx
    - packages/web/lib/hooks/useImageUpload.ts
tech_stack:
  added: []
  patterns:
    - contextSafe() from useGSAP for event handler animations
    - ctxRef.current.add() for existing gsap.context pattern
    - requestAnimationFrame replacing setTimeout for GSAP DOM init
    - gsap.delayedCall replacing setTimeout for GSAP onComplete delays
    - Direct addEventListener without setTimeout(0) workaround
key_files:
  created: []
  modified:
    - packages/web/lib/components/main/TrendingListSection.tsx
    - packages/web/lib/components/main-renewal/MasonryGridItem.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
    - packages/web/lib/components/main-d/DraggableDoodle.tsx
    - packages/web/lib/components/main-d/PolaroidCard.tsx
    - packages/web/lib/components/main-d/StickerPeel.tsx
    - packages/web/lib/components/detail/ItemDetailCard.tsx
    - packages/web/lib/hooks/useImageUpload.ts
decisions:
  - "Keep AISummarySection and StudioLoader setTimeout patterns as-is — both have proper clearTimeout cleanup and the delays are intentional for animation sequencing"
  - "DraggableDoodle and PolaroidCard: migrate Draggable.create() from useEffect into useGSAP rather than wrapping individual gsap calls, since useGSAP provides full context management"
  - "StickerPeel: use contextSafe() for mousemove lighting handler and keep native addEventListener for touch handlers (no gsap calls in touch handlers)"
metrics:
  duration_seconds: 215
  tasks_completed: 2
  tasks_total: 2
  files_modified: 8
  completed_date: "2026-03-26"
requirements: [MEM-01, MEM-03]
---

# Phase 44 Plan 01: GSAP contextSafe + setTimeout Cleanup Summary

GSAP event handler animations wrapped in contextSafe() across 6 components, and 4 unnecessary setTimeout workarounds replaced with proper alternatives.

## What Was Built

Applied two complementary memory leak prevention patterns:

1. **MEM-01: contextSafe() for GSAP event handler animations** — GSAP calls inside React event handlers (onMouseEnter, onMouseLeave, touch events) were executing outside the GSAP context, meaning animations created on hover/touch would not be cleaned up when the component unmounts. Wrapped these in `contextSafe()` (for `useGSAP`-based components) or `ctxRef.current.add()` (for the existing `gsap.context()` pattern in ImageDetailModal).

2. **MEM-03: setTimeout workaround removal** — Four `setTimeout` calls in `useEffect` were identified as workarounds rather than intentional delays. Replaced with proper alternatives: `requestAnimationFrame` for GSAP DOM measurement init, `gsap.delayedCall` for context-managed transition delays, and direct `addEventListener` for click outside detection.

## Tasks Completed

### Task 1: Apply contextSafe() to GSAP event handler animations (2731f623)

**TrendingListSection.tsx:**
- Imported `useGSAP` from `@gsap/react`
- Converted second `useEffect` (marquee animation) to `useGSAP` with `contextSafe` destructuring
- Replaced `setTimeout(50)` with `requestAnimationFrame` (satisfies MEM-03 as well)
- Wrapped `handleMouseEnter` and `handleMouseLeave` with `contextSafe()` — they now run inside the GSAP context and animate are auto-cleaned on unmount

**MasonryGridItem.tsx:**
- Imported `useGSAP` from `@gsap/react`; kept `useState` for `SpotMarker` sub-component
- Removed `isHovered` state and the `useEffect` that triggered GSAP without context
- Added `const { contextSafe } = useGSAP({ scope: cardRef })`
- Created `handleMouseEnter` and `handleMouseLeave` as `contextSafe()` callbacks that query markers at call time
- Updated JSX to use new handlers directly (eliminated extra re-renders from state)

**ImageDetailModal.tsx:**
- Kept existing `ctxRef = useRef(gsap.context(...))` pattern (do not mix with useGSAP)
- `handleTouchMove`: wrapped `gsap.set(drawerRef.current, { y: diff })` with `ctxRef.current.add(() => { ... })`
- `handleTouchEnd`: wrapped `gsap.to(drawerRef.current, ...)` with `ctxRef.current.add(() => { ... })`
- `handleClose` onComplete: replaced `setTimeout(50)` with `gsap.delayedCall(0.05, ...)` (context-managed)

**DraggableDoodle.tsx:**
- Replaced `useEffect` + manual `inst.kill()` with `useGSAP({ scope: ref })`
- `Draggable.create()` now runs inside GSAP context; all gsap calls in callbacks are auto-managed

**PolaroidCard.tsx:**
- Same pattern as DraggableDoodle: `useGSAP({ scope: cardRef, dependencies: [position.zIndex] })`
- `Draggable.create()` inside useGSAP; manual `inst.kill()` cleanup removed

**StickerPeel.tsx:**
- Imported `useGSAP`
- Moved `Draggable.create()` into `useGSAP({ scope: dragTargetRef })` callback
- Kept native `useEffect` for mousemove lighting, but wrapped the handler with `contextSafe()` so the `gsap.set(pointLightRef.current, ...)` call runs inside context
- Touch handlers (classList add/remove) have no GSAP — kept as-is

### Task 2: Replace setTimeout workarounds with proper alternatives (4ef2db9c)

**ItemDetailCard.tsx:**
- Removed `setTimeout(0)` before `document.addEventListener("click", handleClickOutside)`
- Removed corresponding `clearTimeout(tid)` from cleanup
- Direct registration works correctly because `click` events fire after `mousedown` — the delay was a workaround with no benefit

**useImageUpload.ts:**
- Removed `setTimeout(() => { startDetection(); }, 100)`
- Direct call: `startDetection()` — Zustand state updates are synchronous; waiting 100ms for "UI update" was unnecessary

**Preserved (intentional delays with proper cleanup):**
- `AISummarySection.tsx`: `setTimeout(300)` for reveal with `clearTimeout` — intentional animation sequencing
- `StudioLoader.tsx`: `setTimeout(300)` for delayed unmount with `clearTimeout` — exit animation timing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MasonryGridItem: useState still needed for SpotMarker**
- **Found during:** Task 1 — MasonryGridItem refactoring
- **Issue:** Removing `useState` from import broke `SpotMarker` sub-component (line 39 `setShowPopup`)
- **Fix:** Kept `useState` in the import alongside new `useRef`, `useEffect`
- **Files modified:** `MasonryGridItem.tsx`
- **Commit:** 2731f623

**2. [Rule 2 - Enhancement] ImageDetailModal: gsap.delayedCall in handleClose**
- **Found during:** Task 1 review of ImageDetailModal
- **Issue:** `setTimeout(50)` in the `handleClose` onComplete callback was within the GSAP context block but used vanilla setTimeout — a context-managed alternative was available
- **Fix:** Replaced with `gsap.delayedCall(0.05, ...)` — auto-cleaned by ctxRef.revert()
- **Files modified:** `ImageDetailModal.tsx`
- **Commit:** 2731f623

## Self-Check: PASSED

All 8 modified files confirmed to exist on disk. Both task commits (2731f623, 4ef2db9c) confirmed in git history.
