# Quick Task 021: Fix Request Upload Spot Creation Missing

## Problem

Spot creation on image click was not working in the request upload page.

## Root Cause

In `DetectionView.tsx`, the click area div used `z-5` class which is **not a valid Tailwind CSS class**. Tailwind only provides `z-0, z-10, z-20, z-30, z-40, z-50` by default. Without a valid z-index, the click area couldn't capture click events properly.

Additionally, `SpotMarker` had no explicit z-index, making the stacking context unpredictable.

## Solution

1. **DetectionView.tsx**: Change `z-5` to `z-[1]` (arbitrary value, lower than markers)
2. **SpotMarker.tsx**: Add `z-10` to ensure markers are above click area but below other UI

## Files Changed

- `packages/web/lib/components/request/DetectionView.tsx` - Line 73: `z-5` → `z-[1]`
- `packages/web/lib/components/request/SpotMarker.tsx` - Line 35: Added `z-10`

## Verification

- [x] TypeScript check passed
- [x] ESLint (no new errors in modified files)
