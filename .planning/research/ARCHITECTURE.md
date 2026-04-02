# Architecture Research

**Domain:** Profile completion — follow system, tries/saved tabs, public user profile, auth guard
**Researched:** 2026-03-26
**Confidence:** HIGH (direct codebase inspection + backend OpenAPI spec analysis)

## Existing Profile Architecture (Current State)

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  app/profile/page.tsx (server, no auth gate currently)              │
│    └── ProfileClient.tsx (client orchestrator, "use client")        │
├─────────────────────────────────────────────────────────────────────┤
│  React Query hooks (lib/hooks/useProfile.ts)                        │
│  ┌───────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  useMe()  │  │useUserStats│  │useMyBadges│  │useUserActivities │ │
│  └─────┬─────┘  └─────┬──────┘  └─────┬────┘  └────────┬─────────┘ │
│        │              │               │                 │            │
├────────┴──────────────┴───────────────┴─────────────────┴───────────┤
│  Data Layer (split between Orval-generated and Supabase-direct)     │
│  ┌──────────────────────────────────┐  ┌────────────────────────┐   │
│  │ lib/api/generated/users/users.ts │  │ lib/supabase/queries/  │   │
│  │  useGetMyProfile()               │  │ profile.ts             │   │
│  │  useGetMyStats()                 │  │  fetchUserProfileExtras│   │
│  │  useGetUserProfile(userId)       │  │  fetchTryOnCount()     │   │
│  │  getMyActivities()               │  └────────────────────────┘   │
│  └──────────────────────┬───────────┘                               │
│                         │ via lib/api/mutator/custom-instance.ts     │
├─────────────────────────┴───────────────────────────────────────────┤
│  Transport Layer                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  app/api/v1/users/me/route.ts (GET/PATCH)                    │   │
│  │  app/api/v1/users/me/activities/route.ts (GET)               │   │
│  │  app/api/v1/users/me/stats/route.ts (GET)                    │   │
│  │  app/api/v1/users/[userId]/route.ts (GET, no auth required)  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                  proxies to https://dev.decoded.style                │
├─────────────────────────────────────────────────────────────────────┤
│  State Bridge (Zustand)                                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  lib/stores/profileStore.ts                                  │    │
│  │   user, stats, badges, rankings, badgeModalMode             │    │
│  │   setUserFromApi(), setStatsFromApi() (React Query to store) │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (Existing)

| Component | Responsibility | Location |
|-----------|----------------|----------|
| `ProfileClient.tsx` | Client orchestrator — fetches all data, manages tab state, renders skeletons/errors | `app/profile/ProfileClient.tsx` |
| `FollowStats.tsx` | Renders followers/following counts (currently hardcoded: 1234/567) | `lib/components/profile/FollowStats.tsx` |
| `ActivityTabs.tsx` | Tab bar for posts/spots/solutions/tries/saved | `lib/components/profile/ActivityTabs.tsx` |
| `TriesGrid.tsx` | Renders VTON try-on results (stub — `fetchMyTries()` returns `[]`) | `lib/components/profile/TriesGrid.tsx` |
| `SavedGrid.tsx` | Renders saved items via `collectionStore` (mock Pins/Boards/Collage data) | `lib/components/profile/SavedGrid.tsx` |
| `profileStore.ts` | Zustand bridge: API data to store for modal state and component reads | `lib/stores/profileStore.ts` |
| `collectionStore.ts` | Zustand store for saved Pins/Boards — currently loaded with mock data | `lib/stores/collectionStore.ts` |

---

## Critical Finding: Backend API Gap

**The follow system does not exist in the backend OpenAPI spec.**

Inspecting `packages/api-server/openapi.json` (all 63 paths enumerated):

