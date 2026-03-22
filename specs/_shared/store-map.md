# Store Map — Zustand Store Inventory

> All Zustand stores used in decoded-app. Source: `packages/web/lib/stores/` (web-specific) and `packages/shared/stores/` (shared package, re-exported via web stubs).

---

## Store → Screen Matrix

| Store | File | Screens |
|-------|------|---------|
| authStore | `packages/web/lib/stores/authStore.ts` | Login, Profile, all auth-conditional rendering (DesktopHeader user area, admin routes) |
| searchStore | `packages/shared/stores/searchStore.ts` | Search overlay (`/search`) |
| filterStore | `packages/shared/stores/filterStore.ts` | Explore (`/explore`) |
| requestStore | `packages/web/lib/stores/requestStore.ts` | Upload (`/request/upload`), AI Detect (`/request/detect`), Edit/Solution flow |
| transitionStore | `packages/web/lib/stores/transitionStore.ts` | Image detail FLIP animation (grid -> detail transition) |
| magazineStore | `packages/web/lib/stores/magazineStore.ts` | Magazine (`/magazine`, `/magazine/personal`) — **IMPLEMENTED** |
| studioStore | `packages/web/lib/stores/studioStore.ts` | Spline 3D camera states for studio/dome experience — **IMPLEMENTED** |
| creditStore | `packages/web/lib/stores/creditStore.ts` | Credit balance across magazine/VTON features — **PROPOSED** |
| vtonStore | `packages/web/lib/stores/vtonStore.ts` | Try-on studio state — **PROPOSED** |
| profileStore | `packages/web/lib/stores/profileStore.ts` | Profile (`/profile`) |

---

## authStore

**File:** `packages/web/lib/stores/authStore.ts`
**Import:** `import { useAuthStore } from '@/lib/stores/authStore'`

### State

| Field | Type | Description |
|-------|------|-------------|
| user | `User \| null` | Current authenticated user (mapped from Supabase user) |
| isAdmin | `boolean` | Whether user has admin privileges (fetched from users table) |
| isGuest | `boolean` | Whether user is in guest mode (unauthenticated but browsing) |
| isLoading | `boolean` | Auth action in progress |
| isInitialized | `boolean` | Whether initial session check has completed |
| loadingProvider | `OAuthProvider \| null` | Which OAuth provider is currently loading |
| error | `string \| null` | Latest auth error message |

**User type:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}
type OAuthProvider = 'kakao' | 'google' | 'apple';
```

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| initialize | `() => Promise<void>` | Check Supabase session on app start; sets isInitialized |
| signInWithOAuth | `(provider: OAuthProvider) => Promise<void>` | Initiate OAuth redirect (Kakao, Google, Apple) |
| guestLogin | `() => void` | Set isGuest=true for unauthenticated browsing |
| logout | `() => Promise<void>` | Sign out via Supabase, clear user/isAdmin/isGuest |
| clearError | `() => void` | Reset error to null |
| setUser | `(supabaseUser: SupabaseUser \| null) => Promise<void>` | Called by onAuthStateChange listener; fetches isAdmin |

### Selectors

| Selector | Returns | Description |
|----------|---------|-------------|
| selectUser | `User \| null` | Current user |
| selectIsAdmin | `boolean` | Admin flag |
| selectIsAuthenticated | `boolean` | True if user or guest |
| selectIsLoggedIn | `boolean` | True only if user (not guest) |
| selectIsGuest | `boolean` | Guest mode flag |
| selectIsLoading | `boolean` | Loading state |
| selectIsInitialized | `boolean` | Initialization complete |

### Transitions

```
uninitialized → initialized (initialize completes)
  → user: null, isAdmin: false (no session)
  → user: User, isAdmin: true|false (session found)

unauthenticated → loading (signInWithOAuth) → [OAuth redirect]
  → authenticated (onAuthStateChange fires after redirect)
  → error (OAuth failure)

authenticated → unauthenticated (logout)

