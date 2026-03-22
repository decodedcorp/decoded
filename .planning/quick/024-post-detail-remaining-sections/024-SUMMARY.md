---
phase: quick
plan: 024
subsystem: detail-page
tags: [post-detail, sections, gallery, shop-carousel, decoded-items, related-looks, gsap]
dependency-graph:
  requires: ["quick-023"]
  provides: ["Complete post detail page with 4 decoded.pen sections"]
  affects: []
tech-stack:
  added: []
  patterns: ["conditional section rendering", "useRelatedImagesByAccount for cross-account images"]
key-files:
  created:
    - packages/web/lib/components/detail/DecodedItemsSection.tsx
    - packages/web/lib/components/detail/ShopCarouselSection.tsx
    - packages/web/lib/components/detail/GallerySection.tsx
    - packages/web/lib/components/detail/RelatedLooksSection.tsx
  modified:
    - packages/web/lib/components/detail/PostDetailContent.tsx
decisions:
  - Used SolutionRow fields directly instead of legacy ItemRow mapping
  - Extracted brand from keywords[0] or first word of title
  - Gallery gets first 5 related images, Related Looks gets remainder
  - Masonry layout uses alternating 200px/140px heights
metrics:
  duration: ~4 minutes
  completed: 2026-02-12
---

# Quick Task 024: Post Detail Remaining Sections Summary

**One-liner:** 4 decoded.pen sections (Decoded Items, Gallery, Shop the Look, Related Looks) with responsive layouts, GSAP scroll animations, and conditional rendering

## What Was Built

### DecodedItemsSection
- Selectable item list with expandable detail card
- Mobile: vertical list + detail card below
- Desktop: side-by-side (400px list + flex-1 detail card)
- Each item shows thumbnail, title, brand/price, chevron indicator
- Selected item highlighted with primary bg color
- Expanded card: match type badge, title, brand, price, styling tip, Shop Now/Save/Share actions
- GSAP stagger animation on scroll

### ShopCarouselSection
- Horizontal snap-x product card carousel
- Mobile: 140px wide cards with 160px image height
- Desktop: 280px wide cards with 280px image height + nav arrows
- Brand (from keywords/title), product name, price formatting (KRW/USD)
- First card gets primary CTA, rest get secondary
- Navigation arrows: secondary (left) + primary (right) circles

### GallerySection
- "More from this Look" responsive image grid
- Row 1: up to 3 images (140px mobile / 400px desktop)
- Row 2: remaining images up to 2 (140px mobile / 300px desktop)
- Next.js Image with hover scale-105 transition
- Links to /images/[id] for each image
- GSAP stagger fade-in on scroll

### RelatedLooksSection
- Masonry 2-column grid with alternating heights
- Column 1: 200px tall + 140px short
- Column 2: 140px short + 200px tall
- Hover overlay with gradient + @displayName
- Takes first 4 images from related look data
- GSAP stagger reveal on scroll

### PostDetailContent Orchestrator
- Replaced ShopGrid import with 4 new section components
- Added `useRelatedImagesByAccount` hook for gallery/related data
- Gallery gets first 5 images, Related Looks gets remaining
- Section order: Hero > Tags > Article > Decoded Items > Gallery > Shop the Look > Related Looks
- All sections conditional -- only render when data exists
- Empty state still shows when no spots/solutions at all

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript: `npx tsc --noEmit` passes with zero errors
- Build: `yarn build` passes clean
- All sections render conditionally (return null if no data)
- No `any` types used
- Hero, tags, article sections unchanged (no regressions)

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 3a1beb7 | feat(quick-024): create DecodedItemsSection and ShopCarouselSection components |
| 2 | 3f90d6a | feat(quick-024): add Gallery, Related Looks sections; wire all into PostDetailContent |
