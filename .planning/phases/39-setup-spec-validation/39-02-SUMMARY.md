---
phase: 39-setup-spec-validation
plan: 02
subsystem: api
tags: [openapi, orval, utoipa, rust, codegen, audit]

requires:
  - phase: 39-setup-spec-validation
    provides: Plan 01 infrastructure (orval, axios, zod installed; orval.config.ts skeleton)

provides:
  - "packages/api-server/openapi.json — static copy of live OpenAPI 3.1.0 spec for Orval consumption"
  - "39-SPEC-AUDIT.md — documented audit: version confirmed, 4 duplicate operationIds found, multipart list verified, pagination confirmed page+per_page"
  - "Phase 40 blocker identified: 4 duplicate operationIds require backend PR before codegen"

affects: [40-orval-codegen, 41-hook-migration, backend-pr-operationids]

tech-stack:
  added: []
  patterns:
    - "openapi.json saved as static file at packages/api-server/openapi.json — Orval reads this, not the live server"
    - "Backend port for local dev is 8000 (not 3001 as documented in plan interfaces)"

key-files:
  created:
    - packages/api-server/openapi.json
    - .planning/phases/39-setup-spec-validation/39-SPEC-AUDIT.md
  modified: []

key-decisions:
  - "OpenAPI 3.1.0 confirmed — Orval 8.5.3 handles natively, no preprocessing script needed"
  - "4 duplicate operationIds found (list_posts, list_badges, list_solutions, list_spots) — backend PR required before Phase 40"
  - "Fix strategy: add explicit operation_id = 'admin_list_*' to admin handler utoipa annotations"
  - "Search endpoint uses page+limit instead of page+per_page — non-blocking inconsistency, noted for future backend cleanup"
  - "Multipart endpoints: exactly 4 confirmed, all match existing orval.config.ts exclusion list — no additional exclusions needed"
  - "Backend dev server runs on port 8000 locally (plan assumed 3001)"

requirements-completed: [SPEC-01, SPEC-02, SPEC-05]

duration: 3min
completed: 2026-03-23
---

# Phase 39 Plan 02: Spec Audit Summary

**OpenAPI 3.1.0 spec downloaded from live backend, full audit reveals 4 duplicate operationIds (list_posts/badges/solutions/spots) blocking Orval codegen — backend PR required before Phase 40**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T12:03:59Z
- **Completed:** 2026-03-23T12:06:32Z
- **Tasks:** 1 (Task 1 was checkpoint, resolved before this agent; Task 2 executed here)
- **Files created:** 2

## Accomplishments

- Downloaded live OpenAPI spec (8920 lines, 85 endpoints) from http://localhost:8000/api-docs/openapi.json and saved as `packages/api-server/openapi.json`
- Confirmed OpenAPI 3.1.0 with canonical oneOf nullable pattern (21 occurrences, zero `nullable:true`) — Orval 8.5.3 handles this natively, no preprocessing required
- Identified 4 duplicate operationId pairs (list_posts, list_badges, list_solutions, list_spots — user vs admin paths) that block `orval generate`
- Verified multipart endpoint list: exactly 4 endpoints, all match existing orval.config.ts transformer exclusion list
- Confirmed all paginated endpoints use `page` + `per_page` (except `/api/v1/search` which uses `page` + `limit` — minor inconsistency)
- Resolved both STATE.md blockers with evidence from the actual spec

## Task Commits

1. **Task 2: Download OpenAPI spec and run full audit** - `cedb4b54` (feat)

## Files Created/Modified

- `packages/api-server/openapi.json` — Static copy of live OpenAPI 3.1.0 spec (85 endpoints, 8920 lines) for Orval to consume
- `.planning/phases/39-setup-spec-validation/39-SPEC-AUDIT.md` — Full audit results: version, nullable, operationIds, multipart, pagination, Phase 40 blockers

## Decisions Made

