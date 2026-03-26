# Feature Research

**Domain:** Social fashion discovery platform — profile page completion (v10.0)
**Researched:** 2026-03-26
**Confidence:** HIGH (OpenAPI spec analysis + existing codebase inspection + industry patterns from Instagram/Pinterest/Weverse)

## Context: What Already Exists

The profile page (`/profile`) has a working foundation built in prior milestones:

- **Profile header, bio, stats** (Posts/Solutions/Points) — real API data via `useMe`, `useUserStats`
- **Activity tabs** — Posts, Spots, Solutions with infinite scroll via `useUserActivities` — real API connected
- **Profile edit modal** — name, bio, avatar URL via `PATCH /api/v1/users/me`
- **Style DNA, Ink credits, Try-on count** — Supabase direct queries via `useProfileExtras`, `useTryOnCount`
- **BadgeGrid, RankingList** — real API via `useMyBadges`, `useMyRanking`
- **ProfileClient orchestrator, profileStore Zustand, useProfile hooks** — architecture in place

**What is stub/unconnected:**
- `TriesGrid` — fetches from a `TODO: replace with real API` stub that returns `[]`
- `SavedGrid` — uses `collectionStore` local state (no API persistence)
- `FollowStats` — renders hardcoded `1234 followers / 567 following` mock values
- `/profile/[userId]` route — does not exist; `GET /api/v1/users/{user_id}` endpoint exists but no UI
- Auth guard on `/profile` — page renders regardless of login state; no redirect

**Critical backend finding:** No follow, saved-posts, or VTON-tries endpoints exist in the current OpenAPI spec (`packages/api-server/openapi.json`). This is the primary constraint for v10.0.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any social discovery platform. Missing = product feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Auth guard on /profile** | Any profile page behind authentication is standard. Unauthenticated access to personal data is confusing and insecure. | LOW | `proxy.ts` pattern already exists for `/admin`. Mirror it: add `/profile` matcher, redirect to `/login` (or `/`) if no session. Can also do client-side check in `ProfileClient` using `authStore.isInitialized + authStore.user`. |
| **Tries tab — real data** | Users who ran virtual try-on expect to see their results in history. Empty state with no connection reads as broken, not empty. | MEDIUM | `GET /api/v1/users/me/tries` does NOT exist in current OpenAPI spec. Three options: (1) add endpoint to Rust backend, (2) query Supabase `vton_results` table directly (same pattern as `useTryOnCount`), (3) disable the tab visibly until endpoint exists. Option 2 is fastest for v10.0. |
| **Saved tab — real data** | Bookmarking/saving items is a core behavior on fashion discovery platforms (Pinterest, Instagram saves). Currently uses local `collectionStore` with no persistence — data is lost on refresh. | MEDIUM | `GET /api/v1/users/me/saved` does NOT exist in OpenAPI spec. Supabase likely has a `saved_posts` or `bookmarks` table. Direct Supabase query (same pattern as `profileExtras`) is the pragmatic path. Needs API design decision. |
| **Followers / Following counts — real data** | Any social platform shows social graph counts. Hardcoded `1234/567` breaks trust immediately. | LOW | `GET /api/v1/users/me` (`UserResponse`) needs to include `followers_count` and `following_count` fields — check if they exist in the model. If not in the response, a Supabase direct count query is an acceptable interim solution. |
| **Other user profile `/profile/[userId]`** | Clicking on any username/avatar in Posts, Solutions, Comments expects a profile page. Without it, the discovery loop is broken — you can find items but not explore the person who posted them. | MEDIUM | `GET /api/v1/users/{user_id}` exists in OpenAPI spec. Route `/profile/[userId]` needs a new page and a `UserProfileClient` variant. The existing `ProfileClient` must be refactored to accept an optional `userId` prop or split into two components. |
| **Own vs. other profile differentiation** | On your own profile: edit button, settings, private tabs (Tries/Saved). On others' profiles: follow button, no edit, no private tabs. | MEDIUM | Standard social pattern. `ProfileHeader` and action buttons must check `userId === currentUser.id`. The auth guard scope differs: `/profile` requires login; `/profile/[userId]` is public (or requires login for follow action only). |
| **Infinite scroll on Tries/Saved tabs** | Posts/Spots/Solutions already use infinite scroll. Inconsistency on the same page tabs feels like a bug. | LOW | Already have `useInfiniteQuery` pattern from existing tabs. Once API or Supabase query is in place, wiring to the existing scroll infrastructure is LOW complexity. |

