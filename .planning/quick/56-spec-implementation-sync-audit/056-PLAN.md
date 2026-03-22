---
phase: quick-056
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - specs/_shared/component-registry.md
  - specs/_shared/api-contracts.md
  - specs/_shared/store-map.md
  - specs/_shared/data-models.md
  - specs/screens/discovery/SCR-DISC-01-home.md
  - specs/screens/discovery/SCR-DISC-02-search.md
  - specs/screens/discovery/SCR-DISC-03-feed.md
  - specs/screens/discovery/SCR-DISC-04-explore.md
  - specs/screens/detail/SCR-VIEW-01-post-detail.md
  - specs/screens/detail/SCR-VIEW-02-spot-hotspot.md
  - specs/screens/detail/SCR-VIEW-03-item-solution.md
  - specs/screens/detail/SCR-VIEW-04-related-content.md
  - specs/screens/creation/SCR-CREA-01-upload.md
  - specs/screens/creation/SCR-CREA-02-ai-detect.md
  - specs/screens/creation/SCR-CREA-03-edit-solution.md
  - specs/screens/user/SCR-USER-01-login.md
  - specs/screens/user/SCR-USER-02-profile.md
  - specs/screens/user/SCR-USER-03-earnings.md
  - specs/screens/user/SCR-USER-04-sns-connect.md
  - specs/README.md
autonomous: true
requirements: [QUICK-056]

must_haves:
  truths:
    - "Every file path referenced in spec documents exists on the filesystem"
    - "Component registry matches actual design-system exports"
    - "API contracts match actual route handler files"
    - "Store map reflects current store implementations"
    - "Screen spec component maps reference correct file paths"
  artifacts:
    - path: "specs/_shared/component-registry.md"
      provides: "Verified component catalog with correct file paths"
    - path: "specs/_shared/api-contracts.md"
      provides: "Verified API endpoint index with correct handler paths"
    - path: "specs/_shared/store-map.md"
      provides: "Verified store inventory with correct file paths and state shapes"
  key_links:
    - from: "specs/_shared/component-registry.md"
      to: "packages/web/lib/design-system/*.tsx"
      via: "file path references"
      pattern: "packages/web/lib/design-system/"
    - from: "specs/_shared/api-contracts.md"
      to: "packages/web/app/api/v1/"
      via: "handler file references"
      pattern: "app/api/v1/"
---

<objective>
Audit all spec documents against the actual codebase implementation and fix any drift.

Purpose: Specs are used as AI agent context injection — stale paths and outdated information cause implementation errors. After 55+ quick tasks and multiple milestones, drift has accumulated.
Output: All spec shared docs (component-registry, api-contracts, store-map, data-models) and screen specs updated with verified file paths and accurate status.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@specs/README.md
@specs/_shared/component-registry.md
@specs/_shared/api-contracts.md
@specs/_shared/store-map.md
@specs/_shared/data-models.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit shared spec documents against filesystem</name>
  <files>specs/_shared/component-registry.md, specs/_shared/api-contracts.md, specs/_shared/store-map.md, specs/_shared/data-models.md</files>
  <action>
Systematically verify every file path referenced in the four shared spec documents against the actual filesystem. For each document:

**component-registry.md:**
- For each component in the Summary Table, verify the file exists at `packages/web/lib/design-system/{file}`
- Check the barrel export in `packages/web/lib/design-system/index.ts` — confirm all listed components are actually exported
- Identify any new design-system components that exist on disk but are missing from the registry
- Verify prop tables match actual component signatures (spot-check 5-10 components)

**api-contracts.md:**
- For each endpoint in the Endpoint Index, verify the handler file exists at `packages/web/app/api/v1/{path}`
- Check for new API routes that exist on disk but are missing from contracts
- Verify client function references in `packages/web/lib/api/` match

**store-map.md:**
- For each store, verify the file exists at the listed path
- Check if PROPOSED stores have been implemented or should remain PROPOSED
- Verify state shapes match actual store implementations (spot-check authStore, profileStore)
- Check for new stores that exist on disk

**data-models.md:**
- Verify source file paths exist (especially `packages/web/lib/api/types.ts`, `packages/web/lib/supabase/types.ts`)
- Check that referenced type names exist in their source files

