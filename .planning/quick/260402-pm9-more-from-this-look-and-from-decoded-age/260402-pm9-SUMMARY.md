---
phase: quick
plan: 260402-pm9
subsystem: web/detail
tags: [postimage, feature-flags, related-images, image-rendering]
dependency_graph:
  requires: [PostImage component, feature-flags.ts]
  provides: [RelatedImages uses shared PostImage with dynamic ratio flag]
  affects: [packages/web/lib/components/detail/RelatedImages.tsx]
tech_stack:
  added: []
  patterns: [shared PostImage component, feature flag per component]
key_files:
  created: []
  modified:
    - packages/web/lib/config/feature-flags.ts
    - packages/web/lib/components/detail/RelatedImages.tsx
decisions:
  - "PostImage replaces direct next/image in RelatedImages for consistent dynamic ratio support"
  - "flagKey=RelatedImages added to dynamicImageRatio flags (enabled: true)"
  - "Parent aspect-[4/5] controls height; PostImage maxHeight not needed here"
metrics:
  duration: "~5min"
  completed: "2026-04-02"
  tasks_completed: 2
  files_modified: 2
---

# Quick 260402-pm9: RelatedImages PostImage Migration Summary

**One-liner:** Replaced direct `next/image` in RelatedImages with shared `PostImage` component using `flagKey="RelatedImages"` for feature-flag-controlled dynamic blur-background ratio rendering.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add `RelatedImages: true` to `FEATURE_FLAGS.dynamicImageRatio` | a9476f77 |
| 2 | Replace `Image` from `next/image` with `PostImage` in RelatedImages.tsx | ae3ec387 |

## Changes

### packages/web/lib/config/feature-flags.ts
Added `RelatedImages: true` to `dynamicImageRatio` object, enabling dynamic blur-background + object-contain rendering for RelatedImages cards.

### packages/web/lib/components/detail/RelatedImages.tsx
- Removed `import Image from "next/image"`
- Added `import { PostImage } from "@/lib/components/shared/PostImage"`
- Replaced `Image fill + object-cover` block and `null` fallback with single `<PostImage>` call:
  - `src={post.image_url ?? ""}` — null handled by PostImage's onError
  - `flagKey="RelatedImages"` — connects to new feature flag
  - `className="w-full h-full"` — fills parent `aspect-[4/5]` container
  - `imgClassName="transition-transform duration-700 group-hover:scale-105"` — hover scale preserved

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `packages/web/lib/config/feature-flags.ts` — `RelatedImages: true` present (line 11)
- `packages/web/lib/components/detail/RelatedImages.tsx` — PostImage import on line 4, used on line 156; no `next/image` import
- TypeScript: `bunx tsc --noEmit` passed with no errors
- Commits: a9476f77, ae3ec387 exist in git log
