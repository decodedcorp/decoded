---
phase: quick-005
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/explore/ExploreClient.tsx
autonomous: true

must_haves:
  truths:
    - "ThiingsGrid is visible on explore page"
    - "Grid fills available viewport space below header"
    - "Grid works on both mobile and desktop"
  artifacts:
    - path: "packages/web/app/explore/ExploreClient.tsx"
      provides: "Fixed viewport height calculation for ThiingsGrid container"
      contains: "h-[calc(100dvh"
  key_links:
    - from: "ExploreClient container"
      to: "ThiingsGrid"
      via: "position: absolute; inset: 0"
      pattern: "absolute inset-0"
---

<objective>
Fix explore page ThiingsGrid not visible due to container height issue.

Purpose: The ThiingsGrid uses `position: absolute; inset: 0;` which requires its parent to have explicit dimensions. Currently the parent uses `h-full` which doesn't work because percentage heights require explicit parent heights in the chain.

Output: ThiingsGrid properly visible and filling the viewport space below the header.
</objective>

<execution_context>
@/Users/kiyeol/.claude-work/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-work/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/app/explore/ExploreClient.tsx
@packages/web/lib/components/ConditionalNav.tsx (MainContentWrapper padding info)

Key information:
- MainContentWrapper applies: `pt-14 md:pt-[72px] pb-16 md:pb-0`
- Mobile: 56px top header + 64px bottom nav = 120px total
- Desktop: 72px top header, no bottom nav
- ThiingsGrid container uses `position: absolute; inset: 0;`
- `h-full` doesn't work because parent chain uses `min-h-screen` not explicit height
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix container height for ThiingsGrid visibility</name>
  <files>packages/web/app/explore/ExploreClient.tsx</files>
  <action>
Change the outer container from `h-full` to explicit viewport-based height calculation:

**Current (broken):**
```tsx
<div className="h-full relative">
```

**Fix to:**
```tsx
<div className="h-[calc(100dvh-120px)] md:h-[calc(100dvh-72px)] relative">
```

This uses:
- `100dvh` (dynamic viewport height) for better mobile support
- Mobile: subtract 120px (56px header + 64px bottom nav)
- Desktop (md+): subtract 72px (header only, no bottom nav)

The `relative` class is kept to establish positioning context for the `absolute inset-0` children (ThiingsGrid and its wrappers).
  </action>
  <verify>
Run `yarn build` to ensure no build errors.
Then manually verify in browser:
1. `yarn dev`
2. Visit http://localhost:3000/explore
3. Confirm ThiingsGrid is visible and fills the space below header
4. Test on mobile viewport (responsive mode) - should account for bottom nav
  </verify>
  <done>
ThiingsGrid visible on explore page, filling viewport space correctly on both mobile and desktop.
  </done>
</task>

</tasks>

<verification>
1. Build passes: `yarn build` succeeds
2. Visual verification: ThiingsGrid visible on /explore page
3. Mobile responsive: Grid fills space between header and bottom nav
4. Desktop responsive: Grid fills space below header to bottom of viewport
5. Scrolling/panning works: ThiingsGrid drag-to-scroll interaction functional
</verification>

<success_criteria>
- ThiingsGrid is visible and interactive on /explore page
- Grid fills available viewport space on mobile and desktop
- No build errors or TypeScript issues
</success_criteria>

<output>
After completion, create `.planning/quick/005-fix-explore-page-things-grid-not-visible/005-SUMMARY.md`
</output>
