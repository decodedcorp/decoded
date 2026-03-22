---
quick: 004
title: Fix Feed Page Footer Overlap and Responsive Grid
type: execute
files_modified:
  - packages/web/lib/components/ConditionalFooter.tsx
  - packages/web/lib/components/VerticalFeed.tsx
autonomous: true
---

<objective>
Fix the feed page where content overlaps with footer, and make the grid full-width with responsive columns (4 -> 3 -> 2 -> 1).

Problem:
1. Footer overlaps feed content because feed uses fixed-height scroll container
2. Grid is constrained by max-w-lg/4xl/6xl instead of being full-width

Solution:
1. Hide footer on /feed route (like /explore page)
2. Remove max-width constraints and add responsive grid columns
</objective>

<context>
@packages/web/lib/components/ConditionalFooter.tsx
@packages/web/lib/components/VerticalFeed.tsx
@packages/web/app/feed/page.tsx

Current state:
- ConditionalFooter hides footer only on /explore
- VerticalFeed uses max-w-lg md:max-w-4xl lg:max-w-6xl (constrained)
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 (max 3 cols)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Hide footer on feed route</name>
  <files>packages/web/lib/components/ConditionalFooter.tsx</files>
  <action>
Add "/feed" to HIDDEN_FOOTER_PATHS array in ConditionalFooter.tsx.

This prevents footer from rendering on feed page, similar to explore page behavior.
  </action>
  <verify>
grep -n "feed" packages/web/lib/components/ConditionalFooter.tsx
  </verify>
  <done>HIDDEN_FOOTER_PATHS includes "/feed"</done>
</task>

<task type="auto">
  <name>Task 2: Update VerticalFeed to full-width responsive grid</name>
  <files>packages/web/lib/components/VerticalFeed.tsx</files>
  <action>
Update VerticalFeed and VerticalFeedSkeleton container and grid classes:

1. Container: Remove max-w-* constraints, use full width with padding
   - Change: "mx-auto max-w-lg md:max-w-4xl lg:max-w-6xl px-4 md:px-8 lg:px-12"
   - To: "w-full px-4 md:px-6 lg:px-8"

2. Grid: Add responsive columns (1 -> 2 -> 3 -> 4)
   - Change: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
   - To: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

Apply same changes to both VerticalFeed and VerticalFeedSkeleton components.
Also update the loading indicator grid to match the same responsive columns.
  </action>
  <verify>
yarn --cwd packages/web build 2>&1 | head -20
  </verify>
  <done>
- VerticalFeed uses full width container
- Grid shows 1 col on mobile, 2 cols on sm, 3 cols on lg, 4 cols on xl
- No max-width constraints on container
  </done>
</task>

</tasks>

<verification>
1. Run dev server: `yarn --cwd packages/web dev`
2. Visit http://localhost:3000/feed
3. Verify:
   - No footer visible on feed page
   - Grid is full width (no centered narrow column)
   - Responsive: 4 cols on xl, 3 cols on lg, 2 cols on sm, 1 col on mobile
   - Scroll works smoothly without content overlapping
</verification>

<success_criteria>
- Footer hidden on /feed route
- Feed grid fills available width
- Responsive grid: xl=4, lg=3, sm=2, mobile=1 columns
- No visual overlap or layout issues
</success_criteria>

<output>
After completion, update `.planning/STATE.md` quick tasks table.
</output>
