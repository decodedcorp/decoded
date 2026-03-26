# Phase 45: Public User Profile Route - Research

**Researched:** 2026-03-26
**Domain:** Next.js dynamic routing, React Query data fetching, component visibility gating
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 타인 프로필: 프로필 헤더(아바타, 닉네임) + ProfileBio + FollowStats(숫자만) + BadgeGrid + RankingList 공개
- 타인 프로필 숨김: Saved 탭, Ink 크레딧(InkEconomyCard), 프로필 수정 버튼(Settings), ActivityTabs 전체
- StatsCards와 ArchiveStats는 공개 (포스트/스팟/솔루션 개수)
- StyleDNACard는 공개 (읽기 전용)
- 존재하지 않는 userId: 전용 NotFound UI (일러스트 + 홈 이동 버튼)
- 자신의 userId로 접근 시: `/profile`로 리디렉트 (중복 페이지 방지)
- 현재 비공개 프로필 개념 없음 — 모든 유저 프로필은 공개
- `app/profile/[userId]/page.tsx` — Server Component (메타데이터 + PublicProfileClient 렌더)
- `PublicProfileClient.tsx` — 기존 ProfileClient를 참조하되, isOwner=false 분기로 비공개 항목 숨김
- 기존 `/profile` (내 프로필)은 변경하지 않음

### Claude's Discretion
- PublicProfileClient를 새로 만들지 vs ProfileClient에 userId prop 추가하여 공용화할지
- 404 일러스트 디자인
- 로딩 스켈레톤 구성

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUTE-01 | `app/profile/[userId]/page.tsx` 생성 — 기존 `useUser(userId)` hook + API proxy 활용 | `useUser(userId)` hook already exists in `useProfile.ts`, wraps `useGetUserProfile` which calls `GET /api/v1/users/{user_id}` (returns `UserResponse`). The route just needs a page.tsx + PublicProfileClient. |
| ROUTE-02 | 공개 프로필에서 비공개 항목(Saved, Ink 크레딧, 프로필 수정) 숨김 | All components involved accept props — `ProfileHeader` accepts `onEditClick`, `InkEconomyCard` is standalone, `ActivityTabs` includes "Saved" tab. Gate by `isOwner` boolean derived from comparing `useMe().data?.id` with `userId` param. |
</phase_requirements>

## Summary

Phase 45 is a pure frontend addition with no backend changes needed. The API endpoint `GET /api/v1/users/{user_id}` already exists in the OpenAPI spec, returning `UserResponse`. The `useUser(userId)` hook in `useProfile.ts` already wraps this endpoint correctly. The core work is: (1) create the `app/profile/[userId]/page.tsx` route, (2) create `PublicProfileClient.tsx` that renders the user's data with private items hidden.

The key architectural question is whether to create a new `PublicProfileClient` or extend `ProfileClient` with props. Given that the components in `ProfileClient` mostly read from `useProfileStore` (a Zustand store synced via effects), the cleanest path is a dedicated `PublicProfileClient` that calls `useUser(userId)` directly and passes data to components as props — avoiding Zustand store pollution from public profile data.

One important pitfall: several components (`BadgeGrid`, `RankingList`, `ArchiveStats`, `StatsCards`) read exclusively from `useProfileStore` via Zustand selectors. For public profiles, these components would need either: (a) the store to be loaded with the public user's data (risky — overwrites self data), or (b) the components to accept explicit data props. The recommended approach is to pass data directly where possible or conditionally skip Zustand-store-dependent components for public profiles.

**Primary recommendation:** Create a standalone `PublicProfileClient.tsx` that: fetches via `useUser(userId)`, renders visible components with data passed as props (not via profileStore), conditionally hides private items, and handles 404 + self-redirect cases.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16 (project) | Dynamic route `[userId]` | Already in use — `app/profile/page.tsx` pattern |
| React Query (TanStack) | Latest (project) | `useUser(userId)` data fetch | Project standard for all API calls |
| Zustand | Latest (project) | `useAuthStore` for currentUser.id | Project standard for auth state |
| motion/react | Latest (project) | Skeleton/content animations | Used throughout profile components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/navigation` | 16 | `useRouter` for redirect, `useParams` | Self-redirect to `/profile` when `userId === me.id` |
| `next/headers` | 16 | Server-side metadata generation | `generateMetadata` in page.tsx |

### No New Dependencies
This phase requires zero new package installations. All libraries are already in the project.

## Architecture Patterns

### Recommended Project Structure
```
packages/web/app/profile/
├── page.tsx                    # existing — my profile (untouched)
├── ProfileClient.tsx           # existing — my profile client (untouched)
└── [userId]/
    ├── page.tsx                # NEW — Server Component, metadata + PublicProfileClient
    └── PublicProfileClient.tsx # NEW — Client Component, public view
