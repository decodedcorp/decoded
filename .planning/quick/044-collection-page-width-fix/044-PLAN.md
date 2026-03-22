---
phase: quick-044
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/collection/BookshelfView.tsx
  - packages/web/lib/components/collection/CollectionClient.tsx
  - packages/web/lib/components/collection/ShelfRow.tsx
autonomous: true
requirements: [WIDTH-FIX]
must_haves:
  truths:
    - "Bookshelf content feels intimate and cozy, not spread across a wide empty page"
    - "Shelf rows with few spines (56-70px each) look properly grouped"
    - "Layout remains responsive on mobile and desktop"
  artifacts:
    - path: "packages/web/lib/components/collection/BookshelfView.tsx"
      provides: "Narrower max-width container"
      contains: "max-w-3xl"
    - path: "packages/web/lib/components/collection/CollectionClient.tsx"
      provides: "Matching skeleton max-width"
      contains: "max-w-3xl"
  key_links:
    - from: "BookshelfView.tsx"
      to: "ShelfRow.tsx"
      via: "flex layout with centered justify"
      pattern: "justify-center"
---

<objective>
Reduce collection page max-width from 1400px to a tighter container so bookshelf spines feel cozy and grouped rather than spread across an empty wide page.

Purpose: Spines are only 56-70px wide; a 1400px container leaves excessive empty space, making the bookshelf look barren.
Output: Narrower, centered bookshelf layout that feels intimate.
</objective>

<execution_context>
@/Users/kiyeol/.claude-work/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-work/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/collection/BookshelfView.tsx
@packages/web/lib/components/collection/CollectionClient.tsx
@packages/web/lib/components/collection/ShelfRow.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Narrow bookshelf container and center shelf content</name>
  <files>
    packages/web/lib/components/collection/BookshelfView.tsx,
    packages/web/lib/components/collection/CollectionClient.tsx,
    packages/web/lib/components/collection/ShelfRow.tsx
  </files>
  <action>
    1. In BookshelfView.tsx (line 85): Change `max-w-[1400px]` to `max-w-3xl` (768px). This fits ~8-10 spines per row comfortably while keeping content grouped. Keep `mx-auto`.

    2. In CollectionClient.tsx LoadingSkeleton (line 76): Change `max-w-[1400px]` to `max-w-3xl` to match the bookshelf container.

    3. In ShelfRow.tsx (line 23): Change `justify-start` to `justify-center` so spines cluster toward the center of the shelf rather than hugging the left edge. This makes partially-filled rows look balanced.

    Do NOT change: perspective values, GSAP animations, gap sizes, spine dimensions, responsive breakpoints, or padding.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && yarn build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - BookshelfView uses max-w-3xl instead of max-w-[1400px]
    - LoadingSkeleton uses max-w-3xl instead of max-w-[1400px]
    - ShelfRow centers spines with justify-center
    - Build succeeds with no errors
  </done>
</task>

</tasks>

<verification>
- `grep -r "max-w-\[1400px\]" packages/web/lib/components/collection/` returns no results
- `grep "max-w-3xl" packages/web/lib/components/collection/BookshelfView.tsx` finds the new class
- `grep "justify-center" packages/web/lib/components/collection/ShelfRow.tsx` finds the centered layout
- `yarn build` succeeds
</verification>

<success_criteria>
Collection page bookshelf uses a 768px max-width container with centered shelf content. No 1400px references remain in collection components.
</success_criteria>

<output>
After completion, create `.planning/quick/044-collection-page-width-fix/044-SUMMARY.md`
</output>
