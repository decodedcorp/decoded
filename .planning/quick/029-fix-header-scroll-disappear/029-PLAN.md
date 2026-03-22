---
phase: quick-029
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/design-system/desktop-header.tsx
  - packages/web/lib/design-system/mobile-header.tsx
  - packages/web/lib/components/main/DecodedPickSection.tsx
autonomous: true

must_haves:
  truths:
    - "Header remains visible and clickable at all scroll positions on all pages"
    - "DecodedPickSection still overlaps HeroSection with its rounded-top visual effect"
    - "No visual regression on the home page section stacking"
  artifacts:
    - path: "packages/web/lib/design-system/desktop-header.tsx"
      provides: "Desktop header with correct z-index above content sections"
      contains: "z-40"
    - path: "packages/web/lib/design-system/mobile-header.tsx"
      provides: "Mobile header with correct z-index above content sections"
      contains: "z-40"
    - path: "packages/web/lib/components/main/DecodedPickSection.tsx"
      provides: "DecodedPickSection with z-index below header but above hero"
      contains: "z-20"
  key_links:
    - from: "packages/web/lib/design-system/desktop-header.tsx"
      to: "packages/web/lib/design-system/tokens.ts"
      via: "z-index hierarchy: header z-40 > content z-20"
      pattern: "z-40"
---

<objective>
Fix header disappearing behind content sections when scrolling.

Purpose: The DesktopHeader and MobileHeader both use `z-30` while the DecodedPickSection on the home page also uses `relative z-30`. Since DecodedPickSection comes later in the DOM and creates a stacking context at the same z-level, it paints on top of the fixed headers when scrolled into view. The fix is to raise the header z-index above all content sections.

Output: Headers that remain visible and interactive at all scroll positions.
</objective>

<context>
Root cause analysis:
- `DesktopHeader` CVA base: `"fixed top-0 left-0 right-0 z-30 ..."` (line 22 of desktop-header.tsx)
- `MobileHeader` CVA base: `"fixed top-0 left-0 right-0 z-30 ..."` (line 19 of mobile-header.tsx)
- `DecodedPickSection` section: `"... relative z-30 ..."` (line 83 of DecodedPickSection.tsx)
- z-index token system in tokens.ts: `header: 30, sidebar: 40`
- DecodedPickSection needs z > HeroSection (z-20) for the visual overlap, but z < header (z-30)

Fix strategy:
1. Raise headers from z-30 to z-40 (swap with sidebar level, since sidebar is deprecated in favor of headers)
2. Lower DecodedPickSection from z-30 to z-20 (still above HeroSection content at z-10/z-20 relative to its own stacking context, and the section itself just needs to be above the hero's background)
3. Update tokens.ts `header` value from 30 to 40 for documentation consistency (optional, but headers already use Tailwind classes directly)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix z-index hierarchy for headers and overlapping sections</name>
  <files>
    packages/web/lib/design-system/desktop-header.tsx
    packages/web/lib/design-system/mobile-header.tsx
    packages/web/lib/components/main/DecodedPickSection.tsx
  </files>
  <action>
1. In `packages/web/lib/design-system/desktop-header.tsx` line 22, change the CVA base string:
   - FROM: `"fixed top-0 left-0 right-0 z-30 w-full backdrop-blur-md transition-all hidden md:flex"`
   - TO: `"fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md transition-all hidden md:flex"`

2. In `packages/web/lib/design-system/mobile-header.tsx` line 19, change the CVA base string:
   - FROM: `"fixed top-0 left-0 right-0 z-30 w-full backdrop-blur-md md:hidden"`
   - TO: `"fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md md:hidden"`

3. In `packages/web/lib/components/main/DecodedPickSection.tsx` line 83, lower the section z-index:
   - FROM: `"bg-black text-white py-24 md:py-40 px-6 md:px-12 rounded-t-[60px] md:rounded-t-[100px] -mt-20 relative z-30 shadow-[0_-30px_100px_rgba(0,0,0,0.8)] border-t border-white/5"`
   - TO: `"bg-black text-white py-24 md:py-40 px-6 md:px-12 rounded-t-[60px] md:rounded-t-[100px] -mt-20 relative z-20 shadow-[0_-30px_100px_rgba(0,0,0,0.8)] border-t border-white/5"`

Why z-40 for headers: The sidebar (z-40 in tokens) is deprecated in this app (desktop uses header now), so headers taking z-40 is appropriate. This gives clear separation: content sections at z-20, headers at z-40, modals at z-50+.

Why z-20 for DecodedPickSection: It only needs to be above the HeroSection background (z-0 to z-20 relative to hero internals). The section's `relative` + `-mt-20` creates the visual overlap effect, and z-20 is sufficient for this overlap to render correctly above the hero.
  </action>
  <verify>
1. Run `yarn build` in packages/web to confirm no build errors
2. Visual check: scroll the home page - header should remain visible when DecodedPickSection scrolls up
3. Visual check: DecodedPickSection should still overlap HeroSection with rounded top corners
4. Visual check: navigate to other pages (feed, explore) - headers should remain visible on scroll
  </verify>
  <done>
- Headers (both desktop and mobile) remain visible and clickable at ALL scroll positions
- DecodedPickSection rounded-top overlap on HeroSection still works visually
- No z-index regressions on modals, dropdowns, or other overlays
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify no other content sections conflict with header z-index</name>
  <files>
    packages/web/lib/design-system/tokens.ts
  </files>
  <action>
After Task 1 changes, do a codebase-wide grep for any other elements using `z-30` or higher z-index with `relative` or `fixed` positioning in main content areas that could conflict with the header:

```bash
grep -rn "relative z-[3-9]0\|relative z-\[3\|fixed.*z-[3-9]0" packages/web/lib/components/main/ packages/web/app/
```

If any conflicts found, lower them below z-40.

Also update `packages/web/lib/design-system/tokens.ts` line 255 to reflect the actual z-index used:
- FROM: `header: 30,`
- TO: `header: 40,`

This keeps the token documentation consistent with the actual Tailwind classes used.
  </action>
  <verify>
1. Grep confirms no content sections use z-40 or higher (only header, modal, toast elements should)
2. `yarn build` passes with no errors
3. Tokens file is consistent with actual CSS classes
  </verify>
  <done>
- No remaining z-index conflicts between content sections and headers
- tokens.ts zIndex.header value matches actual Tailwind class (z-40)
  </done>
</task>

</tasks>

<verification>
1. `cd packages/web && yarn build` - builds without errors
2. `yarn dev` - scroll home page top to bottom, header always visible
3. Navigate to /feed, /explore, /images - headers stay fixed on scroll
4. Home page: DecodedPickSection rounded-top overlap on hero still renders correctly
5. Desktop header dropdown menu still opens above content (z-50 on dropdown)
</verification>

<success_criteria>
- Header (desktop and mobile) never disappears behind any content section during scroll
- DecodedPickSection visual overlap effect on HeroSection preserved
- No z-index regressions on modals, dropdowns, toasts, or tooltips
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/029-fix-header-scroll-disappear/029-SUMMARY.md`
</output>