```

### Pattern 1: Dynamic Route with Server Component wrapper
**What:** `page.tsx` is a Server Component that generates metadata and delegates rendering to a Client Component.
**When to use:** Whenever the route needs dynamic `<head>` metadata but the main content requires client hooks.
**Example:**
```typescript
// app/profile/[userId]/page.tsx
import { PublicProfileClient } from "./PublicProfileClient";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  return {
    title: `Profile | DECODED`,
    description: `View user profile on DECODED`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  return <PublicProfileClient userId={userId} />;
}
```

Note: In Next.js 15+, `params` is a Promise. The existing `app/profile/page.tsx` uses the simple pattern. Verify in project whether params requires `await` by checking other dynamic routes.

### Pattern 2: Self-redirect check in client component
**What:** On mount, compare the viewed `userId` with the logged-in user's ID. If same, redirect to `/profile`.
**When to use:** When a public route can also be reached by the owner, but owner should use `/profile` instead.
**Example:**
```typescript
// Inside PublicProfileClient.tsx
const { data: me } = useMe();
const router = useRouter();

useEffect(() => {
  if (me?.id && me.id === userId) {
    router.replace("/profile");
  }
}, [me?.id, userId, router]);
```

### Pattern 3: Zustand-Store Component Problem
**What:** `BadgeGrid`, `RankingList`, `StatsCards`, `ArchiveStats` all read from `useProfileStore`. They do NOT accept external data props. If loaded for a public profile, they show the logged-in user's cached data.
**When to use:** This is the core problem to solve.
**Options (in order of recommendation):**

**Option A (Recommended): Skip store-dependent components for public profile**
- Render `ProfileBio`, `FollowStats`, and a simple stats display from `useUser()` data directly
- For `BadgeGrid` and `RankingList`: these require dedicated API calls (`useGetUserProfile` does not return badges/rankings). Skip them for public profiles until Phase 46+ adds those endpoints.
- For `ArchiveStats`: render from `userData` (post count from `UserResponse.total_posts` equivalent in stats)

**Option B: Lightweight data-prop versions of components**
- Create prop-accepting variants: `<BadgeGrid badges={...} />` alongside the store-reading version
- Higher effort but cleaner long-term

**Simplest path:** Check what `UserResponse` actually contains (confirmed: id, email, username, display_name, avatar_url, bio, rank, total_points, is_admin) and what `useUser()` returns — then decide which components can render from that data vs require additional API calls.

### Pattern 4: 404 User NotFound UI
**What:** When `useUser(userId)` returns a 404 error (AxiosError with `response.status === 404`), render a dedicated NotFound component.
**Example:**
```typescript
import type { AxiosError } from "axios";

const isError = userQuery.isError;
const error = userQuery.error as AxiosError | null;

