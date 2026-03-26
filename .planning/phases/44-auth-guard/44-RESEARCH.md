# Phase 44: Auth Guard - Research

**Researched:** 2026-03-26
**Domain:** Next.js 16 route protection, OAuth redirect flow, Supabase session in middleware
**Confidence:** HIGH

## Summary

Phase 44 adds auth protection to `/profile`. The project uses `proxy.ts` (Next.js 16 convention, not `middleware.ts`) to protect `/admin/*` routes — the same pattern extends cleanly to `/profile`. The proxy reads a Supabase session via `createSupabaseMiddlewareClient` and redirects unauthenticated users; for `/profile` the target should be `/login?redirect=/profile` instead of the silent redirect to `/` used for admin.

The client-side piece is `ProfileClient.tsx`, which already shows a generic error UI when `useMe` or `useUserStats` fails. When the API returns 401, Axios throws an AxiosError with `response.status === 401`. The component must detect this status and call `router.push('/login?redirect=/profile')` instead of rendering the error UI.

The login flow completes via Supabase OAuth (`signInWithOAuth`), which redirects back to the app. After returning, `LoginCard.tsx` must read `?redirect=` from the URL search params and navigate there instead of the hardcoded `/` used today.

**Primary recommendation:** Extend `proxy.ts` matcher to include `/profile` with a login redirect, add a 401-specific branch to `ProfileClient.tsx`, and update `LoginCard` / `signInWithOAuth` to honour the `redirect` query param.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Add `/profile` to `proxy.ts` matcher; redirect unauthenticated users to `/login?redirect=/profile` | Confirmed: `proxy.ts` pattern + `createSupabaseMiddlewareClient` already in place. Only matcher + redirect URL need to change. |
| AUTH-02 | `ProfileClient.tsx`: on 401 error, redirect to login instead of showing error UI | Confirmed: `useMe` / `useUserStats` return `error` as `AxiosError`. Check `error.response?.status === 401` and call `router.replace('/login?redirect=/profile')`. |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/server` (NextResponse, NextRequest) | Next.js 16 | Server-side route protection in `proxy.ts` | Project convention (v8.0 decision) |
| `@supabase/auth-helpers-nextjs` (createServerClient) | current | Middleware-safe Supabase session access | Already used in `lib/supabase/middleware.ts` |
| `next/navigation` (useRouter, useSearchParams) | Next.js 16 | Client-side redirect after 401 and post-login navigation | Used throughout codebase |
| `axios` (AxiosError) | current | HTTP error typing for 401 detection | Orval mutator uses Axios |

### No new dependencies required
All necessary libraries are already installed.

## Architecture Patterns

### AUTH-01: proxy.ts extension pattern

The existing `proxy.ts` handles `/admin/*` by checking session, then admin role. For `/profile`, only session is needed — no role check.

```typescript
// packages/web/proxy.ts — extend matcher and add profile branch
export const config = {
  matcher: ["/admin/:path*", "/profile"],  // add /profile
};

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  const { data: { session } } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Profile: redirect unauthenticated to /login?redirect=...
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  // Admin: existing logic
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const isAdmin = await checkIsAdmin(supabase, session.user.id);
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return res;
}
```

**Key detail:** Use `req.nextUrl.pathname` (not `req.url`) when building the `redirect` param so only the path is stored, not the full origin URL.

### AUTH-02: 401 detection in ProfileClient.tsx

`useMe` / `useUserStats` are TanStack Query wrappers around Axios. When the API returns 401, Axios rejects with `AxiosError`. The hook's `error` field is typed as `Error` but at runtime is `AxiosError`.

```typescript
// In ProfileClient.tsx
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";

export function ProfileClient() {
  const router = useRouter();
  // ... existing hook calls ...

  // After hooks, before loading check:
  useEffect(() => {
    if (isError && error) {
      const axiosErr = error as AxiosError;
      if (axiosErr.response?.status === 401) {
        router.replace("/login?redirect=/profile");
      }
    }
  }, [isError, error, router]);

  if (isLoading) return <ProfileSkeleton />;

  // Only show error UI for non-401 errors
  if (isError && error) {
    const axiosErr = error as AxiosError;
    if (axiosErr.response?.status !== 401) {
      return <ProfileError error={error} onRetry={handleRetry} />;
    }
    // 401: show skeleton while redirect is in flight
    return <ProfileSkeleton />;
  }
  // ...
}
```

**Why useEffect + return skeleton:** `router.replace` is async navigation; showing skeleton is cleaner than a flash of error UI.

### Post-login redirect: LoginCard.tsx

`LoginCard` currently calls `signInWithOAuth` then does nothing (OAuth redirect handles it) and `guestLogin` pushes to `/`. Neither reads `?redirect=`.

Two changes needed:

1. `LoginCard` reads `?redirect=` with `useSearchParams` and passes it to the store.
2. `authStore.signInWithOAuth` passes `redirectTo` pointing to an auth callback that bounces to the stored redirect param.

**Simpler approach** (recommended for this phase scope): After OAuth callback, Supabase returns to the page it was called from or the `redirectTo`. The cleanest solution for this phase:

- `LoginCard` reads `searchParams.get("redirect")` via `useSearchParams`.
- For guest login: use the redirect param in `router.push` instead of `/`.
- For OAuth: store the redirect in `sessionStorage` before calling `signInWithOAuth`, then read it in `authStore.initialize()` / `onAuthStateChange` after the OAuth callback.

```typescript
// LoginCard.tsx — read redirect param
"use client";
import { useSearchParams, useRouter } from "next/navigation";
// ...

export function LoginCard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const { signInWithOAuth, guestLogin, ... } = useAuthStore();

  const handleLogin = async (provider: OAuthProvider) => {
    // Persist redirect target across OAuth round-trip
    sessionStorage.setItem("post_login_redirect", redirectTo);
    await signInWithOAuth(provider);
  };

  const handleGuestLogin = () => {
    guestLogin();
    router.push(redirectTo);
  };
  // ...
}
```

```typescript
// authStore.ts — after session is confirmed, redirect if saved target exists
// In setUser() after successful auth:
const savedRedirect = sessionStorage.getItem("post_login_redirect");
if (savedRedirect) {
  sessionStorage.removeItem("post_login_redirect");
  // use window.location.replace or rely on caller to navigate
}
```

**Caution:** `authStore.ts` is a Zustand store, not a React component — it cannot call `useRouter`. The redirect after OAuth must happen in a React component that subscribes to auth state. The existing `providers.tsx` or a new `AuthRedirectHandler` client component is the right place.

**Recommended minimal approach for Phase 44:**
- Proxy handles the unauthenticated case server-side (AUTH-01) — this is the primary guard.
- `ProfileClient` handles the 401 case (AUTH-02) — redirect on API error.
- Login redirect back: handle in `LoginCard` for guest case; for OAuth case, use `redirectTo` option in `signInWithOAuth` pointing to an API route or home, and store/restore via `sessionStorage`.

### Anti-Patterns to Avoid

- **Using `middleware.ts`:** This project uses `proxy.ts` (v8.0 decision — Next.js 16 convention). Do not create `middleware.ts`.
- **Redirect loops:** If proxy redirects `/profile` → `/login?redirect=/profile` and login is also protected, loop occurs. Login page must NOT be in the proxy matcher.
- **Redirecting to absolute URLs from user input:** Always validate/allowlist `redirect` param — never redirect to `http://evil.com`. For this phase, only redirect to relative paths starting with `/`.
- **Calling router in Zustand store:** Zustand stores run outside React — use `window.location` for non-hook contexts or move redirect logic to a component.
- **Showing error UI flash before redirect:** Return skeleton while redirect is in flight (as shown above).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session check in proxy | Custom cookie parsing | `createSupabaseMiddlewareClient` | Already handles session refresh, cookie propagation |
| 401 detection | Manual status string parsing | `(error as AxiosError).response?.status` | Axios typed errors, already used project-wide |
| Post-login redirect state | Custom Redux/Zustand slice | `sessionStorage` + `useSearchParams` | Simplest cross-page state for OAuth redirect round-trip |

## Common Pitfalls

### Pitfall 1: Redirect loop between proxy and login
**What goes wrong:** Proxy protects `/profile` AND `/login` — every unauthenticated request loops.
**Why it happens:** Matcher accidentally includes `/login` (e.g., with `/:path*` pattern).
**How to avoid:** Keep matcher explicit: `["/admin/:path*", "/profile"]`. Do not use `/((?!_next/static|_next/image|favicon.ico).*)`.
**Warning signs:** Browser shows "too many redirects" error.

### Pitfall 2: Open redirect vulnerability
**What goes wrong:** `?redirect=https://evil.com` passed to Supabase `redirectTo` or `router.push`.
**Why it happens:** Redirect param is used verbatim without validation.
**How to avoid:** Validate that the redirect param starts with `/` and does not contain `//` (protocol-relative).
```typescript
function isSafeRedirect(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}
```

### Pitfall 3: useSearchParams without Suspense boundary
**What goes wrong:** Next.js 16 requires `useSearchParams` to be wrapped in `<Suspense>` in Server Components context.
**Why it happens:** `LoginCard` is a `"use client"` component but its parent `LoginPage` is a Server Component.
**How to avoid:** Wrap `<LoginCard />` in `<Suspense fallback={...}>` in `LoginPage`, or ensure `LoginCard` is always client-rendered inside a client boundary. Since `LoginPage` renders `<LoginCard />` directly and there's already a `"use client"` directive in `LoginCard`, this is handled — but confirm no SSR path hits `useSearchParams` without Suspense.

### Pitfall 4: OAuth redirectTo misconfiguration
**What goes wrong:** Supabase blocks `redirectTo` URL because it's not in the allowed URLs list in the Supabase dashboard.
**Why it happens:** Passing a path that differs from the configured redirect URL.
**How to avoid:** For Phase 44, use `sessionStorage` to preserve post-login target instead of passing dynamic paths directly to Supabase `redirectTo`. The Supabase `redirectTo` should remain the fixed configured URL (e.g., `${window.location.origin}/`).

## Code Examples

### proxy.ts: safe redirect URL construction
```typescript
// Source: proxy.ts (existing pattern) + Next.js URL API
const loginUrl = new URL("/login", req.url);
loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
return NextResponse.redirect(loginUrl);
```

### 401 guard in a TanStack Query-backed client component
```typescript
// Source: pattern derived from ProfileClient.tsx structure
useEffect(() => {
  if (isError && error) {
    const axiosErr = error as AxiosError;
    if (axiosErr.response?.status === 401) {
      router.replace("/login?redirect=/profile");
    }
  }
}, [isError, error, router]);
```

### Safe redirect validation
```typescript
function isSafeRedirect(url: string | null): string {
  if (!url) return "/";
  return url.startsWith("/") && !url.startsWith("//") ? url : "/";
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | v8.0 (Phase 33) | All route protection must live in `proxy.ts` |
| Silent redirect to `/` for unauthenticated | Redirect to `/login?redirect=...` | Phase 44 (this phase) | User returns to original URL after login |

## Open Questions

1. **OAuth post-login redirect destination**
   - What we know: `signInWithOAuth` hardcodes `redirectTo: ${window.location.origin}/` — returns to home after OAuth.
   - What's unclear: Whether the Phase 44 scope requires OAuth to also return to `/profile`, or only the guest flow + 401 guard.
   - Recommendation: Phase 44 success criteria (SC-3) says "로그인 완료 후 redirect 파라미터의 URL로 복귀". This covers both OAuth and guest. Implement sessionStorage approach for OAuth round-trip.

2. **`/profile/:userId` sub-routes**
   - What we know: Only `/profile` route exists currently; Phase 45 adds `app/profile/[userId]/page.tsx`.
   - What's unclear: Whether proxy matcher should pre-emptively include `/profile/:path*`.
   - Recommendation: For Phase 44, protect only `/profile` (current route). Phase 45 can extend the matcher when it creates the dynamic route.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.1 |
| Config file | `packages/web/vitest.config.ts` |
| Quick run command | `cd packages/web && bun run test:unit` |
| Full suite command | `cd packages/web && bun run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | proxy.ts redirects unauthenticated `/profile` requests to `/login?redirect=/profile` | unit (pure function) | `cd packages/web && bun run test:unit -- tests/auth-guard.test.ts` | Wave 0 |
| AUTH-02 | ProfileClient 401 error triggers router.replace to login URL | manual / Playwright smoke | visual QA only | manual |

### Sampling Rate
- **Per task commit:** `cd packages/web && bun run test:unit`
- **Per wave merge:** `cd packages/web && bun run test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/web/tests/auth-guard.test.ts` — covers AUTH-01 proxy redirect logic

*(AUTH-02 is a client-side runtime behavior; unit-testing React components with router mocks is disproportionate for this small phase — verify manually or via existing Playwright visual QA)*

## Sources

### Primary (HIGH confidence)
- Codebase: `packages/web/proxy.ts` — existing middleware pattern with `createSupabaseMiddlewareClient`
- Codebase: `packages/web/app/profile/ProfileClient.tsx` — current error handling behavior
- Codebase: `packages/web/lib/stores/authStore.ts` — OAuth signIn with hardcoded `redirectTo`
- Codebase: `packages/web/lib/components/auth/LoginCard.tsx` — current post-login navigation
- Codebase: `packages/web/lib/api/mutator/custom-instance.ts` — Axios as the HTTP client
- `.planning/STATE.md` decision `[v8.0]: proxy.ts replaces middleware.ts`

### Secondary (MEDIUM confidence)
- Next.js 16 docs: `useSearchParams` requires Suspense boundary in App Router
- Supabase docs: `redirectTo` must match allowed URLs in project settings

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in active use
- Architecture: HIGH — proxy pattern directly mirrors existing admin protection; client-side 401 pattern is straightforward AxiosError check
- Pitfalls: HIGH — redirect loop and open redirect are well-known, validated against codebase structure

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable patterns, no fast-moving dependencies)
