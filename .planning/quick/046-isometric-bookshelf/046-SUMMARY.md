---
phase: quick-046
plan: 01
subsystem: collection-bookshelf
tags: [gsap, css-textures, isometric, animation, ui-polish]
dependency_graph:
  requires: [magazine-types, gsap, collection-components]
  provides: [isometric-bookshelf, textured-spines, pop-flip-animation]
  affects: [collection-page]
tech_stack:
  added: []
  patterns: [css-texture-overlays, gsap-timeline-flip, inline-preview-card]
key_files:
  created: []
  modified:
    - packages/web/lib/components/collection/IssueSpine.tsx
    - packages/web/lib/components/collection/BookshelfView.tsx
    - packages/web/lib/components/collection/ShelfRow.tsx
    - packages/web/lib/components/collection/IssuePreviewCard.tsx
    - packages/web/lib/components/collection/CollectionClient.tsx
decisions:
  - "Spine width increased to 64px/78px (from 56px/70px) for better text readability with vertical title"
  - "Cover panel positioned left-full with left-center transform origin for book-opening feel"
  - "Leather texture uses darken utility for darker base tone vs matte/fabric"
metrics:
  duration: "2m 37s"
  completed: "2026-03-05"
---

# Quick Task 046: Isometric Bookshelf Summary

Isometric bookshelf with CSS texture overlays, neon #eafd67 spine numbering, and GSAP pop+flip cover reveal animation.

## Task Results

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Enhanced Isometric Container + Shelf Styling | d11add5 | Perspective 1600px/1000px, rotateX(8deg) tilt, 3D wooden shelf edge, neon skeleton accents |
| 2 | Textured Spines + Neon Numbering + Pop-and-Flip | afa5092 | 3 CSS texture variants, neon Vol glow, title/keyword on spine, GSAP timeline flip animation, inline preview card |

## What Changed

### BookshelfView.tsx
- Perspective increased to 1600px (desktop) / 1000px (mobile)
- Inner container has `rotateX(8deg) translateY(-20px)` for isometric look-down
- Background gradient deepened to `from-[#0d0d0d]`

### ShelfRow.tsx
- Replaced flat `borderBottom` with a pseudo-element 3D wooden shelf edge
- Gradient from `#3a3530` to `#1e1c18` with inset highlight
- Gaps tightened to `gap-3 md:gap-5`

### IssueSpine.tsx (major rewrite)
- 3 CSS texture overlays (matte/fabric/leather) based on `issue_number % 3`
- Neon `#eafd67` Vol numbering with dual text-shadow glow
- Title (truncated 20 chars) and first theme keyword shown vertically
- GSAP timeline animation: spine pops out (z:80, rotateY:-5deg), cover panel flips open from edge-on (rotateY:-90deg to 0deg)
- Reverse animation on deselect: cover closes, spine retracts
- Cover panel contains inline IssuePreviewCard content

### IssuePreviewCard.tsx
- Added `inline` prop for integration into flip panel
- Inline mode: no absolute positioning, compact sizing, fewer keywords

### CollectionClient.tsx
- Skeleton spines now have neon accent bottom border (`border-[#eafd67]/20`)

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Spine width increase**: Widened from 56px/70px to 64px/78px so vertical title text and neon numbering are legible
2. **Cover panel positioning**: Used `left-full` with `transformOrigin: "left center"` so the panel opens like a book cover hinged at the spine edge
3. **Darken utility**: Added a simple hex darken function for leather texture variant rather than importing a color library

## Verification

- Build passes with zero TypeScript/lint errors
- All 5 files modified as specified in plan
