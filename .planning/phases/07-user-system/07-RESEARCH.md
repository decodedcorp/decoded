# Phase 07: Screen Specs — User System - Research

**Researched:** 2026-02-19
**Domain:** User authentication, profile, and earnings — codebase analysis for documentation phase
**Confidence:** HIGH (all findings verified from source files)

## Summary

This is a documentation-only phase that writes screen specs for three existing screens: SCR-USER-01 (login), SCR-USER-02 (profile), and SCR-USER-03 (earnings). All research was performed by directly reading the codebase. No external libraries were researched.

The login page is a fully implemented, single-screen OAuth flow using Google only (Kakao/Apple configs exist in `OAuthButton.tsx` but are not rendered in `LoginCard.tsx`). The profile page is substantially implemented with real API data for user info and stats, but mock data for activity tab content (PostsGrid, SpotsList, SolutionsList, SavedGrid). The earnings screen does NOT exist as a route — it is referenced by a `StatsCards.tsx` click handler that fires an alert saying "수익 페이지는 아직 구현되지 않았습니다." Auth-conditional rendering is done at the component level (not via middleware), with no protected redirect for `/profile` or `/login`.

**Primary recommendation:** SCR-USER-03 must be documented as NOT-IMPL (no route exists). Document the earnings concept from the `profileStore` data model only. Document what the spec _should_ describe when implemented, with clear NOT-IMPL markers throughout.

---

## authStore Deep Dive

**File:** `packages/web/lib/stores/authStore.ts`

### State Shape

```typescript
interface AuthState {
  user: User | null;           // null = unauthenticated
  isAdmin: boolean;            // fetched from users table is_admin field
  isGuest: boolean;            // true after guestLogin()
  isLoading: boolean;          // true during OAuth redirect initiation
  isInitialized: boolean;      // false until initialize() completes
  loadingProvider: OAuthProvider | null;  // "google"|"kakao"|"apple" during login
  error: string | null;        // error message string from failed auth
}
```

### User Type (App-level, NOT SupabaseUser)

```typescript
interface User {
  id: string;          // Supabase UUID
  email: string;
  name: string;        // from user_metadata.full_name || .name || .nickname || email prefix
  avatarUrl?: string;  // from user_metadata.avatar_url || .picture
  createdAt: string;   // ISO string
}
```

### OAuthProvider Type

```typescript
type OAuthProvider = "kakao" | "google" | "apple";
```

### Actions

| Action | Behavior |
|--------|----------|
| `initialize()` | Calls `supabase.auth.getSession()`, populates `user` + `isAdmin`. Runs once (guarded by `isInitialized`). |
| `signInWithOAuth(provider)` | Sets `isLoading: true`, `loadingProvider: provider`. Calls `supabase.auth.signInWithOAuth()` with `redirectTo: window.location.origin + "/"`. On error, sets error message. |
| `guestLogin()` | Sets `isGuest: true`, `user: null`, `isAdmin: false`. Synchronous. |
| `logout()` | Calls `supabase.auth.signOut()`. On success: `user: null`, `isAdmin: false`, `isGuest: false`. |
| `clearError()` | Sets `error: null`. |
| `setUser(supabaseUser)` | Called by `AuthProvider` on `onAuthStateChange`. Maps SupabaseUser → User and fetches `isAdmin`. |

### Selectors

```typescript
selectUser         // state.user
selectIsAdmin      // state.isAdmin
selectIsAuthenticated  // !!state.user || state.isGuest  (guest counts as authenticated)
selectIsLoggedIn   // !!state.user                       (guest does NOT count)
selectIsGuest      // state.isGuest
selectIsLoading    // state.isLoading
selectIsInitialized // state.isInitialized
```

### Auth State Machine

```
unauthenticated → (signInWithOAuth) → loading [redirected to provider] → (callback) → authenticated
unauthenticated → (guestLogin) → guest
authenticated   → (logout) → unauthenticated
guest           → (logout) → unauthenticated  [NOT IMPL: guestLogin has no supabase session, logout is for real users]
```

