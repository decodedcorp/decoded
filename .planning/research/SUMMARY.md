# Project Research Summary

**Project:** decoded-monorepo — v10.0 Profile Page Completion
**Domain:** Social fashion discovery platform — profile completion milestone
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

This milestone completes four stub areas on the decoded profile page: auth guard on `/profile`, real data for the Tries and Saved activity tabs, real follower/following counts in `FollowStats`, and a new public user profile route at `/profile/[userId]`. The existing architecture (React Query, Supabase, Orval-generated API client, Next.js proxy middleware) already supports all four features. No new packages are required. The implementation is additive — new files, targeted modifications to existing components, and one modification to `proxy.ts`.

The primary constraint is a missing backend: the Rust/Axum API has zero follow endpoints, no tries-list endpoint, and no saved-posts-list endpoint in the current OpenAPI spec. This blocks full implementation of two features. The pragmatic approach is to use Supabase direct queries (an established pattern in this codebase via `lib/supabase/queries/profile.ts`) for follow counts and the tries history grid, while deferring follow write actions and saved-posts list until the backend ships those endpoints. The one unblocked, high-value feature — the public user profile at `/profile/[userId]` — has a working backend endpoint (`GET /api/v1/users/{user_id}`), an existing proxy route, and an existing generated hook. It only needs a new Next.js page and client component.

The key risk is scope creep around the follow system. The UI (`FollowButton`, `FollowStats`) already exists and looks complete, which tempts teams to wire mutations that have no backend endpoint. The correct posture for v10.0 is: display real read counts (from Supabase direct query), render a non-functional follow button as a placeholder on the public profile, and defer all follow write operations to a dedicated follow-system milestone triggered by backend endpoint delivery.

---

## Key Findings

### Recommended Stack

No new packages are needed. The milestone is zero-dependency. All required tools are present: `@tanstack/react-query` v5 with `useInfiniteQuery` (already pattern-established in `useUserActivities`), `@supabase/auth-helpers-nextjs` for server-side session check in `proxy.ts`, `next/navigation` `redirect()` for the auth guard, and Orval-generated hooks (`useGetUserProfile`) for the public profile page.

**Core technologies in use:**
- `@tanstack/react-query@5.90.11`: data fetching, infinite scroll, mutation with cache invalidation — established patterns exist in the codebase; no changes required
- `@supabase/supabase-js@2.86.0` + `@supabase/auth-helpers-nextjs@0.15.0`: session check in `proxy.ts` (admin pattern to extend), Supabase direct queries for tries/follow counts — already wired
- Orval-generated API client (`useGetUserProfile`, `getMyActivities`): wraps the Rust backend REST API; runs via `bun run generate:api`; no new generation config needed
- Next.js 16 `proxy.ts` (not `middleware.ts`): the project-specific middleware file; all route guards go here; existing admin pattern is the direct template

### Expected Features

**Must have (table stakes) — v10.0:**
- **Auth guard on `/profile`** — unauthenticated users expect a redirect to login, not a broken skeleton
- **Tries tab real data** — users who ran VTON expect to see their history; stub returning `[]` reads as broken, not empty
- **Saved tab real data** — saved items lost on page refresh is unacceptable; Supabase persistence required
- **Followers/following real counts** — hardcoded `1234/567` in production destroys trust immediately
- **`/profile/[userId]` public page** — clicking a username anywhere in the app must navigate somewhere; currently leads to a 404

**Should have — v10.x (backend-blocked):**
- Follow/unfollow write action — requires `POST/DELETE /api/v1/users/{userId}/follow`; defer until backend ships it
- Public profile `og:` metadata via `generateMetadata` — low cost once the page exists; high share value for K-pop fan culture

**Defer to v11+:**
- Followers/following list modal — requires backend list endpoints
- Boards/Collage API persistence — backend blocker; UI already exists in `SavedGrid`
- Try-on result detail view — depends on Tries tab landing first

**Anti-features to avoid:**
- Real-time follower count via WebSocket — no WebSocket infrastructure; `refetchOnWindowFocus` is sufficient
- Block/mute system — scope is a separate moderation milestone, not profile completion

### Architecture Approach

The profile feature uses a two-layer data strategy: Orval-generated React Query hooks for Rust backend endpoints, and Supabase direct queries for data not yet exposed through the REST API. Both patterns already exist in `lib/hooks/useProfile.ts` and `lib/supabase/queries/profile.ts`. New features extend these files rather than introducing new patterns. Zustand stores (`profileStore`, `collectionStore`) act as UI state bridges — they must not hold server data; server data belongs in the React Query cache.

