---
phase: quick
plan: 260402-qhu
subsystem: web/detail/magazine
tags: [ui, tailwind, magazine, editorial]
dependency_graph:
  requires: []
  provides: [enlarged-celeb-cards, adjusted-item-image-sizes, larger-similar-items]
  affects: [MagazineCelebSection, MagazineItemsSection]
tech_stack:
  added: []
  patterns: [tailwind-responsive-classes]
key_files:
  modified:
    - packages/web/lib/components/detail/magazine/MagazineCelebSection.tsx
    - packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx
decisions:
  - Similar Items margin offsets updated to match new item image widths (15rem/16rem vs 18rem/20rem)
  - max-w-5xl widened to max-w-6xl on celeb section for additional breathing room at 4-col layout
metrics:
  duration: ~5min
  completed: 2026-04-02
  tasks_completed: 1
  files_modified: 2
---

# Phase quick Plan 260402-qhu: Magazine Section Size Adjustments Summary

Magazine component size tuning — celeb grid from 5-col to 4-col on desktop, item images from 288/320px to 240/256px, similar items from square to 4/5 aspect ratio with more gap and padding.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Enlarge Style Archive celeb cards and adjust The Look + Similar Items sizes | 890374ce | MagazineCelebSection.tsx, MagazineItemsSection.tsx |

## Changes Applied

### MagazineCelebSection.tsx

| Location | Before | After |
|----------|--------|-------|
| Line 37 cols estimate | `gridWidth >= 1024 ? 5` | `gridWidth >= 1024 ? 4` |
| Line 84 container | `max-w-5xl` | `max-w-6xl` |
| Line 91 grid | `lg:grid-cols-5` | `lg:grid-cols-4` |

### MagazineItemsSection.tsx

| Location | Before | After |
|----------|--------|-------|
| Line 50 width calc | `sectionWidth - 320` | `sectionWidth - 256` |
| Line 186 item image | `md:w-72 lg:w-80` | `md:w-60 lg:w-64` |
| Line 279 margin offset | `calc(18rem+2.5rem)` / `calc(20rem+2.5rem)` | `calc(15rem+2.5rem)` / `calc(16rem+2.5rem)` |
| Line 283 similar items gap | `gap-3` | `gap-4` |
| Line 292 similar item aspect | `aspect-square` | `aspect-[4/5]` |
| Line 309 text padding | `p-2` | `p-2.5` |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- Files modified: both exist and contain correct changes (verified via grep)
- Commit 890374ce exists: confirmed
- TypeScript errors: none in modified files (pre-existing error in TrendingArtistsSection.tsx is out of scope)
