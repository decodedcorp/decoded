# Phase 41: Read Hook Migration - Research

**Researched:** 2026-03-23
**Domain:** Orval generated TanStack Query hooks — migration from manual API files
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-01 | Read hook migration — badges, rankings, categories | Generated hooks exist: `useListBadges`, `useMyBadges`, `useGetBadge`, `useListRankings`, `useGetMyRanking`, `useGetCategoryRankings`, `useGetCategories` |
| MIG-02 | Read hook migration — comments, spots, solutions | Generated hooks exist: `useListComments`, `useListSpots`, `useListSolutions` |
| MIG-03 | Read hook migration — users, posts | Generated hooks exist: `useGetMyProfile`, `useGetMyStats`, `useGetMyActivities`, `useGetUserProfile`, `useListPosts`, `useGetPost` |
| MIG-04 | Read hook migration — admin domain (dashboard, ai-cost, audit, pipeline, server-logs) | `useGetDashboardStats` exists; ai-cost/audit/pipeline/server-logs are Next.js-internal routes — NOT in generated API; those hooks stay as-is |
| MIG-08 | Resolve type name collisions between manual types.ts and generated model/ | Name conflicts identified: `Category` vs `CategoryResponse`, `CommentResponse` (created_at: number vs string), `UserResponse` (rank: string | null vs string), `MyBadgesResponse`, `RankingListResponse`, mapper files need updating |
</phase_requirements>

---

## Summary

Phase 41 migrates all GET (read) endpoints from hand-written `lib/api/*.ts` functions to Orval-generated `useQuery` hooks. Phase 40 completed the codegen pipeline, so all generated hooks already exist in `lib/api/generated/`. The migration pattern is: (1) update wrapper hooks in `lib/hooks/` to call generated hooks, (2) update consumers that import types from `lib/api/types.ts` to import from `lib/api/generated/models/`, (3) delete the manual API files once all consumers are migrated.

The central complexity is type name conflicts. Generated models have the same names as manual types in `lib/api/types.ts` (e.g., `CategoryResponse`, `MyBadgesResponse`, `UserResponse`, `RankingListResponse`, `CommentResponse`), but with different field shapes. This requires `import type { X as GeneratedX }` aliasing in mappers and hook wrapper files during migration.

**Primary recommendation:** Migrate domain-by-domain in the plan order (badges/rankings/categories → comments/spots/solutions → users/posts → admin). For each domain: swap the data source in the wrapper hook, update type imports with aliasing, verify consumers compile, then delete the manual file. Do NOT delete `lib/api/types.ts` until Plan 41-04 (admin last, because `types.ts` has types used by upload/mutation paths that are out of scope for Phase 41).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | v5.x (already installed) | Query state management | Used throughout; generated hooks target this |
| Orval v8.5.3 | already installed | Code generator | Already generating hooks in lib/api/generated/ |
| axios | already installed | HTTP client | customInstance uses Axios |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript import aliasing | built-in | Resolve name collisions | When generated type name matches manual type name |

**Installation:** None required. All dependencies already installed in Phase 40.

---

## Architecture Patterns

### Recommended Project Structure After Migration

