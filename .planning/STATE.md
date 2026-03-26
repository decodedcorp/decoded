---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: Behavioral Intelligence & Dynamic UI
status: unknown
stopped_at: Phase 49 context gathered
last_updated: "2026-03-26T15:24:46.943Z"
progress:
  total_phases: 47
  completed_phases: 44
  total_plans: 100
  completed_plans: 99
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-26)

**Core value:** 완전한 사용자 경험 — 일관된 디자인 시스템과 실제 데이터
**Current focus:** Phase 48 — tries-saved-backend

## Current Position

Phase: 48 (tries-saved-backend) — EXECUTING
Plan: 1 of 2

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
| v9.0 API Generation          | 5      | -     | Shipped    | 2026-03-23 |
| **v10.0 Profile Completion** | **-**  | **-** | **Active** | -          |

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
- [Phase 42-02]: updateMyProfile(data) called directly as mutationFn — generated raw function compatible with UpdateUserDto; supabaseBrowserClient import removed; setQueryData now type-safe (both GET and PATCH return UserResponse)
- [Phase 42-03]: Solution/Spot manual types removed from mutation-types.ts — no consumers outside deleted files; generated equivalents in @/lib/api/generated/models
- [Phase 42-03]: PostResponse (manual) removed from mutation-types.ts — usePosts.ts imports from generated/models; only used by now-deleted updatePost function
- [Phase 42-03]: fetchPostsServer/fetchPostMagazine added to index.ts barrel — server-only post functions valid as public exports
- [Phase 43-01]: TypeScript typecheck is the spec drift safety net — no git diff --exit-code needed after generate:api
- [Phase 43-01]: pre-push Step 0 uses graceful warning (not exit 1) when api-server/openapi.json absent — developers without backend are not blocked
- [Phase 43-01]: gitignore negation pattern: exclude packages/web/lib/api/generated/ then negate .gitkeep sentinel
- [Phase 43]: CI-04 documented as manual procedure — no automated cross-package CI trigger; backend developer notifies frontend via PR comment or Slack
- [Phase 43]: Rollback strategy: revert openapi.json + re-run generate:api — generated files are gitignored so they are never committed and never need to be reverted
- [Phase 43-03]: vitest environment: node for Zod schema tests (no DOM dependency)
- [Phase 43-03]: HealthCheckResponse has top-level status field — plan interface snippet omitted it; fixture corrected by reading actual schema
- [Phase 44]: sessionStorage for OAuth round-trip (Supabase allowlists fixed redirectTo origin/)
- [Phase 44]: window.location.replace in authStore (not router.push) to avoid login page in browser history
- [Phase 44]: req.nextUrl.pathname used for redirect param to prevent open redirect vulnerability
- [Phase 45-01]: PublicProfileClient is standalone (not extending ProfileClient) — prevents Zustand profileStore being polluted with another user's data
- [Phase 45-01]: ProfileHeaderCard (design-system explicit props) used instead of ProfileHeader (reads profileStore) for public profile view
- [Phase 45-01]: BadgeGrid and RankingList replaced with inline placeholders in public profile — both read profileStore and would show wrong user data
- [Phase 46]: ConnectionTrait must be imported explicitly for query_one on DatabaseConnection
- [Phase 46]: struct update syntax (..UserResponse::from(user)) cleanly sets non-count fields in get_user_with_follow_counts
- [Phase 46]: PATCH /me re-fetches follow counts after update for accurate response
- [Phase 47]: openapi.json edit via python3 json.load/dump for minified JSON safety
- [Phase 47]: Orval preserves snake_case: UserResponse fields are followers_count/following_count (not camelCase)
- [Phase 47]: ProfileClient uses optional chaining (userData?.followers_count ?? 0) — PublicProfileClient uses direct access (non-null guard at line 189)
- [Phase 48]: list_my_tries uses SeaORM entity query (no JOIN needed); list_my_saved uses raw SQL JOIN for post title/thumbnail
- [Phase 48]: per_page capped at 50 in service layer for tries/saved endpoints (not in Pagination struct)
- [Phase 48]: openapi.json edited via python3 json.load/dump for minified JSON safety; TryItem and SavedItem schemas added; Orval regenerated useGetMyTries/useGetMySaved hooks

### Blockers/Concerns

- **Phase 39 RESOLVED:** OpenAPI spec is 3.1.0 — Orval 8.5.3 handles natively, no preprocessing needed
- **Phase 39 RESOLVED:** No Handler/snake_case suffix issues found in operationIds
- **Phase 40 RESOLVED:** Duplicate operationIds fixed in backend (d694b9ac); codegen pipeline fully operational
- **v6.0 (paused)**: Privacy compliance — PIPA/GDPR disclosure required before behavioral tracking ships

### Pending Todos

**From v2-09-03 Visual QA:**

1. Quick task: Fix images page raw JSON error exposure (API error handling - major UX/security)

## Session Continuity

Last session: 2026-03-26T15:24:46.939Z
Stopped at: Phase 49 context gathered
Resume file: .planning/phases/49-tries-tab-frontend/49-CONTEXT.md

Next step: Execute 42-03-PLAN.md

---

_Created: 2026-02-05_
_Last updated: 2026-03-23 after v9.0 roadmap created (Phases 39-43)_
