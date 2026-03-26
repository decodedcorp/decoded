---
phase: 47-observability
plan: 02
subsystem: infra
tags: [sentry, rust, axum, python, fastapi, grpc, error-tracking, observability, tower]

# Dependency graph
requires:
  - phase: 47-observability
    provides: Plan 01 (Next.js Sentry integration) — same phase, sequential
  - phase: 45-rate-limiting
    provides: tower middleware stack in Axum — sentry-tower layers inserted alongside

provides:
  - Rust Axum sentry integration with sync main + async_main guard lifetime pattern
  - sentry-tracing bridge (ERROR->Event, WARN->Breadcrumb) in tracing_subscriber
  - sentry-tower NewSentryLayer + SentryHttpLayer in Axum middleware stack
  - Python FastAPI sentry-sdk with StarletteIntegration + FastApiIntegration + GRPCIntegration
  - Graceful degradation for both services when SENTRY_DSN is absent

affects: [48-e2e-testing, api-server, ai-server]

# Tech tracking
tech-stack:
  added:
    - sentry 0.47.0 (Rust, with tower-axum-matched-path and tracing features)
    - sentry-sdk[fastapi,grpcio] 2.56.0 (Python)
  patterns:
    - sync main() wraps tokio runtime builder — sentry guard outlives async runtime
    - _init_sentry() helper with empty-DSN guard pattern — no crash without DSN

key-files:
  created: []
  modified:
    - packages/api-server/Cargo.toml
    - packages/api-server/src/main.rs
    - packages/ai-server/pyproject.toml
    - packages/ai-server/uv.lock
    - packages/ai-server/src/app.py
    - packages/ai-server/src/bootstrap.py

key-decisions:
  - "EventFilter::Exception does not exist in sentry 0.47.0; correct variants are Event/Breadcrumb/Log/Ignore — plan had outdated API"
  - "sentry_tower:: and sentry_tracing:: are not top-level crates; accessed via sentry::integrations::tower:: and sentry::integrations::tracing::"
  - "SentryHttpLayer::with_transaction() deprecated since 0.38.0 — use SentryHttpLayer::new().enable_transaction() instead"
  - "sentry_layer must be constructed inline per branch (not hoisted) due to generic type inference constraints with tracing_subscriber"
  - "_init_sentry() defined in app.py and imported into bootstrap.py to keep FastAPI creation as the clear boundary"

patterns-established:
  - "Rust Sentry guard lifetime: sync fn main() init sentry -> store _guard -> tokio::runtime::Builder::new_multi_thread().block_on(async_main())"
  - "Python graceful degradation: check empty DSN before sentry_sdk.init(), return early — never crash on missing DSN"

requirements-completed: [OBS-01, OBS-03]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 47 Plan 02: Sentry Backend Integration Summary

**Sentry error tracking integrated into Rust/Axum API server and Python FastAPI+gRPC AI server with correct guard lifetime management and graceful empty-DSN degradation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T15:06:05Z
- **Completed:** 2026-03-26T15:10:46Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- Rust API server: sentry 0.47.0 integrated with tower middleware (NewSentryLayer + SentryHttpLayer) and tracing bridge (ERROR->Event, WARN->Breadcrumb)
- Rust main.rs restructured from `#[tokio::main]` to sync main + async_main pattern so sentry `_guard` outlives the async runtime
- Python AI server: sentry-sdk 2.56.0 installed with FastAPI, Starlette, and gRPC integrations; `_init_sentry()` called before `FastAPI()` instantiation in bootstrap.py
- Both services gracefully skip Sentry init when SENTRY_DSN is empty/absent — no crash in local development

## Task Commits

1. **Task 1: Add sentry crate to Rust and restructure main.rs** - `3530536a` (feat)
2. **Task 2: Add sentry-sdk to Python AI server** - `5f30a5fc` (feat)

## Files Created/Modified