**Major components and their changes:**
1. `proxy.ts` — add `/profile` (exact) and `/profile/:path*` to matcher; add session-based redirect branch for the exact `/profile` path only; session propagation runs for all profile sub-paths
2. `app/profile/[userId]/page.tsx` + `UserProfileClient.tsx` — new files; reuse existing profile primitive components with different data sources, no edit, no private tabs
3. `lib/hooks/useProfile.ts` — add `useFollowCounts`, `useIsFollowing`, `useFollowMutation`, `useMyTryOnHistory`, `useMySavedPosts`
4. `lib/supabase/queries/profile.ts` — add `fetchFollowCounts`, `fetchIsFollowing`, `followUser`, `unfollowUser`, `fetchMyTryOnHistory`
5. `lib/components/profile/FollowStats.tsx` — remove hardcoded defaults; accept real props from orchestrator
6. `lib/components/profile/TriesGrid.tsx` — replace stub `fetchMyTries()` with `useMyTryOnHistory` + infinite scroll via `IntersectionObserver`
7. `lib/components/profile/SavedGrid.tsx` — replace `collectionStore` mock load with real data hook; remove `MOCK_PINS`

### Critical Pitfalls

1. **Follow API called without proxy routes causes CORS errors** — the Rust backend has no follow endpoints in the current spec; calling the backend directly from the browser produces CORS errors. Verify the spec before writing any follow component code; add proxy routes first; run `generate:api` after spec update. Do not write manual fetch wrappers.

2. **Client-side auth guard causes flash of unauthorized content** — `authStore` initializes asynchronously; a `useEffect`-based redirect exposes the profile skeleton briefly to unauthenticated users. The fix is server-side in `proxy.ts` (pre-render). This is the only correct approach for the own-profile route.

3. **`proxy.ts` matcher scope mismatch blocks the public profile or misses session refresh** — using `/profile/:path*` as the auth redirect guard blocks the public `/profile/[userId]` route. The auth redirect must trigger only for the exact `/profile` path. However, session cookie propagation (cookie refresh) must apply to `/profile/:path*` as well. The proxy handler must distinguish the two cases in its logic, not just via the matcher pattern.

4. **Stale empty `["my-tries"]` React Query cache after real API is wired** — the stub returns `[]` and React Query caches it as a successful result. When the real API is wired, stale empty data is served until cache expiry. Fix: scope the query key by `userId` (`["my-tries", userId]`), which inherently invalidates old entries and prevents cross-user cache pollution on shared devices.

5. **`MOCK_PINS` in `collectionStore` ships to production** — `SavedGrid` currently loads `MOCK_PINS` (60+ lines of fake data with `picsum.photos` images). These will appear in production if not removed before the Saved tab PR merges. Grepping `MOCK_PINS` returning 0 results must be a PR gate condition.

---

## Implications for Roadmap

Based on combined research, a 5-phase structure is recommended for v10.0, plus one backend-triggered phase for v10.x.

### Phase 1: Auth Guard
**Rationale:** Auth guard is the simplest feature (extending `proxy.ts` + redirect logic) and is a prerequisite for meaningful testing of all other own-profile features. Own-profile tabs (Tries, Saved) only function correctly when there is a guaranteed authenticated session. Must come first.
**Delivers:** Unauthenticated redirect to `/login?redirect=/profile`; no flash of profile skeleton; server-side pre-render enforcement via `proxy.ts`
**Addresses:** "Auth guard on `/profile`" (P1 table stakes)
**Avoids:** Pitfall 2 (client-side flash), wrong redirect destination (must go to `/login`, not `/`)

### Phase 2: Public User Profile (`/profile/[userId]`)
**Rationale:** This is the only feature with zero backend blockers. `GET /api/v1/users/{user_id}` exists in the spec, the proxy route exists, and the generated hook exists. Only new Next.js files are needed. Shipping this early delivers immediate user-facing value (username clicks work anywhere in the app) and establishes the `UserProfileClient` component that the follow-system phase will extend.
**Delivers:** `app/profile/[userId]/page.tsx` + `UserProfileClient.tsx`; read-only public profile (avatar, name, bio, stats); follow button placeholder (non-functional); no private tabs (Tries/Saved); proxy matcher updated for session propagation on `/profile/:path*`
**Addresses:** "/profile/[userId] public page" (P1), "own vs. other differentiation" (P1)
**Avoids:** Pitfall 3 (proxy matcher scope), duplicating `useUser()` hook that already exists