```
packages/web/lib/api/
├── generated/           # Orval output — SSOT, never edit manually
│   ├── admin/admin.ts   # Generated admin hooks
│   ├── badges/badges.ts
│   ├── categories/categories.ts
│   ├── comments/comments.ts
│   ├── models/          # 165 generated type files — import from here
│   ├── posts/posts.ts
│   ├── rankings/rankings.ts
│   ├── solutions/solutions.ts
│   ├── spots/spots.ts
│   ├── users/users.ts
│   └── zod/             # Generated Zod schemas
├── admin/               # Keep: Next.js-internal admin routes (mock data, no backend)
│   ├── ai-cost.ts       # KEEP — internal Next.js route, no backend endpoint
│   ├── audit.ts         # KEEP — internal Next.js route, no backend endpoint
│   ├── dashboard.ts     # KEEP — internal mock logic (different from generated useGetDashboardStats)
│   ├── pipeline.ts      # KEEP — internal Next.js route, no backend endpoint
│   ├── server-logs.ts   # KEEP — internal Next.js route, no backend endpoint
│   └── *-mock-data.ts   # KEEP — deterministic mock generators
├── mutator/
│   └── custom-instance.ts  # KEEP — Supabase JWT + axios wrapper
├── adapters/            # KEEP — conversion between API types and component types
├── client.ts            # DELETE after users.ts migration (apiClient still used by posts)
├── posts.ts             # Phase 41 scope: DELETE fetchPosts, fetchPostDetail (keep upload/mutation fns for Phase 42)
│                        # Actually: delete entire file only after Phase 42 (mutations out of scope)
├── users.ts             # DELETE after migration (Supabase-direct fetches replaced by generated hooks)
├── badges.ts            # DELETE after migration (was stub returning empty data)
├── rankings.ts          # DELETE after migration (was stub returning empty data)
├── categories.ts        # DELETE after migration
├── comments.ts          # DELETE after migration (keep mutation fns until Phase 42)
├── spots.ts             # DELETE after migration (keep mutation fns until Phase 42)
├── solutions.ts         # DELETE after migration (keep mutation fns until Phase 42)
├── index.ts             # UPDATE to remove deleted re-exports
└── types.ts             # PARTIAL DELETE: remove types now covered by generated/models/
                         # Keep: upload/mutation types still needed by posts.ts mutations
```

**IMPORTANT:** Phase 41 covers READ hooks only. Files that contain both read functions AND mutation functions (comments.ts, spots.ts, solutions.ts, posts.ts) must have ONLY the read functions removed/replaced in this phase. Full file deletion is deferred to Phase 42 (mutation migration).

### Pattern 1: Wrapper Hook Migration (preferred approach)

The existing `lib/hooks/` wrapper hooks are the consumer-facing API. Components import from hooks, not directly from generated files. Update the hook implementation to call generated hooks, keeping the external interface stable.

**What:** Replace `queryFn: () => manualFetch(...)` with the generated hook call inside wrapper hooks.
**When to use:** Wrapper hooks that add staleTime, custom query keys, or post-processing logic.

```typescript
// BEFORE (lib/hooks/useProfile.ts)
import { fetchMyBadges } from "@/lib/api/badges";
export function useMyBadges(options?) {
  return useQuery({
    queryKey: profileKeys.badges(),
    queryFn: fetchMyBadges,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

// AFTER (lib/hooks/useProfile.ts)
import { useMyBadges as useMyBadgesGenerated } from "@/lib/api/generated/badges/badges";
export function useMyBadges(options?) {
  // Generated hook handles its own queryKey. Wrap with select/enabled/staleTime as needed.
  return useMyBadgesGenerated({
    query: { staleTime: 1000 * 60 * 5, ...options }
  });
}
```

### Pattern 2: Direct Generated Hook (simple domains)

Where the wrapper hook adds no value beyond calling the manual function, replace the wrapper hook entirely with a re-export of the generated hook.

```typescript
// lib/hooks/useCategories.ts (new thin wrapper or direct re-export)
export { useGetCategories } from "@/lib/api/generated/categories/categories";
export type { CategoryResponse } from "@/lib/api/generated/models";
```

### Pattern 3: Type Aliasing for Collision Resolution (MIG-08)

Generated model names collide with manual types.ts names. Use import aliasing:

```typescript
// In mapper files (badge-mapper.ts, ranking-mapper.ts, etc.)

// BEFORE
import type { ApiEarnedBadgeItem } from "@/lib/api/types";

// AFTER
import type { EarnedBadgeItem as ApiEarnedBadgeItem } from "@/lib/api/generated/models";

// In hook files where both old and new types appear during migration
import type { UserResponse as GeneratedUserResponse } from "@/lib/api/generated/models";
```

