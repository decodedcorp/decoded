# Phase-1 Remaining Issues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all remaining @thxforall phase-1 issues (#60, #62, #63, #64, #65, #66, #68) on a single feature branch

**Architecture:** Quick wins first (dead code cleanup, error pages), then medium complexity (admin login, flickering), then larger items (FK usage, docs). Each task maps to one or more GitHub issues and produces a commit.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind / Supabase Auth / GSAP

**Branch:** `feat/phase1-remaining`

---

## Pre-flight

- [ ] **Step 1: Create branch**

```bash
git checkout main && git pull origin main
git checkout -b feat/phase1-remaining
```

- [ ] **Step 2: Verify dev server starts**

```bash
cd packages/web && bun dev
```

Expected: Dev server starts on localhost:3000 without errors.

---

## Task 1: Dead Code Cleanup + #68 Verify & Close (#60, #68)

**Context:**
- #68 (Editorial/Trending 데이터 개선): `EditorialSection` + `TrendingListSection`은 page.tsx에서 더 이상 렌더링되지 않음. `TrendingPostsSection` + `EditorialMagazine`으로 대체 완료. enrichArtistName()으로 중복 처리됨 → **이미 해결됨, close 가능**
- #60 (섹션 정리): page.tsx에서 DecodeShowcase, VirtualTryOnTeaser, MainFooter 미사용. 단, **DecodeShowcase는 detail 페이지에서 사용 중이므로 삭제 불가**

**Files:**
- Delete: `packages/web/lib/components/main-renewal/VirtualTryOnTeaser.tsx`
- Delete: `packages/web/lib/components/main-renewal/CommunityLeaderboard.tsx`
- Delete: `packages/web/lib/components/main-renewal/PersonalizeBanner.tsx`
- Delete: `packages/web/lib/components/main/MainFooter.tsx`
- Modify: `packages/web/lib/components/main-renewal/index.ts` (remove dead exports)
- Modify: `packages/web/lib/components/main/index.ts` (remove MainFooter export)
- Modify: `packages/web/app/page.tsx` (remove unused imports)

- [ ] **Step 1: Delete unused component files**

```bash
rm packages/web/lib/components/main-renewal/VirtualTryOnTeaser.tsx
rm packages/web/lib/components/main-renewal/CommunityLeaderboard.tsx
rm packages/web/lib/components/main-renewal/PersonalizeBanner.tsx
rm packages/web/lib/components/main/MainFooter.tsx
```

- [ ] **Step 2: Clean main-renewal/index.ts exports**

Remove these lines from `packages/web/lib/components/main-renewal/index.ts`:

```ts
// REMOVE these lines:
export { default as PersonalizeBanner } from "./PersonalizeBanner";
export { default as DecodeShowcase } from "./DecodeShowcase";  // KEEP — used by detail page
export { default as VirtualTryOnTeaser } from "./VirtualTryOnTeaser";
export { default as CommunityLeaderboard } from "./CommunityLeaderboard";
```

**Important:** Keep `DecodeShowcase` export — it's imported by `packages/web/lib/components/detail/ImageDetailContent.tsx`.

Final `index.ts` should be:

```ts
export { MainHero } from "./MainHero";
export { NeonGlow } from "./NeonGlow";
export { default as MasonryGrid } from "./MasonryGrid";
export { default as MasonryGridItem } from "./MasonryGridItem";
export { default as DecodeShowcase } from "./DecodeShowcase";
export { default as EditorialMagazine } from "./EditorialMagazine";
export { SmartNav } from "./SmartNav";
export * from "./types";
```

- [ ] **Step 3: Clean main/index.ts — remove MainFooter export**

Remove from `packages/web/lib/components/main/index.ts`:
```ts
export { MainFooter } from "./MainFooter";
```

- [ ] **Step 4: Clean page.tsx unused imports**

In `packages/web/app/page.tsx`, remove unused imports:
```ts
// REMOVE from the main imports if not used in render:
import { EditorialSection, TrendingListSection } from "@/lib/components/main";
```

Only keep imports that are actually used in the JSX render section (lines 294-321):
- `DomeGallerySection`, `HeroItemSync`, `TrendingPostsSection`, `HelpFindSection`, `DecodedPickSection` from main
- `MasonryGrid`, `EditorialMagazine` from main-renewal

Also remove any unused type imports (`StyleCardData` if only used by deleted EditorialSection code).

- [ ] **Step 5: Verify build**

```bash
cd packages/web && bun run build 2>&1 | head -30
```

