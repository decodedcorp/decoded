---
phase: quick-260402-pqz
plan: 01
subsystem: detail
tags: [badge-removal, ux, shopgrid, decoded-items]
key-files:
  modified:
    - packages/web/lib/components/detail/ShopGrid.tsx
    - packages/web/lib/components/detail/DecodedItemsSection.tsx
decisions:
  - "isSpotted variable removed entirely (only used for badge rendering)"
  - "matchType field retained in type definition and data mapping (not badge-only)"
metrics:
  duration: ~5min
  completed: "2026-04-02T09:35:28Z"
  tasks: 3
  files: 2
---

# Quick Task 260402-pqz: Post Detail Badge Removal Summary

**One-liner:** Removed Spotted badge from ShopGrid cards and match type badge from DecodedItemsSection for clean image-centric UX.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ShopGrid Spotted 뱃지 제거 | 2e1ef569 | ShopGrid.tsx |
| 2 | DecodedItemsSection match type 뱃지 제거 | 506a5bc1 | DecodedItemsSection.tsx |
| 3 | 타입체크 검증 | (no commit) | - |

## Changes Made

### Task 1: ShopGrid.tsx
- Removed `isSpotted` variable declaration (`const isSpotted = !!item.normalizedCenter`)
- Removed Spotted badge JSX block (comment + conditional render, 7 lines total)
- Note: `normalizedCenter`-based sorting logic retained (unrelated to badge)

### Task 2: DecodedItemsSection.tsx
- Removed Match type badge JSX block (comment + div + span, 7 lines total)
- `matchType` field retained in type definition (line 29) and data mapping (line 93) — not badge-only

### Task 3: TypeScript Verification
- `tsc --noEmit` shows no errors in either target file

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check

- [x] ShopGrid.tsx: no "Spotted" badge JSX present (sorting logic with same word retained — correct)
- [x] DecodedItemsSection.tsx: no match type badge JSX present (type/data references retained — correct)
- [x] Commits exist: 2e1ef569, 506a5bc1
- [x] TypeScript: no errors in target files
