---
phase: quick-031
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/FeedCard.tsx
autonomous: true

must_haves:
  truths:
    - "Feed card images show the top portion of images instead of cropping from the top"
    - "Feed card images still fill their container without distortion"
  artifacts:
    - path: "packages/web/lib/components/FeedCard.tsx"
      provides: "Feed card with top-anchored image positioning"
      contains: "object-top"
  key_links:
    - from: "packages/web/lib/components/FeedCard.tsx"
      to: "img element className"
      via: "object-top positioning"
      pattern: "object-cover object-top"
---

<objective>
Fix feed card images cropping the top portion of images.

Purpose: Feed cards currently use `object-cover` with default center positioning, which crops equally from top and bottom. For fashion/celebrity content, the top of the image (faces, heads) is the most important part and should be preserved.

Output: Feed card images anchored from the top so faces and heads are always visible.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/FeedCard.tsx
@packages/web/lib/components/VerticalFeed.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add object-top positioning to FeedCard image</name>
  <files>packages/web/lib/components/FeedCard.tsx</files>
  <action>
In `packages/web/lib/components/FeedCard.tsx`, on line 190, add `object-top` to the img element's className.

Current (line 190):
```
className={`h-full w-full object-cover transition-opacity duration-200 ease-out ${
```

Change to:
```
className={`h-full w-full object-cover object-top transition-opacity duration-200 ease-out ${
```

This changes the CSS `object-position` from the default `center center` to `top center`, so when `object-cover` crops the image to fit the 4:5 aspect ratio container, it preserves the top of the image (faces, heads) and crops from the bottom instead.

Do NOT change:
- The aspect ratio (`aspect-[4/5]`) on the container div -- this is correct for Instagram-style cards
- The `object-cover` class -- this is needed to fill the container without distortion
- Any other classes or behavior on the img element
  </action>
  <verify>
1. Run `yarn --cwd packages/web build` to confirm no build errors
2. Visual check: Open http://localhost:3000/feed and confirm images show their top portion (faces visible) rather than cropping the top
  </verify>
  <done>Feed card images anchor from the top, preserving faces and heads. Images still fill the 4:5 container without distortion via object-cover.</done>
</task>

</tasks>

<verification>
- `yarn --cwd packages/web build` passes without errors
- Feed page at /feed shows card images with top portion preserved
- No visual distortion or layout shifts in feed cards
</verification>

<success_criteria>
- Feed card images show faces/heads (top of image) instead of cropping them
- Images still fill the 4:5 aspect ratio container cleanly via object-cover
- No regressions in feed card layout, skeleton, or animations
</success_criteria>

<output>
After completion, create `.planning/quick/031-fix-feed-card-image-top-crop/031-SUMMARY.md`
</output>
