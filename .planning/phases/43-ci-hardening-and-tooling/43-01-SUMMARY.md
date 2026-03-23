---
phase: 43-ci-hardening-and-tooling
plan: 01
subsystem: infra
tags: [git, gitignore, orval, ci, pre-push, bash, codegen]

# Dependency graph
requires:
  - phase: 39-orval-research-and-proof-of-concept
    provides: orval.config.ts with generate:api script wired to openapi.json
  - phase: 40-codegen-pipeline-and-custom-mutator
    provides: packages/web/lib/api/generated/ directory and .gitkeep sentinel
provides:
  - Generated API files excluded from git tracking (.gitignore negation pattern)
  - pre-push hook runs generate:api as Step 0 before lint/typecheck
affects: [ci, codegen, pre-push, generated-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "gitignore negation pattern: exclude directory, then negate sentinel .gitkeep"
    - "pre-push hook Step 0 pattern: regenerate before typecheck so drift is caught by compiler"

key-files:
  created: []
  modified:
    - .gitignore
    - packages/web/scripts/pre-push.sh

key-decisions:
  - "Spec drift detected via regeneration + TypeScript typecheck (not git diff --exit-code) — TypeScript is the actual safety net"
  - "Graceful warning (not exit 1) when api-server/openapi.json absent — developer without backend is not blocked"
  - "Step 0 uses if guard on ../api-server/openapi.json existence before calling bun run generate:api"

patterns-established:
  - "CI-01: generate:api runs as prebuild equivalent in local CI (pre-push hook)"
  - "CI-02: spec drift detected via regeneration + TypeScript typecheck catching type mismatches"
  - "CI-03: generated directory gitignored with .gitkeep sentinel preserved via negation"

requirements-completed: [CI-01, CI-02, CI-03]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 43 Plan 01: CI Hardening — gitignore Negation and API Spec Drift Check Summary

**Wired .gitignore to exclude Orval-generated files while preserving .gitkeep, and added Step 0 to pre-push hook that regenerates API code from openapi.json before TypeScript typecheck catches drift**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-23T15:22:55Z
- **Completed:** 2026-03-23T15:24:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Root `.gitignore` now excludes all Orval-generated API files while preserving the `.gitkeep` sentinel via negation pattern
- `packages/web/scripts/pre-push.sh` gains Step 0 that calls `bun run generate:api` when `../api-server/openapi.json` exists, so TypeScript (Step 3) catches any spec drift automatically
- Graceful fallback: if backend openapi.json is absent, a warning is printed but the push is not blocked

## Task Commits

Each task was committed atomically:

1. **Task 1: Add .gitkeep negation to .gitignore** - `48780525` (chore)
2. **Task 2: Add Step 0 API spec drift check to pre-push.sh** - `f7f3d46d` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `.gitignore` — Added `!packages/web/lib/api/generated/.gitkeep` negation immediately after the `packages/web/lib/api/generated/` exclusion line
- `packages/web/scripts/pre-push.sh` — Added Step 0 block: if-guard on openapi.json existence, `bun run generate:api`, graceful warning fallback

## Decisions Made

- TypeScript typecheck (Step 3) is the actual safety net for spec drift — no need for `git diff --exit-code` after regeneration; if generated types changed, consumers break at type level
- Graceful warning (not `exit 1`) when `../api-server/openapi.json` not found — developers without the backend repository checked out should not be blocked
- `.gitkeep` negation pattern: exclusion rule first, negation rule second — order matters in gitignore

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CI-01/CI-02/CI-03 requirements satisfied — pre-push hook enforces API spec drift detection
- Ready to proceed to 43-02 (next plan in phase 43)

## Self-Check: PASSED

- FOUND: `.planning/phases/43-ci-hardening-and-tooling/43-01-SUMMARY.md`
- FOUND: `.gitignore`
- FOUND: `packages/web/scripts/pre-push.sh`
- FOUND commit: `48780525` (Task 1)
- FOUND commit: `f7f3d46d` (Task 2)

---
*Phase: 43-ci-hardening-and-tooling*
*Completed: 2026-03-24*