if (isError && error?.response?.status === 404) {
  return <UserNotFound />;
}
```

### Anti-Patterns to Avoid
- **Loading `useUser()` data into `useProfileStore`:** The profileStore is the logged-in user's data. Injecting a stranger's data would corrupt self-profile state if the user navigates back to `/profile`.
- **Protecting the route with auth guard in proxy.ts:** The CONTEXT.md explicitly states `/profile/[userId]` is a public route. The proxy.ts matcher currently protects `/profile` but NOT `/profile/:path*`. Do not add auth protection.
- **Duplicating ProfileClient logic:** Do not copy-paste ProfileClient wholesale. Extract the visible subset.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fetch other user's profile | Custom fetch function | `useUser(userId)` from `useProfile.ts` | Already wraps `useGetUserProfile` with proper query key and caching |
| Determine if viewer is owner | Complex session inspection | `useMe()` comparison: `me?.id === userId` | Simple, reactive, cached by React Query |
| 404 detection | Status code string parsing | `(error as AxiosError)?.response?.status === 404` | Same pattern used in ProfileClient for 401 |

**Key insight:** The entire data layer is already built. Phase 45 is exclusively UI composition and routing work.

## Common Pitfalls

### Pitfall 1: `params` async in Next.js 15+
**What goes wrong:** `params.userId` may be typed as `Promise<{userId: string}>` in Next.js 15+, causing a runtime error if accessed synchronously.
**Why it happens:** Next.js changed params to be async in v15.
**How to avoid:** Use `await params` in Server Component. Check existing dynamic routes in the project (e.g., `app/posts/[id]/page.tsx`) to confirm the correct pattern used in this codebase.
**Warning signs:** TypeScript error "Property 'userId' does not exist on type 'Promise'"

### Pitfall 2: proxy.ts matcher does not protect `[userId]` route
**What goes wrong:** The current `config.matcher` in `proxy.ts` includes `"/profile"` but NOT `"/profile/:path*"`. Adding `[userId]` routes to the matcher by mistake would break the public access requirement.
**Why it happens:** The existing proxy.ts matcher is `["/admin/:path*", "/profile"]` — the exact string `/profile` protects only that exact path.
**How to avoid:** Do NOT modify `proxy.ts` for this phase. The public route works correctly without any changes.

### Pitfall 3: Zustand profileStore pollution
**What goes wrong:** Using `setUserFromApi` with public user's data replaces the logged-in user's data in the store. Components reading from the store (like `ProfileHeader`) would then display the wrong user's info.
**Why it happens:** `useProfileStore` is a singleton Zustand store — it holds MY profile data.
**How to avoid:** Never call `setUserFromApi`/`setStatsFromApi`/`setBadgesFromApi`/`setRankingsFromApi` with data from `useUser(userId)`.

### Pitfall 4: `BadgeGrid` and `RankingList` only read from store
**What goes wrong:** Rendering `<BadgeGrid />` on a public profile page shows the logged-in user's badges, not the viewed user's badges.
**Why it happens:** These components are hardcoded to call `useProfileStore(selectBadges)`.
**How to avoid:** Either skip these components on public profiles (simplest) or create data-prop variants. The CONTEXT.md says "BadgeGrid + RankingList 공개" — this implies they should be shown. Use Option B (prop variant) or show them as read-only view of the target user's data by fetching separately. However, there are no badge/ranking endpoints for other users in the current OpenAPI spec. **Decision recommendation:** Render empty/placeholder state for `BadgeGrid` and `RankingList` on public profiles for now, since the API endpoints for other users' badges/rankings don't exist yet.

### Pitfall 5: `StyleDNACard` and `ArchiveStats` data source
**What goes wrong:** `StyleDNACard` uses `profileExtras.style_dna` from Supabase (not from `useUser()`). `ArchiveStats` reads from `useProfileStore`. For public profiles these data sources need adjustment.
**How to avoid:**
- `StyleDNACard`: Call `useProfileExtras(userId)` with the public user's ID — this works because `fetchUserProfileExtras` takes any `userId` and queries Supabase directly. No auth check in Supabase means it will return data.
- `ArchiveStats`: Since `UserResponse` contains `total_points`, `rank` — but not post/spot counts per se. Need `useGetMyStats` equivalent for other users, which doesn't exist. Simplest: render `ArchiveStats` with `tryOnCount=0` and use `UserResponse.total_points`/`rank` fields only.

## Code Examples

Verified patterns from existing codebase:

### useUser hook (already implemented)
```typescript
// Source: packages/web/lib/hooks/useProfile.ts
export function useUser(
  userId: string,
  options?: Omit<UseQueryOptions<UserResponse, Error>, "queryKey" | "queryFn">
) {
  return useGetUserProfile(userId, {
    query: {
      queryKey: profileKeys.user(userId),
      enabled: !!userId,
      staleTime: 1000 * 60 * 5,
      ...options,
    },
  });
}
```

### UserResponse shape (from OpenAPI spec)
```typescript
// Required: id, email, username, rank, total_points, is_admin
// Optional: avatar_url, bio, display_name
interface UserResponse {
  id: string;           // UUID
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rank: string;
  total_points: number;
  is_admin: boolean;
}
```

### 404 detection pattern (from ProfileClient.tsx for 401)
```typescript
// Source: packages/web/app/profile/ProfileClient.tsx (adapted for 404)
import type { AxiosError } from "axios";

