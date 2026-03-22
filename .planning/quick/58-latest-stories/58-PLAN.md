---
phase: quick-58
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/page.tsx
  - packages/web/lib/components/main/DynamicHomeFeed.tsx
  - packages/web/lib/components/main/index.ts
  - packages/web/lib/components/main/LatestStoriesSection.tsx
autonomous: true
requirements: [QUICK-58]
must_haves:
  truths:
    - "Main page no longer shows Latest Stories section"
    - "Main page shows DomeGallery in place of Latest Stories"
    - "DomeGallery renders with autoRotate, grayscale, and dark overlay matching #050505 theme"
  artifacts:
    - path: "packages/web/lib/components/main/DynamicHomeFeed.tsx"
      provides: "dome-gallery section rendering"
      contains: "DomeGallery"
    - path: "packages/web/app/page.tsx"
      provides: "dome-gallery in sections array"
      contains: "dome-gallery"
  key_links:
    - from: "packages/web/lib/components/main/DynamicHomeFeed.tsx"
      to: "packages/web/lib/components/dome/DomeGallery"
      via: "import and render in switch case"
      pattern: "dome-gallery"
---

<objective>
Replace the Latest Stories section on the main page with the existing DomeGallery component.

Purpose: User wants the 3D dome gallery experience instead of a flat card grid.
Output: Main page renders DomeGallery where LatestStoriesSection used to be.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/dome/DomeGallery.tsx
@packages/web/lib/components/main/DynamicHomeFeed.tsx
@packages/web/app/page.tsx
@packages/web/lib/components/main/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace latest-stories with dome-gallery in sections and renderer</name>
  <files>
    packages/web/app/page.tsx,
    packages/web/lib/components/main/DynamicHomeFeed.tsx,
    packages/web/lib/components/main/index.ts,
    packages/web/lib/components/main/LatestStoriesSection.tsx
  </files>
  <action>
    1. In `packages/web/app/page.tsx` (line ~237): Change `"latest-stories"` to `"dome-gallery"` in the newSections array.

    2. In `packages/web/lib/components/main/DynamicHomeFeed.tsx`:
       - Remove the `LatestStoriesSection` import (line 17).
       - Add import: `import DomeGallery from "@/lib/components/dome/DomeGallery";`
       - In `HomeSectionType` union: replace `"latest-stories"` with `"dome-gallery"` (line 39).
       - Replace the `case "latest-stories":` block (lines 284-295) with a `case "dome-gallery":` block that renders:
         ```tsx
         case "dome-gallery":
           return (
             <SectionWrapper key={type} layoutMode={layoutMode} className="!py-0">
               <div className="relative w-full h-[70vh] md:h-[80vh]">
                 <DomeGallery
                   autoRotate
                   grayscale
                   overlayBlurColor="#050505"
                 />
               </div>
             </SectionWrapper>
           );
         ```
         The height container (70vh mobile, 80vh desktop) gives the 3D sphere enough room. autoRotate + grayscale + #050505 overlay match the dark theme.

    3. In `packages/web/lib/components/main/index.ts`: Remove the `LatestStoriesSection` export line (line 25).

    4. Delete `packages/web/lib/components/main/LatestStoriesSection.tsx` — no longer referenced.

  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - "latest-stories" no longer exists anywhere in HomeSectionType, page.tsx sections array, or switch cases.
    - "dome-gallery" is in the sections array, HomeSectionType, and renders DomeGallery with autoRotate, grayscale, overlayBlurColor="#050505".
    - LatestStoriesSection.tsx is deleted and its export removed from index.ts.
    - TypeScript compiles without errors.
  </done>
</task>

</tasks>

<verification>
- `grep -r "latest-stories" packages/web/lib/components/main/ packages/web/app/page.tsx` returns no results
- `grep "dome-gallery" packages/web/lib/components/main/DynamicHomeFeed.tsx packages/web/app/page.tsx` shows both files reference dome-gallery
- `ls packages/web/lib/components/main/LatestStoriesSection.tsx` returns "No such file"
- TypeScript compiles cleanly
</verification>

<success_criteria>
Main page renders DomeGallery (3D sphere with auto-rotation, grayscale, dark overlay) where Latest Stories section previously appeared. No TypeScript errors. LatestStoriesSection fully removed.
</success_criteria>

<output>
After completion, create `.planning/quick/58-latest-stories/58-SUMMARY.md`
</output>
