---
phase: quick
plan: 028
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/page.tsx
  - packages/web/lib/components/main/HomeAnimatedContent.tsx
  - packages/web/lib/components/main/index.ts
  - packages/web/lib/components/main/BadgeGridSection.tsx
autonomous: true

must_haves:
  truths:
    - "Home page no longer renders the Achievements / Challenge & Achieve section"
    - "Home page loads without errors after badge removal"
    - "No dead imports or unused variables remain in touched files"
  artifacts:
    - path: "packages/web/app/page.tsx"
      provides: "Home page without badge data fetching"
    - path: "packages/web/lib/components/main/HomeAnimatedContent.tsx"
      provides: "Animated content without BadgeGridSection"
    - path: "packages/web/lib/components/main/index.ts"
      provides: "Barrel export without BadgeGridSection"
  key_links: []
---

<objective>
Remove the "Achievements / Challenge & Achieve" section from the main home page.

Purpose: Clean up unused section from the home page to simplify the layout.
Output: Home page renders without the badge grid section; BadgeGridSection.tsx deleted; all related imports and data fetching removed.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/app/page.tsx
@packages/web/lib/components/main/HomeAnimatedContent.tsx
@packages/web/lib/components/main/index.ts
@packages/web/lib/components/main/BadgeGridSection.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove BadgeGridSection and all badge references</name>
  <files>
    packages/web/app/page.tsx
    packages/web/lib/components/main/HomeAnimatedContent.tsx
    packages/web/lib/components/main/index.ts
    packages/web/lib/components/main/BadgeGridSection.tsx
  </files>
  <action>
    1. **Delete** `packages/web/lib/components/main/BadgeGridSection.tsx` entirely.

    2. **Edit `packages/web/lib/components/main/index.ts`:**
       - Remove line 12: `export { BadgeGridSection } from "./BadgeGridSection";`

    3. **Edit `packages/web/lib/components/main/HomeAnimatedContent.tsx`:**
       - Remove the `import type { BadgeRow } from "@/lib/supabase/types";` import (line 4)
       - Remove `BadgeGridSection` from the barrel import on line 15
       - Remove `badges: BadgeRow[];` from the `HomeAnimatedContentProps` interface (line 37)
       - Remove `badges` from the destructured props (line 51)
       - Remove the entire Achievement Badges motion.div block (lines 110-118):
         ```
         {/* Achievement Badges Section */}
         <motion.div ...>
           <BadgeGridSection badges={badges} />
         </motion.div>
         ```

    4. **Edit `packages/web/app/page.tsx`:**
       - Remove `fetchAllBadgesServer` from the import on line 13
       - Remove `badgesData,` from the destructured Promise.all result (line 36)
       - Remove `fetchAllBadgesServer(),` from the Promise.all array (line 48)
       - Remove `badges={badgesData}` prop from the HomeAnimatedContent JSX (line 90)
  </action>
  <verify>
    Run `cd /Users/kiyeol/development/decoded/decoded-app && yarn lint` to confirm no lint errors.
    Run `cd /Users/kiyeol/development/decoded/decoded-app && yarn build` to confirm successful build with no type errors or missing imports.
    Confirm BadgeGridSection.tsx no longer exists: `ls packages/web/lib/components/main/BadgeGridSection.tsx` should fail.
  </verify>
  <done>
    - BadgeGridSection.tsx is deleted
    - No references to BadgeGridSection, BadgeRow (in main components), fetchAllBadgesServer, or badgesData remain in page.tsx, HomeAnimatedContent.tsx, or index.ts
    - Build passes cleanly
    - Lint passes cleanly
  </done>
</task>

</tasks>

<verification>
- `yarn build` completes without errors
- `yarn lint` completes without errors
- Home page loads at localhost:3000 without the Achievements section
- No grep hits for `BadgeGridSection` in the codebase (except possibly git history)
</verification>

<success_criteria>
- The Achievements / Challenge & Achieve section is completely removed from the home page
- No dead code, unused imports, or type errors remain
- Build and lint pass
</success_criteria>

<output>
After completion, create `.planning/quick/028-remove-achievements-challenge-achieve-ma/028-SUMMARY.md`
</output>