**IMPORTANT:** `isGuest` and `user` are mutually exclusive. Guest has no Supabase session. `selectIsAuthenticated` returns `true` for both authenticated and guest states — this is the key selector for "can browse" access control.

### AuthProvider (Session Listener)

**File:** `packages/web/lib/components/auth/AuthProvider.tsx`

Wraps entire app in `app/providers.tsx`. On mount:
1. Calls `initialize()` to get existing session.
2. Subscribes to `supabase.auth.onAuthStateChange()`.
3. On `SIGNED_IN` or `TOKEN_REFRESHED` → calls `setUser(session.user)`.
4. On `SIGNED_OUT` → calls `setUser(null)`.
5. `INITIAL_SESSION` is ignored (handled by `initialize()`).

The `AuthProvider` is placed inside `AppProviders` which wraps the entire Next.js app.

---

## SCR-USER-01: Login Page Analysis

### Route and Files

| File | Role |
|------|------|
| `packages/web/app/login/page.tsx` | Page entry — renders `LoginBackground` + `LoginCard` |
| `packages/web/app/login/layout.tsx` | Fixed fullscreen layout (`fixed inset-0 z-50`) |
| `packages/web/app/login/LoginBackground.tsx` | Animated DomeGallery background |
| `packages/web/lib/components/auth/LoginCard.tsx` | Core login UI — auth logic |
| `packages/web/lib/components/auth/OAuthButton.tsx` | Per-provider OAuth button |

### Login Page Layout

- Full-screen, black background
- Background: `DomeGallery` with 30 latest images, grayscale, auto-rotating 3D dome
- Dark overlay: `bg-black/30` (z-10)
- Content: centered vertically (`flex min-h-screen flex-col items-center justify-center`)
- `LoginCard` is the sole interactive element (z-20)

### LoginCard Implementation

**Design:** `w-full max-w-sm`, `bg-white/5 backdrop-blur-xl`, `rounded-xl border-0 shadow-2xl`

**Content (top to bottom):**
1. Logo: `decoded` text in `text-[#d9fc69]`, 3xl bold
2. Tagline: "Welcome to Decoded" + "Discover what they're wearing"
3. Error display: conditional `bg-red-500/10 border border-red-500/20` block with error message
4. OAuth buttons: **ONLY Google** (`OAuthButton provider="google"`) — Kakao/Apple removed from rendered output
5. Divider: "or" text divider
6. Guest button: inline `<button>` (not `GuestButton` DS component) — "Continue as Guest"
7. Footer: Terms of Service + Privacy Policy links

**Note:** The design system `LoginCard` in `lib/design-system/login-card.tsx` renders Kakao + Google + Apple. The actual `app/login/LoginCard.tsx` (in `lib/components/auth/`) renders **only Google**. Spec should document the component file, not the DS version.

### OAuth Flow (Google)

1. User taps "Continue with Google" button
2. `handleLogin("google")` → `signInWithOAuth("google")` in authStore
3. authStore: sets `isLoading: true`, `loadingProvider: "google"`
4. Supabase initiates OAuth redirect to Google
5. Loading state shows `Loader2` spinner on button; all buttons disabled
6. Browser redirects to Google OAuth
7. After Google auth: redirected to `window.location.origin + "/"` (hardcoded)
8. `AuthProvider.onAuthStateChange` fires `SIGNED_IN` event
9. `setUser()` called → `mapSupabaseUser()` → User mapped, `isAdmin` fetched
10. `isLoading: false`, `loadingProvider: null`, `user` populated

**Error path:** If `signInWithOAuth` throws, error message string is set in `state.error`. Card displays error in red block. Error cleared by next `signInWithOAuth` call (`error: null` at start).

### Guest Flow

1. User taps "Continue as Guest"
2. `handleGuestLogin()` → `guestLogin()` → sets `isGuest: true`
3. `router.push("/")` — navigates to home immediately (synchronous)
4. No Supabase session created
5. `selectIsAuthenticated` returns `true`, `selectIsLoggedIn` returns `false`

### Post-Login Redirect

