# Quick Task 032: Fix activeImageSrc TDZ Reference Error

## Problem
Runtime ReferenceError: "Cannot access 'activeImageSrc' before initialization" in ImageDetailModal.tsx.

`activeImageSrc` was declared on line 465 (after `renderContent`) but referenced in a `useEffect` dependency array on line 333 (ResizeObserver effect), causing a JavaScript temporal dead zone (TDZ) error.

## Root Cause
JavaScript `const` declarations are hoisted but not initialized until the declaration is reached. The `useEffect` on line 333 attempted to read `activeImageSrc` from its dependency array before the `const` declaration on line 465 was executed.

## Fix
1. Move `activeImageSrc` declaration to line 96 (after refs/state, before any useEffect that references it)
2. Remove the duplicate debug `useEffect` that was adjacent to the old declaration
3. Fix pre-existing type error: `typeof postDetail.solutions[0]` -> `NonNullable<typeof postDetail>["solutions"][0]`

## Tasks
- [x] Move `activeImageSrc` declaration before first usage
- [x] Remove orphaned debug useEffect
- [x] Fix `extractBrand` type error
- [x] Verify TypeScript compilation