Expected: Build succeeds. No "Module not found" or unused import errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(main): remove unused main page components (#60, #68)

Remove VirtualTryOnTeaser, CommunityLeaderboard, PersonalizeBanner,
MainFooter — no longer rendered. Clean dead exports and imports.
#68 resolved: EditorialSection/TrendingListSection replaced by
TrendingPostsSection/EditorialMagazine with enrichArtistName dedup."
```

---

## Task 2: Error Pages (#65)

**Context:**
- `not-found.tsx` exists with proper styling
- `global-error.tsx` exists but is minimal (no Tailwind, no brand styling)
- `error.tsx` (route-level 500) does NOT exist

**Files:**
- Create: `packages/web/app/error.tsx`
- Modify: `packages/web/app/global-error.tsx`

- [ ] **Step 1: Create app/error.tsx**

Create `packages/web/app/error.tsx` — this handles runtime errors within the app layout (unlike global-error which replaces the entire HTML):

```tsx
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="mb-4 text-6xl font-bold text-foreground">500</h1>
      <h2 className="mb-2 text-2xl font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="mb-8 text-center text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Improve global-error.tsx styling**

Replace `packages/web/app/global-error.tsx` with styled version (this renders outside the app layout, so needs inline styles or a self-contained design):

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#050505",
          color: "#fafafa",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1
            style={{
              fontSize: "3.75rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            500
          </h1>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              marginBottom: "2rem",
            }}
          >
            A critical error occurred. Please try again.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "#eafd67",
                color: "#050505",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "transparent",
                color: "#fafafa",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify error page renders**

Test by temporarily adding a throw in a component, or verify types:

```bash
cd packages/web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No type errors in error.tsx or global-error.tsx.

- [ ] **Step 4: Commit**

```bash
git add packages/web/app/error.tsx packages/web/app/global-error.tsx
git commit -m "feat(ui): add error.tsx and improve global-error styling (#65)

Add route-level error boundary with retry + home navigation.
Restyle global-error.tsx to match brand design (dark theme, #eafd67 accent).
Both capture exceptions to Sentry."
```

---

## Task 3: Admin Login Page (#64)

**Context:**
- Admin layout (`app/admin/layout.tsx`) checks Supabase auth + admin status
- Currently redirects to `/` if not authenticated
- Need a dedicated `/admin/login` page with Supabase auth

**Files:**
- Create: `packages/web/app/admin/login/page.tsx`
- Modify: `packages/web/app/admin/layout.tsx` (redirect to `/admin/login`)

- [ ] **Step 1: Create admin login page**

Create `packages/web/app/admin/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            DECODED
          </h1>
          <p className="mt-2 text-sm text-white/50">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#eafd67]/50 focus:outline-none focus:ring-1 focus:ring-[#eafd67]/50"
              placeholder="admin@decoded.style"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#eafd67]/50 focus:outline-none focus:ring-1 focus:ring-[#eafd67]/50"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#eafd67] px-4 py-3 text-sm font-semibold text-[#050505] transition-colors hover:bg-[#d4e85c] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Exempt login page from admin auth check**

The admin `layout.tsx` wraps all `/admin/*` routes including `/admin/login`. We need to bypass the auth check for the login page. Modify `packages/web/app/admin/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { AdminLayoutClient } from "@/lib/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Skip auth check for login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const isAdmin = await checkIsAdmin(supabase, user.id);
  if (!isAdmin) {
    redirect("/admin/login");
  }

  const metadata = user.user_metadata || {};
  const adminName =
    metadata.full_name ||
    metadata.name ||
    metadata.nickname ||
    user.email?.split("@")[0] ||
    "Admin";

  return (
    <AdminLayoutClient adminName={adminName}>{children}</AdminLayoutClient>
  );
}
```

**Note:** `x-pathname` header must be set by the proxy/middleware. If not available, an alternative approach is to use a route group: move login to `app/(admin-public)/admin/login/page.tsx` outside the admin layout. Check if `proxy.ts` or middleware sets this header. If not, use the route group approach instead:

Alternative approach (route group — more reliable):
1. Create `packages/web/app/(admin-public)/admin/login/page.tsx` with the login component
2. Keep `packages/web/app/admin/layout.tsx` unchanged except redirect target: `/admin/login`

The implementer should check which approach works with the existing proxy setup.

- [ ] **Step 3: Update redirect target in layout.tsx**

At minimum, change the redirect in `packages/web/app/admin/layout.tsx` from:

```tsx
redirect("/");
```

to:

```tsx
redirect("/admin/login");
```

(both occurrences — no user and not admin)

- [ ] **Step 4: Verify login page renders**

```bash
cd packages/web && bun dev
# Visit http://localhost:3000/admin/login
```

Expected: Login form renders with email/password fields and DECODED branding.

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/admin/
git commit -m "feat(admin): add dedicated admin login page (#64)

Create /admin/login with Supabase email/password auth.
Redirect unauthenticated users to /admin/login instead of /.
Brand-consistent dark theme with #eafd67 accent."
```

---

## Task 4: Flickering Fix (#63)

**Context:**
- 페이지 전환 시 또는 데이터 로드 시 깜빡거림 발생 가능
- React Query `isLoading` 기반 상태 관리 사용 중
- AnimatePresence/motion 전환 시 깜빡임 가능
- Skeleton → Success 전환 시 layout shift 가능

**Files:**
- Investigate: `packages/web/app/page.tsx` (server component — less likely to flicker)
- Investigate: `packages/web/app/explore/ExploreClient.tsx` (client-side infinite scroll)
- Investigate: `packages/web/lib/components/main/HeroItemSync.tsx` (hero rotation)
- Potentially modify: Multiple components based on findings

- [ ] **Step 1: Identify flickering locations**

Run dev server and inspect pages with browser DevTools Performance tab:

```bash
cd packages/web && bun dev
```

Check these pages for flickering:
1. Main page (/) — hero rotation, section loading
2. Explore (/explore) — infinite scroll, filter changes
3. Post detail (/posts/[id]) — image loading, spot markers

Use Chrome DevTools > Performance > record page load. Look for:
- Layout shifts (CLS)
- Multiple re-renders
- Flash of unstyled content

- [ ] **Step 2: Fix image loading flicker**

Common cause: images loading without explicit dimensions cause layout shift.

Check if `PostImage` component and `Image` usage always specifies `width`/`height` or uses `fill` with a sized container:

```bash
# Find Image usage without explicit dimensions
cd packages/web
grep -rn "Image" --include="*.tsx" -l | head -20
```

For any `<Image>` or `<img>` without proper sizing, add explicit dimensions or use `fill` with `sizes` prop inside a relatively positioned container.

- [ ] **Step 3: Fix AnimatePresence key changes**

Check `ExploreClient.tsx` and other components for `AnimatePresence` that might re-animate on data refresh:

Ensure `AnimatePresence` uses `mode="wait"` where appropriate and `motion` elements have stable `key` props (not array indices that change on data refetch).

- [ ] **Step 4: Add CSS containment for heavy sections**

For sections that recalculate layout on load, add `contain: layout` or `content-visibility: auto`:

```tsx
// Example: In MasonryGrid wrapper
<section className="relative" style={{ contentVisibility: "auto", containIntrinsicSize: "0 500px" }}>
  <MasonryGrid items={gridItems} />
</section>
```

- [ ] **Step 5: Verify flickering resolved**

Record before/after with Chrome DevTools Performance. CLS should be < 0.1.

```bash
# Lighthouse CLS check
npx lighthouse http://localhost:3000 --only-categories=performance --output=json | jq '.audits["cumulative-layout-shift"].numericValue'
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix(ui): reduce page transition flickering (#63)

Add proper image dimensions, stabilize AnimatePresence keys,
add content-visibility for heavy sections."
```

---

## Task 5: Posts FK ID Usage (#62)

**Context:**
- Warehouse FK columns (`artist_id`, `group_id`, `brand_id`) exist via migration (#69 merged)
- Backend DTO supports optional FK IDs (#77 — DTO work done)
- Frontend does NOT yet use these IDs for filtering
- 현재는 `artist_name` 문자열 기반 매칭만 사용

**Depends on:** #77 backend (DTO work checked off but issue still open)

**Files:**
- Investigate: `packages/web/lib/api/generated/models/` (check if FK fields exist in generated types)
- Modify: `packages/web/app/explore/ExploreClient.tsx` (add FK-based filtering)
- Modify: `packages/web/lib/hooks/useExploreData.ts` (if exists, update query params)

- [ ] **Step 1: Check API returns FK IDs**

```bash
cd packages/web
# Check if generated types include FK fields
grep -rn "artist_id\|group_id\|brand_id" lib/api/generated/ --include="*.ts" | head -20
```

If FK fields are NOT in the generated types:
```bash
# Regenerate from latest openapi.json
bun run generate:api
# Then re-check
grep -rn "artist_id\|group_id\|brand_id" lib/api/generated/ --include="*.ts" | head -20
```

If still not present, the backend OpenAPI spec needs updating first. In that case, **skip this task** and note that #77 must be completed first (API must expose FK IDs in post list response).

- [ ] **Step 2: Add FK ID filter params to explore**

If FK IDs are available in the API response, update the explore page to use them for filtering:

In `ExploreClient.tsx`, when filtering by artist, pass `artist_id` instead of (or alongside) `artist_name`:

```tsx
// When building API query params for filtered posts
const params = new URLSearchParams();
if (selectedArtistId) {
  params.set("artist_id", selectedArtistId);
}
if (selectedGroupId) {
  params.set("group_id", selectedGroupId);
}
if (selectedBrandId) {
  params.set("brand_id", selectedBrandId);
}
```

- [ ] **Step 3: Update artist profile display**

When FK IDs are available, link artist names to warehouse profile data:

```tsx
// Use artist_id to fetch full profile from warehouse
const artistProfile = artistProfileMap.get(post.artist_id);
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(data): use warehouse FK IDs for explore filtering (#62)

Pass artist_id/group_id/brand_id to API queries when available.
Enables precise filtering vs string-based matching."
```

---

## Task 6: Agent Docs Update (#66)

**Context:**
- `docs/agent/` 문서들이 존재하지만 최근 변경사항 미반영
- warehouse FK migration, 메인 페이지 리뉴얼, explore 검색 등 반영 필요

**Files:**
- Modify: `docs/agent/warehouse-schema.md` — FK columns 추가
- Modify: `docs/agent/api-v1-routes.md` — search, new endpoints
- Modify: `docs/agent/web-hooks-and-stores.md` — 훅/스토어 변경
- Modify: `docs/agent/web-routes-and-features.md` — 라우트 변경

- [ ] **Step 1: Update warehouse-schema.md**

Read current state of warehouse tables:

```bash
# Check current warehouse schema
grep -rn "warehouse" packages/web/lib/supabase/ --include="*.ts" -l
```

Add documentation for:
- `posts` 테이블의 `artist_id`, `group_id`, `brand_id` nullable FK columns
- warehouse ↔ public schema 관계

- [ ] **Step 2: Update api-v1-routes.md**

Read current API routes:

```bash
ls packages/web/app/api/v1/
```

Update the route table to include:
- `/api/v1/posts` query params (sort, per_page, has_magazine, artist_id, etc.)
- `/api/v1/search/*` endpoints
- Any new endpoints since last update

- [ ] **Step 3: Update web-hooks-and-stores.md**

Check current hooks/stores:

```bash
ls packages/web/lib/hooks/
ls packages/shared/stores/
```

Update to reflect:
- `useExploreData` changes
- `searchStore` / `hierarchicalFilterStore` usage
- New hooks added since last update

- [ ] **Step 4: Update web-routes-and-features.md**

Reflect current route structure:
- Main page sections (HeroItemSync, TrendingPosts, HelpFind, EditorialMagazine, DecodedPick, MasonryGrid, DomeGallery)
- Removed sections (DecodeShowcase from main, VirtualTryOnTeaser, etc.)
- Admin login page (new)
- Error pages

- [ ] **Step 5: Commit**

```bash
git add docs/agent/
git commit -m "docs: update agent reference docs for phase-1 changes (#66)

Reflect warehouse FK migration, main page renewal,
explore search integration, admin login, error pages."
```

---

## Post-flight

- [ ] **Step 1: Final build check**

```bash
cd packages/web && bun run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Update epic #35 checklist**

On GitHub, update #35 body to check off completed items:
- [x] #60, #62, #63, #64, #65, #66, #68

- [ ] **Step 3: Close resolved issues**

```bash
gh issue close 68 -c "Resolved: EditorialSection/TrendingListSection replaced by TrendingPostsSection/EditorialMagazine with enrichArtistName dedup"
gh issue close 60 -c "Dead components removed, Magazine redesigned"
gh issue close 65 -c "error.tsx added, global-error.tsx styled"
gh issue close 64 -c "/admin/login page implemented"
gh issue close 63 -c "Flickering fixes applied"
gh issue close 62 -c "FK ID filtering implemented" # Only if Step 5 was completed
gh issue close 66 -c "Agent docs updated"
```

- [ ] **Step 4: Create PR**

```bash
gh pr create --title "feat: complete phase-1 remaining issues (#60,#62,#63,#64,#65,#66,#68)" \
  --body "## Summary
- Dead code cleanup: remove unused main page components
- Error pages: add error.tsx, restyle global-error.tsx
- Admin login: dedicated /admin/login page with Supabase auth
- Flickering: image dimensions, AnimatePresence stabilization
- FK IDs: warehouse FK filtering in explore (if API ready)
- Docs: agent reference docs updated

Closes #60, #62, #63, #64, #65, #66, #68
Epic: #35"
```
