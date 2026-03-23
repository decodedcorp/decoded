---
phase: 40-codegen-pipeline-and-custom-mutator
plan: 02
subsystem: api
tags: [orval, codegen, turborepo, tanstack-query, typescript, smoke-test]

# Dependency graph
requires:
  - phase: 40-01
    provides: "Custom Orval axios mutator (custom-instance.ts) and finalized orval.config.ts"
provides:
  - "generate:api script in packages/web and root package.json for monorepo-level access"
  - "Turborepo generate:api task with output caching and correct build/typecheck dependency ordering"
  - "15 per-tag generated hook files in packages/web/lib/api/generated/ (tags-split mode)"
  - "models/ directory with 150+ TypeScript type definition files"
  - "zod/ directory with decodedApi.zod.ts"
affects: [codegen-pipeline, api-hooks, tanstack-query-integration, build-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Turborepo task name must exactly match package script name — generate:api task maps to generate:api script"
    - "Orval tags-split mode creates one subdirectory per OpenAPI tag, not flat .ts files at generated root"
    - "Root turbo run generate:api dispatches to packages/web generate:api script via workspace-aware task resolution"

key-files:
  created: []
  modified:
    - packages/web/package.json
    - package.json
    - turbo.json

key-decisions:
  - "Turbo task name must be generate:api (not generate) — Turborepo matches task names by exact script name in package.json; using generate:api in turbo.json and generate:api in package scripts achieves exact match"
  - "Root package.json generate:api calls turbo run generate:api (not turbo run generate) — required after turbo task rename"
  - "build.dependsOn includes generate:api without ^ prefix — generate does not depend on other packages building first"
  - "typecheck task added to turbo.json with dependsOn: generate:api — ensures generated types are available during typecheck"

requirements-completed: [INFRA-03, SPEC-04]

# Metrics
duration: 3min
completed: 2026-03-23
---

# Phase 40 Plan 02: Codegen Pipeline Smoke Test Summary

**generate:api script wired into packages/web, root package.json, and Turborepo with Orval producing 15 per-tag hook files, models, and zod schemas — typecheck clean, no double-prefix URLs**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T12:51:45Z
- **Completed:** 2026-03-23T12:54:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `"generate:api": "orval --config orval.config.ts"` to `packages/web/package.json` scripts
- Added `"generate:api": "turbo run generate:api"` to root `package.json` enabling `bun run generate:api` from repo root
- Updated `turbo.json`: added `generate:api` task with `lib/api/generated/**` output caching; updated `build.dependsOn` to include `generate:api`; added `typecheck` task with `dependsOn: [generate:api]`
- Executed full smoke test: 15 per-tag hook files generated (admin, badges, categories, comments, earnings, feed, health, posts, rankings, search, solutions, spots, subcategories, users, votes), 150+ model types, `decodedApi.zod.ts`
- Confirmed zero double-prefix `/api/v1/api/v1/` occurrences in all generated files
- Confirmed `bun run typecheck` exits 0 with all generated files included
- Confirmed root-level `bun run generate:api` dispatches through Turborepo to packages/web
- Confirmed generated files remain gitignored (no tracked changes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generate:api script to package.json (web + root) and generate task to turbo.json** - `d2aa9da4` (feat)
2. **Task 2: Run orval generate and execute full smoke test** - `4904d4e1` (feat)

**Plan metadata:** (docs commit — see final commit)

## Files Created/Modified

- `packages/web/package.json` — Added `generate:api` script calling `orval --config orval.config.ts`
- `package.json` — Added root-level `generate:api` script calling `turbo run generate:api`
- `turbo.json` — Added `generate:api` task with output caching; updated `build` and `typecheck` task dependencies

## Decisions Made

- **Turbo task name must exactly match package script name** — Initial plan used `generate` as turbo task name, but Turborepo requires exact match with the package.json script name (`generate:api`). Auto-fixed via Rule 3 (blocking issue preventing Task 2 from working).
- **No `^` prefix on generate:api dependsOn** — Code generation does not depend on upstream packages building first; it only reads the openapi.json file.
- **typecheck added as explicit turbo task** — Without this entry, turbo would not apply the `generate:api` dependency ordering when running `turbo run typecheck`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Turbo task name mismatch prevented root generate:api from running**
- **Found during:** Task 2 (Step 7 — verify root-level generate:api)
- **Issue:** Plan specified turbo task as `generate` but packages/web script is named `generate:api`. Turborepo requires exact match between task name and package script name. Running `turbo run generate` produced "No tasks were executed" (0 tasks).
- **Fix:** Renamed turbo task from `generate` to `generate:api`; updated root package.json from `turbo run generate` to `turbo run generate:api`; updated `build.dependsOn` and `typecheck.dependsOn` from `generate` to `generate:api`
- **Files modified:** `turbo.json`, `package.json`
- **Commit:** `4904d4e1`

## Smoke Test Results

| Check | Result |
|-------|--------|
| orval generation (packages/web) | PASS — 15 tag dirs, models/, zod/ |
| orval generation (root via turbo) | PASS — dispatched correctly |
| Double-prefix /api/v1/api/v1/ | PASS — 0 matches |
| TypeScript typecheck | PASS — exit code 0 |
| Generated files gitignored | PASS — no tracked changes |
| customInstance imports in generated files | PASS — confirmed in 5+ files |
| Turborepo caching on second run | PASS — 1 cached, 0 re-executed |

## Issues Encountered

None beyond the auto-fixed turbo task name mismatch.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 40 is fully complete: orval toolchain setup (Phase 39), custom mutator (Phase 40-01), and codegen pipeline + smoke test (Phase 40-02)
- Phase 41 (hook migration) can now begin: generated hooks exist in `packages/web/lib/api/generated/`
- Developers can run `bun run generate:api` from repo root to regenerate all hooks after OpenAPI spec changes
- Turborepo caches generated output — subsequent builds skip regeneration when openapi.json is unchanged

---
*Phase: 40-codegen-pipeline-and-custom-mutator*
*Completed: 2026-03-23*
