---
phase: 46-component-refactoring
plan: "03"
subsystem: web/detail
tags: [refactor, hooks, components, gsap, solutions]
dependency_graph:
  requires: []
  provides:
    - useAdoptDropdown hook
    - useItemCardGSAP hook
    - TopSolutionCard component
    - OtherSolutionsList component
    - useImageModalAnimation hook
    - slim ItemDetailCard (297 lines)
    - slim ImageDetailModal (284 lines)
  affects:
    - packages/web/lib/components/detail/ItemDetailCard.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
tech_stack:
  added: []
  patterns:
    - Hook extraction for GSAP animation lifecycle (ctxRef owned by hook)
    - Subcomponent extraction for large inline IIFE JSX blocks
    - Spread operator for passing hook return as props
key_files:
  created:
    - packages/web/lib/hooks/useAdoptDropdown.ts
    - packages/web/lib/hooks/useItemCardGSAP.ts
    - packages/web/lib/components/detail/TopSolutionCard.tsx
    - packages/web/lib/components/detail/OtherSolutionsList.tsx
    - packages/web/lib/hooks/useImageModalAnimation.ts
  modified:
    - packages/web/lib/components/detail/ItemDetailCard.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
decisions:
  - OtherSolutionsList handles empty state (shows add-more button or null) so ItemDetailCard doesn't need conditional wrapping
  - useImageModalAnimation takes all refs as arguments (not creating them) — component owns ref declarations, hook owns animation lifecycle
  - Floating image entry animation kept in useImageModalAnimation alongside mount effect (same effect dependency: activeImageSrc/originRect)
  - renderContent() kept inline in ImageDetailModal (only ~60 lines, avoids duplicate of ImageDetailContent)
metrics:
  duration_s: 347
  completed_date: "2026-03-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 2
---

# Phase 46 Plan 03: ItemDetailCard + ImageDetailModal Refactoring Summary

Extracted hooks and subcomponents from two 700+ line components, reducing each below 300 lines: `ItemDetailCard` (769→297 lines) via `useAdoptDropdown`, `useItemCardGSAP`, `TopSolutionCard`, `OtherSolutionsList`; `ImageDetailModal` (730→284 lines) via `useImageModalAnimation` owning GSAP ctxRef.

## Tasks Completed

| Task | Name | Commit | Lines Before | Lines After |
|------|------|--------|-------------|-------------|
| 1 | Extract ItemDetailCard hooks and subcomponents | 3e9d2f56 | 769 | 297 |
| 2 | Extract ImageDetailModal animation hook | f3d474e9 | 730 | 284 |

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `packages/web/lib/hooks/useAdoptDropdown.ts` | Adopt dropdown state, click-outside, adopt/unadopt mutations | ~70 |
| `packages/web/lib/hooks/useItemCardGSAP.ts` | ScrollTrigger entry animation for item card | ~45 |
| `packages/web/lib/components/detail/TopSolutionCard.tsx` | Top solution display with adopt/unadopt actions | ~175 |
| `packages/web/lib/components/detail/OtherSolutionsList.tsx` | Expandable other solutions list with adopt actions | ~175 |
| `packages/web/lib/hooks/useImageModalAnimation.ts` | Full GSAP lifecycle for ImageDetailModal (ctxRef, mount, close, touch) | ~230 |

## Decisions Made

1. **OtherSolutionsList handles empty state** — The `otherSolutions.length === 0` case renders the "add more" button directly in `OtherSolutionsList` (or returns `null`). This removes a conditional wrapper from `ItemDetailCard` and keeps solution display logic co-located.

2. **Refs declared in component, passed to hook** — `useImageModalAnimation` receives refs as parameters rather than creating them. This lets the JSX directly attach `ref={...}` to elements while the hook owns animation state.

3. **Floating image entry animation in hook** — The `useEffect` for the floating image FLIP animation (`activeImageSrc, originRect` deps) is co-located with `ctxRef` in `useImageModalAnimation` since both share the same animation responsibility.

4. **`renderContent()` kept inline** — The existing `ImageDetailContent.tsx` serves a different use case (full page). The 60-line inline function is within budget and avoids a near-duplicate component.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written. Line counts landed within target: ItemDetailCard at 297 (target ~200, limit 300), ImageDetailModal at 284 (target ~180, limit 300). Both satisfy the ≤300 requirement.

## Verification

```
ItemDetailCard.tsx:      297 lines  ✓ (≤300)
ImageDetailModal.tsx:    284 lines  ✓ (≤300)
export function ItemDetailCard     ✓
export function ImageDetailModal   ✓
export function useAdoptDropdown   ✓
export function useItemCardGSAP    ✓
export function useImageModalAnimation ✓
export function TopSolutionCard    ✓
export function OtherSolutionsList ✓
```

## Self-Check: PASSED
