# Quick Task 007: Fix Explore Page "Failed to load images" Error

## Summary

Fixed the explore page image loading error by removing an invalid Supabase REST API query option and improving error handling for better debugging.

## Root Cause

The `fetchImagesByPostImage` function in `images.ts` used `.order("ts", { ascending: false, referencedTable: "post" })` which generates an invalid PostgREST REST API query. The `referencedTable` option is not supported for ordering in PostgREST.

## Changes Made

### Task 1: Improved Error Handling
**Commit:** ae6469f

Files modified:
- `packages/shared/supabase/queries/images-adapter.ts`
  - Added Supabase initialization check before queries
  - Wrapped `fetchImagesByPostImage` call in try-catch with context
  - Added console.error logging for debugging

- `packages/web/app/explore/ExploreClient.tsx`
  - Improved error display to show actual error message
  - Added console.error for browser debugging
  - Handle both Error instances and generic objects

### Task 2: Fixed Root Cause
**Commit:** 6cc6cb2

Files modified:
- `packages/shared/supabase/queries/images.ts`
  - Removed `.order("ts", { ascending: false, referencedTable: "post" })` line
  - Added comment explaining why client-side sorting is used
  - Client-side sorting by `post.ts` was already implemented correctly

## Verification

- [x] Build succeeds: `yarn build`
- [x] Dev server runs without errors: `yarn dev`
- [x] `/explore` page loads and displays images (HTTP 200)
- [x] No TypeScript errors
- [x] Error handling provides useful debugging information when issues occur

## Technical Notes

- PostgREST (Supabase's REST layer) does not support ordering by foreign table columns via the `referencedTable` option
- The function already had client-side sorting implemented, so removing the invalid DB-level ordering has no functional impact
- The improved error handling will make future debugging easier by showing actual error messages instead of generic "Something went wrong"

## Duration

Completed: 2026-02-05