### Pattern 4: Admin Domain — Split Approach

Admin domain has two distinct data sources that must NOT be conflated:

1. **Generated backend hooks** (lib/api/generated/admin/admin.ts): `useGetDashboardStats`, `useGetPopularKeywords`, `useGetTrafficAnalysis`, `useAdminListPosts`, `useAdminListSolutions`, `useAdminListBadges`, `useAdminListSpots`
2. **Next.js-internal hooks** (lib/hooks/admin/): `useDashboardStats`, `useAiCostKPI`, `useAuditList`, `usePipelines`, `useServerLogs` — these call `/api/v1/admin/*` Next.js routes backed by mock data generators; they are NOT in the backend OpenAPI spec and have NO generated equivalents.

The admin migration (Plan 41-04) only applies to items in category 1 — swapping backend data calls over to generated hooks. The Next.js-internal hooks stay unchanged.

### Anti-Patterns to Avoid

- **Dual hook usage on same endpoint simultaneously**: Never have both `fetchMyBadges()` and `useMyBadges()` (generated) fetching the same data in the same component tree — causes duplicate requests and cache conflicts.
- **Importing generated hooks inside `packages/shared`**: Breaks with "No QueryClient set" error (known Orval/TanStack monorepo issue, already documented in STATE.md). Generated hooks must remain in `packages/web`.
- **Editing generated files**: All files under `lib/api/generated/` are regenerated by `bun run generate:api` — any manual edits will be overwritten.
- **Deleting types.ts prematurely**: `types.ts` contains types used by upload endpoints (excluded from Orval — binary/multipart), coordinate utility functions (`apiToStoreCoord`, `storeToApiCoord`), and mutation DTOs still needed in Phase 42.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query key management | Custom queryKey arrays in every hook | Generated `getXxxQueryKey()` helpers from Orval | Auto-invalidation in Phase 42 depends on matching keys |
| TypeScript type adapter | Manual cast functions between old/new types | `import type { X as Y }` aliasing | Zero runtime cost; cast functions add test surface for no benefit |
| Re-fetching logic | Custom staleTime/gcTime per hook | Pass `query: { staleTime: N }` to generated hook options | Generated hooks already support all useQuery options via the options.query pass-through |
| Auth header injection | Adding headers in each hook | `customInstance` already handles Supabase JWT | Injecting auth anywhere else duplicates the mutator logic |

**Key insight:** The generated hooks are full-featured useQuery wrappers — they accept the complete `UseQueryOptions` via the `options.query` parameter. There is no need to wrap them in another `useQuery` call.

---

## Common Pitfalls

### Pitfall 1: Type Shape Mismatches Between Manual and Generated Models

**What goes wrong:** Migrating a consumer without updating its type imports causes TypeScript errors because generated models have different field shapes.

**Critical differences found:**
- `Category` (manual) has `name: { ko: string; en: string }` but generated `CategoryResponse` has `name: CategoryName` (same shape, different wrapper type) and adds `display_order`, `is_active`, `description`, `icon_url`
- `CommentResponse.created_at` is `number` (Unix timestamp) in manual types.ts but `string` (ISO date) in generated `CommentResponse`
- `UserResponse.rank` is `string | null` in manual types.ts but `string` (non-nullable) in generated `UserResponse`
- `Spot` (manual) has `post_id`, `category_id`, `solution_count` fields that are NOT in generated `SpotListItem` (which only has `id`, `position_left`, `position_top`, `category`, `status`, `created_at`)
- `SolutionListItem.vote_stats` uses `{ accurate: number; different: number }` in manual but `VoteStatsDto` in generated

**Why it happens:** The generated models are derived from the backend OpenAPI spec, which may define stricter types or slightly different field names than the manual types.ts that was written before the spec was fully established.

