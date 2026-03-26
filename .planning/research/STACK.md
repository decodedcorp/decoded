# Stack Research

**Domain:** Profile Page Completion — Follow system, Auth guard, Infinite scroll tabs, Public user profile routing
**Researched:** 2026-03-26
**Confidence:** HIGH (codebase direct inspection + OpenAPI spec analysis)

---

## Context: Existing Stack — Do Not Re-Research

Validated from codebase inspection. Already installed, zero changes needed:

| Package | Version | Status |
|---------|---------|--------|
| Next.js | 16.0.7 | Stays |
| React | 18.3.1 (PROJECT.md says 18) | Stays |
| TypeScript | 5.9.3 | Stays |
| @tanstack/react-query | 5.90.11 | Stays — `useInfiniteQuery` already in use |
| Zustand | 4.5.7 | Stays |
| @supabase/supabase-js | 2.86.0 | Stays |
| @supabase/auth-helpers-nextjs | 0.15.0 | Stays |
| Orval-generated API client | (regenerated) | Stays — `useGetUserProfile`, `getMyActivities` already generated |
| axios | (in use via Orval mutator) | Stays |
| Tailwind CSS | 3.4.18 | Stays |
| bun | 1.3.10+ | Stays |

**Critical discovery from OpenAPI spec inspection:**
The Rust backend exposes exactly 5 user endpoints: `GET/PATCH /api/v1/users/me`, `GET /api/v1/users/me/activities`, `GET /api/v1/users/me/stats`, `GET /api/v1/users/{user_id}`. **There are no follow system endpoints** (`/follow`, `/followers`, `/following`) in the current backend spec. The follow system UI is mock data only.

---

## New Stack: What to Add

### Core Technologies

