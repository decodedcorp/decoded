---
phase: v4-04-screen-specs-detail-view
plan: 02
subsystem: ui
tags: [screen-spec, detail-view, shopping, related-content, recommendations, affiliate, gsap]

# Dependency graph
requires:
  - phase: v4-04-01
    provides: SCR-VIEW-01 and SCR-VIEW-02 detail view specs (page layout, hotspot interaction)
  - phase: v4-02-01
    provides: component-registry, api-contracts, data-models as reference foundation
  - phase: v4-03-01
    provides: FLW-02 detail flow (shopping exit, interaction states)
provides:
  - SCR-VIEW-03: Item/Solution detail spec with shopping connection flow and affiliate URL documentation
  - SCR-VIEW-04: Related content spec with researched recommendation logic and status tags
affects:
  - v4-05 (Discovery screen specs — cross-reference patterns)
  - v4-06 (Creation-AI screen specs — solution creation flow reference)
  - Future implementation of runtime affiliate conversion (NOT-IMPL documented)
  - Future implementation of comment system (NOT-IMPL documented)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EARS requirements with tri-state status tags: ✅ / ⚠️ NOT-IMPL / 📋 PLANNED"
    - "Stale path handling: confirmed-missing components listed under spec header, not in component table"
    - "Recommendation logic research: read component source to determine actual vs assumed behavior before documenting"

key-files:
  created:
    - specs/screens/detail/SCR-VIEW-03-item-solution.md
    - specs/screens/detail/SCR-VIEW-04-related-content.md
  modified: []

key-decisions:
  - "Affiliate conversion: useConvertAffiliate hook exists but is NOT called at tap time; affiliate URLs are pre-stored in SolutionRow.affiliate_url — documented as NOT-IMPL for runtime conversion"
  - "ItemVoting is UI-only stub: itemId prop prefixed with _ (unused), hardcoded counts 24/3, no API call — marked NOT-IMPL for backend voting"
  - "Related content recommendation is artist-based only (useInfinitePosts artistName); no ML/category/tag-based recommendation exists"
  - "SmartTagsBreadcrumb is purely presentational — tags passed from parent, no data fetching, no filtering query triggered"
  - "CommentSection in shared/ uses MOCK_COMMENTS; detail-specific Comment components (Form/Item/List) confirmed missing per filesystem"
  - "Legacy image flow (ImageDetailContent + ShopGrid + ItemDetailCard) coexists with post flow (PostDetailContent + DecodedItemsSection)"

patterns-established:
  - "Component map table includes both current and legacy flow rows, clearly labeled"
  - "Researched recommendation logic before documenting — never assume, always verify from code"

# Metrics
duration: ~20min
completed: 2026-02-19
---

# Phase v4-04 Plan 02: Item/Solution and Related Content Screen Specs Summary

**SCR-VIEW-03 documents the shopping connection flow (affiliate URLs pre-stored, runtime conversion designed but not wired); SCR-VIEW-04 documents artist-based recommendation with honest NOT-IMPL tags for comments and ML logic**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-02-19T~12:40Z
- **Completed:** 2026-02-19T~13:00Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- SCR-VIEW-03 documents DecodedItemsSection and ShopCarouselSection with verified file paths; captures that affiliate URLs are pre-stored in SolutionRow (not fetched at click time) and marks runtime conversion as NOT-IMPL
- SCR-VIEW-04 documents three related content components with honest recommendation logic: `RelatedImages` is artist-filtered only via `useInfinitePosts`, no ML/category recommendation exists
- All stale paths from STALE-PATHS-AUDIT (BuyButton, VoteButton, VotingSection, VibeItemCard, DualMatchSection, AddVibeModal, Comment detail components, TagBreadcrumb) documented as NOT-IMPL and excluded from component tables

## Task Commits

Each task was committed atomically:

1. **Task 1: Write SCR-VIEW-03-item-solution.md** - `80847f4` (docs)
2. **Task 2: Write SCR-VIEW-04-related-content.md** - `535cfb2` (docs)

**Plan metadata:** (pending metadata commit)

## Files Created

- `specs/screens/detail/SCR-VIEW-03-item-solution.md` — Item/Solution detail spec (147 lines): DecodedItemsSection, ShopCarouselSection, ItemVoting; shopping connection flow; stale components tagged NOT-IMPL
- `specs/screens/detail/SCR-VIEW-04-related-content.md` — Related content spec (154 lines): GallerySection, RelatedLooksSection, RelatedImages, SmartTagsBreadcrumb; researched recommendation logic; comment system tagged NOT-IMPL

## Decisions Made

- **Affiliate URL delivery:** Pre-stored in `SolutionRow.affiliate_url` at creation time, not fetched at click time. `useConvertAffiliate` hook and `POST /api/v1/solutions/convert-affiliate` endpoint exist but are not called in the current shopping UI. This is a significant implementation gap documented in SCR-VIEW-03.
- **ItemVoting status:** The `itemId` prop is `_itemId` (prefixed underscore = intentionally unused). Hardcoded defaults of 24/3 votes. Local state only. No backend voting API exists. Marked as UI-only stub.
- **Recommendation scope:** Only artist-based filtering via `useInfinitePosts({ artistName: account })`. There is no server-side recommendation engine, no category-based filtering, and no ML component. `SmartTagsBreadcrumb` does not trigger new queries.
- **CommentSection location:** `shared/CommentSection.tsx` with MOCK_COMMENTS is the actual current implementation. The old detail-specific `CommentForm/Item/List/Section` components were never built.

## Deviations from Plan

None — plan executed exactly as written. All component research findings matched deviation-free execution (findings documented in spec as status tags, not deviations from the plan itself).

## Issues Encountered

None — all component files existed at expected paths, only stale paths (per STALE-PATHS-AUDIT) were confirmed missing.

## Next Phase Readiness

- SCR-VIEW-03 and SCR-VIEW-04 complete the Detail View bundle (v4-04 phase: all 4 screen specs written)
- v4-05 (Discovery screen specs) can begin; cross-reference pattern established
- Key gaps documented for future implementation: runtime affiliate conversion, backend voting persistence, real comment system, ML recommendation

---
*Phase: v4-04-screen-specs-detail-view*
*Completed: 2026-02-19*