any state → guest (guestLogin)
```

### Used By

Login page (`/login`), DesktopHeader/MobileHeader (user area), Profile page, all routes requiring auth check, admin route protection.

---

## searchStore

**File:** `packages/shared/stores/searchStore.ts`
**Web stub:** `packages/web/lib/stores/searchStore.ts` (re-exports from `@decoded/shared`)
**Import:** `import { useSearchStore } from '@/lib/stores/searchStore'`

### State

| Field | Type | Description |
|-------|------|-------------|
| query | `string` | Current search input value (live) |
| debouncedQuery | `string` | Debounced query used for API calls |
| activeTab | `SearchTab` | Active result tab (`'all' \| 'posts' \| 'images' \| 'users'`) |
| filters | `SearchFilters` | Active search filters |
| page | `number` | Current result page (resets on tab/filter change) |

**SearchFilters type:**
```typescript
interface SearchFilters {
  category?: SearchCategory;
  mediaType?: SearchMediaType;
  context?: SearchContext;
  hasAdopted?: boolean;
  sort: SearchSortOption; // default: 'relevant'
}
```

### Actions

| Action | Description |
|--------|-------------|
| setQuery | Update live search input |
| setDebouncedQuery | Update debounced query (called by useDebounce) |
| setActiveTab | Switch result tab, resets page |
| setFilters | Merge filter updates, resets page |
| setPage | Navigate to page |
| resetFilters | Reset filters to defaults |
| resetAll | Clear all state (query, filters, tab, page) |
| getURLParams | Serialize state to URLSearchParams |
| setFromURLParams | Hydrate state from URLSearchParams (URL sync) |

### Transitions

```
idle (query: '') → typing (setQuery) → debounced (setDebouncedQuery)
  → results rendered via React Query using debouncedQuery

filter change → page reset → new results
tab change → page reset → new results
```

### Used By

Search overlay page (`/search`), `useSearchURLSync` hook.

---

## filterStore

**File:** `packages/shared/stores/filterStore.ts`
**Web stub:** `packages/web/lib/stores/filterStore.ts` (re-exports from `@decoded/shared`)
**Import:** `import { useFilterStore } from '@/lib/stores/filterStore'`

### State

| Field | Type | Description |
|-------|------|-------------|
| activeFilter | `FilterKey` | Currently active category filter |

**FilterKey type:**
```typescript
type FilterKey = 'all' | 'fashion' | 'beauty' | 'lifestyle' | 'accessories' | 'newjeanscloset' | 'blackpinkk.style';
```

### Actions

| Action | Description |
|--------|-------------|
| setActiveFilter | Set active filter (primary action) |
| setFilter | Deprecated alias for setActiveFilter |

### Transitions

```
all → [category] (setActiveFilter) → filtered grid results
[category] → all (setActiveFilter with 'all')
```

### Used By

Explore page (`/explore`) category filter bar.

---

## requestStore

**File:** `packages/web/lib/stores/requestStore.ts`
**Import:** `import { useRequestStore } from '@/lib/stores/requestStore'`

> **Note:** Detailed step enum verification and full request flow analysis deferred to v4-06 (Creation-AI phase) per STATE.md pending todos. This section documents the observable structure.

### Step Flow

```
Step 1: Upload
  → addImage/addImages (file selection + preview)
  → updateImageStatus (uploading → uploaded)
  → setImageUploadedUrl (store CDN URL)
  → canProceedToNextStep: images.some(img => img.status === 'uploaded')

Step 2: AI Detection
  → startDetection() → POST /api/v1/posts/analyze → setDetectedSpots
  → selectSpot / addSpot / removeSpot (manual editing)
  → setSpotSolution (attach product info to spot)
  → canProceedToNextStep: detectedSpots.length > 0

Step 3: Details
  → setArtistName, setGroupName, setContext, setDescription
  → setMediaSource (required: type + title)
  → canProceedToNextStep: mediaSource?.type && mediaSource?.title

Step 4: Submit
  → setSubmitting(true) → POST /api/v1/posts (with spots + solution)
  → setSubmitting(false) + resetRequestFlow() on success