const axiosErr = userQuery.error as AxiosError | null;
if (userQuery.isError && axiosErr?.response?.status === 404) {
  return <UserNotFound />;
}
```

### Self-redirect pattern
```typescript
// Redirect self to /profile (de-duplicate pages)
const router = useRouter();
const { data: me } = useMe();

useEffect(() => {
  if (me?.id && me.id === userId) {
    router.replace("/profile");
  }
}, [me?.id, userId, router]);
```

### ProfileBio usage (accepts props directly)
```typescript
// Source: packages/web/lib/components/profile/ProfileBio.tsx
// Props: bio?: string; socialLinks?: SocialLink[]; className?: string
// Can be rendered directly from useUser() data:
<ProfileBio bio={userData?.bio ?? undefined} />
```

### FollowStats usage (accepts props directly)
```typescript
// Source: packages/web/lib/components/profile/FollowStats.tsx
// Props: followers?: number; following?: number; className?: string
// For Phase 45: followers/following will be hardcoded 0 (real data in Phase 46)
<FollowStats followers={0} following={0} className="px-4" />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts | proxy.ts | v8.0 (Next.js 16) | Route protection is in `proxy.ts`, not `middleware.ts` |
| Manual API calls | Orval-generated hooks | v9.0 | `useGetUserProfile` is generated; `useUser` wraps it |
| Supabase direct auth | Supabase + Rust API hybrid | v9.0 | Profile data from Rust API, extras from Supabase |

**Key observation about proxy.ts matcher:**
The current matcher is `["/admin/:path*", "/profile"]`. This means:
- `/profile` — protected (requires auth)
- `/profile/anything` — NOT in matcher, therefore NOT protected by proxy

This is correct for Phase 45 (public route). No changes needed to `proxy.ts`.

## Open Questions

1. **BadgeGrid/RankingList for public profile**
   - What we know: These components read exclusively from Zustand `profileStore`. The API has no endpoint for another user's badges/rankings.
   - What's unclear: CONTEXT.md says "BadgeGrid + RankingList 공개" — but data source is undefined.
   - Recommendation: Render them with empty state (no badges/rankings available for this user yet). This is honest — the data genuinely doesn't exist in the API. Phase 46+ can add the endpoints.

2. **`params` async signature**
   - What we know: Next.js 15+ made `params` async.
   - What's unclear: Which exact Next.js minor version this project uses (listed as "Next.js 16" in CLAUDE.md).
   - Recommendation: Check one existing dynamic route (e.g., `app/posts/[id]/page.tsx`) for the correct `params` typing pattern before implementing.

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (key absent) — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (e2e) + Vitest (unit) |
| Config file | `packages/web/playwright.config.ts` / `packages/web/vitest.config.ts` |
| Quick run command | `cd packages/web && bun run typecheck` |
| Full suite command | `cd packages/web && bun run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-01 | `/profile/[userId]` renders public profile data | manual/e2e | `cd packages/web && bun run typecheck` | ❌ Wave 0 |
| ROUTE-02 | Private items hidden for non-owner viewer | manual | Visual verification | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run typecheck`
- **Per wave merge:** `cd packages/web && bun run typecheck && bun run lint`
- **Phase gate:** TypeScript clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] TypeScript check passes after new files created — no new test files required for this phase (UI-only route addition)

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `packages/web/app/profile/ProfileClient.tsx`, `packages/web/lib/hooks/useProfile.ts`, `packages/web/lib/stores/profileStore.ts`
- OpenAPI spec — `packages/api-server/openapi.json` — confirmed `GET /api/v1/users/{user_id}` endpoint and `UserResponse` schema
- `packages/web/proxy.ts` — confirmed matcher does not protect `/profile/:path*`
- `packages/web/lib/components/profile/` — all 21 component files inspected

### Secondary (MEDIUM confidence)
- Next.js App Router dynamic segments pattern (training knowledge, verified against existing route patterns in codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified by direct codebase inspection
- Architecture: HIGH — all components and hooks verified by reading source files
- Pitfalls: HIGH — identified from direct code inspection (Zustand store usage, proxy.ts matcher, async params)

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable codebase, 30-day window)
