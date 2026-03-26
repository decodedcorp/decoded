---
phase: 45-security-foundation
plan: 02
subsystem: api
tags: [rate-limiting, security, next.js, typescript, env-validation]

# Dependency graph
requires: []
provides:
  - "In-memory sliding window rate limiter (lib/rate-limit.ts)"
  - "Fail-fast env validator throwing at module load (lib/server-env.ts)"
  - "image-proxy rate-limited at 60 req/min per IP"
  - "posts/analyze rate-limited at 10 req/min per IP with 429+Retry-After"
  - "All 28 Next.js API route files: console guarded, env from server-env, catch blocks sanitized"
  - "debug-env route deleted (information leakage endpoint removed)"
affects: [sentry-integration, e2e-testing, production-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "server-env: fail-fast env validation at module load, not per-request"
    - "rate-limit: in-memory sliding window, state is per-process (single-server ok)"
    - "console guard: if (process.env.NODE_ENV === 'development') { console.error(...) }"
    - "catch block: expose only error.message, never stack traces or internal URLs"

key-files:
  created:
    - packages/web/lib/rate-limit.ts
    - packages/web/lib/server-env.ts
  modified:
    - packages/web/app/api/v1/image-proxy/route.ts
    - packages/web/app/api/v1/posts/analyze/route.ts
    - packages/web/app/api/v1/posts/route.ts
    - packages/web/app/api/v1/posts/upload/route.ts
    - packages/web/app/api/v1/posts/with-solution/route.ts
    - packages/web/app/api/v1/posts/with-solutions/route.ts
    - packages/web/app/api/v1/posts/extract-metadata/route.ts
    - packages/web/app/api/v1/posts/[postId]/route.ts
    - packages/web/app/api/v1/posts/[postId]/spots/route.ts
    - packages/web/app/api/v1/posts/[postId]/saved/route.ts
    - packages/web/app/api/v1/posts/[postId]/likes/route.ts
    - packages/web/app/api/v1/vton/route.ts
    - packages/web/app/api/v1/vton/items/route.ts
    - packages/web/app/api/v1/users/me/route.ts
    - packages/web/app/api/v1/users/me/stats/route.ts
    - packages/web/app/api/v1/users/me/activities/route.ts
    - packages/web/app/api/v1/users/[userId]/route.ts
    - packages/web/app/api/v1/spots/[spotId]/route.ts
    - packages/web/app/api/v1/spots/[spotId]/solutions/route.ts
    - packages/web/app/api/v1/solutions/extract-metadata/route.ts
    - packages/web/app/api/v1/solutions/convert-affiliate/route.ts
    - packages/web/app/api/v1/solutions/[solutionId]/route.ts
    - packages/web/app/api/v1/solutions/[solutionId]/adopt/route.ts
    - packages/web/app/api/v1/rankings/route.ts
    - packages/web/app/api/v1/rankings/me/route.ts
    - packages/web/app/api/v1/categories/route.ts
    - packages/web/app/api/v1/badges/route.ts
    - packages/web/app/api/v1/badges/me/route.ts

key-decisions:
  - "Rate limiter is in-memory per-process (not Redis) — acceptable for single-server deployment, aligns with REQUIREMENTS.md scope"
  - "console.log/error guarded (not deleted) — Phase 47 Sentry integration will replace with structured logging"
  - "vton/route.ts kept console.log for VTON telemetry but converted to console.error guarded by NODE_ENV — preserves observability in dev"
  - "debug-env route deleted entirely rather than guarded — no legitimate production use case, deletion is safer"

patterns-established:
  - "API route pattern: import API_BASE_URL from @/lib/server-env at module top (not per-request process.env)"
  - "Error logging pattern: if (process.env.NODE_ENV === 'development') { console.error(...) }"
  - "Catch block pattern: { message: error instanceof Error ? error.message : 'Proxy error' } — never expose internal details"

requirements-completed: [RATE-03, RATE-04, SEC-01, SEC-02, SEC-03]

# Metrics
duration: 8min
completed: 2026-03-26
---

# Phase 45 Plan 02: Security Foundation — Next.js API Hardening Summary

**In-memory sliding window rate limiter + fail-fast env validator applied to all 28 Next.js API proxy routes: console logs guarded, API_BASE_URL fail-fast at module load, catch blocks sanitized, debug-env deleted**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T13:55:19Z
- **Completed:** 2026-03-26T14:03:05Z
- **Tasks:** 3/3
- **Files modified:** 30 (28 routes + 2 new utilities)

## Accomplishments

- Created `lib/rate-limit.ts` with sliding window `checkRateLimit`, `getClientKey`, `rateLimitResponse` — returns 429 with `Retry-After` header
- Created `lib/server-env.ts` with `requireEnv()` that throws at module load for missing `API_BASE_URL` — fail-fast config
- Applied 60 req/min rate limit to `image-proxy`, 10 req/min to `posts/analyze` (most expensive AI endpoint)
- Replaced `const API_BASE_URL = process.env.API_BASE_URL` per-request pattern with `import { API_BASE_URL } from "@/lib/server-env"` across all 25 proxy routes
- Guarded all `console.log`/`console.error` with `if (process.env.NODE_ENV === "development")` across all 28 routes
- Sanitized all catch blocks to expose only `error.message`, never stack traces or internal URLs
- Deleted `debug-env/route.ts` entirely — was exposing `NODE_ENV`, `NEXT_PUBLIC_DEBUG`, and Supabase URL presence with no production guard

## Task Commits

1. **Task 1: Create rate-limit.ts + server-env.ts, apply to image-proxy and analyze** - `052fa62d` (feat)
2. **Task 2: Bulk harden posts, vton, users routes + delete debug-env** - `ccfde9c8` (feat)
3. **Task 3: Bulk harden spots, solutions, rankings, categories, badges routes** - `4d92aaeb` (feat)

## Files Created/Modified

- `packages/web/lib/rate-limit.ts` — New: in-memory sliding window rate limiter
- `packages/web/lib/server-env.ts` — New: fail-fast env var validator
- `packages/web/app/api/v1/image-proxy/route.ts` — Rate limited at 60 req/min
- `packages/web/app/api/v1/posts/analyze/route.ts` — Rate limited at 10 req/min, server-env import, log guard, catch sanitized
- 24 other proxy route files — server-env import, log guard, catch sanitized
- `packages/web/app/api/v1/debug-env/route.ts` — DELETED

## Decisions Made

- Rate limiter is in-memory per-process (not Redis) — acceptable for single-server deployment, aligns with REQUIREMENTS.md scope
- console.log/error guarded (not deleted) — Phase 47 Sentry integration will replace with structured logging
- vton/route.ts kept extensive VTON telemetry logs but guarded with NODE_ENV — valuable for dev debugging expensive GCP API calls
- debug-env route deleted entirely rather than production-guarded — no legitimate production use case

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Verification grep `grep -v NODE_ENV | wc -l` appeared to show 37 unguarded console calls — investigation confirmed these were console.error lines inside `if (process.env.NODE_ENV === "development") { ... }` blocks (multi-line calls where the continuation lines don't contain NODE_ENV). Python context-window analysis confirmed 0 truly unguarded calls.

## User Setup Required

None - no external service configuration required. Rate limiter is in-memory, no Redis setup needed.

## Next Phase Readiness

- All 28 Next.js proxy routes are hardened for production
- lib/rate-limit.ts and lib/server-env.ts ready for use in any future routes
- Phase 47 (Sentry) can now replace guarded console.error calls with structured logging

---
*Phase: 45-security-foundation*
*Completed: 2026-03-26*