Write a sync report to `.planning/quick/56-spec-implementation-sync-audit/AUDIT-REPORT.md` with:
- Section per document
- Each discrepancy: [file], [issue type: STALE_PATH | MISSING_ENTRY | OUTDATED_STATUS | WRONG_PROPS], [details]
- Summary counts

Then update all four shared spec documents to fix every discrepancy found.
  </action>
  <verify>
Run a verification script: for every file path in the updated spec docs, check it exists on disk. Zero broken paths.
```bash
grep -oP 'packages/web/[^\s|`\)]+\.(ts|tsx)' specs/_shared/component-registry.md specs/_shared/api-contracts.md specs/_shared/store-map.md specs/_shared/data-models.md | while IFS=: read -r spec path; do [ ! -f "$path" ] && echo "BROKEN: $spec -> $path"; done
```
  </verify>
  <done>All four shared spec documents have verified file paths, no broken references, new components/routes/stores added where missing</done>
</task>

<task type="auto">
  <name>Task 2: Audit and fix screen spec component maps</name>
  <files>specs/screens/discovery/SCR-DISC-01-home.md, specs/screens/discovery/SCR-DISC-02-search.md, specs/screens/discovery/SCR-DISC-03-feed.md, specs/screens/discovery/SCR-DISC-04-explore.md, specs/screens/detail/SCR-VIEW-01-post-detail.md, specs/screens/detail/SCR-VIEW-02-spot-hotspot.md, specs/screens/detail/SCR-VIEW-03-item-solution.md, specs/screens/detail/SCR-VIEW-04-related-content.md, specs/screens/creation/SCR-CREA-01-upload.md, specs/screens/creation/SCR-CREA-02-ai-detect.md, specs/screens/creation/SCR-CREA-03-edit-solution.md, specs/screens/user/SCR-USER-01-login.md, specs/screens/user/SCR-USER-02-profile.md, specs/screens/user/SCR-USER-03-earnings.md, specs/screens/user/SCR-USER-04-sns-connect.md</files>
  <action>
For each screen spec in discovery/, detail/, creation/, and user/ bundles:

1. Read the spec's Component Map table
2. Verify every File column path exists on the filesystem
3. Check the route path matches the actual page file location (e.g., `/explore` -> `packages/web/app/explore/page.tsx`)
4. Fix stale paths (components that moved or were renamed)
5. Update Status field in the header if it doesn't match reality (e.g., "planned" -> "implemented" if the page exists)
6. Remove references to components marked NOT-IMPL that now exist, or confirm they are still missing
7. Update the "Updated" date in the header to 2026-03-05

Do NOT touch magazine/, collection/, or vton/ specs — those are M7 future features with intentionally forward-looking specs.

Append findings to the AUDIT-REPORT.md created in Task 1 under a "## Screen Specs" section.
  </action>
  <verify>
Verify all screen spec file paths resolve:
```bash
for spec in specs/screens/discovery/*.md specs/screens/detail/*.md specs/screens/creation/*.md specs/screens/user/*.md; do
  grep -oP 'packages/web/[^\s|`\)]+\.(ts|tsx)' "$spec" 2>/dev/null | while read path; do [ ! -f "$path" ] && echo "BROKEN in $spec: $path"; done
done
```
  </verify>
  <done>All screen specs (discovery, detail, creation, user bundles) have verified component map paths, accurate status fields, and updated timestamps</done>
</task>

</tasks>

<verification>
- Zero broken file path references across all updated spec documents
- AUDIT-REPORT.md documents all changes made with before/after
- No regressions introduced (magazine/collection/vton specs untouched)
</verification>

<success_criteria>
- Every file path in shared specs (component-registry, api-contracts, store-map, data-models) verified against filesystem
- Every file path in screen specs (discovery, detail, creation, user) verified against filesystem
- New components/routes/stores discovered on disk are added to relevant spec docs
- AUDIT-REPORT.md created with full discrepancy log
</success_criteria>

<output>
After completion, create `.planning/quick/56-spec-implementation-sync-audit/056-SUMMARY.md`
</output>
