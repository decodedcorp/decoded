---
phase: 45-security-foundation
plan: 01
subsystem: api
tags: [rate-limiting, tower-governor, gcra, axum, middleware, jwt]

# Dependency graph
requires: []
provides:
  - GCRA-based rate limiting middleware for Axum backend
  - JwtUserKeyExtractor (JWT sub claim + IP fallback key extraction)
  - GovernorLayer applied to /posts/analyze endpoint
affects: [45-02]

# Tech tracking
tech-stack:
  added: [tower_governor 0.8, governor 0.10]
  patterns:
    - Rate limit layer isolated to specific route via separate Router::new() block
    - JWT sub extracted without signature verification (upstream auth already verified)
    - IP fallback via ConnectInfo<SocketAddr> extension for anonymous requests

key-files:
  created:
    - packages/api-server/src/middleware/rate_limit.rs
  modified:
    - packages/api-server/Cargo.toml
    - packages/api-server/src/middleware/mod.rs
    - packages/api-server/src/domains/posts/handlers.rs

key-decisions:
  - "governor 0.10 added directly as it is not re-exported by tower_governor 0.8 (needed for StateInformationMiddleware type)"
  - "JWT sub extracted with insecure_disable_signature_validation() — safe because auth_middleware already validates upstream"
  - "IP fallback uses ConnectInfo<SocketAddr> Axum extension (not X-Forwarded-For) — simpler and avoids header spoofing in non-proxy deploys"

patterns-established:
  - "Route isolation pattern: wrap rate-limited routes in separate Router then .merge() into main router"
  - "GovernorConfigBuilder::use_headers() enables X-RateLimit-* and Retry-After headers on 429 responses"

requirements-completed: [RATE-01, RATE-02, RATE-04]

# Metrics
duration: 7min
completed: 2026-03-26
---

# Phase 45 Plan 01: Rate Limiting Middleware Summary

**GCRA rate limiting on /posts/analyze via tower_governor 0.8: per-user JWT sub key extractor with IP fallback, 1 req/s burst-3, X-RateLimit-* headers on 429**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-26T13:55:19Z
- **Completed:** 2026-03-26T14:02:16Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Added tower_governor 0.8 + governor 0.10 to Cargo.toml (workspace + package deps)
- Created `rate_limit.rs` with `JwtUserKeyExtractor` that extracts JWT sub claim without signature re-verification, falling back to IP for anonymous requests
- Built `ai_rate_limit_layer()` function: GCRA 1 req/s replenishment, burst 3, use_headers() for RATE-04 compliance
- Applied GovernorLayer only to `/analyze` route — all other posts routes unaffected
- 2 unit tests added and passing; all 367 existing tests continue to pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tower_governor dependency and create rate_limit middleware module** - `a837e564` (feat)
2. **Task 2: Apply GovernorLayer to the /analyze route in posts handler** - `35c60faf` (feat)

## Files Created/Modified

- `packages/api-server/src/middleware/rate_limit.rs` — JwtUserKeyExtractor + ai_rate_limit_layer() + unit tests
- `packages/api-server/Cargo.toml` — tower_governor 0.8 + governor 0.10 in workspace.dependencies and [dependencies]
- `packages/api-server/src/middleware/mod.rs` — `pub mod rate_limit` + `pub use rate_limit::ai_rate_limit_layer`
- `packages/api-server/src/domains/posts/handlers.rs` — rate_limited_routes isolation, ai_rate_limit_layer() applied

## Decisions Made

- Added `governor = "0.10"` directly because `tower_governor` does not re-export `governor::middleware::StateInformationMiddleware`, which is required for the `use_headers()` return type in the function signature.
- JWT sub extracted with `insecure_disable_signature_validation()` — safe because `auth_middleware` already performs full JWKS signature verification upstream. Re-verifying here would add network overhead with no security benefit.
- IP fallback uses `ConnectInfo<SocketAddr>` from Axum extensions rather than X-Forwarded-For headers, avoiding header spoofing in non-proxy deployments.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added governor 0.10 dependency**
- **Found during:** Task 1 (create rate_limit middleware module)
- **Issue:** `tower_governor` does not re-export `governor::middleware::StateInformationMiddleware`. The `ai_rate_limit_layer()` return type requires this type explicitly, but `governor` crate was not in our dependencies.
- **Fix:** Added `governor = "0.10"` to workspace.dependencies and `governor = { workspace = true }` to package dependencies in Cargo.toml
- **Files modified:** packages/api-server/Cargo.toml
- **Verification:** `cargo check` and `cargo test` pass
- **Committed in:** a837e564 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary companion dependency for tower_governor. No scope creep.

## Issues Encountered

None beyond the blocking dependency discovered during implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Rate limiting middleware (RATE-01, RATE-02, RATE-04) fully implemented and tested
- Ready for Phase 45 Plan 02 (Sentry error tracking or next security requirement)
- No blockers

---
*Phase: 45-security-foundation*
*Completed: 2026-03-26*