```

### Key State Fields

| Field | Type | Description |
|-------|------|-------------|
| currentStep | `RequestStep` (1\|2\|3) | Active step in multi-step flow |
| images | `UploadedImage[]` | Uploaded images with status tracking |
| detectedSpots | `DetectedSpot[]` | AI-detected or manually-added spots |
| isDetecting | `boolean` | AI analysis in progress |
| isRevealing | `boolean` | Spot reveal animation in progress (1.5s) |
| selectedSpotId | `string \| null` | Currently selected spot |
| aiMetadata | `AiMetadata` | AI-suggested artist name + context |
| isSubmitting | `boolean` | Form submission in progress |

### Used By

Upload page (`/request/upload`), AI Detect page (`/request/detect`), solution editing flow.

---

## transitionStore

**File:** `packages/web/lib/stores/transitionStore.ts`
**Import:** `import { useTransitionStore } from '@/lib/stores/transitionStore'`

> **Note:** FLIP animation pattern verification (useFlipTransition.ts integration) deferred to v4-04 (Detail View phase) per STATE.md pending todos.

### State

| Field | Type | Description |
|-------|------|-------------|
| selectedId | `string \| null` | ID of image being transitioned to detail |
| originState | `FlipState \| null` | GSAP Flip.getState() snapshot from grid item |
| originRect | `DOMRect \| null` | Bounding rect of grid item before transition |
| imgSrc | `string \| null` | Image source URL for transition continuity |

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| setTransition | `(id, state, rect, imgSrc?) => void` | Capture pre-transition state from grid item |
| reset | `() => void` | Clear all transition state after animation completes |

### Transitions

```
idle (selectedId: null) → captured (setTransition called from grid)
  → FLIP animation plays (detail page reads originState + originRect)
  → idle (reset called after animation completes)
```

### Used By

Image grid (grid → detail FLIP trigger), Image detail page (`/images/[id]` — reads originState for FLIP playback).

---

## profileStore

**File:** `packages/web/lib/stores/profileStore.ts`
**Import:** `import { useProfileStore } from '@/lib/stores/profileStore'`

### State

| Field | Type | Description |
|-------|------|-------------|
| user | `ProfileUser` | Display user data (populated from API or mock) |
| stats | `ProfileStats` | Contribution/earnings stats |
| badges | `Badge[]` | Earned badges list |
| rankings | `Ranking[]` | User rankings by scope and period |
| badgeModalMode | `BadgeModalMode` | Modal display mode (`'single' \| 'all' \| null`) |
| selectedBadge | `Badge \| null` | Badge shown in single-badge modal |

**Note:** Store ships with mock data as initial state. API actions (`setUserFromApi`, `setStatsFromApi`) hydrate real data from `/api/v1/users/me` and `/api/v1/users/me/stats`.

### Actions

| Action | Description |
|--------|-------------|
| openBadgeModal | Open badge modal in 'single' or 'all' mode |
| closeBadgeModal | Close badge modal, clear selectedBadge |
| setUserFromApi | Map `UserResponse` to `ProfileUser` store shape |
| setStatsFromApi | Map `UserStatsResponse` to `ProfileStats` store shape |

### Selectors

| Selector | Returns |
|----------|---------|
| selectUser | `ProfileUser` |
| selectStats | `ProfileStats` |
| selectBadges | `Badge[]` |
| selectRankings | `Ranking[]` |
| selectBadgeModalMode | `BadgeModalMode` |
| selectSelectedBadge | `Badge \| null` |

### Transitions

```
mock data (initial) → real data (setUserFromApi + setStatsFromApi called after API fetch)

