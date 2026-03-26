# Project Research Summary

**Project:** decoded-monorepo v10.0 — Production Stability & Tech Debt Resolution
**Domain:** Polyglot monorepo hardening (Next.js 16 + Rust/Axum + Python/gRPC)
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

The v10.0 tech debt resolution targets five distinct problem areas across a production polyglot monorepo: rate limiting on AI-cost endpoints, cross-service Sentry error tracking, business-logic E2E test coverage, component decomposition of four monolith files, and memory leak elimination from GSAP/ObjectURL/Three.js patterns. The research confirms all five areas are achievable without introducing major new architectural dependencies — the stack already contains the right primitives (Playwright, tower, tracing, GSAP's `useGSAP`, moka cache), and the gaps are targeted additions: `tower-governor`, `@sentry/nextjs`, `sentry` (Rust crate), and `sentry-sdk[fastapi]` for Python.

The recommended execution order is dictated by strict architectural dependencies: memory leaks first (isolated, no regressions, immediate production benefit), component refactoring second (required before clean E2E targets exist and before Sentry can group errors by meaningful component names), rate limiting in parallel with refactoring (backend-only, independent of frontend), Sentry fourth (stable components reduce alert noise; rate limiting must precede it so 429s are not reported as errors), and E2E tests last (integration assertions over the entire hardened system). Deviating from this sequence creates concrete, documented failure modes.

The highest-risk areas are GSAP animation continuity during component extraction (silent failures with no TypeScript errors), Axum rate-limiter state sharing (broken implementation appears to work until load-tested), and Sentry source map upload (the most common "looks done but isn't" failure). All three have clear prevention strategies and go/no-go verification steps documented in PITFALLS.md.

---

## Key Findings

### Recommended Stack

The existing stack requires no architectural changes — only targeted additions. See [STACK.md](.planning/research/STACK.md) for full version and compatibility tables.

**Core technologies to add:**
- `tower-governor 0.8` (Rust): Per-IP/per-user rate limiting using shared-Arc GCRA algorithm — the only correct approach in Tower/Axum without state-clone bugs; supports `SmartIpKeyExtractor` for proxy-aware IP detection
- `@sentry/nextjs ^10.45.0`: App Router-native error capture with source map upload via webpack plugin; install via wizard (`bunx @sentry/wizard@latest -i nextjs`) to get correctly structured `instrumentation.ts` config files
- `sentry 0.46` + `sentry-tracing 0.46` (Rust): Captures unhandled `AppError::Internal` via `sentry-tower` layer; integrates automatically with existing `tracing` calls at zero additional code-change cost
- `sentry-sdk[fastapi] ^2.0` (Python): ASGI auto-instrumentation for FastAPI; must explicitly add `GRPCIntegration` or gRPC handler exceptions are not captured
- In-memory sliding window (Next.js proxy): Zero-dependency soft gate using `Map<string, number[]>` — sufficient for single-process Vercel; do not add Upstash/Redis for this milestone

**What not to add:** Upstash Redis (overkill for single-process deployment), `why-did-you-render` (debug tool, not a fix), Sentry Session Replay on initial install (adds ~50KB bundle, enable post-baseline), `react-scan` (performance scope, not stability scope), new ESLint plugins for component size (unmaintained).

### Expected Features

See [FEATURES.md](.planning/research/FEATURES.md) for full prioritization matrix. Note: FEATURES.md covers the Orval + Zod API code generation milestone (v9.0 context). The v10.0 stability work features are derived from CONCERNS.md and the ARCHITECTURE.md integration analysis.

**Must have (table stakes for v10.0 stability):**
- Rate limiting enforced at the Axum middleware layer — not optional, not proxy-only (proxy is bypassed by direct callers)
- Sentry capturing errors across all three runtimes with readable stack traces (source maps are a go/no-go gate)
- E2E test coverage of 6 critical flows: auth, post creation, AI detection, image detail, search, rate-limit 429 response
- Component extraction maintaining animation continuity for ThiingsGrid, ImageDetailContent, ImageDetailModal, DecodedLogo
- Memory leak fixes for ObjectURL (requestStore), GSAP context (event handlers), Three.js renderer (DecodedLogo), and event listeners

**Should have (stability differentiators):**
- Cross-service Sentry trace correlation (`Sentry-Trace` header forwarded Rust → Python gRPC calls)
- Per-authenticated-user rate limiting keyed on JWT `sub` claim, not per-IP (trivially bypassed behind NAT)
- `data-testid` attributes added proactively during component refactoring, not retroactively
- `storageState` auth fixture for Playwright (pre-authenticated session, not per-test UI login flow)
- Sentry `before_send` hook stripping user image URL fields from event payloads (privacy compliance)

**Defer to v10.x+:**
- Redis-backed rate limiting (only when multi-instance or multi-region deployment)
- Sentry Session Replay and Performance Profiling (enable after confirming error capture baseline)
- MSW mock generation (requires `@faker-js/faker` + `msw`, separate milestone)
- Zod strict mode on API response schemas (defer until OpenAPI spec is stable post-v9.0 migration)

### Architecture Approach

The architecture is additive: all five tech debt items insert into the existing Browser → Next.js → Rust/Axum → Python/gRPC → Supabase stack without structural changes. See [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) for full component diagram and data flow.

**Major components and their v10.0 changes:**
1. **Next.js proxy routes** (`app/api/v1/*`) — add soft rate-limit soft gate; fix 429 passthrough (currently swallowed as 500, a confirmed bug pattern in the proxy)
2. **Rust Tower middleware stack** — insert `tower-governor` after `auth`; `sentry-tower::NewSentryLayer` as outermost layer (ordering is strict: Sentry outermost, rate limit inner)
3. **React components** (ThiingsGrid ~948 LOC, ImageDetailContent ~671 LOC, ImageDetailModal ~637 LOC, DecodedLogo ~764 LOC) — extract hooks and sub-components; fix GSAP cleanup via `useGSAP` + `contextSafe()`
4. **Zustand requestStore** — AbortController pattern for ObjectURL lifecycle; URL tracking `Set<string>` for complete cleanup on unmount
5. **Playwright test suite** — extend existing visual QA infrastructure with `e2e/` tier using storageState auth, `data-testid` selectors, Page Object Model

### Critical Pitfalls

See [PITFALLS.md](.planning/research/PITFALLS.md) for all 10 pitfalls with full prevention strategies and recovery steps.

1. **Axum rate limiter state not shared across Tower service clones** — `tower::RateLimitLayer` clones its counter per handler (Axum issue #2634); the rate limit never triggers. Use `tower-governor` with shared `Arc<GovernorConfig>`. Validate with load test: `for i in {1..200}; do curl POST /api/v1/posts/analyze; done` must return 429 before request 101.

2. **GSAP animations silently break after component extraction** — GSAP refs lose DOM targets when sections are extracted to child components; no TypeScript error, no console error, just absent animations. Refactor sequence: fix `useGSAP` cleanup first, then extract markup with `forwardRef`, then move animation hooks to lowest owner. Test animations manually after every extraction step.

3. **Sentry source maps not uploading, producing minified stack traces** — `SENTRY_AUTH_TOKEN` missing from CI/Vercel env is the most common cause. `withSentryConfig` must be the outermost `next.config.js` wrapper. Go/no-go gate: a test error must show TypeScript source lines, not `page-abc123.js:1:4821`.

4. **Sentry user context missing from client-side events** — `setUser()` on the server does not propagate to the browser SDK (documented in Sentry GitHub discussion #10019). Must call `Sentry.setUser()` in `authStore` client-side after session hydration, independently of the server call.

5. **Playwright auth race condition in CI** — Supabase session hydrates asynchronously after `page.goto()`; tests pass locally (warm) but fail in CI (cold start). Fix: `storageState` setup project pre-authenticating via Supabase REST API + `waitForFunction` polling for authenticated DOM sentinel before executing authenticated actions.

6. **ObjectURL race condition during rapid navigation** — compression Promise resolves after component unmounts, creating URLs from cleared store state. Fix: AbortController passed to compression; check `signal.aborted` before `createObjectURL`. Track all created URLs in `Set<string>` for complete cleanup.

---

## Implications for Roadmap

The architecture's dependency graph directly mandates a 5-phase sequence. No phase can safely be reordered without triggering the pitfalls documented in PITFALLS.md.

### Phase 1: Memory Leak Fixes
**Rationale:** Smallest scope, no regressions possible, immediate production benefit, and a prerequisite for clean component refactoring. Fixing GSAP cleanup after structural extraction is exponentially harder than before it.
**Delivers:** `useGSAP` + `contextSafe()` across all animated components; AbortController + URL tracking Set in `requestStore.ts`; Three.js `renderer.dispose()` in `DecodedLogo.tsx`; event listener cleanup audit across all components
**Addresses:** Pitfalls 9 (ObjectURL race) and 10 (GSAP orphaned tweens from event handlers)
**Avoids:** The "fix cleanup after the refactor" trap — GSAP context cleanup must own the lifecycle before DOM structure is reorganized

### Phase 2: Component Refactoring
**Rationale:** Clean component boundaries are required before E2E tests can use stable `data-testid` selectors and before Sentry can group errors by meaningful component names. Monolith stack traces produce ungroupable Sentry events.
**Delivers:** ThiingsGrid → `useThiingsPhysics` hook + `ThiingsCell` component; ImageDetailContent → `ImageDetailHero`, `ImageDetailSpots`, `ImageDetailShop`; ImageDetailModal → `useModalGSAP` hook + `ModalDrawer`; DecodedLogo → `useDecodedLogoWebGL` + `DecodedLogoFallback`; `data-testid` attributes on all interactive elements; Playwright visual baseline re-approval for affected pages
**Uses:** `forwardRef` pattern for GSAP ref propagation into child components; `useGSAP` with `scope` parameter (established in Phase 1)
**Avoids:** Pitfall 8 (GSAP refs silently lose targets); Anti-Pattern 3 (visual baseline update required after refactoring — must be done before merge)

### Phase 3: Rate Limiting (Rust + Next.js)
**Rationale:** Backend-only work, independent of frontend. Can run in parallel with Phase 2 if team capacity allows. Must precede Sentry so that `tower-governor` 429 responses are positioned inside the `sentry-tower` layer and are not incorrectly reported as application errors.
**Delivers:** `packages/api-server/src/middleware/rate_limit.rs` (new) with `tower-governor`; per-user JWT-keyed limiting on AI endpoints (`POST /posts/analyze`, `/posts/extract-metadata`, `/posts/upload`); `moka` cache with TTL eviction as backing store (not unbounded HashMap); `429` passthrough fix in Next.js proxy routes; in-memory sliding window soft gate in Next.js
**Implements:** Tower middleware insertion pattern; `SmartIpKeyExtractor` (proxy-aware) for IP-keyed endpoints; custom extractor reading JWT `sub` claim for per-user limits
**Avoids:** Pitfall 1 (shared Arc state required), Pitfall 2 (unbounded HashMap — use moka with TTL), Security mistake (per-IP is bypassable — key on JWT sub for AI endpoints)

### Phase 4: Sentry Error Tracking (All Three Runtimes)
**Rationale:** Refactored components in Phase 2 give clean stack traces; rate limiting in Phase 3 prevents 429s from being counted as errors. Three SDK installations are independent and do not require each other. Install all three runtimes in one phase to allow cross-service trace correlation setup.
**Delivers:** `@sentry/nextjs` with wizard-generated config files + source maps verified; `sentry-tower::NewSentryLayer` in Rust middleware stack (outermost position) with `AppError::Internal`/`AppError::ExternalService` filtering; `sentry-sdk[fastapi,arq,grpc]` in Python with `GRPCIntegration`; `Sentry.setUser()` in `AuthProvider` client-side + server layout; `Sentry-Trace` header forwarding Rust → Python gRPC; Sentry tunnel route configured to prevent DSN exposure
**Uses:** Wizard-generated config for Next.js (avoids instrumentation.ts misconfiguration); `sentry::init()` with `attach_stacktrace: true` in Rust `main.rs`
**Avoids:** Pitfall 3 (user context split — set in both server and client), Pitfall 4 (source maps — verified as go/no-go gate), Pitfall 5 (Tokio async panic not captured without `sentry-tower` layer)

### Phase 5: E2E Business Logic Tests
**Rationale:** Must be last — it is an integration assertion over the complete hardened system. Tests verify refactored components via stable `data-testid` selectors, confirm Sentry sees zero unexpected errors on happy paths, and assert 429 responses flow correctly to the UI. Running these tests before Phase 1-4 completes produces flaky results against unstable targets.
**Delivers:** 6 E2E specs (`auth.spec.ts`, `post-creation.spec.ts`, `ai-detection.spec.ts`, `image-detail.spec.ts`, `search.spec.ts`, `rate-limit.spec.ts`); `storageState` auth fixture (Supabase REST API login, not UI login); Page Object Model in `e2e/pages/`; CI project separation (visual-qa weekly schedule, e2e on every PR); Docker Compose test environment design decision for full-stack AI detection tests
**Avoids:** Pitfall 6 (auth race — storageState setup project is the first deliverable, before any test is written), Pitfall 7 (UI label coupling — `data-testid` only, no `getByText` in business logic tests)

### Phase Ordering Rationale

- **Memory leaks before refactoring:** GSAP cleanup must be in place before DOM structure is reorganized. Fixing cleanup in a split component requires coordinating between parent and child owners — 3x harder than fixing it in the monolith. This is the most critical ordering constraint.
- **Refactoring before Sentry:** Sentry groups errors by component name. Monolith components (`ThiingsGrid` at 948 lines) generate confusing, ungroupable stack traces. Refactoring first means Sentry events have meaningful groups from day one.
- **Rate limiting before Sentry:** Tower layer ordering is strict. `sentry-tower::NewSentryLayer` must be outermost to capture all errors from inner layers. Rate limiting must be an inner layer (after auth, before handlers). Inserting them in this order requires establishing the middleware stack in Phase 3 first, then wrapping with Sentry in Phase 4.
- **Sentry before E2E:** E2E happy-path tests should assert zero unexpected Sentry events. This requires Sentry to be capturing events before the tests run.
- **E2E last:** Full-stack integration assertion requires the complete system to be stable. Testing against unstable animated components or before rate limiting is wired produces flaky results that erode test suite trust.

### Research Flags

Phases requiring deeper research or design decisions during planning:
- **Phase 3 (Rate Limiting — custom JWT extractor):** `tower-governor` provides `SmartIpKeyExtractor` out of the box, but a custom extractor reading JWT `sub` claim from the `Authorization` header requires a brief implementation spike. Verify the extractor trait API against tower-governor 0.8 before Phase 3 spec-writing.
- **Phase 5 (E2E — test environment design):** The AI detection E2E flow requires Rust backend + Python AI server running simultaneously. The test environment design (local Docker Compose, preview deployment URL, or selective service mocking) is an unresolved architectural decision that must be made before Phase 5 spec-writing begins.

Phases with well-documented patterns (skip additional research-phase):
- **Phase 1 (Memory Leaks):** All leak sites are identified in `CONCERNS.md`; GSAP `contextSafe()` and AbortController patterns are fully documented in official sources.
- **Phase 2 (Component Refactoring):** Extraction strategy is structural; no external APIs; `forwardRef` and `useGSAP` patterns are standard.
- **Phase 4 (Sentry):** Wizard handles most configuration; three independent SDK installs with official documentation for each runtime.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry, Rust docs.rs, and official Sentry docs as of 2026-03-26. Version compatibility cross-checked against existing stack (axum 0.8.8, Next.js 16.2.1, React 19, FastAPI 0.115.11). |
| Features | HIGH | v10.0 feature set derived directly from CONCERNS.md (known issues) + ARCHITECTURE.md integration analysis. No speculation required — this is existing-codebase work, not greenfield. |
| Architecture | HIGH | Based on direct codebase inspection: 41 proxy route files, existing middleware stack in `mod.rs`, `Cargo.toml`, `pyproject.toml`. All claims derive from file inspection, not inference. |
| Pitfalls | HIGH (memory leaks, GSAP, component splitting) / MEDIUM (Sentry polyglot correlation, Playwright/Supabase) | GSAP and memory pitfalls sourced from official GSAP docs and direct codebase analysis. Sentry multi-runtime cross-service correlation (Rust→Python gRPC) has limited real-world documentation at this specific combination. |

**Overall confidence:** HIGH

### Gaps to Address

- **Sentry cross-service trace correlation (Rust → Python gRPC):** The `Sentry-Trace` header forwarding mechanism for gRPC metadata injection has limited documentation at the Rust+Python combination specifically. Validate this integration path during Phase 4 execution before declaring cross-service tracing complete. Fall back to independent per-service capture if correlation proves unreliable.
- **tower-governor custom JWT sub extractor:** The extractor trait API for reading JWT claims from the Authorization header (for per-user rate limiting) requires a code spike during Phase 3 planning. Confirm the extractor compiles against tower-governor 0.8 before finalizing Phase 3 scope.
- **Playwright Docker Compose test environment:** The AI detection E2E flow requires all three services running simultaneously. Whether to use local Docker Compose, a preview environment, or selective mocking is an open decision. Resolve before Phase 5 spec-writing to avoid re-scoping test coverage.
- **Visual baseline re-approval scope (Phase 2):** Refactoring ThiingsGrid and ImageDetailContent will invalidate existing Playwright visual baselines for the images page, detail modal, and potentially the main page. Pre-map which baselines are affected before Phase 2 begins to avoid blocking CI for extended periods mid-refactor.

---

## Sources

### Primary (HIGH confidence)
- [Sentry Next.js official docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) — App Router wizard setup, instrumentation.ts pattern
- [Sentry Rust/Axum official docs](https://docs.sentry.io/platforms/rust/guides/axum/) — tower-axum-matched-path feature, sentry 0.46.2 config
- [tower-governor GitHub](https://github.com/benwis/tower-governor) — v0.8.0 stable, SmartIpKeyExtractor, shared Arc pattern
- [Playwright Auth official docs](https://playwright.dev/docs/auth) — storageState pattern, auth-setup project dependencies
- [GSAP React official docs](https://gsap.com/resources/React/) — useGSAP, contextSafe() for event handlers
- [Orval React Query Guide](https://www.orval.dev/guides/react-query) — hook generation, tags-split mode (v9.0 context)
- Direct codebase analysis — `CONCERNS.md`, `ARCHITECTURE.md`, 41 proxy route files, `Cargo.toml` (api-server), `pyproject.toml` (ai-server), existing middleware stack

### Secondary (MEDIUM confidence)
- [Axum issue #2634](https://github.com/tokio-rs/axum/issues/2634) — RateLimitLayer clone-state bug confirmed
- [Sentry GitHub discussion #10019](https://github.com/getsentry/sentry-javascript/discussions/10019) — setUser() not propagated server→client in App Router
- [Playwright + Supabase login via REST](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test) — storageState with Supabase auth REST API pattern
- [Upstash ratelimit for Next.js](https://upstash.com/blog/nextjs-ratelimiting) — useful context for multi-region decision
- [npm: @sentry/nextjs](https://www.npmjs.com/package/@sentry/nextjs) — Version 10.45.0 confirmed as latest

### Tertiary (LOW confidence — needs validation during execution)
- Sentry `Sentry-Trace` header forwarding into gRPC metadata for Rust→Python correlation — documented pattern exists; limited real-world reports for this exact runtime combination
- `moka` cache TTL configuration as tower-governor backing store — community-documented but requires implementation spike to validate API compatibility with governor 0.8

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
