---
phase: 48-test-coverage
plan: "01"
subsystem: testing
tags: [vitest, unit-tests, data-testid, e2e-selectors, physics-engine, vton, detail-components]
dependency_graph:
  requires: []
  provides: [unit-test-coverage-physics, data-testid-selectors]
  affects: [packages/web/tests, packages/web/lib/components/ThiingsGrid.tsx, packages/web/lib/components/vton, packages/web/lib/components/detail]
tech_stack:
  added: []
  patterns: [vitest-unit-testing, vi-fake-timers, data-testid-e2e-selectors]
key_files:
  created:
    - packages/web/tests/physics.test.ts
    - packages/web/tests/hooks.test.ts
  modified:
    - packages/web/lib/components/ThiingsGrid.tsx
    - packages/web/lib/components/vton/VtonModal.tsx
    - packages/web/lib/components/vton/VtonPhotoArea.tsx
    - packages/web/lib/components/vton/VtonItemPanel.tsx
    - packages/web/lib/components/detail/ItemDetailCard.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
    - packages/web/lib/components/detail/OtherSolutionsList.tsx
    - packages/web/lib/components/detail/TopSolutionCard.tsx
decisions:
  - item-adopt-button placed on TopSolutionCard's adopt button (not ItemDetailCard) — actual button element is in TopSolutionCard; ItemDetailCard got item-detail-card on its root
  - vton-result-image placed on BeforeAfterSlider wrapper div — result is rendered by BeforeAfterSlider component, no direct img element in VtonPhotoArea
  - OtherSolutionsList fragment replaced with div wrapper for data-testid container — fragment cannot hold attributes
metrics:
  duration_seconds: 540
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_modified: 10
---

# Phase 48 Plan 01: Unit Tests and data-testid Selectors Summary

Vitest unit tests for ThiingsGridPhysics pure functions (debounce, throttle, getDistance) and dataUrlToBlob helper, plus 14 data-testid attributes across four refactored component trees for stable E2E selectors.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Write Vitest unit tests for ThiingsGridPhysics and dataUrlToBlob | ef80e9c6 | Done |
| 2 | Add data-testid attributes to four refactored component trees | 36e4aa35 | Done |

## What Was Built

### Task 1: Unit Tests (2 new files, 16 test cases)

**packages/web/tests/physics.test.ts** (13 tests):
- `getDistance`: 4 tests — zero distance, 3-4-5 triangle, negative coords, symmetry
- `debounce`: 4 tests — delay, pre-delay suppression, timer reset on re-call, cancel()
- `throttle`: 5 tests — leading fire, suppress within window, allow after window, trailing call, leading:false

**packages/web/tests/hooks.test.ts** (3 tests):
- `dataUrlToBlob`: PNG mime type, blob size > 0, JPEG mime type

All 16 tests pass via `bunx vitest run tests/physics.test.ts tests/hooks.test.ts`.

### Task 2: data-testid Attributes (14 attributes across 8 files)

| Component | Element | data-testid |
|-----------|---------|------------|
| ThiingsGrid.tsx | Root container | `thiings-grid` |
| ThiingsGrid.tsx | Item wrapper | `thiings-grid-item` |
| VtonModal.tsx | Modal root | `vton-modal` |
| VtonPhotoArea.tsx | Photo area root | `vton-photo-area` |
| VtonPhotoArea.tsx | Result display wrapper | `vton-result-image` |
| VtonItemPanel.tsx | Item panel root | `vton-item-panel` |
| VtonItemPanel.tsx | Try-on button | `vton-try-on-button` |
| ItemDetailCard.tsx | Card root | `item-detail-card` |
| TopSolutionCard.tsx | Adopt button | `item-adopt-button` |
| ImageDetailModal.tsx | Modal root | `image-detail-modal` |
| ImageDetailModal.tsx | Floating image | `image-detail-image` |
| ImageDetailModal.tsx | Close button | `image-detail-close` |
| OtherSolutionsList.tsx | Solutions container | `item-solutions-list` |

## Verification

- `bunx vitest run tests/physics.test.ts tests/hooks.test.ts`: 16/16 tests green
- `grep data-testid` across target files: 14 attributes found (>= 13 required)
- No new TypeScript errors introduced (pre-existing errors in ItemDetailCard line 58 and postDetailToImageDetail.ts are unrelated to this plan)

## Deviations from Plan

### Minor Implementation Notes

**1. [Rule 2 - Missing] adopt button in TopSolutionCard, not ItemDetailCard**
- **Found during:** Task 2
- **Issue:** Plan said "adopt button" in ItemDetailCard.tsx but the actual `<button>` element is in TopSolutionCard.tsx (adopt logic is spread via `adoptDropdown` props)
- **Fix:** Added `data-testid="item-detail-card"` to ItemDetailCard root as specified, plus `data-testid="item-adopt-button"` to the adopt button in TopSolutionCard.tsx
- **Files modified:** packages/web/lib/components/detail/TopSolutionCard.tsx (added to plan's file list)
- **Commit:** 36e4aa35

**2. [Rule 1 - Minor] OtherSolutionsList fragment replaced with div**
- **Found during:** Task 2
- **Issue:** OtherSolutionsList returns `<>...</>` fragment — fragments cannot receive props including data-testid
- **Fix:** Replaced `<>` with `<div data-testid="item-solutions-list">` and updated closing tag
- **Files modified:** packages/web/lib/components/detail/OtherSolutionsList.tsx
- **Commit:** 36e4aa35

## Self-Check: PASSED

Files created/modified all verified present. Commits ef80e9c6 and 36e4aa35 confirmed in git log.