badgeModalMode: null → 'single' (openBadgeModal('single', badge)) → null (closeBadgeModal)
badgeModalMode: null → 'all' (openBadgeModal('all')) → null (closeBadgeModal)
```

### Used By

Profile page (`/profile`) — all sections: header, stats, badges grid, rankings, badge modal.

---

## magazineStore

**File:** `packages/web/lib/stores/magazineStore.ts`
**Import:** `import { useMagazineStore } from '@/lib/stores/magazineStore'`

> STATUS: Implemented (M7). Manages daily editorial, personal issue, and collection bookshelf state.

### State

| Field | Type | Description |
|-------|------|-------------|
| currentIssue | `MagazineIssue \| null` | Currently displayed daily issue |
| personalIssue | `MagazineIssue \| null` | User's personalized issue |
| personalStatus | `'idle' \| 'checking' \| 'generating' \| 'ready' \| 'error'` | Personal issue generation state |
| isLoading | `boolean` | Daily issue fetch in progress |
| gsapTimeline | `gsap.core.Timeline \| null` | Active GSAP timeline for current layout (client-only, not persisted) |

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| fetchDailyIssue | `() => Promise<void>` | GET /api/v1/magazine/daily |
| fetchPersonalIssue | `() => Promise<void>` | GET /api/v1/magazine/personal |
| requestGeneration | `() => Promise<void>` | POST /api/v1/magazine/personal/generate + start polling |
| setGsapTimeline | `(timeline: gsap.core.Timeline) => void` | Store reference for cleanup |
| reset | `() => void` | Clear all state, kill GSAP timeline |

### Transitions

```
idle -> loading (fetchDailyIssue) -> interactive (issue received + GSAP complete)
idle -> checking (fetchPersonalIssue) -> ready (issue exists) | generating (no issue)
generating -> polling (3s interval) -> ready (generation complete)
any -> error (network/timeout failure)
```

### Used By

Magazine pages (`/magazine`, `/magazine/personal`), NavBar (magazine tab badge).

---

## studioStore

**File:** `packages/web/lib/stores/studioStore.ts`
**Import:** `import { useStudioStore } from '@/lib/stores/studioStore'`

> STATUS: Implemented. Manages Spline 3D camera state for the studio/dome experience.

### State

| Field | Type | Description |
|-------|------|-------------|
| cameraState | `CameraState` | Current camera state: `"loading" \| "entry" \| "browse" \| "focused" \| "exit"` |
| app | `Application \| null` | Spline runtime application reference |

### Used By

Login page (`/login`) DomeGallery background, Lab experiments.

---

## creditStore (Proposed)

**File:** `packages/web/lib/stores/creditStore.ts` (not yet created)
**Import:** `import { useCreditStore } from '@/lib/stores/creditStore'`

> STATUS: Proposed for Milestone 7. Store not yet implemented.

### State

| Field | Type | Description |
|-------|------|-------------|
| balance | `number` | Current credit balance |
| isLoading | `boolean` | Balance fetch in progress |
| lastFetched | `number \| null` | Timestamp of last balance fetch (stale check) |

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| fetchBalance | `() => Promise<void>` | GET /api/v1/credits/balance |
| deductLocally | `(amount: number) => void` | Optimistic deduction before API confirms |
| refund | `(amount: number) => void` | Rollback on API failure |

### Selectors

| Selector | Returns | Description |
|----------|---------|-------------|
| selectBalance | `number` | Current balance |
| selectCanAfford | `(cost: number) => boolean` | Check if user can afford an action |

### Transitions

```
unknown -> fetching (fetchBalance) -> known (balance set)
known -> deducted (deductLocally) -> confirmed (API success) | rolled back (refund on failure)
```

### Used By

Magazine generation (SCR-MAG-02), VTON submit (SCR-VTON-01), credit display in profile/header.

---

## vtonStore (Proposed)

**File:** `packages/web/lib/stores/vtonStore.ts` (not yet created)
**Import:** `import { useVtonStore } from '@/lib/stores/vtonStore'`

> STATUS: Proposed for Milestone 7. Store not yet implemented.

### State

| Field | Type | Description |
|-------|------|-------------|
| userPhoto | `string \| null` | User photo URL (compressed, ephemeral) |
| selectedItem | `{ id: string, imageUrl: string, name: string, brand: string } \| null` | Item chosen for try-on |
| taskId | `string \| null` | Backend task ID for polling |
| resultImageUrl | `string \| null` | Generated try-on result image |
| status | `'idle' \| 'confirming' \| 'generating' \| 'ready' \| 'error'` | Current studio state |
| generationStage | `1 \| 2 \| 3 \| 4 \| 5 \| null` | Active cinematic stage during generation |

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| setUserPhoto | `(url: string) => void` | Set compressed user photo |
| setSelectedItem | `(item) => void` | Select item for try-on |
| submitTryOn | `() => Promise<void>` | POST /api/v1/vton/apply, start polling |
| setStage | `(stage: number) => void` | Update cinematic stage for animation sync |
| reset | `() => void` | Clear all state (photo stays for "Try Another") |
| fullReset | `() => void` | Clear everything including photo |

### Transitions

```
idle -> confirming (item dropped/selected) -> generating (user confirms + API queued)
generating -> stage 1-5 (cinematic sequence) -> ready (poll returns result)
generating -> error (API failure) -> idle (after credit refund)
ready -> idle (Try Another) -> confirming (new item selected)
```

### Used By

VTON Studio page (`/vton`).