- OAuth: `redirectTo: window.location.origin + "/"` — hardcoded to root (`/`)
- Guest: `router.push("/")` — also to root
- There is NO referrer/callbackUrl mechanism — login always returns to `/`

### Error Handling — Implemented vs NOT-IMPL

| Scenario | Status | Implementation |
|----------|--------|----------------|
| OAuth failure (network/provider error) | IMPL | Error string shown in red block in LoginCard |
| Loading state during OAuth | IMPL | `Loader2` spinner + all buttons disabled |
| Background load failure | IMPL | Falls back to solid black background (no DomeGallery if no images) |
| Session already exists | NOT-IMPL | No redirect if user navigates to `/login` while authenticated |
| Callback error (from provider) | NOT-IMPL | No handling of OAuth callback URL error params |

---

## SCR-USER-02: Profile Page Analysis

### Route and Files

| File | Role |
|------|------|
| `packages/web/app/profile/page.tsx` | Page entry — renders `ProfileClient` |
| `packages/web/app/profile/ProfileClient.tsx` | Main client component, orchestrates all sub-components |
| `packages/web/lib/components/profile/*.tsx` | Profile feature components |
| `packages/web/lib/stores/profileStore.ts` | Profile state — mix of API data and mock data |
| `packages/web/lib/hooks/useProfile.ts` | React Query hooks for API calls |

### Profile Layout (Mobile)

```
[Mobile Header: ← Profile title | Share + Settings icons]  sticky top-0
│ ProfileHeader (ProfileHeaderCard with avatar/name/stats/actions)
│ ProfileBio (bio text + social links - MOCK DATA)
│ FollowStats (followers/following - MOCK DATA: 1234/567)
│ StatsCards (3 stats: Posts | Solutions | Points)
│ BadgeGrid (badge icons - MOCK DATA from profileStore)
│ ActivityTabs (Posts | Spots | Solutions | Saved)
│ ActivityContent → one of: PostsGrid | SpotsList | SolutionsList | SavedGrid
```

### Profile Layout (Desktop ≥768px)

```
[DesktopHeader]
└── 2-column layout via ProfileDesktopLayout:
    LEFT (w-80): ProfileHeader (ProfileHeaderCard)
    RIGHT (flex-1):
      BadgeGrid
      RankingList (MOCK DATA: global #42, IVE #3, BLACKPINK #12)
      ActivityTabs + ActivityContent
```

### Data Sources — Real vs Mock

| Component | Data Source | Status |
|-----------|-------------|--------|
| ProfileHeader (user info) | `useMe()` → `/api/v1/users/me` → profileStore | REAL |
| StatsCards | `useUserStats()` → `/api/v1/users/me/stats` → profileStore | REAL |
| BadgeGrid | `profileStore.badges` (MOCK_BADGES hardcoded) | MOCK |
| RankingList | `profileStore.rankings` (MOCK_RANKINGS hardcoded) | MOCK |
| ProfileBio | Hardcoded prop defaults (bio string + social links) | MOCK |
| FollowStats | Hardcoded prop defaults (1234 followers, 567 following) | MOCK |
| PostsGrid | MOCK_POSTS (6 picsum images) | MOCK |
| SpotsList | MOCK_SPOTS (3 items) | MOCK |
| SolutionsList | MOCK_SOLUTIONS (3 items) | MOCK |
| SavedGrid | MOCK_SAVED (4 items) | MOCK |

### Stats Display

`StatsCards` renders 3 stat cards:
- **Posts** (`totalContributions`) — from API `total_posts`; clickable → alerts "not yet implemented"
- **Solutions** (`totalAnswers`) — from API `total_comments`; not clickable
- **Points** (`totalEarnings`) — mapped from API `total_points`, formatted as KRW currency; clickable → alerts "수익 페이지는 아직 구현되지 않았습니다"

### Activity Tabs

```typescript
type ActivityTab = "posts" | "spots" | "solutions" | "saved";
const TABS = [
  { id: "posts", label: "Posts" },
  { id: "spots", label: "Spots" },
  { id: "solutions", label: "Solutions" },
  { id: "saved", label: "Saved" },
];
```