### Differentiators (Competitive Advantage)

Features that enhance the decoded-specific value proposition — not required by convention, but valued by users on a K-pop fashion discovery platform.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Follow button with optimistic update** | Standard platforms (Instagram, Twitter) update the button instantly and reconcile later. Decoded's social layer is nascent — a polished follow interaction establishes credibility. | MEDIUM | Requires `POST /api/v1/users/{user_id}/follow` and `DELETE /api/v1/users/{user_id}/follow` endpoints (not in current spec). Optimistic update via React Query `useMutation` with `onMutate` / `onError` rollback is the pattern. |
| **Followers/Following modal list** | Clicking the follower/following count opens a list of user avatars with follow buttons — same as Instagram. Reinforces the social graph and drives discovery. | HIGH | Requires `GET /api/v1/users/{user_id}/followers` and `/following` endpoints (not in spec). Deferred unless backend is extended. |
| **Try-on result detail view** | Tapping a VTON result card in the Tries tab shows full-screen result with the source post link. Closes the loop between discovery and try-on. | LOW | Once Tries tab has real data, adding a tap-to-expand behavior is pure UI — no new API needed beyond the result URL already returned. |
| **Saved tab sub-tabs (Pins/Boards/Collage)** | `SavedGrid` already has `Pins/Boards/Collage` sub-tab UI implemented via `collectionStore`. Connecting this to persistent API data would make decoded's curation system a differentiator vs. flat bookmarks on other platforms. | HIGH | Requires board/collection API endpoints (not in spec). The UI is built; the backend is the blocker. For v10.0, persist pins to Supabase directly; defer Boards/Collage to a collections milestone. |
| **Public profile shareable URL** | `/profile/[userId]` with proper `og:image`, `og:title` metadata makes profiles shareable on KakaoTalk, Instagram stories. K-pop fan culture is highly share-driven. | LOW | Once `/profile/[userId]` page exists, adding `generateMetadata` with user name/avatar is trivial — pure Next.js SSR metadata. High social/discovery value for LOW cost. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time follower count updates (WebSocket)** | Social platforms show live counts. Feels modern and engaging. | WebSocket infrastructure does not exist. Adding it for a count that changes infrequently adds significant backend complexity for minimal UX gain. | Poll on page focus (`refetchOnWindowFocus: true` in React Query). Count is fresh on return. |
| **Block/mute user system** | Standard moderation on social platforms. | Requires complex relationship table, UI flows, and content filtering logic across every content feed. Out of scope for a follow-system MVP. | File user report (simpler) if moderation is needed. |
| **Mutual follow / "friends" detection** | Instagram-style mutual follow badge feels personalized. | Requires backend join query across the follow graph. Adds complexity to the `UserResponse` shape without adding core discovery value. | Show simple follow state (following/not following). Add mutual detection in a later iteration. |
| **Offline profile caching (PWA)** | Profile data should work offline. | Next.js SSR + Supabase auth make full offline mode non-trivial. Service worker conflicts with auth token refresh. | React Query's `staleTime` + `gcTime` provide adequate perceived performance without full offline. |
| **Bulk follow import from other platforms** | "Follow everyone from your Instagram/Twitter" feature. | Requires OAuth integrations with third-party platforms and a matching algorithm. Scope is a separate milestone, not part of profile completion. | Manual search-and-follow. |

---

## Feature Dependencies

```
[Auth Guard on /profile]
    └──required-for──> [Tries Tab real data]   (must know who is "me")
    └──required-for──> [Saved Tab real data]   (must know who is "me")
    └──required-for──> [Follow button on /profile/[userId]]  (must know current user)

[GET /api/v1/users/{user_id} — already in OpenAPI spec]
    └──required-by──> [/profile/[userId] page]
    └──enhances──> [Followers/Following real counts] (if fields added to UserResponse)

[Tries Tab — Supabase direct OR new endpoint]
    └──requires──> [vton_results Supabase table accessible to current user]
    └──enables──> [Try-on result detail view]

[Saved Tab — Supabase direct OR new endpoint]
    └──requires──> [saved_posts or bookmarks Supabase table]
    └──enables──> [Saved Pins persistence]
    └──enables-later──> [Boards/Collage sub-tabs]

[/profile/[userId] page]
    └──requires──> [GET /api/v1/users/{user_id}]  (already in spec)
    └──enables──> [Public shareable URL with og: metadata]
    └──enables──> [Follow button]
    └──requires──> [Own vs. other differentiation logic]

[Follow button]
    └──requires──> [POST/DELETE /api/v1/users/{user_id}/follow]  (NOT in current spec — backend work required)
    └──requires──> [/profile/[userId] page]
    └──enables──> [Followers/Following list modal]

[Followers/Following real counts in FollowStats]
    └──requires──> [UserResponse includes followers_count + following_count fields]
    └──OR──> [Direct Supabase count query on follows table]
```

### Dependency Notes

- **Auth guard is the simplest feature but unlocks everything.** It must be Phase 1. It takes 1-2 hours using the existing `proxy.ts` pattern.
- **Tries and Saved tabs have no backend endpoints.** Both depend on Supabase direct queries as the v10.0 approach. This is consistent with how `useTryOnCount` and `profileExtras` already work.
- **`/profile/[userId]` has a backend endpoint** (`GET /api/v1/users/{user_id}`). This is the highest-value unblocked feature — it only needs a new Next.js route and a refactored `ProfileClient`.
- **Follow system is fully blocked on backend.** No follow endpoints exist in the OpenAPI spec. The UI (`FollowStats` buttons are already rendered) is ready but non-functional until the Rust backend exposes follow endpoints. For v10.0, focus on read-only real counts; write operations (follow/unfollow) belong to a follow-system milestone unless the backend is extended in parallel.
- **FollowStats hardcoded values** are the lowest-trust element on the current profile. Even if a proper follow system isn't built, replacing mock values with real counts (even from a Supabase direct query) is a high-trust, low-cost fix.

---

## MVP Definition

This is a subsequent milestone — not a greenfield MVP. "Launch with" means "complete for v10.0 profile completion."

### Launch With (v10.0)

Minimum to call the profile page "complete" — no stub data, no broken tabs.

- [ ] **Auth guard on `/profile`** — redirect unauthenticated users to `/login` (or `/`). Uses existing `proxy.ts` middleware pattern. Blocks unauthorized access to private profile data.
- [ ] **Tries tab — Supabase direct query** — replace `fetchMyTries` stub with real query against `vton_results` table. Infinite scroll using existing `useInfiniteQuery` pattern. Empty state remains if table is empty.
- [ ] **Saved tab — Supabase direct query** — persist pins from `collectionStore` to Supabase `saved_posts` / `bookmarks` table. Load on mount. Replace local-only state with real data.
- [ ] **Followers/Following real counts** — check if `UserResponse` from `GET /api/v1/users/me` includes counts. If yes, wire to `FollowStats`. If no, Supabase direct count as fallback. Remove hardcoded mock values.
- [ ] **`/profile/[userId]` page** — new `app/profile/[userId]/page.tsx` + `UserProfileClient.tsx`. Fetches `GET /api/v1/users/{user_id}`. Shows public info (avatar, name, bio, stats, posts). No private tabs (Tries/Saved). Edit button hidden. Follow button placeholder (non-functional until backend extends).

### Add After Validation (v10.x)

Add once v10.0 is confirmed working in production.

- [ ] **Follow/unfollow action** — trigger: backend exposes `POST/DELETE /api/v1/users/{user_id}/follow`. Wire follow button with optimistic update.
- [ ] **Followers/Following list modal** — trigger: backend exposes list endpoints. High social graph discovery value.
- [ ] **Public profile og: metadata** — `generateMetadata` on `/profile/[userId]` with user avatar as og:image. Low cost once the page exists.

### Future Consideration (v11+)

Defer until follow system backend is proven and collection system is scoped.

- [ ] **Boards/Collage in Saved tab** — requires collection API endpoints. The UI is already built in `SavedGrid`; the backend is the blocker.
- [ ] **Try-on result detail view** — tap-to-expand on Tries grid with source post link.
- [ ] **Real-time follower counts** — only if WebSocket infrastructure is built.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth guard on `/profile` | HIGH | LOW | P1 |
| Followers/Following real counts | HIGH | LOW | P1 |
| `/profile/[userId]` public page | HIGH | MEDIUM | P1 |
| Tries tab real data (Supabase) | MEDIUM | MEDIUM | P1 |
| Saved tab real data (Supabase) | MEDIUM | MEDIUM | P1 |
| Follow/unfollow button (write) | HIGH | HIGH (backend blocked) | P2 |
| Public og: metadata on user profiles | MEDIUM | LOW | P2 |
| Followers/Following list modal | MEDIUM | HIGH (backend blocked) | P3 |
| Try-on result detail view | LOW | LOW | P3 |
| Boards/Collage API persistence | MEDIUM | HIGH (backend blocked) | P3 |

**Priority key:**
- P1: Required for v10.0 — profile completion milestone is incomplete without these
- P2: Ship when backend is extended — high value, waiting on follow API
- P3: Future milestone — meaningful but not blocking

---

## Competitor Feature Analysis

Reference platforms: Instagram (follow system), Pinterest (saved/boards), Weverse (K-pop fan profiles), LikeToKnowIt (fashion discovery).

| Feature | Instagram | Pinterest | Weverse | Our Approach |
|---------|-----------|-----------|---------|--------------|
| Follow counts | Real-time, prominent in header | Shown on profile, secondary | Shown with artist/fan split | Real counts from API/Supabase in `FollowStats` component (already UI-ready) |
| Saved/Bookmarks | Private by default, flat list | Boards (public/private), sub-boards | Fan-made "Universe" collections | Saved tab with Pins (flat) for v10.0; Boards deferred |
| Try-on/AR history | Instagram filter history (camera) | No equivalent | No equivalent | VTON results grid — decoded-specific differentiator |
| Public user profile | Full public profile, all posts | Public boards, pins | Artist profiles public, fan profiles limited | Public posts + bio; Tries/Saved hidden; follow button |
| Auth gate | Public browsing allowed; account needed for actions | Public browsing allowed | Account required for all content | `/profile/[userId]` is public; `/profile` (own) requires auth |
| Own vs. other | Edit button appears only on own profile | Follows/edit only on own | N/A | `userId === currentUser.id` guard in `ProfileHeader` |

---

## Existing Code Impact Map

| Existing File | Current State | Required Change |
|---------------|---------------|-----------------|
| `packages/web/proxy.ts` | Protects `/admin` only | Add `/profile` to matcher; redirect to `/` if no session |
| `app/profile/page.tsx` | No auth check; renders `ProfileClient` directly | Add server-side session check OR extend proxy matcher |
| `ProfileClient.tsx` | Own profile only; hardcoded FollowStats | Extract shared logic; pass `userId` prop for other-user variant |
| `TriesGrid.tsx` | Stub `fetchMyTries()` returning `[]` | Replace with Supabase direct query on `vton_results` table |
| `SavedGrid.tsx` | Uses local `collectionStore` with no persistence | Add Supabase read/write for pins; keep local state as optimistic cache |
| `FollowStats.tsx` | Hardcoded `followers=1234, following=567` | Accept real props from `UserResponse` or Supabase count |
| `lib/hooks/useProfile.ts` | Has `useGetUserProfile` hook (for other-user) | Wire to new `/profile/[userId]` page client |
| `app/profile/[userId]/` | Does not exist | New route: `page.tsx` + `UserProfileClient.tsx` |

---

## Sources

- OpenAPI spec analysis: `packages/api-server/openapi.json` — all 60 endpoints enumerated, no follow/saved/tries endpoints found (HIGH confidence — direct spec inspection)
- Existing codebase inspection: `ProfileClient.tsx`, `TriesGrid.tsx`, `SavedGrid.tsx`, `FollowStats.tsx`, `profileStore.ts`, `proxy.ts` (HIGH confidence — direct code reading)
- Industry patterns: Instagram profile architecture (follow system, own vs. other guards), Pinterest saved/boards (collection hierarchy), Weverse (K-pop fan platform — share-first culture) (MEDIUM confidence — known platform behavior, not current docs)
- Next.js 16 middleware pattern: `proxy.ts` existing implementation for `/admin` (HIGH confidence — codebase)

---

*Feature research for: decoded platform — v10.0 Profile Page Completion*
*Researched: 2026-03-26*
