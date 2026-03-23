---
phase: 39-setup-spec-validation
plan: 01
subsystem: infra
tags: [orval, axios, zod, openapi, codegen, react-query]

# Dependency graph
requires: []
provides:
  - orval@8.5.3 devDependency in packages/web for OpenAPI codegen
  - axios@1.13.6 runtime dependency in packages/web
  - zod@3.25 runtime dependency in packages/web (v3, NOT v4)
  - orval.config.ts skeleton with two config blocks (react-query + zod)
  - multipart endpoint exclusion transformer (removes POST from 4 binary upload paths)
  - lib/api/generated/.gitkeep placeholder directory for generated output
affects:
  - 39-02 (OpenAPI spec download — will place openapi.json at the input.target path)
  - 40 (custom-instance.ts mutator creation — referenced in orval.config.ts)
  - 41 (codegen run — consumes orval.config.ts)

# Tech tracking
tech-stack:
  added:
    - orval@8.5.3 (OpenAPI codegen tool)
    - axios@1.13.6 (HTTP client for generated hooks)
    - zod@3.25 (runtime schema validation, v3 pinned)
  patterns:
    - Orval tags-split mode: one generated file per OpenAPI tag
    - Two-config Orval setup: react-query hooks + standalone zod schemas
    - Transformer pattern: spec preprocessing to exclude non-representable endpoints

key-files:
  created:
    - packages/web/orval.config.ts
    - packages/web/lib/api/generated/.gitkeep
  modified:
    - packages/web/package.json
    - bun.lock

key-decisions:
  - "zod pinned to ^3.25 (NOT v4) — Orval has active zod v4 incompatibility bugs #2249/#2304"
  - "orval installed as devDependency (codegen tool, not runtime)"
  - "input.target uses '../api-server/openapi.json' relative from packages/web/ — Orval resolves relative to config file location"
  - "httpClient: 'axios' explicit — Orval 8 defaults to fetch, must override"
  - "Transformer removes only POST verb from /api/v1/posts, preserving GET (list_posts)"
  - "decodedApiZod block omits transformer — Zod schemas for excluded endpoints are harmless"

patterns-established:
  - "Pattern 1: Orval transformer function receives the full OpenAPI spec object and returns modified spec — use pathsToRemoveVerb pattern for excluding endpoints by HTTP verb"
  - "Pattern 2: Two Orval config blocks — decodedApi for runtime TanStack Query hooks, decodedApiZod for standalone validation schemas"

requirements-completed: [INFRA-01, SPEC-03]

# Metrics
duration: 8min
completed: 2026-03-23
---

# Phase 39 Plan 01: Install Orval Toolchain and Config Skeleton Summary

**Orval codegen toolchain installed (orval@8.5.3, axios@1.13.6, zod@3.25) with orval.config.ts skeleton featuring two config blocks and a multipart endpoint exclusion transformer**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-23T10:35:30Z
- **Completed:** 2026-03-23T10:43:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed orval@8.5.3 as devDependency — pinned to v8.5.x for stability
- Installed axios@1.13.6 and zod@3.25 as runtime dependencies (zod v3 explicitly, NOT v4 due to Orval compatibility bugs)
- Created orval.config.ts with two config blocks: decodedApi (react-query hooks via TanStack Query) and decodedApiZod (standalone Zod validation schemas)
- Transformer correctly removes POST verb from 4 multipart/binary upload endpoints while preserving GET on /api/v1/posts
- Created lib/api/generated/.gitkeep as placeholder for Phase 41 codegen output

## Task Commits

Each task was committed atomically:

1. **Task 1: Install orval, axios, zod packages** - `832cd4b8` (chore)
2. **Task 2: Create orval.config.ts skeleton with multipart exclusion transformer** - `33147d70` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `packages/web/package.json` - Added orval@^8.5.3 (dev), axios@^1.13.6 (dep), zod@^3.25 (dep)
- `bun.lock` - Updated with 350+ new transitive packages
- `packages/web/orval.config.ts` - Orval config with two blocks + multipart exclusion transformer
- `packages/web/lib/api/generated/.gitkeep` - Empty placeholder for codegen output directory

## Decisions Made
- zod pinned to ^3.25 (not v4): Orval has active incompatibility with zod v4 (GitHub issues #2249, #2304). Running `bun add zod` without a version pin installs v4 (current `latest`), which breaks Orval's Zod schema generation.
- httpClient explicitly set to "axios": Orval 8 changed its default HTTP client to fetch. Without the explicit `httpClient: "axios"` setting, generated hooks would use fetch instead of the axios instance with interceptors.
- Two config blocks vs one: Separating react-query hooks from Zod schemas keeps concerns clean — the zod block doesn't need the multipart transformer since unused Zod schemas are harmless.
- Transformer removes only POST verb: `/api/v1/posts` has both GET (list_posts, keep) and POST (create_post_without_solutions, remove). The transformer uses verb-level removal via `pathsToRemoveVerb`, not path-level removal.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Minor: `node -e` command with `!` in shell required workaround — used `cat package.json | grep version` instead. No impact on outcome.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- orval.config.ts skeleton is complete and ready for Phase 39 Plan 02 (OpenAPI spec download)
- Phase 40 needs to create `packages/web/lib/api/mutator/custom-instance.ts` — referenced in orval.config.ts but not yet created
- Phase 41 can run `bun orval` once the openapi.json is in place and custom-instance.ts exists
- Blocker: openapi.json does not yet exist at `packages/api-server/openapi.json` — Phase 39-02 will download the live spec

---
*Phase: 39-setup-spec-validation*
*Completed: 2026-03-23*