Default active tab: `"posts"`. Tab switching is local `useState` in `ProfileClient`. No URL sync.

### Profile Edit

`ProfileEditModal` is fully implemented:
- Triggered by Settings icon (mobile) or "Edit Profile" button (ProfileHeader)
- Form fields: Display Name, Bio, Avatar URL
- Validation: displayName min 2 chars, bio max 200 chars
- Submits via `useUpdateProfile()` → `PATCH /api/v1/users/me`
- On success: toasts "Profile updated successfully", updates profileStore + React Query cache, closes modal

### Auth Dependency

Profile page does NOT use `useAuthStore` directly for data. It uses `useMe()` (React Query → `/api/v1/users/me`). The API route itself requires `Authorization` header. If user is not authenticated, the API returns 401, triggering React Query error state → `ProfileError` component renders.

**No explicit redirect to `/login`** when profile page is accessed unauthenticated. The error state shows "프로필을 불러올 수 없습니다" with a retry button — NOT a login redirect.

### Own vs Other User Profile

The current `/profile` route is always **own profile only** (`/api/v1/users/me`). There is `fetchUserById` in the API layer and `useUser(userId)` hook, but **no `/profile/[userId]` route exists** in the app. Other-user profile viewing is NOT-IMPL at the routing level.

---

## SCR-USER-03: Earnings Screen Analysis

### Implementation Status: NOT-IMPL (no route exists)

There is **no `/profile/earnings` route**, **no earnings page component**, and **no dedicated earnings API route** in the codebase.

### Evidence

1. `StatsCards.tsx` line 77-78:
   ```typescript
   const handleEarningsClick = () => {
     console.log("Navigate to /profile/earnings - not yet implemented");
     alert("수익 페이지는 아직 구현되지 않았습니다.");
   };
   ```

2. No files matching `earnings`, `payout`, `settlement`, `withdraw` in `app/` directory.

3. No API routes for earnings data.

4. Affiliate link conversion exists (`/api/v1/solutions/convert-affiliate`) but this is a backend utility for URL conversion, not a user-facing earnings dashboard.

### What Exists (Foundation Only)

The data model in `profileStore` has `totalEarnings: number` mapped from `total_points` in `UserStatsResponse`. This is displayed in `StatsCards` as "Points" (formatted as KRW currency). Points ≠ actual earnings payout system.

The affiliate mechanism at the solution level:
- `Solution` type has `affiliate_url: string | null`
- `POST /api/v1/solutions/convert-affiliate` converts a product URL to affiliate URL
- This is handled server-side; no click tracking UI exists in the frontend

### Spec Approach for SCR-USER-03

Since no screen exists, the spec must:
1. Document the **intended** screen design based on the phase requirements
2. Mark all requirements as `NOT-IMPL`
3. Reference the existing data model (`total_points` as points/earnings basis)
4. Reference the affiliate conversion API as the backend mechanism
5. Note that the "Points" StatCard on the profile screen is the entry point (click → NOT-IMPL alert)

---

## Auth-Conditional Rendering Patterns (Cross-Cutting)

### Middleware (Server-Level Protection)

**File:** `packages/web/middleware.ts`

Only `/admin/:path*` is middleware-protected. The middleware:
1. Checks Supabase session via `createSupabaseMiddlewareClient`
2. If no session → redirect to `/`
3. If session but `is_admin !== true` → redirect to `/`
4. Development mode: middleware is bypassed entirely

**No other routes are middleware-protected.** `/profile`, `/login`, `/request/upload`, etc. have no server-level auth guards.

### Component-Level Auth Patterns

**Pattern 1: Admin-conditional UI**
Used in `DesktopHeader` and `MobileHeader`:
```typescript
const user = useAuthStore((state) => state.user);
const isAdmin = useAuthStore(selectIsAdmin);
// ...
{user && isAdmin && <Link href="/admin">Admin Panel</Link>}
```

