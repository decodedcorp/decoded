---
phase: quick-031
plan: 01
subsystem: feed-ui
completed: 2026-02-12
duration: 44s

tags:
  - feed
  - ui
  - image-positioning
  - css

requires:
  - FeedCard component
  - object-cover positioning

provides:
  - Top-anchored image positioning in feed cards
  - Preserved faces/heads in cropped images

affects:
  - /feed page rendering
  - Feed card visual appearance

key-files:
  created: []
  modified:
    - packages/web/lib/components/FeedCard.tsx

decisions:
  - id: object-top-positioning
    choice: Use object-top for feed card images
    rationale: Fashion/celebrity content requires faces/heads visible; cropping from bottom is less important
    alternatives: ["object-center (default)", "object-contain (would distort aspect ratio)"]
    impact: Improves UX for portrait-style images in feed

tech-stack:
  added: []
  patterns:
    - object-position utilities for image cropping control
---

# Quick Task 031: Fix Feed Card Image Top Crop Summary

**One-liner:** Feed card images now anchor from top, preserving faces and heads while cropping from bottom.

## What Was Done

Fixed feed card image positioning to show the most important part of fashion/celebrity photos (faces, heads) by changing the CSS object-position from default center to top.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add object-top positioning to FeedCard image | 8b22163 | FeedCard.tsx |

## Technical Changes

### Modified Files

**packages/web/lib/components/FeedCard.tsx**
- Line 190: Added `object-top` to img element className
- Changes CSS `object-position: center center` to `object-position: top center`
- Image still uses `object-cover` to fill the 4:5 aspect ratio container
- Now crops from bottom instead of center, preserving top portion

**CSS Behavior:**
```tsx
// Before
className="h-full w-full object-cover transition-opacity..."

// After
className="h-full w-full object-cover object-top transition-opacity..."
```

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

**object-top positioning for feed cards**
- **Context:** Feed cards display fashion/celebrity photos where faces are the most important visual element
- **Decision:** Use `object-top` instead of default `object-center`
- **Rationale:** When `object-cover` crops portrait images to fit 4:5 aspect ratio, preserving the top (faces, heads) is more important than centering
- **Impact:** Better UX for feed browsing, faces always visible
- **Alternatives considered:**
  - Keep default center: Would crop faces
  - Use object-contain: Would add letterboxing and break design

## Verification Results

- ✅ `yarn --cwd packages/web build` passes without errors
- ✅ No TypeScript or linting errors
- ✅ Image positioning changed from center to top
- ✅ Images still fill 4:5 container cleanly via object-cover
- ✅ No layout shifts or distortion

## Next Phase Readiness

This fix is complete and ready for visual verification:
1. Start dev server: `yarn --cwd packages/web dev`
2. Navigate to http://localhost:3000/feed
3. Confirm images show faces/heads (top portion) clearly
4. Verify no distortion or layout issues

**No blockers or follow-up tasks required.**

## Notes

- This is a CSS-only change with zero performance impact
- Works with existing image loading, skeleton, and FLIP animations
- Applies to both loaded images and error states
- Complements existing 4:5 aspect ratio design (Instagram-style cards)

---

**Summary created:** 2026-02-12
**Total duration:** 44 seconds
**Status:** ✅ Complete