### Phase 3: Follow Counts (Real Data)
**Rationale:** Follow counts are visible on every profile load. Replacing hardcoded `1234/567` with real data is high-trust, low-effort, and does not require backend follow write endpoints. Uses the established Supabase direct query pattern from `profile.ts`. Must verify `user_follows` table existence in Supabase before implementing — this is the one open question that could block this phase.
**Delivers:** `useFollowCounts` hook; `fetchFollowCounts` Supabase query; `FollowStats.tsx` hardcoded defaults removed; real counts on both own profile and public profile
**Addresses:** "Followers/following real counts" (P1)
**Avoids:** Pitfall (hardcoded defaults shipping to production)
**Prerequisite check:** Confirm `user_follows` table exists in Supabase schema before Phase 3 begins

### Phase 4: Tries Tab (Real Data + Infinite Scroll)
**Rationale:** Tries tab has a clear Supabase data source (`user_tryon_history` table, confirmed accessible via `fetchTryOnCount`). The infinite scroll pattern is established in `useUserActivities`. This phase replaces the stub and wires the real data source, completing one of the two "no stub data" goals.
**Delivers:** `useMyTryOnHistory` hook with `useInfiniteQuery`; `fetchMyTryOnHistory` Supabase query; replaced `TriesGrid` stub; inline `useInfiniteScrollTrigger` hook (~15 lines, no new package); query key scoped by `userId`
**Addresses:** "Tries tab real data" (P1 table stakes)
**Avoids:** Pitfall 4 (stale empty cache — query key must include `userId`)
**Prerequisite check:** Confirm `user_tryon_history` schema includes `result_image_url` and other fields `TriesGrid` expects

### Phase 5: Saved Tab (Real Data)
**Rationale:** Saved tab has the most uncertainty — no `GET /api/v1/users/me/saved` endpoint in the OpenAPI spec, and `collectionStore` uses mock data that must be removed before any production merge. Placed last in v10.0 because it requires an upfront design decision (Supabase direct vs. undocumented backend endpoint) that should be made after the team has established the pattern from Phases 3 and 4.
**Delivers:** `useMySavedPosts` hook; `MOCK_PINS` removal from `collectionStore`; real pin data in `SavedGrid` (flat list only for v10.0); Boards/Collage sub-tabs remain as UI-only placeholders
**Addresses:** "Saved tab real data" (P1 table stakes)
**Avoids:** Pitfall 5 (mock pins shipping to production — grep `MOCK_PINS` must return 0 before merge)
**Prerequisite check:** Determine if `GET /api/v1/users/me/saved` exists on the live backend (not in spec) or if Supabase `saved_posts` table is the data source

### Phase 6 (v10.x, backend-triggered): Follow System Write Operations
**Rationale:** Follow/unfollow write operations are fully blocked on backend endpoint delivery. This phase is triggered externally when `POST/DELETE /api/v1/users/{userId}/follow` lands in the backend OpenAPI spec. The follow button placeholder from Phase 2 communicates intent without false functionality until then.
**Delivers:** `useFollowMutation` hook with optimistic update + cache invalidation; `followUser`/`unfollowUser` mutations; functional follow button on public profile; `FollowStats` counts update without page reload after follow action
**Addresses:** "Follow/unfollow action" (P2)
**Avoids:** Pitfall 1 (CORS from missing proxy routes — add proxy routes before wiring mutation), Pitfall 6 (stale follow button state — mutation must invalidate both user stats and follow status queries)

### Phase Ordering Rationale

- Phase 1 before everything: own-profile features require a guaranteed authenticated session; without the auth guard, Tries and Saved tab data fetching cannot assume a logged-in user
- Phase 2 second because it has zero backend blockers and the `UserProfileClient` becomes a shared foundation for Phase 6; establishing the public profile routing also forces the proxy matcher to be updated correctly early
- Phases 3-5 ordered by increasing uncertainty: follow counts (one Supabase query, predictable) → tries (known table, established `useInfiniteQuery` pattern) → saved (requires backend investigation before implementation begins)
- Phase 6 is externally triggered and cannot be scheduled until the backend team confirms endpoint delivery

### Research Flags

Phases requiring deeper investigation before implementation begins:

