---
phase: quick-046
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/collection/IssueSpine.tsx
  - packages/web/lib/components/collection/BookshelfView.tsx
  - packages/web/lib/components/collection/ShelfRow.tsx
  - packages/web/lib/components/collection/IssuePreviewCard.tsx
  - packages/web/lib/components/collection/CollectionClient.tsx
autonomous: true
requirements: [SCR-COL-01]

must_haves:
  truths:
    - "Bookshelf has stronger isometric perspective (user looks down at shelf)"
    - "Spines show CSS texture overlays (matte/fabric/leather feel per issue)"
    - "Vol numbering uses #eafd67 neon accent with glow effect"
    - "Spine shows issue title and theme keyword vertically"
    - "Hover pops spine out AND flips cover open to reveal preview content"
  artifacts:
    - path: "packages/web/lib/components/collection/IssueSpine.tsx"
      provides: "Textured spine with neon numbering and pop+flip GSAP animation"
    - path: "packages/web/lib/components/collection/BookshelfView.tsx"
      provides: "Enhanced isometric perspective container"
    - path: "packages/web/lib/components/collection/IssuePreviewCard.tsx"
      provides: "Preview card integrated into flip animation as opened-cover content"
  key_links:
    - from: "IssueSpine.tsx"
      to: "IssuePreviewCard.tsx"
      via: "GSAP timeline: spine pop-out triggers cover flip revealing preview"
      pattern: "gsap\\.timeline.*rotateY"
    - from: "BookshelfView.tsx"
      to: "ShelfRow.tsx"
      via: "Enhanced perspective passed to shelf rows"
      pattern: "perspective.*rotateX"
---

<objective>
Redesign the collection bookshelf with isometric perspective, textured spines with neon #eafd67 numbering, and a dramatic pop-and-flip interaction that reveals issue preview content.

Purpose: Transform the plain bookshelf into a collectible, tactile experience with strong brand identity.
Output: Visually upgraded collection page with CSS textures, neon accents, and GSAP flip interactions.
</objective>

<execution_context>
@/Users/kiyeol/.claude-work/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-work/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/collection/IssueSpine.tsx
@packages/web/lib/components/collection/BookshelfView.tsx
@packages/web/lib/components/collection/ShelfRow.tsx
@packages/web/lib/components/collection/IssuePreviewCard.tsx
@packages/web/lib/components/collection/CollectionClient.tsx
@packages/web/lib/components/magazine/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enhanced Isometric Container + Shelf Styling</name>
  <files>packages/web/lib/components/collection/BookshelfView.tsx, packages/web/lib/components/collection/ShelfRow.tsx, packages/web/lib/components/collection/CollectionClient.tsx</files>
  <action>
**BookshelfView.tsx:**
- Increase perspective to `1600px` desktop / `1000px` mobile for a more dramatic look-down feel
- Add `rotateX(8deg)` to the inner `max-w-3xl` container to tilt the bookshelf plane toward the viewer (isometric look-down)
- Add subtle `translateY(-20px)` to lift the shelf slightly
- Keep the gradient background but deepen it: `from-[#0d0d0d] to-mag-bg`

**ShelfRow.tsx:**
- Change shelf bottom border to a thicker, more 3D look: use a pseudo-element approach via an extra div at bottom with gradient from `#3a3530` to `#1e1c18` (wooden shelf edge feel)
- Add `perspective: inherit` and `transformStyle: preserve-3d` to the row container
- Increase gap slightly: `gap-3 md:gap-5` (tighter than current for bookshelf feel)

**CollectionClient.tsx:**
- Update LoadingSkeleton spine placeholders to match new spine dimensions (same sizes, but add the neon accent stripe: a thin `#eafd67` line at bottom of each skeleton spine via `border-b-2 border-[#eafd67]/20`)
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && yarn build 2>&1 | tail -5</automated>
  </verify>
  <done>Bookshelf container has stronger isometric perspective with rotateX tilt. Shelf rows have 3D wooden edge. Skeleton updated.</done>
</task>

<task type="auto">
  <name>Task 2: Textured Spines with Neon Numbering + Pop-and-Flip Interaction</name>
  <files>packages/web/lib/components/collection/IssueSpine.tsx, packages/web/lib/components/collection/IssuePreviewCard.tsx</files>
  <action>
**IssueSpine.tsx - Major rewrite:**

1. **CSS Texture overlays** (no images, pure CSS):
   - Create 3 texture variants based on `issue.issue_number % 3`:
     - `matte`: Subtle noise via CSS `background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)` layered on accent color
     - `fabric`: Cross-hatch pattern via two overlapping `repeating-linear-gradient` at 45deg and -45deg with very subtle white lines (`rgba(255,255,255,0.03)`)
     - `leather`: Vertical grain via `repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)` plus a slightly darker base
   - Apply as `backgroundImage` layered on top of `issue.theme_palette.accent` background