**Pattern 2: Authenticated user UI (logged-in vs guest/anon)**
Used in `DesktopHeader`:
```typescript
const user = useAuthStore((state) => state.user);
// ...
{user ? (
  <UserDropdown /> // avatar, name, dropdown menu
) : (
  <Link href="/login">Login</Link>
)}
```

**Pattern 3: Profile page — API-driven error (no explicit auth check)**
`ProfileClient` does NOT check `useAuthStore`. It calls `useMe()` which calls `/api/v1/users/me` with `Authorization` header. The API layer adds the auth header. If user is not authenticated, API returns 401 → React Query error → `ProfileError` component.

**Pattern 4: Guest access**
`guestLogin()` sets `isGuest: true`. `selectIsAuthenticated` returns `true` for guests. The LoginCard has a "Continue as Guest" button that calls `guestLogin()` then `router.push("/")`. There is no guest-specific rendering pattern discovered in profile/detail pages — guests would hit the same 401 API error as unauthenticated users on `/profile`.

### Session Handling

- Session initialization: `AuthProvider` runs `initialize()` on app mount via `useEffect`
- Token refresh: Supabase handles internally; `TOKEN_REFRESHED` event → `setUser()` called
- Session expiry: No explicit handling in frontend; Supabase client handles token refresh. If refresh fails, `SIGNED_OUT` event → `setUser(null)`. No "session expired" UI.
- Loading state during init: `isInitialized: false` during `initialize()`. No app-level loading screen gated on `isInitialized` was found.

---

## Prior Spec Format Reference

**Template from:** `specs/screens/detail/SCR-VIEW-01-post-detail.md`

Key format conventions:
1. Header: `# [SCR-ID] Screen Name` + route + status + date
2. Purpose section: 1-3 sentences
3. Component Map: table with Region | Component | File | Props/Notes
4. Layout: ASCII art diagram for mobile then desktop table
5. Requirements: EARS syntax with checkmarks (`✅`) and not-impl markers (`⚠️ NOT-IMPL`)
6. Navigation: table of triggers → destinations
7. Error & Empty States: table of State | Condition | UI
8. Line limit: 200 lines (300 max with justification)

**EARS syntax pattern:**
- `When [condition], the system shall [action]. ✅` (implemented)
- `When [condition], the system shall [action]. ⚠️ NOT-IMPL` (not implemented)
- `When [condition], the system shall — ⚠️ NOT-IMPL` (entirely missing)

---

## Component File Path Summary (Verified)

All paths verified against filesystem:

### Login (SCR-USER-01)
- Page: `packages/web/app/login/page.tsx`
- Layout: `packages/web/app/login/layout.tsx`
- Background: `packages/web/app/login/LoginBackground.tsx`
- LoginCard: `packages/web/lib/components/auth/LoginCard.tsx`
- OAuthButton: `packages/web/lib/components/auth/OAuthButton.tsx`
- AuthProvider: `packages/web/lib/components/auth/AuthProvider.tsx`

### Profile (SCR-USER-02)
- Page: `packages/web/app/profile/page.tsx`
- ProfileClient: `packages/web/app/profile/ProfileClient.tsx`
- ProfileHeader: `packages/web/lib/components/profile/ProfileHeader.tsx`
- ProfileBio: `packages/web/lib/components/profile/ProfileBio.tsx`
- FollowStats: `packages/web/lib/components/profile/FollowStats.tsx`
- StatsCards: `packages/web/lib/components/profile/StatsCards.tsx`
- BadgeGrid: `packages/web/lib/components/profile/BadgeGrid.tsx`
- BadgeModal: `packages/web/lib/components/profile/BadgeModal.tsx`
- RankingList: `packages/web/lib/components/profile/RankingList.tsx`
- ActivityTabs: `packages/web/lib/components/profile/ActivityTabs.tsx`
- ActivityContent: `packages/web/lib/components/profile/ActivityContent.tsx`
- PostsGrid: `packages/web/lib/components/profile/PostsGrid.tsx`
- SpotsList: `packages/web/lib/components/profile/SpotsList.tsx`
- SolutionsList: `packages/web/lib/components/profile/SolutionsList.tsx`
- SavedGrid: `packages/web/lib/components/profile/SavedGrid.tsx`
- ProfileEditModal: `packages/web/lib/components/profile/ProfileEditModal.tsx`
- ProfileDesktopLayout: `packages/web/lib/components/profile/ProfileDesktopLayout.tsx`

