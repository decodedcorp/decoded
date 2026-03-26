---
phase: 44-auth-guard
plan: "01"
subsystem: auth
tags: [auth-guard, redirect, oauth, profile, session]
dependency_graph:
  requires: []
  provides: [profile-auth-guard, post-login-redirect]
  affects: [packages/web/proxy.ts, packages/web/app/profile/ProfileClient.tsx, packages/web/lib/components/auth/LoginCard.tsx, packages/web/lib/stores/authStore.ts, packages/web/app/login/page.tsx]
tech_stack:
  added: []
  patterns: [sessionStorage-oauth-roundtrip, server-side-route-guard, open-redirect-prevention]
key_files:
  created: []
  modified:
    - packages/web/proxy.ts
    - packages/web/app/profile/ProfileClient.tsx
    - packages/web/lib/components/auth/LoginCard.tsx
    - packages/web/lib/stores/authStore.ts
    - packages/web/app/login/page.tsx
decisions:
  - "Use req.nextUrl.pathname (not full URL) for redirect param to prevent open redirect"
  - "sessionStorage approach for OAuth round-trip (Supabase dashboard allowlists fixed redirectTo origin/)"
  - "window.location.replace in authStore (not router.push) to avoid login page appearing in browser history"
  - "Suspense wrapper required for LoginCard because useSearchParams is used inside"
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_modified: 5
  completed_date: "2026-03-26"
---

# Phase 44 Plan 01: Auth Guard for /profile Summary

Auth guard for /profile route using server-side proxy redirect, client-side 401 detection, and sessionStorage-based post-login return URL for OAuth round-trips.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | proxy.ts auth guard + ProfileClient 401 redirect | 17a2845e | proxy.ts, ProfileClient.tsx |
| 2 | Post-login redirect via LoginCard + authStore sessionStorage | 8da7b1d6 | LoginCard.tsx, authStore.ts, login/page.tsx |

## What Was Built

**Task 1: Server-side guard + client-side 401 handling**

- `proxy.ts` extended to match `/profile` — unauthenticated requests are redirected to `/login?redirect=/profile`
- Profile guard placed before admin logic to avoid admin role check for profile routes
- `ProfileClient.tsx` adds `useEffect` detecting `AxiosError` with status 401, calls `router.replace("/login?redirect=/profile")`
- On 401, returns `<ProfileSkeleton />` instead of `<ProfileError>` while navigation is in flight

**Task 2: Post-login return URL**

- `LoginCard.tsx` reads `?redirect=` param via `useSearchParams()`, validated by `getSafeRedirect()` helper (prevents open redirect)
- Before OAuth redirect, stores validated URL in `sessionStorage("post_login_redirect")`
- Guest login uses `router.push(redirectTo)` instead of hardcoded `"/"`
- `authStore.initialize()` checks `sessionStorage` after OAuth callback; uses `window.location.replace(savedRedirect)` to navigate back
- `login/page.tsx` wraps `<LoginCard>` in `<Suspense>` (required by Next.js when using `useSearchParams`)

## Decisions Made

1. **`req.nextUrl.pathname` for redirect param** — uses path only, not full URL, preventing open redirect exploitation
2. **sessionStorage for OAuth round-trip** — Supabase dashboard has `${origin}/` allowlisted as `redirectTo`; changing it would require dashboard config change. sessionStorage persists across the OAuth redirect cycle.
3. **`window.location.replace` in authStore** — authStore is a Zustand store (not a React component), cannot use `useRouter`. `replace` also removes the login page from browser history.
4. **`<Suspense>` wrapper in login/page.tsx** — Next.js requires Suspense boundary around any component using `useSearchParams()` in a Server Component parent.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript typecheck (`bun run tsc --noEmit`): PASSED with zero errors
- All acceptance criteria confirmed by grep inspection
- Build from monorepo root had a pre-existing error on `(.)request/detect` page (unrelated to this plan)

## Self-Check

- [x] `packages/web/proxy.ts` — FOUND, contains `/profile` matcher and `loginUrl.searchParams.set`
- [x] `packages/web/app/profile/ProfileClient.tsx` — FOUND, contains `useRouter`, `AxiosError`, 401 redirect, `ProfileSkeleton` fallback
- [x] `packages/web/lib/components/auth/LoginCard.tsx` — FOUND, contains `useSearchParams`, `getSafeRedirect`, `sessionStorage.setItem`
- [x] `packages/web/lib/stores/authStore.ts` — FOUND, contains `sessionStorage.getItem/removeItem`, `window.location.replace`
- [x] `packages/web/app/login/page.tsx` — FOUND, contains `Suspense` wrapper around `LoginCard`
- [x] Commit `17a2845e` — Task 1
- [x] Commit `8da7b1d6` — Task 2

## Self-Check: PASSED