**How to avoid:** For each domain migration, audit the type diff before replacing imports. Use `import type { X as ManualX }` for old type, `import type { X as GeneratedX }` for new type, then update component code to use the generated type's actual fields.

**Warning signs:** TypeScript errors on `.rank`, `.post_id`, `.solution_count`, `created_at` type after updating imports.

### Pitfall 2: users.ts Uses Supabase Directly (Not REST API)

**What goes wrong:** The current `fetchMe()`, `fetchUserStats()`, and `fetchUserById()` in `lib/api/users.ts` go to Supabase directly — NOT through the REST API. The generated `useGetMyProfile` calls `GET /api/v1/users/me` on the backend.

**Why it happens:** The manual implementation was written before the backend user endpoints existed.

**How to avoid:** For Plan 41-03, switch `useMe` wrapper in `lib/hooks/useProfile.ts` to use `useGetMyProfile` (generated). This changes the data source from Supabase auth metadata to the backend user table. Verify that returned `UserResponse` fields from the backend include all fields that `profileStore.ts` and `ActivityItemCard.tsx` consume.

**Warning signs:** `rank`, `total_points`, `is_admin` showing null/0 after migration if backend endpoint returns different data.

### Pitfall 3: Admin Dashboard — Two Different "Dashboard Stats" Endpoints

**What goes wrong:** There are two different data sources for admin dashboard:
1. Generated `useGetDashboardStats` → calls `GET /api/v1/admin/dashboard` (backend REST)
2. Manual `useDashboardStats` in hooks/admin/useDashboard.ts → calls `/api/v1/admin/dashboard/stats` (Next.js route, returns mock KPIStats format)

These return DIFFERENT types: `DashboardStatsResponse` (generated, from backend) vs `KPIStats` (mock, with delta percentages). The admin dashboard page currently uses `useDashboardStats` (mock). For Plan 41-04, decide whether to switch the admin page to the real backend `useGetDashboardStats` or keep the mock pattern — this is a functional change, not just a plumbing change.

**How to avoid:** Keep the two data sources explicit. The plan should document which hook replaces which. Admin ai-cost/audit/pipeline/server-logs have no generated equivalents — those hooks stay as-is.

### Pitfall 4: Mapper Files Use Old Type Names

**What goes wrong:** `lib/utils/badge-mapper.ts` imports `ApiEarnedBadgeItem` and `ApiAvailableBadgeItem` from `lib/api/types.ts`. Generated equivalents are `EarnedBadgeItem` and `AvailableBadgeItem` (without the `Api` prefix). Similarly `lib/utils/ranking-mapper.ts` imports `ApiMyRankingDetail` and `ApiCategoryRank` — generated equivalents are `MyRankingDetailResponse` and `CategoryRank`.

**How to avoid:** When migrating badges/rankings domains in Plan 41-01, update both the hooks AND the mapper files. Use `import type { EarnedBadgeItem as ApiEarnedBadgeItem }` to keep the mapper's internal alias stable if desired.

### Pitfall 5: Wrapper Hooks That Re-wrap with Different Query Keys

**What goes wrong:** `lib/hooks/useProfile.ts` uses `profileKeys.badges()` as the query key for badges, while the generated hook uses `['/api/v1/badges/me']`. After migration, if both keys exist (one from old cache, one from new), there will be duplicate cache entries that never invalidate each other.

**How to avoid:** When switching a wrapper hook to use a generated hook, either: (a) pass `queryKey: profileKeys.badges()` via `options.query.queryKey` to override the generated key, OR (b) update all invalidation calls throughout the codebase to use the generated key. Option (a) is safer for Phase 41 since Phase 42 hasn't wired invalidation yet.

---

## Code Examples

Verified patterns from the generated codebase:

### Calling a Generated Hook with Custom Options