- Available `/api/v1/users/*` endpoints: `GET/PATCH /me`, `GET /me/activities`, `GET /me/stats`, `GET /{user_id}`
- `UserActivityType` enum: only `"post" | "spot" | "solution"` — no tries or saved
- `UserResponse` schema: no `followers_count`, `following_count` fields
- `UserStatsResponse` schema: no follow-related fields
- No `/api/v1/users/me/followers`, `/api/v1/users/{id}/follow`, `/api/v1/users/me/saved-posts`, or `/api/v1/users/me/tries` paths exist

**This is the primary constraint on all four features.** Architecture decisions must route around missing backend endpoints using the established Supabase-direct pattern.

---

## Feature Integration Architecture

### Feature 1: Auth Guard (#19)

**What's needed:** Redirect unauthenticated users away from `/profile`.

**Integration approach:**

The existing `proxy.ts` (Next.js 16 middleware equivalent at root) already implements admin auth guard. The same pattern applies to `/profile`.

Auth check addition to `proxy.ts`:
1. `supabase.auth.getSession()` — already called for admin paths
2. If no session and path matches `/profile` exactly → redirect to `/login?redirect=/profile`

**New files needed:** None — modify `proxy.ts` only.
**Modified files:** `proxy.ts` — extend `matcher` config, add profile redirect branch.

**Data flow:**
```
User navigates to /profile
    ↓
proxy.ts intercepts (server-side before page renders)
    ↓
supabase.auth.getSession() via middleware client
    ↓ no session
NextResponse.redirect("/login?redirect=/profile")
    ↓ session exists
NextResponse.next() → page.tsx → ProfileClient.tsx
```

**Note on matcher scope:** The matcher must NOT be `/profile/:path*` — that would block public user profiles at `/profile/[userId]`. Protect only the exact `/profile` path.

---

### Feature 2: Follow System (#17)

**What's needed:** Real follower/following counts in `FollowStats.tsx`, follow/unfollow action on other user profiles.

**Constraint:** Backend has no follow endpoints. `UserResponse` has no follow count fields.

**Architecture decision — Supabase direct query:**

The project has an established pattern for Supabase-direct queries when backend endpoints don't exist (`fetchUserProfileExtras`, `fetchTryOnCount` in `lib/supabase/queries/profile.ts`). Follow counts use the same approach.

**Prerequisite:** A `user_follows` table must exist in Supabase. The current `types.ts` (updated 2026-03-18) lists 11 tables and does not include `user_follows`. This is an open question — confirm before building.

**New additions to `lib/supabase/queries/profile.ts`:**
- `fetchFollowCounts(userId)` → `{ followers: number, following: number }`
- `fetchIsFollowing(viewerId, targetId)` → `boolean`
- `followUser(viewerId, targetId)` → `void`
- `unfollowUser(viewerId, targetId)` → `void`

**New query keys in `lib/hooks/useProfile.ts`:**
```typescript
profileKeys.followCounts = (userId: string) =>
  [...profileKeys.all, "followCounts", userId] as const
profileKeys.isFollowing = (viewerId: string, targetId: string) =>
  [...profileKeys.all, "isFollowing", viewerId, targetId] as const
```

**New hooks in `lib/hooks/useProfile.ts`:**
- `useFollowCounts(userId)` — read-only, used on both my and other user's profile
- `useFollowMutation(targetId)` — follow/unfollow, used only on other user's profile

**New component:** `lib/components/profile/FollowButton.tsx` — follow/unfollow action, only rendered on `UserProfileClient` (not own profile).

**Modified files:**
- `lib/components/profile/FollowStats.tsx` — remove hardcoded defaults (1234/567), accept real props
- `ProfileClient.tsx` — pass follow counts from `useFollowCounts(userId)` to `FollowStats`

**Data flow (my profile):**
```
ProfileClient mounts, userId = userData?.id
    ↓
useFollowCounts(userId) → Supabase direct query on user_follows
    ↓
FollowStats receives { followers, following } as props
```

