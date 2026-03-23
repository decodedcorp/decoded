---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: Behavioral Intelligence & Dynamic UI
status: unknown
stopped_at: Completed 42-01-PLAN.md
last_updated: "2026-03-23T15:05:00.000Z"
progress:
  total_phases: 40
  completed_phases: 37
  total_plans: 91
  completed_plans: 88
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** 완전한 사용자 경험 — 일관된 디자인 시스템과 실제 데이터
**Current focus:** Phase 42 — mutation-migration-cache-wiring

## Current Position

Phase: 42 (mutation-migration-cache-wiring) — EXECUTING
Plan: 2 of 3

## Milestone Summary

| Milestone                    | Phases | Plans | Status     | Date       |
| ---------------------------- | ------ | ----- | ---------- | ---------- |
| v1.0 Documentation           | 5      | 5     | Shipped    | 2026-01-29 |
| v1.1 API Integration         | 5      | 13    | Shipped    | 2026-01-29 |
| v2.0 Design Overhaul         | 9      | 26    | Shipped    | 2026-02-05 |
| v2.1 Design System           | 6      | 14    | Shipped    | 2026-02-06 |
| v3.0 Admin Panel             | 6      | 12    | Shipped    | 2026-02-19 |
| v4.0 Spec Overhaul           | 9      | 13    | Shipped    | 2026-02-20 |
| v5.0 AI Magazine             | 3      | 11    | Shipped    | 2026-03-12 |
| v6.0 Behavioral Intelligence | 3      | 10    | Paused     | -          |
| v7.0 Sticker Canvas          | 3      | 8     | Paused     | -          |
| v8.0 Monorepo & Bun          | 4      | 3     | Shipped    | 2026-03-23 |
| **v9.0 API Generation**      | **5**  | **-** | **Active** | -          |

## Accumulated Context

### Decisions

Recent decisions from v8.0:

- [v8.0]: bun hoisted strategy with bunfig.toml
- [v8.0]: Backend stays OUTSIDE bun workspaces (Cargo independent)
- [v8.0]: Root workspaces explicit list (not glob) to prevent backend inclusion
- [v8.0]: Fragment wrapper for ImageDetailContent (TS JSX children inference limit)
- [v8.0]: proxy.ts replaces middleware.ts (Next.js 16 convention)

v9.0 key constraints (from research):