```typescript
// Source: packages/web/lib/api/generated/badges/badges.ts
// Generated hook signature:
export function useMyBadges<TData, TError>(
  options?: { query?: Partial<UseQueryOptions<...>>, request?: SecondParameter<typeof customInstance> },
  queryClient?: QueryClient
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> }

// Usage in wrapper hook:
import { useMyBadges as useMyBadgesGenerated } from "@/lib/api/generated/badges/badges";

export function useMyBadges(options?) {
  return useMyBadgesGenerated({
    query: {
      staleTime: 1000 * 60 * 5,
      queryKey: profileKeys.badges(), // preserve existing key for cache continuity
      ...options,
    }
  });
}
```

### Parameterized Hook (with path param)

```typescript
// Source: packages/web/lib/api/generated/comments/comments.ts
// Generated hook: useListComments(postId: string, options?)

// Wrapper hook migration:
import { useListComments as useListCommentsGenerated } from "@/lib/api/generated/comments/comments";

export function useComments(postId: string) {
  return useListCommentsGenerated(postId, {
    query: {
      queryKey: commentKeys.list(postId), // preserve existing cache key
      enabled: !!postId,
    }
  });
}
```

### Type Aliasing for Collision Resolution

```typescript
// Source: lib/utils/badge-mapper.ts (after migration)
import type { EarnedBadgeItem as ApiEarnedBadgeItem } from "@/lib/api/generated/models";
import type { AvailableBadgeItem as ApiAvailableBadgeItem } from "@/lib/api/generated/models";
// Rest of mapper unchanged — field access still works if shapes are compatible
```

### Users Domain: Switching from Supabase-Direct to Backend API

```typescript
// Source: lib/hooks/useProfile.ts (after migration)
import { useGetMyProfile } from "@/lib/api/generated/users/users";

export function useMe(options?) {
  return useGetMyProfile({
    query: {
      queryKey: profileKeys.me(),
      staleTime: 1000 * 60 * 5,
      ...options,
    }
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import { fetchMyBadges } from "@/lib/api/badges"` + manual `useQuery` | `useMyBadges()` from generated hooks | Phase 41 | Remove queryFn boilerplate; type safety from OpenAPI spec |
| `fetchMe()` via Supabase auth metadata | `useGetMyProfile()` via backend REST | Phase 41 | Real server-side user data (rank, points, is_admin) instead of auth metadata |
| Manual `Category` type with `{ ko, en }` | Generated `CategoryResponse` with `CategoryName` | Phase 41 | Backend spec-driven types become SSOT |
| `lib/api/types.ts` as global type hub | `lib/api/generated/models/` (165 type files) | Phase 41 end | Import from specific model files |

**Still valid (do NOT migrate in Phase 41):**
- `uploadImage()` in posts.ts — binary upload, excluded from Orval permanently
- `createPost*()` functions in posts.ts — mutations, Phase 42
- `lib/api/admin/*.ts` files for ai-cost/audit/pipeline/server-logs — Next.js-internal routes with no backend equivalent
- Supabase-direct queries in `useImages.ts`, `usePosts.ts` (legacy functions) — out of scope

---

## Open Questions

1. **CommentResponse.created_at type mismatch (number vs string)**
   - What we know: Manual type has `created_at: number`, generated has `created_at: string`
   - What's unclear: Does `CommentSection.tsx` render the timestamp directly, or pass it to a formatter? If it calls `new Date(created_at)` it works for both; if it does arithmetic it will break with string.
   - Recommendation: Read `CommentSection.tsx` before Plan 41-02, add `select` transform if needed: `select: (data) => data.map(c => ({ ...c, created_at: typeof c.created_at === 'string' ? new Date(c.created_at).getTime() : c.created_at }))`

2. **SpotListItem missing solution_count field**
   - What we know: Manual `Spot` type has `solution_count: number`; generated `SpotListItem` does not
   - What's unclear: Which components use `spot.solution_count`? Does `ImageDetailContent.tsx` need it?
   - Recommendation: Audit `solution_count` usage before Plan 41-02. If needed, use `SpotWithTopSolution` from generated models (which exists in `PostDetailResponse`) instead of direct `SpotListItem`.