**Data flow (other user profile):**
```
UserProfileClient mounts, targetUserId from URL params
    ↓ parallel
useUser(targetUserId)           → REST API /api/v1/users/{userId}
useFollowCounts(targetUserId)   → Supabase direct
useIsFollowing(viewer, target)  → Supabase direct (skip if not logged in)
    ↓
FollowStats receives real counts
FollowButton rendered with isFollowing state (hidden if viewing own profile)
```

---

### Feature 3: Tries/Saved Activity Tabs (#16)

#### Tries Tab

**Constraint:** No backend endpoint. `TriesGrid.tsx` stub returns `[]`. Supabase `user_tryon_history` table confirmed in `types.ts` comments. The existing `fetchTryOnCount()` confirms this table is accessible via Supabase direct.

**Architecture decision — Supabase direct query with infinite scroll:**

**Prerequisite:** Confirm `user_tryon_history` schema has `result_image_url` (or equivalent). The stub type expects this field.

**New additions to `lib/supabase/queries/profile.ts`:**
- `fetchMyTryOnHistory(userId, page, perPage)` → `{ data: TryOnResult[], total: number }`

**New hook in `lib/hooks/useProfile.ts`:**
- `useMyTryOnHistory(userId)` using `useInfiniteQuery`, page-based cursor

**Modified files:**
- `lib/components/profile/TriesGrid.tsx` — replace `fetchMyTries()` stub with `useMyTryOnHistory(userId)`, add infinite scroll via IntersectionObserver

**Query key:**
```typescript
profileKeys.tryHistory = (userId: string) =>
  [...profileKeys.all, "tryHistory", userId] as const
```

#### Saved Tab

**Constraint:** `SavedGrid.tsx` uses `collectionStore` with mock Pins/Boards/Collage data. The save/unsave actions exist in `lib/api/savedPosts.ts` calling `/api/v1/posts/{postId}/saved`, but the GET (list) endpoint is NOT in the OpenAPI spec.

**Architecture decision — investigate then connect:**

Two possible paths depending on backend reality:
- Path A: Backend has `GET /api/v1/users/me/saved-posts` (undocumented) — add proxy route, connect via React Query
- Path B: Backend has no list endpoint — use Supabase direct on a `saved_posts` table

**Path A new files:**
- `app/api/v1/users/me/saved-posts/route.ts` — new proxy route (GET, auth required)
- Hook `useMySavedPosts()` in `lib/hooks/useProfile.ts`

**Modified files:**
- `lib/components/profile/SavedGrid.tsx` — replace `collectionStore` with real hook

**Note:** The current `collectionStore` Pins/Boards/Collage UI is elaborate and conceptually different from "saved posts list." If backend saved posts are post thumbnails, `SavedGrid.tsx` needs a visual redesign, not just a data swap.

---

### Feature 4: Other User Profile Page (#18)

**What's needed:** New route `/profile/[userId]` showing public profile.

**Existing infrastructure already available:**
- `app/api/v1/users/[userId]/route.ts` — proxy already exists (GET, no auth required)
- `useGetUserProfile(userId)` — Orval-generated hook in `lib/api/generated/users/users.ts`
- `useUser(userId)` wrapper already implemented in `lib/hooks/useProfile.ts`

**New files:**
- `app/profile/[userId]/page.tsx` — server component, extracts `params.userId`
- `app/profile/[userId]/UserProfileClient.tsx` — client orchestrator for public profile

**Architecture decision — separate client components, shared primitive components:**

`UserProfileClient.tsx` reuses profile components but with different props and no edit capability:
- `ProfileHeader` — needs to accept user data as props (refactor needed — currently reads from `profileStore`)
- `ProfileBio` — already accepts `bio` prop, no change needed
- `FollowStats` — accepts real counts from `useFollowCounts`
- `FollowButton` — new, shown only when viewer !== target
- Activity display — limited (no tries/saved for other users since backend has no public activities endpoint)

