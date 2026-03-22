---
phase: quick-030
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/detail/ImageDetailModal.tsx
  - packages/web/lib/components/detail/PostDetailContent.tsx
  - packages/web/lib/design-system/hotspot.tsx
autonomous: true

must_haves:
  truths:
    - "Desktop sidebar drawer content does NOT scroll independently -- only the drawer's internal scrollable area scrolls"
    - "Floating left-side image displays fully without cropping or enlargement (object-contain, not object-cover)"
    - "Spot markers are visible on the floating left-side image at correct positions"
    - "Spot markers use the design system Hotspot component with brand-derived color"
  artifacts:
    - path: "packages/web/lib/components/detail/ImageDetailModal.tsx"
      provides: "Fixed sidebar layout, spots on floating image, proper image sizing"
    - path: "packages/web/lib/design-system/hotspot.tsx"
      provides: "Brand color support via style prop or colorOverride"
  key_links:
    - from: "ImageDetailModal.tsx"
      to: "Hotspot component"
      via: "import and render spots as Hotspot markers on left-side image"
      pattern: "Hotspot.*position"
---

<objective>
Fix the desktop sidebar (drawer) layout for post detail pages and add spot markers with brand color support on the floating left-side image.

Purpose: When viewing /posts/[id] via the intercepting route (modal drawer), the desktop experience has several issues: the sidebar scrolls when it shouldn't, the left-side image is cropped/enlarged, and spot markers are missing from the floating image. This task fixes all of these and introduces brand color to the design system Hotspot component.

Output: A polished desktop sidebar experience where the image is fully visible with spot markers, and the drawer sidebar is properly constrained.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/detail/ImageDetailModal.tsx
@packages/web/lib/components/detail/PostDetailContent.tsx
@packages/web/lib/design-system/hotspot.tsx
@packages/web/lib/supabase/types.ts (SpotRow, SolutionRow types)
@packages/web/lib/components/detail/DecodedItemsSection.tsx (extractBrand pattern)
@packages/web/lib/components/request/SpotMarker.tsx (existing spot marker reference)

Key context from quick-027:
- PostDetailContent already has object-contain for hero image + spot marker positioning logic
- Hero uses ResizeObserver + natural dimensions for pixel-based spot placement
- isModal prop controls conditional ScrollTrigger animations
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Desktop Sidebar Scroll and Left-Side Image Display</name>
  <files>
    packages/web/lib/components/detail/ImageDetailModal.tsx
  </files>
  <action>
Fix three issues in the ImageDetailModal desktop layout:

**1. Sidebar scroll containment:**
The drawer `<aside>` element should not allow its overall frame to move. The internal `scrollContainerRef` div already has `overflow-y-auto`, which is correct. Verify the drawer itself has `overflow-hidden` on the aside level (currently `overflow-visible` which can cause issues). Change the aside's class from `overflow-visible` to `overflow-hidden` to prevent content from visually escaping the drawer bounds.

**2. Left-side floating image sizing:**
Currently the floating image uses `object-cover` (line ~557: `className="w-full h-full object-cover"`), which crops the image. Change to `object-contain` with a dark background so the full image is visible without clipping or enlargement.

In the floating image container div (`leftImageContainerRef`), update:
- Add `bg-black rounded-lg overflow-hidden` classes
- Change the inner `<img>` from `object-cover` to `object-contain`

Also adjust the target sizing calculation in the GSAP animation (the `useEffect` around line 416) to be more proportional:
- Instead of `targetHeight = Math.min(viewportHeight * 0.8, targetWidth * 1.5)`, calculate based on image aspect ratio if available. Since we don't have aspect ratio at mount time, keep a reasonable max: `targetHeight = viewportHeight * 0.75` and `targetWidth = leftSpace * 0.7` with a max of 500px. The object-contain will handle the actual fit.

**3. Add spot markers on floating image:**
After the `<img>` tag inside the floating image container, render spot markers from `postDetail.spots`. Each spot has `position_left` and `position_top` as percentage strings.

Import the Hotspot component from `@/lib/design-system`. For each spot, render:
```tsx
<Hotspot
  variant="numbered"
  number={index + 1}
  position={{
    x: parseFloat(spot.position_left),
    y: parseFloat(spot.position_top),
  }}
  label={matchingSolution?.title || `Spot ${index + 1}`}
  onClick={() => {/* future: scroll to decoded items */}}
/>
```

IMPORTANT: The spots need to be positioned relative to the CONTAINED image area, not the container. Since the floating image uses object-contain, you need to calculate the actual displayed image rect (same pattern as PostDetailContent). Add state for naturalSize and containerSize with the same ResizeObserver + onLoad pattern used in PostDetailContent (lines 99-136). Then compute `getContainedImageRect()` and position spots using pixel offsets from that rect rather than raw percentages.

Wrap the spots in a container div with `absolute inset-0 pointer-events-none` and use pixel-based left/top positioning (with `pointer-events-auto` on each Hotspot).