No new core framework or library additions required. All four milestone features
are achievable with the existing stack.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| None | — | — | The existing stack covers all four features. See supporting libraries below for the one optional addition. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/navigation` (already in stack) | Next.js 16 built-in | `useRouter`, `usePathname`, `redirect()` for auth guard client and server redirects | Use `redirect()` (server) in `page.tsx` server component for auth guard; `useRouter().push('/login')` (client) as fallback in ProfileClient |
| `@supabase/auth-helpers-nextjs` (already in stack) | 0.15.0 | `createSupabaseMiddlewareClient` for session check in `proxy.ts` | Already powers admin auth guard in `proxy.ts` — extend same pattern to `/profile` route |
| `useIntersectionObserver` (implement inline, no package) | N/A | Trigger `fetchNextPage()` when sentinel element enters viewport | Build a ~15-line custom hook using native `IntersectionObserver` API; no third-party dependency needed given existing pattern in `useUserActivities` |

**No new npm packages are needed.** The one judgment call is `IntersectionObserver` for
infinite scroll — do not install `react-intersection-observer` package; the existing
codebase implements this pattern inline and native browser API is sufficient for this
feature's scroll trigger use case.

### Development Tools

No new tools needed. Orval will regenerate the API client when backend adds follow
endpoints. The current `bun run generate:api` workflow handles that automatically.

---

## Feature-by-Feature Stack Analysis

### Feature 1: Auth Guard — Unauthenticated redirect

**Stack needed:** `proxy.ts` extension (server-side) + optional client-side fallback

**Pattern:**
- Extend the existing `proxy.ts` `config.matcher` to include `/profile/:path*`
- The `proxy()` function already does session check via `createSupabaseMiddlewareClient`
- For `/profile`, redirect to `/login` (not `/` like admin — user should be told why)
- Client-side fallback: `useAuthStore` already exposes session state; `ProfileClient` can early-return a redirect if session missing

**Why no new packages:** `proxy.ts` already imports `createSupabaseMiddlewareClient` and
`NextResponse.redirect`. Adding `/profile` to the matcher is a one-line config change.

**Constraint:** Next.js 16 uses `proxy.ts` (not `middleware.ts`) per project convention.
The `config.matcher` must include both `/admin/:path*` and `/profile/:path*`.

---

### Feature 2: Follow System — Followers/Following real data

**Stack needed:** None yet. Backend has no follow endpoints.

**Critical finding:** OpenAPI spec (inspected at `packages/api-server/openapi.json`) has
zero follow-related endpoints. `UserResponse` schema has no `followers_count` or
`following_count` fields. `UserStatsResponse` has no follow fields.

**Current state:** `FollowStats.tsx` renders hardcoded `followers={1234}` and `following={567}`.
`UserResponse` from the API contains only: `id`, `avatar_url`, `bio`, `display_name`,
`email`, `is_admin`, `rank`, `total_points`, `username`.

**What to do now (without backend):**
- Wire `followers` and `following` props from `useUserStats()` if/when the backend adds
  those fields to `UserStatsResponse`
- For this milestone: display `0` counts from real data rather than hardcoded placeholders
- `FollowStats.tsx` needs to accept `undefined` counts gracefully (show `—` or `0`)

**When backend adds follow endpoints:** Orval will generate `useFollowUser`,
`useUnfollowUser`, `useGetFollowers`, `useGetFollowing` hooks after `bun run generate:api`.
No new packages needed at that point — hooks drop into the existing React Query setup.

**Stack decision:** Do NOT build a custom Supabase follow table or Shadow API route for
follow counts. Follow the "API-first" constraint from `PROJECT.md`. Mock or omit until
backend is ready.

---

### Feature 3: Tries/Saved tabs — API connection + infinite scroll

**Stack needed:** No new packages. Pattern already established.

**Tries tab — current state:**
- `TriesGrid.tsx` has a stub `fetchMyTries()` returning `[]`
- Comment says: `Will be: GET /api/v1/users/me/tries`
- That endpoint does NOT exist in the OpenAPI spec
- `useTries.ts` in `lib/hooks/` is also a stub returning `{ tries: [], total: 0 }`

**Saved tab — current state:**
- `SavedGrid.tsx` uses `collectionStore` (Zustand), which manages `pins`, `boards`, `collage`
- This is NOT API-driven — it's a local Zustand store with a `loadCollection()` action
- No backend endpoint for saved items in the spec

**What the milestone should do:**
- **Tries tab:** Keep stub but add proper loading/empty states with real data shape; wire
  to real API when backend exposes the endpoint. Use `useInfiniteQuery` pattern from
  `useUserActivities` as the template.
- **Saved tab:** The `collectionStore.loadCollection()` needs to fetch from real data
  source — determine if this is Supabase direct query (like `useProfileExtras`) or backend
  API. Current Supabase schema inspection needed but that's phase-specific research.

**Infinite scroll pattern (already established):**
```typescript
// Pattern already in useUserActivities — replicate for tries/saved
const { fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: [...],
  queryFn: async ({ pageParam = 1 }) => fetchEndpoint({ page: pageParam }),
  getNextPageParam: (lastPage) =>
    lastPage.pagination.current_page < lastPage.pagination.total_pages
      ? lastPage.pagination.current_page + 1
      : undefined,
  initialPageParam: 1,
});
```

The scroll trigger uses an `IntersectionObserver` sentinel div — implement as a reusable
`useInfiniteScrollTrigger` hook inline in the profile hooks file. 15-20 lines, no package.

---

### Feature 4: Public user profile — `/profile/[userId]`

**Stack needed:** No new packages. Next.js dynamic routes + existing generated hook.

**Current state:**
- `GET /api/v1/users/{user_id}` backend endpoint exists
- `app/api/v1/users/[userId]/route.ts` proxy route exists (no auth required)
- `useGetUserProfile(userId)` generated hook already wraps this endpoint (seen in `useProfile.ts`)
- `useUser(userId)` wrapper hook already exists in `lib/hooks/useProfile.ts`
- **Missing:** `app/profile/[userId]/page.tsx` and `app/profile/[userId]/ProfilePublicClient.tsx`

**Pattern:** Mirror `app/profile/page.tsx` (private) but:
- Use `useUser(userId)` instead of `useMe()`
- Show follow button instead of edit button
- No edit modal
- Read-only activity tabs (posts/spots/solutions only — no tries/saved for other users)
- No auth guard needed (public profile is accessible without login)

**Routing:** Next.js App Router dynamic segment. Path: `app/profile/[userId]/page.tsx`.
Conflicts to check: current `/profile` maps to `/profile/page.tsx`; adding
`/profile/[userId]` is additive, no conflict.

---

## Proxy Routes Needed

New backend proxy routes that do not exist yet:

| Route | Status | Notes |
|-------|--------|-------|
| `GET /api/v1/users/me/tries` | NOT in backend spec | Build stub proxy; real endpoint pending backend |
| `POST /api/v1/users/{userId}/follow` | NOT in backend spec | Do not build — follow system is backend-blocked |
| `DELETE /api/v1/users/{userId}/follow` | NOT in backend spec | Do not build — follow system is backend-blocked |
| `GET /api/v1/users/{userId}/followers` | NOT in backend spec | Do not build — backend-blocked |
| `GET /api/v1/users/{userId}/following` | NOT in backend spec | Do not build — backend-blocked |

Existing proxy routes that are sufficient:
- `GET /api/v1/users/[userId]/route.ts` — already handles public profile
- `GET /api/v1/users/me/activities/route.ts` — already handles activities pagination

---

## Installation

No new packages to install. The milestone is zero-dependency.

```bash
# Nothing to install — all required stack is already present
# Verify generated API exists (needs regeneration in fresh worktree):
cd packages/web && bun run generate:api
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Inline `useInfiniteScrollTrigger` hook (~15 lines) | `react-intersection-observer` npm package | Package adds 3KB for a trivial observer wrapper; existing codebase doesn't use it; native API sufficient |
| Extend existing `proxy.ts` matcher for auth guard | New `middleware.ts` file | Project explicitly uses `proxy.ts` (not `middleware.ts`) per Next.js 16 convention documented in `CLAUDE.md` |
| Mock follow counts as `0` from real user data | Build Supabase `follows` table directly | Violates "API-first" constraint; creates a second data source that would conflict when backend adds follow endpoints |
| `redirect()` from server page for auth guard | Client-side only `useEffect` redirect | Server redirect prevents flash of unauthenticated content; `proxy.ts` middleware redirect is the most reliable approach |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-intersection-observer` | Unnecessary package for a ~15-line observer pattern | Inline `useInfiniteScrollTrigger` hook using native `IntersectionObserver` |
| Supabase `follows` table / direct query | Backend will own follow relationships; building a shadow Supabase table creates conflicting data sources | Wait for `POST /api/v1/users/{userId}/follow` endpoint from backend |
| Custom `middleware.ts` file | Conflicts with existing `proxy.ts` convention in Next.js 16 | Extend `proxy.ts` config.matcher |
| `swr` or any second data-fetching library | Project already standardized on TanStack Query | Use existing `useInfiniteQuery` from `@tanstack/react-query` |
| Follow count data from `profileStore` Zustand | `profileStore` is for UI state, not server data | Follow data belongs in React Query cache when backend is ready |
| New Orval config entry for follow endpoints | There are no follow endpoints to generate | Add follow endpoints to Orval config after backend ships them |

---

## Stack Patterns by Variant

**If backend adds follow endpoints (future):**
- Run `bun run generate:api` — Orval generates `useFollowUser`, `useUnfollowUser`, `useGetFollowers`, `useGetFollowing`
- Add proxy routes in `app/api/v1/users/[userId]/follow/route.ts`
- Wire into `FollowStats` component
- No new packages

**If tries endpoint ships (future):**
- Add `GET /api/v1/users/me/tries` to backend
- Add proxy route `app/api/v1/users/me/tries/route.ts`
- Replace `TriesGrid` stub with `useInfiniteQuery` using the same pattern as `useUserActivities`
- No new packages

**If saved items move to backend API (future):**
- Determine if `collectionStore.loadCollection()` targets Supabase or REST API
- If REST: add to OpenAPI spec, regenerate with Orval
- If Supabase direct: keep `useQuery` pattern from `useProfileExtras`

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @supabase/auth-helpers-nextjs@0.15.0 | Next.js 16 | `createSupabaseMiddlewareClient` works with `proxy.ts` pattern; verified in existing admin auth guard |
| @tanstack/react-query@5.90.11 | `useInfiniteQuery` (v5 API) | v5 uses `initialPageParam` and returns typed `InfiniteData<T>` — existing `useUserActivities` demonstrates the correct v5 pattern |
| next/navigation `redirect()` | Next.js 16 App Router server components | Use in `page.tsx` (server component); not in `"use client"` components |

---

## Sources

- `packages/api-server/openapi.json` — Direct inspection of all 67 backend endpoints; confirmed absence of follow, tries, saved endpoints (HIGH confidence — primary source)
- `packages/web/app/api/v1/users/` — Direct inspection of existing proxy routes (HIGH confidence — codebase)
- `packages/web/lib/hooks/useProfile.ts` — Confirmed `useUser(userId)` and `useUserActivities` hooks already exist (HIGH confidence — codebase)
- `packages/web/proxy.ts` — Confirmed auth guard pattern using `createSupabaseMiddlewareClient` + `config.matcher` (HIGH confidence — codebase)
- `packages/web/lib/components/profile/FollowStats.tsx` — Confirmed hardcoded mock data (HIGH confidence — codebase)
- `packages/web/lib/components/profile/TriesGrid.tsx` — Confirmed stub `fetchMyTries()` returning `[]` (HIGH confidence — codebase)
- `packages/web/lib/components/profile/SavedGrid.tsx` — Confirmed uses `collectionStore` Zustand, not API (HIGH confidence — codebase)
- `packages/web/app/profile/` — Confirmed no `[userId]` subdirectory exists (HIGH confidence — codebase)

---

*Stack research for: decoded-monorepo v10.0 Profile Page Completion*
*Researched: 2026-03-26*