**No activity tabs for public profile (current backend constraint):** The backend `GET /api/v1/users/{user_id}` returns only profile data. There is no `GET /api/v1/users/{user_id}/activities` endpoint. Public activity visibility is deferred until backend support exists.

**Auth guard interaction:** The `proxy.ts` matcher for profile auth guard must be exact `/profile`, not `/profile/:path*`, so public profile pages pass through without auth.

---

## New Project Structure

```
packages/web/
├── app/
│   ├── profile/
│   │   ├── page.tsx                          # existing — no change
│   │   ├── ProfileClient.tsx                 # MODIFY — wire real FollowStats
│   │   └── [userId]/                         # NEW
│   │       ├── page.tsx                      # NEW — server, extract userId param
│   │       └── UserProfileClient.tsx         # NEW — public profile orchestrator
│   │
│   └── api/v1/users/
│       ├── me/route.ts                       # existing
│       ├── me/activities/route.ts            # existing
│       ├── me/stats/route.ts                 # existing
│       ├── me/saved-posts/route.ts           # NEW (conditional on backend)
│       └── [userId]/route.ts                 # existing
│
├── lib/
│   ├── components/profile/
│   │   ├── FollowStats.tsx                  # MODIFY — remove hardcoded defaults
│   │   ├── FollowButton.tsx                 # NEW — follow/unfollow action
│   │   ├── ProfileHeader.tsx                # MODIFY — accept user prop (not only store)
│   │   ├── TriesGrid.tsx                    # MODIFY — replace stub with real query
│   │   └── SavedGrid.tsx                    # MODIFY — replace mock with real data
│   │
│   ├── hooks/
│   │   └── useProfile.ts                   # MODIFY — add useFollowCounts,
│   │                                       #   useIsFollowing, useFollowMutation,
│   │                                       #   useMyTryOnHistory, useMySavedPosts
│   │
│   └── supabase/queries/
│       └── profile.ts                      # MODIFY — add fetchFollowCounts,
│                                           #   fetchIsFollowing, followUser,
│                                           #   unfollowUser, fetchMyTryOnHistory
│
└── proxy.ts                                # MODIFY — add profile auth guard (exact /profile)
```

---

## Data Flow Changes

### Auth Guard (new)

```
User navigates to /profile
    ↓
proxy.ts matcher: ["/admin/:path*", "/profile"]
    ↓ no session
NextResponse.redirect("/login?redirect=/profile")
    ↓ session exists
NextResponse.next() → page.tsx → ProfileClient.tsx renders
```

### Follow Counts (new)

```
ProfileClient.tsx
    ↓ userData?.id available
useFollowCounts(userId)
    → supabaseBrowserClient
      .from("user_follows")
      .select("*", { count: "exact" })
      .eq("follower_id", userId)   // following count
      + .eq("followee_id", userId) // followers count
    ↓
FollowStats({ followers: N, following: M })
```

### Tries (new)

```
ProfileClient.tsx: activeTab === "tries"
    ↓
TriesGrid calls useMyTryOnHistory(userId)
    → useInfiniteQuery
    → supabaseBrowserClient
      .from("user_tryon_history")
      .select("id, result_image_url, created_at, item_count")
      .eq("user_id", userId)
      .range(offset, offset + perPage - 1)
    ↓
IntersectionObserver at grid bottom triggers fetchNextPage()
```

### Public Profile Route (new)