3. **Admin dashboard migration scope**
   - What we know: `useGetDashboardStats` (generated) returns `DashboardStatsResponse` (real backend); current `useDashboardStats` (manual) returns mock `KPIStats`
   - What's unclear: Should Plan 41-04 migrate the admin dashboard page to use real backend data, or keep the mock? This is a product decision.
   - Recommendation: Keep mock hooks as-is for Plan 41-04; only migrate explicit backend-only admin queries (adminListPosts, adminListSolutions, adminListBadges, adminListSpots). Dashboard/ai-cost/audit/pipeline/server-logs stay on mock routes.

---

## Validation Architecture

> `workflow.nyquist_validation` is not present in `.planning/config.json` — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (e2e) + TypeScript compiler (type check) |
| Config file | `packages/web/playwright.config.ts` (if exists), else TypeScript `tsc --noEmit` |
| Quick run command | `cd packages/web && bun run type-check` (or `bunx tsc --noEmit`) |
| Full suite command | `bun run build` (Next.js build catches type errors) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-01 | badges/rankings/categories render with generated hooks | type-check | `bunx tsc --noEmit` from packages/web | ✅ (tsc always available) |
| MIG-02 | comments/spots/solutions render with generated hooks | type-check | `bunx tsc --noEmit` from packages/web | ✅ |
| MIG-03 | users/posts render with generated hooks | type-check + smoke | `bunx tsc --noEmit` + `bun run build` | ✅ |
| MIG-04 | admin domain reads work | type-check | `bunx tsc --noEmit` | ✅ |
| MIG-08 | No type duplicates from types.ts | type-check | `bunx tsc --noEmit` | ✅ |

### Sampling Rate
- **Per task commit:** `cd packages/web && bunx tsc --noEmit`
- **Per wave merge:** `bun run build` from repo root
- **Phase gate:** Full build green before `/gsd:verify-work`

### Wave 0 Gaps
- None — TypeScript compiler is the primary validation mechanism and requires no setup. No dedicated unit test files needed for this migration phase; type correctness is the acceptance criterion.

---

## Domain-by-Domain Migration Map

### Plan 41-01: badges, rankings, categories + types.ts audit (MIG-01, MIG-08)

| Domain | Manual File to Delete | Generated Hook | Wrapper Hook to Update |
|--------|-----------------------|----------------|------------------------|
| badges | `lib/api/badges.ts` | `useListBadges`, `useMyBadges`, `useGetBadge` | `useMyBadges` in `useProfile.ts` |
| rankings | `lib/api/rankings.ts` | `useListRankings`, `useGetMyRanking`, `useGetCategoryRankings` | `useMyRanking` in `useProfile.ts` |
| categories | `lib/api/categories.ts` | `useGetCategories` | Any component calling `getCategories()` |

**Mapper updates required:**
- `lib/utils/badge-mapper.ts`: `ApiEarnedBadgeItem` → `EarnedBadgeItem`, `ApiAvailableBadgeItem` → `AvailableBadgeItem`
- `lib/utils/ranking-mapper.ts`: `ApiMyRankingDetail` → `MyRankingDetailResponse`, `ApiCategoryRank` → `CategoryRank`

**types.ts audit (MIG-08):** Identify which types in `types.ts` have generated equivalents. Do NOT delete types still used by Phase 41 out-of-scope code (upload, mutations). Begin the import-aliasing pattern.

### Plan 41-02: comments, spots, solutions (MIG-02)