2. **Neon #eafd67 numbering:**
   - Override Vol.XX color to `#eafd67` regardless of issue palette
   - Increase font size: `text-sm md:text-base font-black tracking-widest`
   - Add CSS text-shadow glow: `0 0 8px rgba(234,253,103,0.6), 0 0 20px rgba(234,253,103,0.3)`
   - Keep `writingMode: vertical-rl`

3. **Show title + theme keyword on spine:**
   - Below the Vol number, show `issue.title` truncated to ~20 chars in `text-[7px] md:text-[8px]` vertically, color `issue.theme_palette.primary` with 80% opacity
   - At bottom of spine, show first `theme_keyword` (if available) in `text-[6px] md:text-[7px]` uppercase, color `#eafd67` at 50% opacity
   - Date label removed from spine (it's in the preview card)

4. **Pop + Flip GSAP animation:**
   - Replace the simple pop-out with a GSAP timeline:
   - Create a wrapper div with `transformStyle: preserve-3d` that contains TWO faces:
     - **Front face** (the spine): positioned normally
     - **Back face / cover panel**: a div positioned with `rotateY(180deg)` and `backface-visibility: hidden`, sized `w-[180px] md:w-[200px]` same height as spine, positioned `left: 0` overlapping the spine
   - On `isActive=true`, timeline:
     1. Pop spine out: `z: 80, rotateY: -5deg` (0.3s, `back.out(1.7)`)
     2. Simultaneously, animate the cover panel from `rotateY(-90deg)` (hidden, edge-on) to `rotateY(0deg)` (fully open, facing viewer) with `duration: 0.4, ease: "power3.out", delay: 0.15`
     3. The cover panel contains the IssuePreviewCard content (inline, not as separate positioned element)
   - On `isActive=false`, reverse: cover panel rotates back to `-90deg`, spine retracts

5. **Restructure the component:**
   - The IssuePreviewCard is no longer absolutely positioned outside the spine
   - Instead, the "cover panel" IS the preview content, attached to the spine as a book cover opening
   - The cover panel div has: dark background `bg-[#111]`, border-left `border-l border-[#eafd67]/20`, rounded-r-lg
   - Inside the cover panel, render: cover image (if available, h-[100px] object-cover), title, vol label, theme keywords, and Open/Delete buttons - reuse the layout logic from IssuePreviewCard

**IssuePreviewCard.tsx:**
- Refactor to accept an optional `inline` prop (boolean, default false)
- When `inline=true`: remove absolute positioning, remove the `flipLeft` logic, remove outer wrapper positioning classes, just render the content (image + metadata + buttons) as a flow element
- When `inline=false`: keep current behavior for any other consumers (backward compat)
- IssueSpine will use `<IssuePreviewCard issue={issue} inline onOpen={...} onDelete={...} />`

**Animation refs:**
- Use `useRef` for the cover panel div
- Create the GSAP timeline in a `useEffect` watching `isActive`
- Kill previous timeline on cleanup to prevent animation conflicts
- Add `will-change: transform` to both spine and cover panel for GPU acceleration
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && yarn build 2>&1 | tail -5</automated>
  </verify>
  <done>Spines show CSS texture variants per issue. Vol numbering is neon #eafd67 with glow. Title and theme keyword visible on spine. Hover triggers pop-out + cover flip revealing preview content as a book opening. Animation is smooth with GSAP timeline. IssuePreviewCard supports inline mode.</done>
</task>

</tasks>

<verification>
1. `yarn build` succeeds with no TypeScript or lint errors
2. Visual check: navigate to `/collection` page
   - Bookshelf has isometric tilt (look-down perspective)
   - Spines show texture variation (matte/fabric/leather)
   - Vol numbers are neon yellow-green (#eafd67) with glow
   - Spine text includes title and theme keyword
   - Hover/click on spine: it pops out and a cover panel flips open showing preview
   - Deselecting: cover closes and spine retracts smoothly
   - Mobile: works at smaller viewport, touch to activate
</verification>

<success_criteria>
- Bookshelf container has enhanced isometric perspective with rotateX tilt
- All spines show one of 3 CSS texture overlays (no images used)
- Vol numbering uses #eafd67 neon accent with text-shadow glow on every spine
- Spine displays title text and theme keyword vertically
- Pop+flip animation works: spine pops out, cover panel flips open to reveal preview
- Animation reverses cleanly on deselect
- Responsive: works on mobile and desktop
- Build passes with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/046-isometric-bookshelf/046-SUMMARY.md`
</output>