```
/profile/[userId] navigated to
    ↓
proxy.ts: matcher does NOT match /profile/[userId] → no auth check
    ↓
app/profile/[userId]/page.tsx extracts params.userId
    ↓
UserProfileClient.tsx mounts, parallel fetches:
  useUser(userId) → GET /api/v1/users/{userId} (existing proxy)
  useFollowCounts(userId) → Supabase direct
  useIsFollowing(viewer, userId) → Supabase direct (skipped if not logged in)
    ↓
Render read-only profile: ProfileHeader, ProfileBio, FollowStats
Render FollowButton if viewer !== target and viewer is authenticated
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Widening proxy.ts auth guard to /profile/:path*

**What people do:** `matcher: ["/admin/:path*", "/profile/:path*"]` to guard all profile sub-paths.
**Why it's wrong:** This blocks `/profile/[userId]` which is a public route.
**Do this instead:** Protect only the exact `/profile` path. Implement as a path equality check in the proxy function body, not just via the matcher.

### Anti-Pattern 2: Fetching follow data inside ProfileHeader component

**What people do:** Add Supabase query directly in `ProfileHeader.tsx`.
**Why it's wrong:** Profile components are presentational. Mixing data fetching in them breaks reuse in `UserProfileClient` and makes testing harder.
**Do this instead:** Fetch in orchestrator components, pass counts as props to `FollowStats`.

### Anti-Pattern 3: Expanding collectionStore with API calls

**What people do:** Add `loadFromApi()` to `collectionStore` to fetch real saved posts.
**Why it's wrong:** `collectionStore` was designed as a Pins/Boards/Collage UI state machine. Saved posts from the backend are a different entity. This conflates two responsibilities.
**Do this instead:** Add `useMySavedPosts()` hook in `useProfile.ts`. Have `SavedGrid` call it directly. Deprecate the mock loading in `collectionStore`.

### Anti-Pattern 4: Duplicating the existing useUser() hook

**What people do:** Create a new fetch function for the public profile page.
**Why it's wrong:** `useGetUserProfile(userId)` already exists in Orval-generated code. `useUser(userId)` wrapper already exists in `lib/hooks/useProfile.ts`. The proxy route already exists.
**Do this instead:** Import `useUser(userId)` from `lib/hooks/useProfile.ts` in `UserProfileClient.tsx`.

---

## Open Questions (Require Investigation Before Building)

1. **Does `user_follows` table exist in Supabase?** The `types.ts` file (updated 2026-03-18) lists 11 tables with no `user_follows`. If the table doesn't exist, follow counts are blocked pending DB migration coordinated with the backend team.

2. **Does `user_tryon_history` have `result_image_url`?** The `TriesGrid.tsx` stub expects this field. `fetchTryOnCount()` only selects `id`. Full schema needs verification before implementing the tries tab.

3. **Does `GET /api/v1/users/me/saved-posts` exist on the live backend?** It is not in the OpenAPI spec. `lib/api/savedPosts.ts` references `POST/DELETE /api/v1/posts/{postId}/saved` but no GET list endpoint. Either the spec is incomplete or the list endpoint doesn't exist.

4. **Should public user profiles show any activity?** The backend has no `GET /api/v1/users/{user_id}/activities` endpoint. If the feature scope requires showing other users' posts on their profile, this needs either a backend endpoint addition or Supabase direct query with public RLS policy.

---

## Sources

- `packages/api-server/openapi.json` — all 63 API paths and schemas enumerated directly (HIGH confidence)
- `packages/web/lib/hooks/useProfile.ts` — existing hook implementations read directly (HIGH confidence)
- `packages/web/app/profile/ProfileClient.tsx` — existing orchestrator component (HIGH confidence)
- `packages/web/lib/components/profile/` — all 18 profile components inspected (HIGH confidence)
- `packages/web/lib/supabase/types.ts` — Supabase table schemas, updated 2026-03-18 (HIGH confidence)
- `packages/web/proxy.ts` — existing admin auth guard implementation (HIGH confidence)
- `packages/web/lib/supabase/queries/profile.ts` — existing Supabase direct query pattern (HIGH confidence)
- `packages/web/lib/stores/profileStore.ts` and `collectionStore.ts` — current state management (HIGH confidence)
- `packages/web/lib/api/savedPosts.ts` — saved posts action endpoints (HIGH confidence)

---

*Architecture research for: v10.0 Profile Page Completion (follow system, tries/saved tabs, public user profile, auth guard)*
*Researched: 2026-03-26*
