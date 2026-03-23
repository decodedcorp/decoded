---
phase: 40-codegen-pipeline-and-custom-mutator
plan: 01
subsystem: api
tags: [orval, axios, supabase, jwt, codegen, typescript]

# Dependency graph
requires:
  - phase: 39-setup-spec-validation
    provides: "orval.config.ts base setup with input transformer and decodedApiZod block"
provides:
  - "Custom Orval axios mutator with Supabase JWT injection at packages/web/lib/api/mutator/custom-instance.ts"
  - "Orval afterAllFilesWrite prettier formatting hook in orval.config.ts"
  - "Generated API directory excluded from git via .gitignore"
affects: [codegen-pipeline, api-hooks, tanstack-query-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Orval custom mutator pattern: axios instance + JWT injection + CancelToken for TanStack Query"
    - "Empty baseURL for Next.js proxy routing (avoids CORS and double-prefix)"
    - "Optional auth pattern: inject token when available, no throw on missing token"

key-files:
  created:
    - packages/web/lib/api/mutator/custom-instance.ts
  modified:
    - packages/web/orval.config.ts
    - .gitignore

key-decisions:
  - "baseURL must be empty string — OpenAPI paths include /api/v1/ prefix; any non-empty base causes double-prefix"
  - "hooks block is sibling of input/output inside decodedApi (not nested inside output) — wrong placement causes silent failure"
  - "afterAllFilesWrite uses full path ./node_modules/.bin/prettier --write (not plain prettier) to avoid shell PATH issues in Orval subprocess"
  - "ErrorType and BodyType are required type exports — Orval generated files import these from the mutator module"
  - "No hooks block on decodedApiZod — zod schemas are small and rarely read by humans"

patterns-established:
  - "Mutator pattern: All Orval-generated hooks call customInstance which injects auth automatically"
  - "CancelToken: Orval generated code calls promise.cancel() on TanStack Query cancellation — must be supported"

requirements-completed: [INFRA-02, INFRA-04, INFRA-05]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 40 Plan 01: Codegen Pipeline Custom Mutator Summary

**Custom Orval axios mutator with Supabase JWT injection, afterAllFilesWrite prettier hook, and gitignore for generated API files**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-23T12:46:53Z
- **Completed:** 2026-03-23T12:48:54Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `packages/web/lib/api/mutator/custom-instance.ts` — the single auth/routing integration seam for all Orval-generated hooks; wraps axios with empty-string baseURL and Supabase JWT Bearer token injection
- Added `hooks.afterAllFilesWrite: "./node_modules/.bin/prettier --write"` to orval.config.ts at the correct config-block level (sibling of input/output)
- Excluded `packages/web/lib/api/generated/` from git so regenerated files never pollute version control

## Task Commits

Each task was committed atomically:

1. **Task 1: Create custom-instance.ts Orval mutator with Supabase JWT injection** - `4f3732e5` (feat)
2. **Task 2: Finalize orval.config.ts hooks, validate decodedApiZod config, and add generated dir to .gitignore** - `10d7aed5` (feat)

**Plan metadata:** (docs commit — see final commit)

## Files Created/Modified

- `packages/web/lib/api/mutator/custom-instance.ts` — Orval custom axios mutator: empty-string baseURL, Supabase JWT injection, ErrorType/BodyType exports, CancelToken support
- `packages/web/orval.config.ts` — Added hooks.afterAllFilesWrite with full prettier binary path at decodedApi config-block level
- `.gitignore` — Added packages/web/lib/api/generated/ exclusion rule

## Decisions Made

- `baseURL: ""` — OpenAPI spec paths already include `/api/v1/` prefix; any non-empty baseURL causes double-prefix `/api/v1/api/v1/...`
- `hooks` block placed as sibling of `input` and `output` inside `decodedApi` — placing it inside `output` causes TypeScript type error and silent non-execution
- Used `./node_modules/.bin/prettier --write` (full path) not plain `prettier --write` — plain string may fail if binary is not in shell PATH when Orval spawns the subprocess
- `decodedApiZod` block validated as already correct from Phase 39 — no changes needed

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- The custom mutator is ready; `orval generate` can now run without the "missing mutator file" error
- orval.config.ts is complete with hooks, transformer, and both config blocks (decodedApi + decodedApiZod)
- Phase 40-02 can proceed: run `orval generate` and validate the generated output

---
*Phase: 40-codegen-pipeline-and-custom-mutator*
*Completed: 2026-03-23*