### State & Hooks
- authStore: `packages/web/lib/stores/authStore.ts`
- profileStore: `packages/web/lib/stores/profileStore.ts`
- useProfile hooks: `packages/web/lib/hooks/useProfile.ts`
- AuthProvider: `packages/web/lib/components/auth/AuthProvider.tsx`

### Earnings (SCR-USER-03) — No dedicated files exist
- Entry point (StatCard click): `packages/web/lib/components/profile/StatsCards.tsx` (NOT-IMPL alert)
- Affiliate API: `packages/web/app/api/v1/solutions/convert-affiliate/route.ts`

---

## Key Planning Decisions Informed by Research

1. **SCR-USER-01 (Login):** Document Google OAuth only (as per user decision). No Kakao/Apple. Document DomeGallery background, glassmorphic card, error display (implemented), and guest flow. Post-login redirect is hardcoded to `/`. No "already logged in" redirect.

2. **SCR-USER-02 (Profile):** Distinguish real data (user info, stats) from mock data (badges, rankings, activity tabs). Document edit modal as fully implemented. No own-vs-other handling — always own profile. Auth guard is API-driven (401 error), not redirect-based.

3. **SCR-USER-03 (Earnings):** Document as NOT-IMPL screen. Entry point is the "Points" StatCard click on profile. All requirements marked NOT-IMPL. Reference existing data model (total_points, affiliate_url) as the planned foundation.

4. **Auth-conditional rendering:** Document both patterns — (a) header-level `user ? authenticated UI : Login link`, (b) API-error-driven on profile. No middleware auth guards for user-facing routes.

---

## Sources

### PRIMARY (HIGH confidence — direct source code reading)

- `packages/web/lib/stores/authStore.ts` — full authStore shape, actions, selectors
- `packages/web/lib/components/auth/AuthProvider.tsx` — session lifecycle management
- `packages/web/lib/components/auth/LoginCard.tsx` — actual login UI implementation
- `packages/web/lib/components/auth/OAuthButton.tsx` — provider configs
- `packages/web/app/login/page.tsx` + `layout.tsx` + `LoginBackground.tsx` — login page structure
- `packages/web/app/login/LoginBackground.tsx` — DomeGallery background
- `packages/web/app/profile/ProfileClient.tsx` — profile page orchestration
- `packages/web/lib/components/profile/*.tsx` — all profile feature components
- `packages/web/lib/stores/profileStore.ts` — profile state with mock data
- `packages/web/lib/hooks/useProfile.ts` — React Query hooks
- `packages/web/lib/api/types.ts` — UserResponse, UserStatsResponse types
- `packages/web/middleware.ts` — route protection (admin-only)
- `packages/web/lib/design-system/desktop-header.tsx` — auth-conditional header rendering
- `packages/web/lib/design-system/mobile-header.tsx` — admin-conditional shield icon
- `packages/web/lib/components/profile/StatsCards.tsx` — earnings NOT-IMPL evidence
- `packages/web/app/api/v1/solutions/convert-affiliate/route.ts` — affiliate API

### TEMPLATE REFERENCE (HIGH confidence)
- `specs/screens/detail/SCR-VIEW-01-post-detail.md` — established spec format

---

## Metadata

**Confidence breakdown:**
- authStore shape: HIGH — read directly from source
- Login flow: HIGH — read all components, traced full flow
- Profile implementation status: HIGH — read all components, identified mock vs real data
- Earnings status: HIGH — confirmed NOT-IMPL from alert in StatsCards.tsx and absence of any route
- Auth-conditional patterns: HIGH — read middleware, headers, LoginCard

**Research date:** 2026-02-19
**Valid until:** Stable (documentation phase; no code changes planned)
