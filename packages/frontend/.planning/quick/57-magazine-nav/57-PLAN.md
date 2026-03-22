---
phase: quick
plan: 57
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/main-renewal/SmartNav.tsx
  - packages/web/lib/components/ConditionalNav.tsx
  - packages/web/app/magazine/page.tsx
  - packages/web/app/magazine/personal/page.tsx
  - packages/web/app/magazine/DailyEditorialClient.tsx
  - packages/web/app/magazine/layout.tsx
  - packages/web/app/api/v1/post-magazines/[id]/route.ts
  - packages/web/lib/components/magazine/
  - packages/web/lib/stores/magazineStore.ts
  - packages/web/lib/components/collection/types.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Magazine nav item no longer appears in SmartNav"
    - "Navigating to /magazine returns 404"
    - "/magazine/personal route condition removed from ConditionalNav"
    - "Collection components still compile (no broken imports)"
  artifacts:
    - path: "packages/web/lib/components/main-renewal/SmartNav.tsx"
      provides: "NAV_ITEMS without Magazine entry"
    - path: "packages/web/lib/components/ConditionalNav.tsx"
      provides: "No magazine/personal path checks"
  key_links:
    - from: "collection components"
      to: "magazine types"
      via: "relocated MagazineIssue type"
      pattern: "import.*MagazineIssue"
---

<objective>
Remove all magazine navigation, routes, components, API route, and store from the codebase.

Purpose: Magazine feature is being removed from the product.
Output: Clean codebase with no magazine references in nav or routes; collection components remain functional with relocated types.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/main-renewal/SmartNav.tsx
@packages/web/lib/components/ConditionalNav.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove magazine nav entries and route conditions</name>
  <files>
    packages/web/lib/components/main-renewal/SmartNav.tsx
    packages/web/lib/components/ConditionalNav.tsx
  </files>
  <action>
    1. In SmartNav.tsx, remove `{ href: "/magazine", label: "Magazine" }` from the NAV_ITEMS array (line 24).

    2. In ConditionalNav.tsx:
       - Line 21: Remove `|| pathname === "/magazine/personal"` from the hide condition. Result: `if (pathname.startsWith("/admin")) {`
       - Line 57: Remove `pathname === "/magazine/personal"` from the MainContentWrapper condition. Result: `if (pathname.startsWith("/admin") || pathname === "/") {`

  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && grep -r "magazine" packages/web/lib/components/main-renewal/SmartNav.tsx packages/web/lib/components/ConditionalNav.tsx; echo "exit: $?"</automated>
  </verify>
  <done>No magazine references in SmartNav or ConditionalNav. Grep returns no matches.</done>
</task>

<task type="auto">
  <name>Task 2: Delete magazine routes, components, API, and store; relocate shared types</name>
  <files>
    packages/web/app/magazine/ (delete entire directory)
    packages/web/app/api/v1/post-magazines/ (delete entire directory)
    packages/web/lib/components/magazine/ (delete entire directory)
    packages/web/lib/stores/magazineStore.ts (delete)
    packages/web/lib/components/collection/types.ts (create - relocated types)
  </files>
  <action>
    IMPORTANT: Before deleting, relocate types that collection components depend on.

    1. Create `packages/web/lib/components/collection/types.ts` with the MagazineIssue type and its dependencies (ThemePalette, LayoutJSON, LayoutComponent, ComponentType, AnimationType, PersonalStatus) copied from `packages/web/lib/components/magazine/types.ts`.

    2. Update all collection component imports that reference `../magazine/types` to use `./types` instead. Files to update:
       - `packages/web/lib/components/collection/IssuePreviewCard.tsx`
       - `packages/web/lib/components/collection/BookshelfViewFallback.tsx`
       - `packages/web/lib/components/collection/BookshelfView.tsx`
       - `packages/web/lib/components/collection/MagazinePreviewModal.tsx`
       - `packages/web/lib/components/collection/IssueSpine.tsx`
       - `packages/web/lib/components/collection/ShelfRow.tsx`
       - `packages/web/lib/components/collection/studio/useSplineBridge.ts` (change `../../magazine/types` to `../types`)

    3. For collection components that import `useMagazineStore` from `@/lib/stores/magazineStore`:
       - `IssueDetailPanel.tsx`, `StudioHUD.tsx`, `EmptyStudio.tsx`, `studio/useSplineEvents.ts`, `studio/SplineStudio.tsx`
       - Check what store properties they use. If they only use issue selection state, create a minimal `packages/web/lib/components/collection/useCollectionStore.ts` with just those properties extracted. Otherwise, keep magazineStore.ts but rename it or note it as tech debt.
       - DECISION: Since this is a quick task and collection is a separate feature, keep `magazineStore.ts` alive but remove only the magazine-page-specific data (dailyEditorial, personalIssue mock imports). Keep issue selection state that collection uses. Remove the mock JSON imports that will be deleted with the magazine components directory -- replace with empty defaults.

    4. In magazineStore.ts: Remove imports from `../components/magazine/mock/*` and `../components/magazine/types`. Instead import types from `../components/collection/types`. Remove dailyEditorial and personalIssue state/actions. Keep only collection-related state (selectedIssue, issues list).

    5. Delete directories and files:
       - `rm -rf packages/web/app/magazine/`
       - `rm -rf packages/web/app/api/v1/post-magazines/`
       - `rm -rf packages/web/lib/components/magazine/`

    6. Check if `packages/web/lib/components/detail/ImageDetailContent.tsx` imports from `./magazine` (detail/magazine/ subdirectory). This is the DETAIL magazine subdirectory (not the main one being deleted), so leave it alone -- it is NOT affected.

    7. Run TypeScript check to verify no broken imports.

  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && yarn tsc --noEmit 2>&1 | head -50</automated>
  </verify>
  <done>
    - No magazine route directories exist (app/magazine/, app/api/v1/post-magazines/)
    - No magazine components directory exists (lib/components/magazine/)
    - Collection components compile without errors (types relocated)
    - magazineStore.ts still exists but only serves collection feature
    - TypeScript compiles clean
  </done>
</task>

</tasks>

<verification>
- `grep -r "\/magazine" packages/web/lib/components/main-renewal/SmartNav.tsx` returns nothing
- `ls packages/web/app/magazine/ 2>/dev/null` returns nothing
- `ls packages/web/lib/components/magazine/ 2>/dev/null` returns nothing
- `yarn tsc --noEmit` passes
</verification>

<success_criteria>

- Magazine removed from navigation
- All magazine route pages deleted
- Magazine API route deleted
- Magazine components directory deleted
- Collection feature still works (types relocated, store trimmed)
- TypeScript compiles without errors
  </success_criteria>

<output>
After completion, create `.planning/quick/57-magazine-nav/57-SUMMARY.md`
</output>