- **Phase 3 (potentially blocking):** Confirm `user_follows` table exists in Supabase. The `types.ts` file (updated 2026-03-18) lists 11 tables with no `user_follows`. If absent, a DB migration coordinated with the backend team is a Phase 3 prerequisite — this could add lead time.
- **Phase 4 (schema validation):** Confirm `user_tryon_history` has `result_image_url` and other fields expected by `TriesGrid`. The existing `fetchTryOnCount` only selects `id`. Run a Supabase query or inspect the schema directly before writing the Phase 4 Supabase query.
- **Phase 5 (design decision):** Determine whether `GET /api/v1/users/me/saved` exists on the live backend (undocumented) or whether Supabase direct query is the only path. This decision affects whether a new proxy route is needed and which query pattern to follow.

Phases with established patterns (skip additional research):

- **Phase 1:** Exact pattern exists in `proxy.ts` for `/admin`. Extending to `/profile` is mechanical — no new concepts involved.
- **Phase 2:** Backend endpoint exists, proxy route exists, generated hook exists. Standard Next.js App Router dynamic route. No research needed.
- **Phase 4 (once schema confirmed):** `useInfiniteQuery` + `IntersectionObserver` pattern is fully established in `useUserActivities`. Replicate directly.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase inspection; all required packages confirmed present; no new dependencies needed; zero-package conclusion verified by reading the existing hook and proxy patterns |
| Features | HIGH | OpenAPI spec enumerated directly (all 63-67 paths); existing components read; mock/stub states confirmed in source; industry patterns (Instagram/Pinterest/Weverse) from known platform behavior |
| Architecture | HIGH | All 18 profile components inspected; existing hook patterns read; Supabase query patterns confirmed; `proxy.ts` admin implementation verified; data flow diagrams derived from codebase, not assumption |
| Pitfalls | HIGH | Direct code reading of stub patterns, hardcoded values, and missing proxy routes confirmed in source; React Query cache behavior pitfalls from established v5 knowledge |

**Overall confidence:** HIGH

### Gaps to Address

- **`user_follows` table existence (blocking for Phase 3):** `types.ts` (updated 2026-03-18) lists 11 Supabase tables with no `user_follows`. If the table doesn't exist, Phase 3 requires a DB migration before any frontend work. Verify with `supabase db diff` or direct schema inspection before Phase 3 planning begins.

- **`user_tryon_history` full schema (affects Phase 4):** Only `id` is used by the existing `fetchTryOnCount` query. The tries tab needs `result_image_url`, `created_at`, and potentially `item_count`. Confirm all required columns exist before writing the Phase 4 Supabase query.

- **`GET /api/v1/users/me/saved` endpoint existence (blocking for Phase 5):** The save/unsave per-post endpoints exist (`lib/api/savedPosts.ts`), but no list endpoint is in the spec. Phase 5 design cannot be finalized until it is confirmed whether (a) the backend has an undocumented list endpoint or (b) Supabase direct is the only path. Fetch and inspect the live backend spec at the start of Phase 5.

- **Public profile activity visibility (explicit scope cut):** `GET /api/v1/users/{user_id}/activities` does not exist in the spec. The Phase 2 public profile page will show no activity tabs for other users. This must be documented explicitly in Phase 2 implementation to prevent scope creep when reviewers ask "where are their posts?"

---

## Sources

### Primary (HIGH confidence)
- `packages/api-server/openapi.json` — direct enumeration of all 63-67 backend endpoints; confirmed absence of follow, tries-list, saved-list endpoints
- `packages/web/proxy.ts` — admin auth guard pattern; `createSupabaseMiddlewareClient` + `config.matcher` implementation confirmed
- `packages/web/lib/hooks/useProfile.ts` — existing hook implementations; `useUser`, `useUserActivities`, `useInfiniteQuery` v5 pattern
- `packages/web/lib/components/profile/` — all 18 profile components; stub states in `TriesGrid`, `SavedGrid`, `FollowStats` confirmed directly
- `packages/web/lib/supabase/queries/profile.ts` — Supabase direct query pattern for `fetchTryOnCount`, `fetchUserProfileExtras`
- `packages/web/lib/supabase/types.ts` — Supabase table schemas as of 2026-03-18; 11 tables listed
- `packages/web/lib/stores/collectionStore.ts` — `MOCK_PINS` constant (60+ lines of fake data) confirmed
- `packages/web/app/api/v1/users/` — existing proxy routes confirmed; absence of follow proxy routes confirmed
- `packages/web/lib/api/savedPosts.ts` — per-post save/unsave/status endpoints confirmed; no list endpoint

### Secondary (MEDIUM confidence)
- Industry platform behavior (Instagram, Pinterest, Weverse) — follow system UX conventions, own vs. other profile differentiation, saved/collections hierarchy patterns

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
