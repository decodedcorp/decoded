---
phase: quick
plan: 260402-mym
subsystem: web/explore
tags: [explore, editorial, magazine, filter]
key-files:
  modified:
    - packages/web/app/explore/page.tsx
decisions:
  - "Pass hasMagazine={true} to ExploreClient -- leverages existing prop and useInfinitePosts filter"
metrics:
  duration: 81s
  completed: "2026-04-02T07:39:00Z"
---

# Quick Task 260402-mym: Explore Editorial Post Filter Summary

Filter /explore page to show only posts that have editorial (magazine) content generated.

## What Changed

Added `hasMagazine` prop to `ExploreClient` in `packages/web/app/explore/page.tsx`. The ExploreClient component already accepts `hasMagazine?: boolean` and the underlying `useInfinitePosts` hook applies `.not("post_magazine_id", "is", null)` Supabase filter when true. This single prop addition filters the explore page to only display posts with associated magazine content.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 1695e82e | feat(260402-mym): filter explore page to show only editorial posts |

## Files Modified

- `packages/web/app/explore/page.tsx` -- added `hasMagazine` prop to ExploreClient

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED
