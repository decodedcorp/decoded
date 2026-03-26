# Pitfalls Research

**Domain:** Profile page completion — follow system, activity tab extensions, public user profiles, auth guard in Next.js + Supabase
**Researched:** 2026-03-26
**Confidence:** HIGH (based on direct codebase analysis + architecture patterns)

---

## Critical Pitfalls

### Pitfall 1: Follow API Routes Missing from OpenAPI Spec and Proxy Layer

**What goes wrong:**
The Rust backend has no `/api/v1/users/{user_id}/follow` or `/api/v1/users/me/followers` endpoints in the current `openapi.json`. The frontend has a `FollowButton` component and `FollowStats` component with hardcoded defaults, but no proxy routes exist under `app/api/v1/users/` for follow operations. Implementing the follow system and calling these endpoints directly from the browser will fail with CORS errors because the backend does not whitelist browser origins.

**Why it happens:**
Developers see the existing `FollowButton` component and assume backend integration is just wiring a hook. They miss that (a) the backend endpoint may not yet exist, (b) even if it does the Next.js proxy route must be added first, and (c) Orval-generated hooks will not exist until the spec is updated and `generate:api` is re-run.

**How to avoid:**
1. Verify the backend spec at `https://dev.decoded.style` includes follow endpoints before writing any frontend code.
2. Add proxy routes at `app/api/v1/users/[userId]/follow/route.ts` and `app/api/v1/users/me/followers/route.ts` before attempting API calls.
3. Run `bun run generate:api` from `packages/web` after the spec is confirmed — do not write manual fetch wrappers for endpoints that belong in generated code.

**Warning signs:**
- CORS errors in the browser console when testing follow actions
- 404 from the Next.js dev server when calling `/api/v1/users/.../follow`
- `FollowStats` always shows hardcoded `1234 followers / 567 following` after "wiring up"

**Phase to address:** Follow System phase — verify backend spec first, add proxy routes, then regenerate API client.

---

### Pitfall 2: Auth Guard Using Client-Side `authStore` State Causes Flash of Unauthorized Content

**What goes wrong:**
The current `authStore` is initialized asynchronously via `AuthProvider` on mount. If the auth guard for `/profile` is implemented as a client-side redirect (`useEffect` that checks `authStore.user === null`), there is a window between initial render and `isInitialized === true` where the profile page renders briefly for unauthenticated users before redirecting. On slower connections this flash is visible and can expose UI that should be gated.

**Why it happens:**
The existing `proxy.ts` (Next.js 16 file, not `middleware.ts`) only guards `/admin/*`. Developers copy the admin pattern but implement it client-side for profile because the server-side Supabase session check feels complex. The `authStore.isInitialized` flag exists precisely for this scenario but is frequently overlooked.

**How to avoid:**
Extend `proxy.ts` to include `/profile` in the matcher config. The existing `createSupabaseMiddlewareClient` is already wired for session checks. The guard should return `NextResponse.redirect(new URL("/login", req.url))` (not `/`) when no session exists. This is a server-side check before the page renders — zero flash.

```typescript
// proxy.ts addition
export const config = {
  matcher: ["/admin/:path*", "/profile"],
};
```

If a client-side fallback is also needed (belt-and-suspenders), check `authStore.isInitialized` before redirecting — never redirect when `isInitialized === false`.

**Warning signs:**
- Brief flash of profile skeleton/content before redirect on incognito window
- `isLoading: true` in profile page briefly showing skeleton before 401 error triggers
- The existing `ProfileError` component showing "프로필을 불러올 수 없습니다" for unauthenticated users instead of redirecting

**Phase to address:** Auth Guard phase — must be implemented in `proxy.ts`, not as a client hook.

---

### Pitfall 3: Public Profile Route `/profile/[userId]` Conflicts with Proxy Matcher and Session Propagation

**What goes wrong:**
The current profile page is at `/profile` (no dynamic segment). Adding `/profile/[userId]` as a dynamic route creates a silent issue: if the auth guard in `proxy.ts` only matches `/profile` exactly, the public profile route at `/profile/[userId]` has no server-side session propagation, breaking Supabase cookie refresh for authenticated users viewing other profiles. Follow button initial state will be wrong (shows "Follow" even when already following).

**Why it happens:**
Next.js App Router resolves dynamic segments last (static routes take priority), so `/profile` and `/profile/[userId]` coexist without routing conflict. But the `proxy.ts` matcher uses path patterns. Developers add the route and forget to update the matcher for session cookie propagation — they see it "works" for anonymous viewing but miss that authenticated state doesn't sync.

**How to avoid:**
Update `proxy.ts` matcher to include `/profile/:path*` — ensures session cookies are refreshed on all profile routes. The proxy handler must distinguish: if path is `/profile` with no segment, require auth and redirect to login. If path is `/profile/[userId]`, allow through but still run session refresh.

```typescript
export const config = {
  matcher: ["/admin/:path*", "/profile", "/profile/:path*"],
};
```

**Warning signs:**
- Authenticated user visits `/profile/someUserId`, follow button shows wrong initial state
- Supabase session expires while user is on a public profile page — no cookie refresh
- `useUser(userId)` returns stale data because auth token was not refreshed

**Phase to address:** Public Profile page phase.

---

### Pitfall 4: `TriesGrid` Stub Returns Empty Array — React Query Caches Stale Empty State

**What goes wrong:**
`TriesGrid.tsx` has `async function fetchMyTries(): Promise<TryResult[]> { return []; }`. The React Query cache entry for `["my-tries"]` is populated with an empty array and remains there for `staleTime: 60s`. When the real API is wired in later, cached components in the same page session continue to render the empty state until the cache expires or is manually invalidated.

**Why it happens:**
The stub returns a value (not throws), so React Query considers the query successful and caches `[]`. This is invisible during development because each page refresh is a fresh cache. It only surfaces when users navigate within the app without a hard refresh.

**How to avoid:**
When replacing the stub with the real API call:
1. Change the query key to include a user identifier: `["my-tries", userId]`
2. The current key `["my-tries"]` with no user scope means a user viewing another person's tries sees their own cached result
3. Call `queryClient.invalidateQueries({ queryKey: ["my-tries"] })` at the point of API wiring, or change the key structure which inherently invalidates old entries

**Warning signs:**
- Empty state shows on first load even after API is connected
- React Query DevTools shows `["my-tries"]` with `status: success`, `data: []`
- Works on hard refresh but not on soft navigation

**Phase to address:** Tries tab API connection phase.

---

### Pitfall 5: `SavedGrid` Mock Data in `collectionStore` Creates Two Sources of Truth

**What goes wrong:**
`SavedGrid.tsx` reads from `collectionStore` which calls `loadCollection()`. That function populates `pins` and `boards` from `MOCK_PINS` constant in `collectionStore.ts`. If the real saved posts API is connected without replacing the store's data source, the component shows mock pins plus real saved posts, or shows mock pins even in production.

The real saved posts API (`savedPosts.ts`) operates at a per-post level (save/unsave/status for a single post ID), not at a grid level. There is no `GET /api/v1/users/me/saved` endpoint in the current OpenAPI spec.

**Why it happens:**
The `SavedGrid` uses Zustand store as its data layer, not React Query directly. The real per-post save API in `lib/api/savedPosts.ts` does not have a "list all saved posts" endpoint. Developers assume saved grid just needs to call `fetchSavedPosts()` without verifying the endpoint exists.

**How to avoid:**
Before implementing the Saved tab, verify whether the backend has a `GET /api/v1/users/me/saved` endpoint. If it does not exist, the Saved grid cannot be meaningfully implemented — display a "Coming soon" state or skip the tab. If it exists, replace `loadCollection()` in `collectionStore` with the real API call and remove the `MOCK_PINS` constant entirely.

**Warning signs:**
- Saved grid shows placeholder images from `picsum.photos` in staging
- Pin count in the grid doesn't match the save/unsave action count from post detail pages
- `loadCollection()` is called but the grid never updates after a user saves a post

**Phase to address:** Saved tab implementation phase — start by auditing the backend spec for a list endpoint.

---

### Pitfall 6: `FollowButton` Local State Diverges from Server State on Navigation

**What goes wrong:**
`FollowButton` manages follow state with `useState(initialFollowing)`. If `initialFollowing` is passed from a parent that fetched follow status at page load, and the user follows/unfollows and then navigates away and back, the component re-mounts with the original `initialFollowing` prop from the stale React Query cache — not the updated value. The follow action mutation does not invalidate the query that provides the follow status.

**Why it happens:**
This is the "optimistic update without cache invalidation" pattern. The `onFollowChange` callback in `FollowButton` triggers only what the parent wires it to. If no follow mutation hook is created with an `onSuccess` invalidation, the cache stays stale.

**How to avoid:**
Create a `useFollowUser(targetUserId)` mutation hook that:
1. Calls the follow/unfollow API endpoint
2. On success, invalidates `profileKeys.user(targetUserId)` and `profileKeys.stats()` for the current user (following count changes)
3. Passes `isFollowing` from query data into `FollowButton.initialFollowing` — the component re-derives from server state on each mount

**Warning signs:**
- User follows someone, navigates away, comes back, button shows "Follow" again instead of "Following"
- Follower count in `FollowStats` doesn't change after clicking follow
- React Query DevTools shows no invalidation triggered by follow mutations

**Phase to address:** Follow system phase — wire as a proper mutation with cache invalidation.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keeping `MOCK_PINS` in `collectionStore` while wiring other tabs | Faster shipping of non-saved tabs | Saved tab always shows fake data; QA failure if shipped | Never — replace with empty array before merging |
| Client-side only auth guard via `useEffect` | Avoids touching `proxy.ts` | Flash of unauthorized content; profile skeleton shown to logged-out users | Never for `/profile` own-profile route |
| Using `["my-tries"]` as query key without user scope | Simple key | Cache pollution between users on shared device; stale empty state | Never — always scope by userId |
| Keeping hardcoded `followers = 1234, following = 567` defaults in `FollowStats` | Visible in component library | Wrong counts shown if API errors or data unavailable | Never in production code — use `0` or undefined |
| Adding `/profile/[userId]` page without updating proxy matcher | Page routes correctly | Authenticated state doesn't propagate; cookie refresh skipped | Never — proxy.ts update is 2 lines |
| Writing manual fetch functions for follow endpoints instead of regenerating Orval | Avoids waiting for backend spec update | Two API client patterns in codebase; manual code not covered by type generation | Only as temporary shim for 1 sprint, must be removed after spec update |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Orval `generate:api` for follow endpoints | Running generation before updating `packages/api-server/openapi.json` with follow endpoints | Confirm backend spec has follow operations first, copy updated spec file, then run `bun run generate:api` from `packages/web` |
| Supabase session in `proxy.ts` for `/profile` | Using `supabase.auth.getUser()` instead of `supabase.auth.getSession()` | `getSession()` is the pattern used for admin guard — reads from JWT cookie without network call; stay consistent |
| React Query invalidation after follow mutation | Invalidating only `profileKeys.user(targetUserId)` | Also invalidate `profileKeys.stats()` for current user — their following count changes; optionally `profileKeys.me()` if user object contains follow counts |
| Public profile `useUser(userId)` before route param resolves | Passing `""` (empty string) as userId | The `useUser` hook has `enabled: !!userId` guard — pass `undefined` when userId is unavailable; `""` evaluates truthy in some JS checks |
| Auth redirect destination | Redirecting to `/` (home) on unauthenticated access to `/profile` | Redirect to `/login?redirect=/profile` so the user returns to profile after login; admin guard redirects to `/` for stealth reasons — profile should not be stealthy |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full followers list inline on profile page without pagination | Profile page becomes slow for users with many followers | Only fetch follower/following counts for stats display; use infinite scroll if a followers list modal is shown | At ~1k followers (first page response exceeds 200ms on mobile) |
| Loading saved posts grid on profile page load regardless of active tab | Unnecessary network request delays initial paint | Gate the saved posts query with `enabled: activeTab === "saved"` — the existing `useUserActivities` already uses this pattern | At 50+ saved items on slower connections |
| Invalidating all profile queries on follow action | Every profile section re-fetches unnecessarily | Use targeted `invalidateQueries` with specific keys — only follow stats query, not full user profile | At ~20 simultaneous invalidations |
| No `staleTime` on public profile queries | Network request on every navigation to a user profile | Set `staleTime: 1000 * 60 * 5` matching own profile in `useMe` | High navigation frequency (users browsing multiple profiles) |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public profile renders all fields from `UserResponse` including private ones | Sensitive data (email, is_admin, ink_credits) visible to anyone | The backend `GET /api/v1/users/{user_id}` should return public-only fields — verify the response schema before rendering; create a `PublicUserProfile` type that excludes sensitive fields |
| Follow button renders on own profile page | User can follow themselves; pollutes follower counts | Add guard: `if (targetUserId === currentUser?.id) return null` before rendering `FollowButton` |
| Auth redirect goes to `/` without explaining why | User lands on home with no context, may think the site is broken | Redirect to `/login?redirect=/profile` with clear message; admin stealth-redirect pattern is intentional there but wrong for user-facing pages |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Follow button shows "Follow" while mutation is in-flight | Perceived lag — button seems unresponsive | Optimistic update: immediately flip button state, revert on error; `useState` in `FollowButton` already supports this if the parent wires the mutation correctly |
| `FollowStats` shows loading skeleton while counts load | Stats flicker during profile load | Fetch followers and following counts in a single query; render both as skeleton until both resolve |
| Navigating to `/profile/[userId]` for non-existent user shows raw JSON error | White screen or JSON visible in browser | Add `notFound()` in the public profile page server component when API returns 404; the proxy already forwards status codes |
| Own profile accessible via `/profile/[userId]` and `/profile` — two URLs | Duplicate content, confusing canonical URL | Redirect `/profile/[currentUserId]` to `/profile` in the public profile server component |
| Auth redirect goes to `/` instead of login | User has no path to authenticate | Redirect to `/login?redirect=/profile` — standard pattern distinct from the admin stealth redirect |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Follow System:** `FollowButton` renders and toggles visually — verify the API mutation is wired, cache is invalidated, and `FollowStats` counts update without a page reload
- [ ] **Auth Guard:** Navigating to `/profile` in an incognito window redirects — verify redirect goes to `/login?redirect=/profile` (not `/`), and returning after login lands back on `/profile`
- [ ] **TriesGrid:** Grid renders empty state — verify the stub `fetchMyTries` is replaced with a real API call and query key includes `userId`
- [ ] **SavedGrid:** Grid renders — verify `MOCK_PINS` constant is removed from `collectionStore.ts` before merging; `picsum.photos` images in production is a QA failure
- [ ] **Public Profile `/profile/[userId]`:** Page renders another user's profile — verify Settings/Share buttons from own profile are replaced with Follow button and navigation, not just hidden
- [ ] **FollowStats real data:** Counts display — verify hardcoded `followers = 1234, following = 567` defaults are removed and the component receives real data or shows `0`
- [ ] **Proxy matcher coverage:** Auth guard is active — verify `proxy.ts` matcher includes both `/profile` and `/profile/:path*` for session propagation
- [ ] **Orval regeneration:** `generate:api` runs without errors — verify `packages/api-server/openapi.json` is updated before regenerating; running against stale spec produces stale types

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Follow API called without proxy (CORS error) | LOW | Add proxy route at `app/api/v1/users/[userId]/follow/route.ts`; point generated hook through empty baseURL |
| Client-side auth guard shows flash of content | LOW | Move guard to `proxy.ts` matcher — 2-line change; flash disappears immediately |
| Stale empty `["my-tries"]` cache after API is wired | LOW | Change query key to include `userId`, or call `queryClient.invalidateQueries` on mount |
| Mock pins visible in production | MEDIUM | Remove `MOCK_PINS` from `collectionStore`, replace `loadCollection()` with API call or `[]`; verify with hard refresh in staging |
| `/profile/[userId]` capturing wrong paths | MEDIUM | Add explicit static routes for any path that must not be treated as userId; App Router resolves static before dynamic |
| Orval generated types out of sync with follow API | MEDIUM | Re-verify `packages/api-server/openapi.json` matches live backend, run `bun run generate:api`, fix TypeScript errors before proceeding |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Follow API missing from spec and proxy | Follow System (before any component code) | `curl https://dev.decoded.style/api/v1/users/{id}/follow` returns 200/405 (not 404); proxy route file exists |
| Auth guard client-side flash | Auth Guard phase | Incognito navigation to `/profile` immediately redirects; no skeleton visible before redirect |
| `/profile/[userId]` proxy matcher gap | Public Profile phase | Authenticated user visits public profile; Supabase cookie refreshed (verify Network tab) |
| Stale empty tries cache | Tries tab API connection phase | Navigate away and back; tries grid reloads from API; no stale empty state |
| Mock pins in saved grid | Saved tab phase | Grep `MOCK_PINS` and `picsum.photos` returns 0 results before PR merge |
| Follow button state diverges from server | Follow System phase | Follow user, navigate away, navigate back; button still shows "Following" |
| `FollowStats` hardcoded defaults | Follow System phase | Remove default values from `FollowStats` props; component must fail to render or show `0` when no data |

---

## Sources

- Direct codebase analysis:
  - `/packages/web/lib/components/profile/FollowStats.tsx` — hardcoded `followers = 1234, following = 567` defaults confirmed
  - `/packages/web/lib/components/profile/TriesGrid.tsx` — stub `fetchMyTries` returning `[]` confirmed
  - `/packages/web/lib/stores/collectionStore.ts` — `MOCK_PINS` constant confirmed (60+ lines of mock data)
  - `/packages/web/proxy.ts` — only `/admin/:path*` in matcher, no profile guard
  - `/packages/web/lib/components/shared/FollowButton.tsx` — local `useState` only, no mutation hook wired
  - `/packages/web/app/api/v1/users/` directory — no follow proxy routes (`/me/followers`, `/[userId]/follow`) confirmed
  - `/packages/api-server/openapi.json` — no follow, saved list, or tries endpoints in spec (verified via path enumeration)
  - `/packages/web/lib/hooks/useProfile.ts` — existing query key patterns, `useUser` hook with `enabled: !!userId`
  - `/packages/web/lib/api/savedPosts.ts` — per-post save/unsave exists but no list endpoint
- Architecture patterns from `.planning/codebase/ARCHITECTURE.md`
- Known codebase concerns from `.planning/codebase/CONCERNS.md`

---

*Pitfalls research for: Profile Page Completion (v10.0) — follow system, activity tabs, public profile, auth guard*
*Researched: 2026-03-26*
