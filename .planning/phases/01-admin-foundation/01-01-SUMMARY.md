---
phase: 01-admin-foundation
plan: 01
subsystem: auth
tags: [supabase, middleware, nextjs, admin, route-protection, is_admin]

# Dependency graph
requires: []
provides:
  - Next.js middleware protecting all /admin/* routes server-side
  - createSupabaseMiddlewareClient factory for middleware cookie context
  - checkIsAdmin utility querying users.is_admin field
affects:
  - 01-admin-foundation (plans 02, 03 - layout and login page need admin check)
  - v3-02 (dashboard - protected by this middleware)
  - v3-03 (AI audit - protected by this middleware)
  - v3-04 (cost monitoring - protected by this middleware)
  - v3-05 (pipeline & server logs - protected by this middleware)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Supabase middleware client pattern (createServerClient with NextRequest/NextResponse cookie adapters)
    - Silent redirect pattern for admin route protection (no error message, no panel disclosure)
    - Separated admin check utility for reuse in layout-level server components

key-files:
  created:
    - packages/web/middleware.ts
    - packages/web/lib/supabase/middleware.ts
    - packages/web/lib/supabase/admin.ts
  modified: []

key-decisions:
  - "Use createServerClient from @supabase/auth-helpers-nextjs (not deprecated createMiddlewareClient) with getAll/setAll cookie adapters"
  - "checkIsAdmin separated from middleware.ts for reuse in server components without importing middleware utilities"
  - "Silent redirect to / for both unauthenticated and non-admin users — admin panel existence not disclosed"

patterns-established:
  - "Admin middleware pattern: getSession() -> redirect if no session -> checkIsAdmin() -> redirect if false -> NextResponse.next()"
  - "Dev-only error logging: console.error wrapped in NODE_ENV === 'development' to avoid leaking internals in production"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 01 Plan 01: Admin Route Protection Summary

**Next.js middleware with Supabase session + users.is_admin check silently protecting all /admin/* routes server-side**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T02:25:29Z
- **Completed:** 2026-02-19T02:26:54Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Supabase client factory for middleware context (reads/writes cookies from NextRequest/NextResponse directly)
- Admin check utility querying `users.is_admin` field with false-by-default safety (returns false on any error)
- Middleware matching `/admin/:path*` that silently redirects both unauthenticated and non-admin users to home

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase middleware client and admin check utility** - `1f1f9ff` (feat)
2. **Task 2: Create Next.js middleware for admin route protection** - `798e36f` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `packages/web/middleware.ts` - Next.js middleware matching `/admin/:path*`, checks session + is_admin, silently redirects denials to /
- `packages/web/lib/supabase/middleware.ts` - `createSupabaseMiddlewareClient(req, res)` factory using createServerClient with NextRequest/NextResponse cookie adapters
- `packages/web/lib/supabase/admin.ts` - `checkIsAdmin(supabase, userId)` querying users.is_admin, returns false on any error or missing record

## Decisions Made

- Used `createServerClient` from `@supabase/auth-helpers-nextjs` (which re-exports `@supabase/ssr`) with `getAll`/`setAll` cookie methods — the plan suggested the deprecated `createMiddlewareClient` API which no longer exists; the current package API uses `createServerClient` with explicit cookie adapters.
- `checkIsAdmin` is in a separate `admin.ts` file so layout-level server components can import it without pulling in the middleware-specific `NextRequest`/`NextResponse` types.
- Dev-only error logging in `checkIsAdmin` to avoid exposing internal Supabase error details in production logs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used correct createServerClient API instead of deprecated createMiddlewareClient**

- **Found during:** Task 1 (creating middleware.ts)
- **Issue:** Plan specified `createMiddlewareClient` from `@supabase/auth-helpers-nextjs` — this API does not exist in the installed version (0.15.0). The package has been consolidated into `@supabase/ssr` and exports `createServerClient` with cookie method adapters.
- **Fix:** Used `createServerClient` from `@supabase/auth-helpers-nextjs` with `getAll`/`setAll` cookie adapters reading from `NextRequest` and writing to both `req.cookies` and `res.cookies`.
- **Files modified:** `packages/web/lib/supabase/middleware.ts`
- **Verification:** TypeScript compiles without errors; middleware correctly handles request/response cookie lifecycle.
- **Committed in:** `1f1f9ff` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — incorrect API usage in plan)
**Impact on plan:** Fix was necessary for correct operation. The correct API produces functionally identical behavior to what the plan specified. No scope creep.

## Issues Encountered

None — TypeScript compiled clean on first attempt, ESLint showed no new errors in new files (60 pre-existing errors in other files unrelated to this plan).

## User Setup Required

None - no external service configuration required. Admin check queries the existing `users.is_admin` field already present in the Supabase schema.

## Next Phase Readiness

- `/admin/*` routes are now fully protected server-side
- `checkIsAdmin` is available for double-checking in layout-level server components (plan 02)
- Ready to proceed to plan 01-02 (admin layout) and 01-03 (admin login redirect)

---
*Phase: 01-admin-foundation*
*Completed: 2026-02-19*