- [v9.0]: Use zod v3 (not v4) — Orval Zod v4 compat bugs #2249/#2304 active
- [v9.0]: mutator baseURL must be empty string — OpenAPI paths already include /api/v1/
- [v9.0]: Upload endpoints excluded from Orval permanently (binary/multipart not representable)
- [v9.0]: Never put generated hooks in packages/shared (No QueryClient set error — TanStack #3595)
- [v9.0]: Migrate per-endpoint atomically — no dual hooks on same endpoint simultaneously
- [Phase 39]: zod pinned to ^3.25 (NOT v4) — Orval zod v4 compat bugs #2249/#2304 active
- [Phase 39]: httpClient: axios explicit in orval.config.ts — Orval 8 defaults to fetch without this setting
- [Phase 39]: input.target '../api-server/openapi.json' — Orval resolves paths relative to config file (packages/web/)
- [Phase 39]: OpenAPI 3.1.0 confirmed — Orval 8.5.3 handles natively, no preprocessing script needed
- [Phase 39]: 4 duplicate operationIds found (list_posts, list_badges, list_solutions, list_spots) — backend PR required before Phase 40 codegen; fix via explicit operation_id = 'admin_list_*' in utoipa annotations
- [Phase 39]: Backend local dev port is 8000 (not 3001 as documented); spec URL: http://localhost:8000/api-docs/openapi.json
- [Phase 40-codegen-pipeline-and-custom-mutator]: baseURL empty string in customInstance — OpenAPI paths include /api/v1/ prefix to prevent double-prefix
- [Phase 40-codegen-pipeline-and-custom-mutator]: hooks block is sibling of input/output in orval.config.ts — placing inside output causes silent failure
- [Phase 40]: Turbo task name must exactly match package script name — generate:api task name required (not generate) for Turborepo to dispatch correctly
- [Phase 41-01]: Import-alias pattern for generated hooks: import with 'as *Generated' suffix to avoid name collision
- [Phase 41-01]: Cache key preservation: pass profileKeys.badges()/rankings()/CATEGORIES_QUERY_KEY into generated hook's query.queryKey
- [Phase 41-01]: null-to-undefined coercion in badge-mapper: generated types use string|null, store Badge.description expects string|undefined
- [Phase 41-02]: Split import pattern: read hooks from generated, mutation functions still from manual API files
- [Phase 41-02]: SolutionLike.metadata widened to unknown; parseSolutionMetadata accepts unknown — generated SolutionListItem.metadata is unknown per OpenAPI spec
- [Phase 41-02]: setQueryData<any> on spot mutation hooks for transition period — Phase 42 will wire mutations to generated types
- [Phase 41]: updateMe inlined into useProfile.ts instead of keeping users.ts alive — cleanest deletion boundary; Phase 42 will replace with generated useUpdateMyProfile mutation
- [Phase 41]: useUserActivities uses getMyActivities raw function in useInfiniteQuery — generated hook is regular useQuery, infinite pagination requires manual composition
- [Phase 41]: usePostMagazine in useImages.ts unchanged — fetchPostMagazine has no generated equivalent (post-magazines endpoint not in OpenAPI spec)
- [Phase 41-04]: types.ts deleted per ROADMAP SC-5; mutation-types.ts holds manual types for mutations/uploads/server functions; ManualUpdateSolutionDto introduced since generated UpdateSolutionDto has incompatible shape
- [Phase 41-04]: PostDetailResponse/SpotWithTopSolution/TopSolutionSummary imported from generated/models; UpdatePostDto/UpdateUserDto/UserStatsResponse/CreateSpotDto/UpdateSpotDto also from generated/models
- [Phase 42-01]: setQueryData<any> on spot mutations replaced with invalidateQueries — SpotResponse (mutation return) and SpotListItem (query cache) have incompatible shapes
- [Phase 42-01]: setQueryData on post detail replaced with invalidateQueries — postKeys.detail holds Supabase PostDetail shape, not generated PostResponse (cross-boundary type mismatch)
- [Phase 42-01]: ManualUpdateSolutionDto replaced with generated UpdateSolutionDto in UpdateSolutionVariables — generated shape is the OpenAPI spec shape
- [Phase 42-01]: extractMetadata/convertAffiliate generated fns take DTO objects ({url}) not bare strings — all callers updated accordingly
- [Phase 42-01]: SolutionInputForm meta.price/currency removed — generated MetadataResponse has no top-level price/currency (only in extra_metadata.LinkMetadata)

### Blockers/Concerns

- **Phase 39 RESOLVED:** OpenAPI spec is 3.1.0 — Orval 8.5.3 handles natively, no preprocessing needed
- **Phase 39 RESOLVED:** No Handler/snake_case suffix issues found in operationIds
- **Phase 40 RESOLVED:** Duplicate operationIds fixed in backend (d694b9ac); codegen pipeline fully operational
- **v6.0 (paused)**: Privacy compliance — PIPA/GDPR disclosure required before behavioral tracking ships

### Pending Todos

**From v2-09-03 Visual QA:**

1. Quick task: Fix images page raw JSON error exposure (API error handling - major UX/security)

## Session Continuity

Last session: 2026-03-23T15:05:00Z
Stopped at: Completed 42-01-PLAN.md
Resume file: None

Next step: Execute 42-02-PLAN.md

---

_Created: 2026-02-05_
_Last updated: 2026-03-23 after v9.0 roadmap created (Phases 39-43)_