- `packages/api-server/Cargo.toml` - Added sentry 0.47.0 to workspace.dependencies and [dependencies]
- `packages/api-server/src/main.rs` - Restructured to sync main + async_main; added sentry init, tracing layer, tower middleware layers
- `packages/ai-server/pyproject.toml` - Added sentry-sdk[fastapi,grpcio]>=2.56.0
- `packages/ai-server/uv.lock` - Updated lockfile after uv add
- `packages/ai-server/src/app.py` - Added _init_sentry() helper with imports
- `packages/ai-server/src/bootstrap.py` - Imports and calls _init_sentry() before FastAPI() creation

## Decisions Made

- `EventFilter::Exception` does not exist in sentry 0.47.0 — the plan referenced an outdated API; correct variant is `EventFilter::Event` for ERROR-level events
- `sentry_tower::` and `sentry_tracing::` are not top-level crates; they are re-exported via `sentry::integrations::tower::` and `sentry::integrations::tracing::`
- `SentryHttpLayer::with_transaction()` deprecated since 0.38.0; replaced with `SentryHttpLayer::new().enable_transaction()`
- Sentry layer closure must be constructed inline within each if/else branch rather than hoisted to a variable, due to Rust generic type inference constraints when layering tracing_subscriber
- `_init_sentry()` defined in `app.py` and imported into `bootstrap.py` — keeps the bootstrap boundary clean and allows `app.py` to own Sentry initialization logic

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed outdated EventFilter API in plan**
- **Found during:** Task 1 (Rust main.rs restructure)
- **Issue:** Plan specified `EventFilter::Exception` which doesn't exist in sentry 0.47.0; API uses `EventFilter::Event` (bitflag)
- **Fix:** Used `EventFilter::Event` for ERROR level; verified via sentry-tracing source in cargo registry
- **Files modified:** packages/api-server/src/main.rs
- **Verification:** cargo check passes
- **Committed in:** 3530536a (Task 1 commit)

**2. [Rule 1 - Bug] Fixed incorrect sentry re-export paths in plan**
- **Found during:** Task 1 (first cargo check attempt)
- **Issue:** Plan used `sentry_tower::` and `sentry_tracing::` as top-level crate names; actually re-exported as `sentry::integrations::tower::` and `sentry::integrations::tracing::`
- **Fix:** Updated all references to correct integration paths
- **Files modified:** packages/api-server/src/main.rs
- **Verification:** cargo check passes
- **Committed in:** 3530536a (Task 1 commit)

**3. [Rule 1 - Bug] Fixed deprecated SentryHttpLayer::with_transaction()**
- **Found during:** Task 1 (cargo check warning)
- **Issue:** `with_transaction()` deprecated since sentry 0.38.0; plan specified deprecated API
- **Fix:** Used `SentryHttpLayer::new().enable_transaction()` per current docs
- **Files modified:** packages/api-server/src/main.rs
- **Verification:** cargo check passes, no deprecation warning
- **Committed in:** 3530536a (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - outdated API in plan)
**Impact on plan:** All fixes corrected outdated API references in the plan; intent and behavior are identical. No scope creep.

## Issues Encountered

- Rust type inference requires sentry tracing layer to be constructed inline per if/else branch rather than in a shared variable — Rust's generic system cannot unify the two `SentryLayer<S>` instances with different subscriber type parameters across branches

## User Setup Required

Set `SENTRY_DSN` environment variable in both services to enable error tracking. Without it, both services start normally with Sentry silently disabled.

- `packages/api-server/.env` or deployment env: `SENTRY_DSN=https://...@sentry.io/...`
- `packages/ai-server/.env` or deployment env: `SENTRY_DSN=https://...@sentry.io/...`
- Optional: `APP_ENV=production` sets 0.1 sample rate for both services (default is 1.0 for development)

## Next Phase Readiness

- Sentry is fully integrated across all three services (Next.js in Plan 01, Rust + Python in this plan)
- Both backend services gracefully degrade in local development without DSN
- Ready for Phase 48: E2E testing foundation

---
*Phase: 47-observability*
*Completed: 2026-03-26*