| Domain | Manual File | Generated Hook | Wrapper Hook |
|--------|-------------|----------------|--------------|
| comments | `lib/api/comments.ts` (READ only: `fetchComments`) | `useListComments(postId)` | `useComments` in `useComments.ts` |
| spots | `lib/api/spots.ts` (READ only: `fetchSpots`) | `useListSpots(postId)` | `useSpots` in `useSpots.ts` (if exists) |
| solutions | `lib/api/solutions.ts` (READ only: `fetchSolutions`) | `useListSolutions(spotId)` | `useSolutions` in `useSolutions.ts` |

**Note:** Do NOT delete these manual files — they contain mutation functions (`createComment`, `createSpot`, `createSolution`, etc.) needed in Phase 42. Only remove/replace the read functions.

### Plan 41-03: users, posts (MIG-03)

| Domain | Manual File | Generated Hooks | Wrapper Hooks |
|--------|-------------|-----------------|---------------|
| users | `lib/api/users.ts` | `useGetMyProfile`, `useGetMyStats`, `useGetMyActivities`, `useGetUserProfile` | `useMe`, `useUserStats`, `useUserActivities`, `useUser` in `useProfile.ts` |
| posts | `lib/api/posts.ts` (READ only) | `useListPosts(params)`, `useGetPost(postId)` | `useInfinitePosts` in `usePosts.ts`, `fetchPosts` calls in `useImages.ts` |

**Special case — users.ts:** Current `fetchMe()` uses Supabase auth metadata. Switch to `useGetMyProfile` means data comes from backend REST. Verify `profileStore.ts` `setUserFromApi()` accepts `UserResponse` (generated) shape.

**Special case — posts.ts:** `lib/hooks/useImages.ts` imports `fetchPosts`, `fetchPostDetail`, `fetchPostMagazine` directly from `lib/api/posts`. These must be replaced with generated hooks. `usePostMagazine` may not have a generated equivalent — check if `post-magazines` endpoint is in generated files.

### Plan 41-04: admin + types.ts deletion (MIG-04, MIG-08)

| Domain | Action |
|--------|--------|
| `lib/api/admin/dashboard.ts` | KEEP — serves Next.js-internal mock routes |
| `lib/api/admin/ai-cost.ts` | KEEP — no backend equivalent |
| `lib/api/admin/audit.ts` | KEEP — no backend equivalent |
| `lib/api/admin/pipeline.ts` | KEEP — no backend equivalent |
| `lib/api/admin/server-logs.ts` | KEEP — no backend equivalent |
| `lib/hooks/admin/useDashboard.ts` | Keep mock hooks; optionally add generated `useGetDashboardStats` as a parallel "real data" hook |
| `lib/api/types.ts` | DELETE types that have generated equivalents; KEEP `UploadResponse`, `AnalyzeRequest/Response`, coordinate utility functions, types used by still-active mutation paths |

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `packages/web/lib/api/generated/` — all generated files (badges, categories, comments, posts, rankings, solutions, spots, users, admin, models/index.ts)
- Direct code inspection: `packages/web/lib/api/types.ts` — full manual types inventory
- Direct code inspection: `packages/web/lib/hooks/useProfile.ts`, `useComments.ts`, `usePosts.ts`, `useImages.ts` — current consumer patterns
- Direct code inspection: `packages/web/lib/hooks/admin/useDashboard.ts`, `useAiCost.ts`, `useAudit.ts`, `usePipeline.ts` — admin data sources

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` v9.0 decisions — confirmed Orval constraints still apply
- `.planning/REQUIREMENTS.md` — MIG-01 through MIG-09 definitions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — dependencies already installed, hooks already generated
- Architecture: HIGH — migration pattern directly visible from existing code
- Type mismatches: HIGH — verified by reading both manual types.ts and generated model files
- Admin scope: HIGH — confirmed audit/pipeline/server-logs have no backend API equivalents
- Pitfalls: HIGH — based on direct code inspection of consumers

**Research date:** 2026-03-23
**Valid until:** Until next `bun run generate:api` changes generated code shapes (stable for 30 days assuming no OpenAPI spec changes)
