---
phase: quick
plan: 260402-mym
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/explore/page.tsx
autonomous: true
requirements: ["GH-40"]
must_haves:
  truths:
    - "/explore page only shows posts that have an associated magazine (editorial posts)"
  artifacts:
    - path: "packages/web/app/explore/page.tsx"
      provides: "Server component passing hasMagazine={true} to ExploreClient"
      contains: "hasMagazine={true}"
  key_links:
    - from: "packages/web/app/explore/page.tsx"
      to: "packages/web/app/explore/ExploreClient.tsx"
      via: "hasMagazine prop"
      pattern: "hasMagazine=\\{true\\}"
---

<objective>
Pass `hasMagazine={true}` to ExploreClient on the /explore page so only editorial posts (posts with a magazine_id) are displayed.

Purpose: The explore page should only show curated editorial content, not all posts.
Output: Updated page.tsx with the prop passed through.
</objective>

<execution_context>
@$HOME/.claude-pers/get-shit-done/workflows/execute-plan.md
@$HOME/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/app/explore/page.tsx
@packages/web/app/explore/ExploreClient.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Pass hasMagazine={true} to ExploreClient</name>
  <files>packages/web/app/explore/page.tsx</files>
  <action>
    In `packages/web/app/explore/page.tsx`, change `<ExploreClient />` to `<ExploreClient hasMagazine={true} />`.

    ExploreClient already accepts `hasMagazine?: boolean` prop and passes it to useInfinitePosts which filters `.not("post_magazine_id", "is", null)`. No other changes needed.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-monorepo && grep -q 'hasMagazine={true}' packages/web/app/explore/page.tsx && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>ExploreClient receives hasMagazine={true}, /explore page only fetches posts with magazine_id</done>
</task>

</tasks>

<verification>
- `grep 'hasMagazine={true}' packages/web/app/explore/page.tsx` returns a match
- `cd packages/web && bunx tsc --noEmit --pretty` passes (type check)
</verification>

<success_criteria>
- /explore page passes hasMagazine={true} to ExploreClient
- TypeScript compiles without errors
- Only editorial posts (with magazine_id) appear on the explore page
</success_criteria>

<output>
After completion, create `.planning/quick/260402-mym-explore-editorial-post/260402-mym-SUMMARY.md`
</output>