To wire this up:
- Import `Hotspot` from `@/lib/design-system`
- Import `useState, useEffect` (already imported)
- Add `naturalSize` and `containerSize` state
- Add ResizeObserver on the leftImageContainerRef
- Add `onLoad` handler on the floating `<img>` for natural dimensions
- Add `getContainedImageRect()` helper (copy pattern from PostDetailContent)
- Render Hotspot markers after the `<img>` inside the floating container

Find the matching solution for each spot from `postDetail.solutions` using `solutions.find(s => s.spot_id === spot.id)` to get the brand name for the label.
  </action>
  <verify>
    Run `cd /Users/kiyeol/development/decoded/decoded-app && yarn build` -- should compile without errors.
    Visual check: Navigate to any post detail via grid click (intercepting route). On desktop:
    - The left-side image should show the full image without cropping (letterboxed in dark background)
    - Spot markers (numbered circles) should appear at correct positions on the image
    - The right-side drawer content should scroll internally, the drawer frame itself should not scroll
  </verify>
  <done>
    Desktop sidebar drawer is scroll-contained, floating image shows full content with object-contain, numbered spot markers are visible at correct positions on the floating image.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add Brand Color Support to Hotspot Component</name>
  <files>
    packages/web/lib/design-system/hotspot.tsx
    packages/web/lib/components/detail/ImageDetailModal.tsx
  </files>
  <action>
Extend the design system Hotspot component to accept an optional brand color, then use it in ImageDetailModal.

**1. Update Hotspot component (hotspot.tsx):**

Add a `color` prop to `HotspotProps`:
```typescript
/** Optional brand color override (CSS color value, e.g., '#FF0000', 'rgb(...)') */
color?: string;
```

When `color` is provided, apply it as the background color via the `style` prop, overriding the default `bg-primary` from CVA variants. Do this by:
- Adding `backgroundColor: color` to the existing style object when color is truthy
- The text color should auto-contrast: if a color is provided, keep `text-primary-foreground` (white works for most brand colors)

Update the component render:
```tsx
style={{
  left: `${clampedX}%`,
  top: `${clampedY}%`,
  transform: "translate(-50%, -50%)",
  ...(color ? { backgroundColor: color } : {}),
  ...style,
}}
```

This preserves backward compatibility -- existing usage without `color` prop works identically.

**2. Use brand color in ImageDetailModal:**

When rendering spot markers on the floating image, derive a brand color from the solution's keywords (first keyword as brand name). Since we don't have actual brand color data in the DB, use a deterministic hash-to-color function:

Add a small helper in ImageDetailModal (or inline):
```typescript
function brandToColor(brand: string): string {
  // Simple hash to generate a consistent hue for each brand
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = brand.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
```

Then pass the color to each Hotspot:
```tsx
const brand = extractBrand(matchingSolution);
<Hotspot
  variant="numbered"
  number={index + 1}
  position={{ x: ..., y: ... }}
  color={brandToColor(brand)}
  label={`${brand}: ${matchingSolution?.title || 'Item'}`}
/>
```

Add the `extractBrand` helper (copy from DecodedItemsSection.tsx -- it's a small pure function):
```typescript
function extractBrand(solution: SolutionRow | undefined): string {
  if (!solution) return "Unknown";
  if (solution.keywords && solution.keywords.length > 0) {
    return solution.keywords[0].toUpperCase();
  }
  if (solution.title) {
    const firstWord = solution.title.split(" ")[0];
    if (firstWord && firstWord.length > 1) return firstWord.toUpperCase();
  }
  return "BRAND";
}
```

NOTE: Do NOT modify the PostDetailContent hero spot markers -- those use a different inline style approach (emerald-500 circles). This task only affects the floating image in the modal and the Hotspot design system component.
  </action>
  <verify>
    Run `cd /Users/kiyeol/development/decoded/decoded-app && yarn build` -- should compile without errors.
    Visual check: Open a post with spots via intercepting route. Spot markers on the floating image should show brand-specific colors (different brands = different hues). The numbered hotspot should be clearly visible with the colored background.
  </verify>
  <done>
    Hotspot design system component supports optional brand color override. ImageDetailModal renders spot markers with deterministic brand-derived colors on the floating left-side image.
  </done>
</task>

</tasks>

<verification>
1. `yarn build` passes without TypeScript or build errors
2. Desktop: Open post detail via grid click -- floating image shows full content (no crop)
3. Desktop: Spot markers appear on floating image at correct positions
4. Desktop: Each spot marker has a brand-derived color
5. Desktop: Drawer content scrolls internally, drawer frame stays fixed
6. Mobile: No regressions -- modal drawer still works with swipe gestures
7. Existing Hotspot usage (without color prop) still works unchanged
</verification>

<success_criteria>
- Desktop sidebar scroll is contained within the drawer
- Floating left-side image uses object-contain (full image visible, no crop)
- Spot markers render on floating image using design system Hotspot component
- Brand color applied to each spot marker via deterministic hash
- No build errors, no mobile regressions
</success_criteria>

<output>
After completion, create `.planning/quick/030-fix-desktop-sidebar-image-spot-brand/030-SUMMARY.md`
</output>