- **Orval preprocessing not needed:** Spec is OpenAPI 3.1.0 with oneOf nullable pattern. Orval 8.5.3 handles this natively per PR #1818 fix (shipped v7.5.0).
- **Backend PR required for Phase 40:** 4 duplicate operationIds found. Fix: add explicit `operation_id = "admin_list_*"` to admin handler `#[utoipa::path]` annotations. This is the recommended approach per utoipa docs.
- **Multipart exclusion list is complete:** No additional multipart endpoints beyond the original 4. The orval.config.ts transformer plan from Phase 39-01 requires no changes.
- **Backend runs on port 8000 locally:** Plan interfaces documented port 3001, but local dev env uses 8000. Spec URL: `http://localhost:8000/api-docs/openapi.json`. Updated in audit doc.

## Deviations from Plan

### Observations (not auto-fixed — informational)

**1. Backend port is 8000, not 3001**
- **Found during:** Task 2 (downloading spec)
- **Issue:** Plan interfaces documented `http://localhost:3001/api-docs/openapi.json` but the user confirmed the server runs on port 8000
- **Action:** Used port 8000 as instructed in checkpoint resolution. Documented in audit file.
- **Impact:** Spec file `packages/api-server/openapi.json` references port 8000 as the source. Future agents should use `http://localhost:8000/api-docs/openapi.json`.

**2. /api/v1/search uses `limit` instead of `per_page`**
- **Found during:** Task 2 (pagination audit)
- **Issue:** All other paginated endpoints use `page` + `per_page`, but search uses `page` + `limit`
- **Action:** Documented in audit as minor non-blocking inconsistency. Did not fix (backend change, out of scope).
- **Impact:** Orval will generate a `limit` param for the search hook. Cosmetic inconsistency only.

**3. 4 duplicate operationIds found (more than the 2 expected)**
- **Found during:** Task 2 (operationId audit)
- **Expected:** Research identified `list_posts` and `list_badges` as candidate duplicates
- **Actual:** 4 duplicates: `list_posts`, `list_badges`, `list_solutions`, `list_spots`
- **Action:** Documented all 4 with fix plans in 39-SPEC-AUDIT.md. This is a BLOCKER for Phase 40.
- **Impact:** Phase 40 (orval codegen) is blocked until backend PR resolves these 4 duplicates.

---

**Total deviations:** None requiring auto-fix. 3 informational observations documented.
**Impact on plan:** Plan executed as written. The additional duplicate operationIds (4 vs 2 expected) are a new blocker that requires a backend PR. This was anticipated as a possible outcome in the plan design.

## Issues Encountered

- Duplicate operationId count was higher than expected (4 pairs vs 2 suspected). The additional duplicates are `list_solutions` (spots vs admin::solutions) and `list_spots` (posts/{id}/spots vs admin/spots). All have the same fix pattern — add `operation_id = "admin_*"` to the admin handlers.

## User Setup Required

None — no external service configuration required. However, Phase 40 requires a backend PR to fix 4 duplicate operationIds before `orval generate` can run.

## Next Phase Readiness

**Phase 40 (orval-codegen) is BLOCKED until:**
1. Backend PR submitted and merged fixing these operationIds:
   - `list_posts` → add `operation_id = "admin_list_posts"` to `packages/api-server/src/domains/admin/posts/` handler
   - `list_badges` → add `operation_id = "admin_list_badges"` to admin badges handler
   - `list_solutions` → add `operation_id = "admin_list_solutions"` to admin solutions handler
   - `list_spots` → add `operation_id = "admin_list_spots"` to admin spots handler
2. Backend restarted after fix
3. `packages/api-server/openapi.json` re-downloaded and verified (duplicate check should return `[]`)

**Once blocker resolved, Phase 40 can:**
- Finalize orval.config.ts with correct operationId exclusions and transformer
- Run `orval generate` in packages/web
- Verify all 85 endpoints (minus 4 excluded multipart POST verbs) generate correct hooks

---
*Phase: 39-setup-spec-validation*
*Completed: 2026-03-23*
