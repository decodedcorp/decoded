# Architecture Research

**Domain:** Polyglot Monorepo Tech Debt Resolution (Next.js + Rust/Axum + Python/gRPC)
**Researched:** 2026-03-26
**Confidence:** HIGH — Based on direct codebase analysis, no speculation.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Next.js 16 (packages/web)                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │    │
│  │  │ React Pages  │  │  Zustand /   │  │  Orval-Generated │  │    │
│  │  │ + Components │  │  TanStack Q  │  │  API Hooks       │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │    │
│  │  ┌────────────────────────────────────────────────────────┐ │    │
│  │  │          Next.js API Proxy Routes (app/api/v1/*)       │ │    │
│  │  │  Rate limit gate [NEW]   Sentry capture [NEW]          │ │    │
│  │  └────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                          HTTP/REST (Bearer JWT)                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │             Rust / Axum (packages/api-server)               │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  Tower middleware stack                              │   │    │
│  │  │  cors → logger → auth → [rate-limit NEW] → router   │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │  ┌───────────┐  ┌──────────────┐  ┌────────────────────┐    │    │
│  │  │  Domains  │  │   SeaORM     │  │  moka cache +      │    │    │
│  │  │  (router) │  │   (Postgres) │  │  Meilisearch       │    │    │
│  │  └───────────┘  └──────────────┘  └────────────────────┘    │    │
│  │                     gRPC                                     │    │
│  │  ┌────────────────────────────────────────────────────────┐  │    │
│  │  │         Python AI Server (packages/ai-server)          │  │    │
│  │  │  FastAPI + arq workers + LangGraph + Groq/Gemini       │  │    │
│  │  │  [Sentry Python SDK NEW]                               │  │    │
│  │  └────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Supabase (PostgreSQL + Auth + RLS)             │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

**[NEW]** markers indicate net-new components added by v10.0 tech debt work.

## Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Next.js pages + components | UI rendering, user interaction, design system | Orval hooks, Zustand stores |
| Next.js API proxy (app/api/v1/*) | CORS bridge, auth forwarding, rate-limit gate | Rust/Axum backend |
| Rust/Axum middleware stack | Auth, CORS, logging, (new) rate limiting, (new) Sentry | All domain handlers |
| Rust domain handlers | Business logic per domain (posts, users, spots…) | SeaORM, moka, Meilisearch |
| Python AI server | LLM orchestration, image analysis, magazine generation | Rust via gRPC |
| Supabase | Persistent storage, RLS, JWT auth | Next.js server-side, Rust |
| Playwright E2E suite | Full-stack flow verification | Next.js dev/preview URLs |

## Integration Points Per Tech Debt Item

### 1. Rate Limiting

**Primary enforcement layer: Rust/Axum middleware**

The existing middleware stack (`cors → logger → auth`) has no rate-limiting layer. The correct insertion point is after `auth` (so user identity is available for per-user limits) and before domain handlers.

```
Tower middleware stack (packages/api-server/src/middleware/):
  cors.rs  →  logger.rs  →  auth.rs  →  [rate_limit.rs NEW]  →  router handlers
```

- Crate: `tower_governor` (wraps `governor` leaky-bucket, integrates cleanly with Tower/Axum)
- Limit scoping: IP-based for public endpoints; user-ID-based for authenticated endpoints
- AI cost-critical endpoints requiring hard limits: `POST /api/v1/posts/analyze`, `POST /api/v1/posts/extract-metadata`, `POST /api/v1/posts/upload`
- Storage: In-process `dashmap` (already have `moka` in workspace, alternative). Redis is overkill for single-instance.
- Next.js proxy layer: Forward `429` responses with `Retry-After` header unmodified — do NOT re-throw as 500 (current bug pattern in proxy routes).

**Secondary soft-gate: Next.js proxy (app/api/v1/posts/analyze/route.ts)**

Optionally add a request-count check using a server-side in-memory counter per session cookie for defense-in-depth. This is not the authoritative limit — Rust holds truth.

**New files:**
- `packages/api-server/src/middleware/rate_limit.rs` (new)
- Update `packages/api-server/src/middleware/mod.rs` to export
- Update `packages/api-server/src/main.rs` middleware composition

### 2. Sentry Error Tracking

Three SDKs across three runtimes — each is independent and does not depend on others.

**Frontend (Next.js):**
- Package: `@sentry/nextjs`
- Entry points: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` (Next.js 16 convention)
- Auto-instruments: unhandled promise rejections, React error boundaries, fetch, Next.js route handlers
- Additional capture: React Error Boundary wrapping `ThiingsGrid`, `ImageDetailContent`, `SplineStudio` (high-risk components)
- Source maps: Sentry Webpack plugin uploads during `next build`
- User context: Set `Sentry.setUser({ id, email })` in `AuthProvider` on `SIGNED_IN`

**Backend (Rust/Axum):**
- Crate: `sentry` + `sentry-tower`
- Integration: Add `sentry::init()` in `main.rs`; `sentry_tower::NewSentryLayer` into Tower stack
- Captures: unhandled `AppError` variants; gRPC errors from Python AI server
- Performance: Sentry transaction tracing per request (optional, adds ~5% overhead — enable selectively)
- Config: `SENTRY_DSN` env var (server-only, never exposed to browser)

**Python AI server:**
- Package: `sentry-sdk[fastapi,arq]`
- Integration: `sentry_sdk.init()` in `src/app.py` + `src/bootstrap.py`
- Captures: LLM API failures (Groq, Gemini, OpenAI), arq worker exceptions, gRPC handler errors
- Breadcrumbs: Log LLM model, token counts as structured breadcrumb context

**Cross-service correlation:**
- Rust should forward a `Sentry-Trace` header to gRPC calls (or inject as gRPC metadata)
- Allows tracing a single user request across frontend → Rust → Python in Sentry UI

**New files:**
- `packages/web/sentry.client.config.ts` (new)
- `packages/web/sentry.server.config.ts` (new)
- Update `packages/web/next.config.js` to wrap with `withSentryConfig()`
- Update `packages/api-server/Cargo.toml` to add `sentry`, `sentry-tower`
- Update `packages/api-server/src/main.rs` Sentry init
- Update `packages/ai-server/pyproject.toml` to add `sentry-sdk[fastapi,arq]`

### 3. E2E Tests (Playwright)

Existing Playwright infrastructure already exists: 40 visual QA tests, 36 approved baselines, GitHub Actions CI. The v10.0 work **extends** this, it does not create new infrastructure.

**What exists:**
- `packages/web/playwright.config.ts` — configured
- Visual regression tests for 10 pages at 4 breakpoints

**What is needed: business-logic E2E flows (not visual)**

Critical paths to cover:

| Flow | Start | End | Key assertions |
|------|-------|-----|----------------|
| Auth (OAuth happy path) | Landing page | Authenticated state | authStore has user, header shows avatar |
| Post creation | Upload image | Post visible in feed | Post exists via API assertion |
| AI detection | Upload → analyze | Spots rendered on image | Spot coordinates visible, count > 0 |
| Image detail | Click image | Modal open + data loaded | Image title, spot count, share button |
| Search | Type query | Results rendered | Count > 0, first result relevant |
| Rate limit | Rapid AI requests | 429 response | UI shows "too many requests" message |

**Integration point:** Tests run against `next dev` (local) or a preview deployment URL. The AI detection flow requires the Rust backend + Python AI server to be running — use a `test:e2e` script that starts all services via Docker Compose.

**New files:**
- `packages/web/e2e/auth.spec.ts`
- `packages/web/e2e/post-creation.spec.ts`
- `packages/web/e2e/ai-detection.spec.ts`
- `packages/web/e2e/image-detail.spec.ts`
- `packages/web/e2e/search.spec.ts`
- `packages/web/e2e/rate-limit.spec.ts`

### 4. Component Refactoring

Not a new integration — modifies existing component files. Zero new infrastructure required.

**Target components and extraction strategy:**

| Component | Current LOC | Primary debt | Extraction target |
|-----------|------------|-------------|-------------------|
| `ThiingsGrid.tsx` | ~948 | Physics engine + rendering mixed | `useThiingsPhysics.ts` hook + `ThiingsCell.tsx` |
| `ImageDetailContent.tsx` | ~671 | Multi-section layout monolith | `ImageDetailHero.tsx`, `ImageDetailSpots.tsx`, `ImageDetailShop.tsx` |
| `ImageDetailModal.tsx` | ~637 | GSAP + state + layout mixed | `useModalGSAP.ts` hook, `ModalDrawer.tsx` |
| `DecodedLogo.tsx` | ~764 | Three.js + ASCII rendering | `useDecodedLogoWebGL.ts` + `DecodedLogoFallback.tsx` |

**Boundary rule:** Each extracted unit must be independently importable and testable. No circular imports back to parent.

**Integration risk:** These components are used on high-traffic pages (main, detail, images). Refactoring requires visual regression baseline re-approval in Playwright.

**Sequence within the phase:** Refactoring must happen before or in parallel with E2E tests — E2E tests should test the refactored components, not the monoliths.

### 5. Memory Leak Prevention

Scope: React component cleanup, ObjectURL lifecycle, GSAP context. All changes are within `packages/web`.

**Known leak sites (from CONCERNS.md):**

| Site | Leak type | Fix pattern |
|------|-----------|-------------|
| `requestStore.ts` `createPreviewUrl()` | `URL.createObjectURL` not always revoked | `useEffect(() => { return () => URL.revokeObjectURL(url) }, [url])` in consuming component |
| `ImageDetailModal.tsx` GSAP | Context created, cleanup conditional | `useGSAP()` hook from `@gsap/react` with `scope` parameter — auto-reverts on unmount |
| `DecodedLogo.tsx` Three.js | Canvas + renderer not disposed on unmount | `useEffect` cleanup: `renderer.dispose()`, `scene.clear()`, `canvas.remove()` |
| Event listeners (generic) | `addEventListener` without paired `removeEventListener` | `useEffect` cleanup always removes listener |

**Verification:** Chrome DevTools Memory profiler — take heap snapshot before/after navigation away from affected pages. ObjectURL count in blob registry should return to 0.

## Data Flow: Error and Metrics Propagation

```
User Action (Browser)
    |
React Component
    | throws / rejects
[Sentry client SDK] <-- captures automatically
    |
Next.js API Proxy (app/api/v1/*)
    | fetch to Rust
    | 429 Too Many Requests -----------------------> [UI shows Retry-After toast]
    | 500/503 error
[Sentry server SDK] <-- captures automatically
    |
Rust/Axum handler
    | AppError propagation via ?
[sentry-tower layer] <-- captures AppError::Internal
    | gRPC call
Python AI server
    | LLM timeout / API error
[sentry-sdk Python] <-- captures with LLM breadcrumbs
```

**Rate limit data flow:**

```
Request arrives at Rust
    |
[tower_governor middleware]
    | bucket has capacity --> proceed to handler
    | bucket exhausted --> return 429 { "error": "rate_limited", "retry_after": N }
Next.js proxy forwards 429 as-is (fix current swallow-to-500 behavior)
Browser receives 429 --> custom-instance.ts (Orval mutator) detects --> toast notification
```

## Recommended Build Order

Dependencies drive ordering:

```
1. Memory Leaks (no dependencies, isolated cleanup)
        |
2. Component Refactoring (structural prereq for clean E2E targets)
        |               parallel with
3.              Rate Limiting -- Rust layer (backend, independent of frontend)
        |
4. Sentry (frontend + backend + AI) (needs stable components to avoid noisy alerts)
        |
5. E2E Tests (tests all the above; must be last to assert full system behavior)
```

**Rationale:**

- Memory leaks first: smallest scope, no regressions, immediate production benefit.
- Refactoring before Sentry: Sentry error grouping works better with clean component names. Monolith components generate confusing stack traces.
- Rate limiting before Sentry backend: Tower middleware insertion order matters. Rate limit → Sentry layer ordering ensures rate-limit 429s are not reported as errors.
- Sentry before E2E: E2E tests can verify Sentry captures work (assert no errors fired during happy-path flows).
- E2E last: Integration test of the complete system. Must pass with all other items done.

## Architectural Patterns to Follow

### Pattern 1: Tower Middleware Insertion (Rust)

**What:** New middleware (rate limit, Sentry) slots into the existing Tower service builder without touching domain handlers.

**When to use:** Any cross-cutting concern in the Rust backend.

**Trade-offs:** Tower layer ordering is strict and matters for correctness. Sentry must be outermost to capture all errors including those from inner layers.

**Example:**
```rust
let app = Router::new()
    .nest("/api/v1", build_api_router(state.clone()))
    .layer(sentry_tower::NewSentryLayer::new_from_top())  // outermost
    .layer(create_rate_limit_layer(&config))              // after sentry
    .layer(create_cors_layer(&config.allowed_origins))
    .layer(request_logger_middleware)
    .with_state(state);
```

### Pattern 2: Next.js Proxy 429 Passthrough

**What:** Currently proxy routes catch all errors and return 500. Rate-limit 429 responses from Rust must be forwarded with correct status and `Retry-After` header.

**When to use:** All proxy routes calling AI or rate-limited endpoints.

**Trade-offs:** Requires touching ~5 proxy route files. Low-risk change — just stop overwriting the status code.

```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/posts/analyze`, ...);
if (!response.ok) {
  return new Response(response.body, {
    status: response.status,  // preserve 429, not hardcode 500
    headers: {
      'Content-Type': 'application/json',
      ...(response.headers.get('Retry-After')
        ? { 'Retry-After': response.headers.get('Retry-After')! }
        : {}),
    },
  });
}
```

### Pattern 3: useGSAP for Animation Cleanup

**What:** Replace raw `useEffect` + `gsap.context()` with `@gsap/react`'s `useGSAP` hook which auto-handles context revert on unmount.

**When to use:** All GSAP animations in components, especially in components that mount/unmount (modals, drawers).

**Trade-offs:** `useGSAP` is the official GSAP React integration — no external dep addition needed, already in package.json.

```typescript
import { useGSAP } from "@gsap/react";

// OLD (leaks on rapid mount/unmount):
useEffect(() => {
  const ctx = gsap.context(() => { ... }, containerRef);
  return () => ctx.revert();
}, []);

// NEW (safe, auto-reverts):
useGSAP(() => {
  gsap.from(containerRef.current, { opacity: 0 });
}, { scope: containerRef, dependencies: [] });
```

### Pattern 4: Sentry User Context Binding

**What:** Bind authenticated user to Sentry scope once, in `AuthProvider`, so all subsequent errors carry user identity.

**When to use:** Once in `AuthProvider.tsx`, not scattered across individual components.

**Trade-offs:** None. Centralizing avoids duplicate setUser calls and race conditions.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Rate Limiting Only at the Next.js Proxy Layer

**What people do:** Add rate limiting in Next.js API routes only (easier, TypeScript).

**Why it's wrong:** The Rust backend is directly accessible by bypassing the Next.js proxy (direct API calls from curl, mobile app, or other services). The Next.js layer is a soft gate only.

**Do this instead:** Enforce at the Rust middleware layer. Next.js can add a soft advisory check.

### Anti-Pattern 2: Sentry Capturing Expected Business Errors

**What people do:** Let all `AppError` variants reach Sentry, including 404 Not Found and 401 Unauthorized.

**Why it's wrong:** Floods Sentry with noise, obscures real errors, burns through Sentry quota.

**Do this instead:** Only capture `AppError::Internal` and `AppError::ExternalService` in Sentry. Filter 4xx client errors with `before_send` callback.

### Anti-Pattern 3: Component Refactoring Without Visual Baseline Update

**What people do:** Refactor `ThiingsGrid` or `ImageDetailModal`, then run Playwright visual tests which fail because the component renders differently.

**Why it's wrong:** False negatives block CI; team ignores visual failures.

**Do this instead:** After refactoring each component, explicitly re-approve visual baselines for affected pages before merging.

### Anti-Pattern 4: ObjectURL Revoke Only in Zustand Store

**What people do:** Revoke ObjectURLs inside Zustand store actions (`clearImages`).

**Why it's wrong:** If a component unmounts before `clearImages` is called (navigation, error boundary), the URL leaks. Store actions are not lifecycle-aware.

**Do this instead:** Revoke in `useEffect` cleanup of the component that consumes the URL. Store may also call revoke as belt-and-suspenders, but component cleanup is authoritative.

## New vs. Modified Components Summary

| Item | New | Modified |
|------|-----|----------|
| `packages/api-server/src/middleware/rate_limit.rs` | NEW | — |
| `packages/api-server/src/middleware/mod.rs` | — | MODIFIED (export rate_limit) |
| `packages/api-server/src/main.rs` | — | MODIFIED (middleware stack + Sentry init) |
| `packages/api-server/Cargo.toml` | — | MODIFIED (tower_governor, sentry deps) |
| `packages/web/sentry.client.config.ts` | NEW | — |
| `packages/web/sentry.server.config.ts` | NEW | — |
| `packages/web/next.config.js` | — | MODIFIED (withSentryConfig wrapper) |
| `packages/web/lib/components/auth/AuthProvider.tsx` | — | MODIFIED (Sentry.setUser) |
| `packages/web/app/api/v1/posts/analyze/route.ts` | — | MODIFIED (429 passthrough) |
| `packages/ai-server/pyproject.toml` | — | MODIFIED (sentry-sdk) |
| `packages/ai-server/src/app.py` / `bootstrap.py` | — | MODIFIED (sentry init) |
| `packages/web/e2e/*.spec.ts` | NEW (6 files) | — |
| `packages/web/lib/components/ThiingsGrid.tsx` | — | MODIFIED (extract hooks) |
| `packages/web/lib/components/detail/ImageDetailContent.tsx` | — | MODIFIED (split sections) |
| `packages/web/lib/components/detail/ImageDetailModal.tsx` | — | MODIFIED (useGSAP) |
| `packages/web/lib/stores/requestStore.ts` | — | MODIFIED (ObjectURL lifecycle) |

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Sentry (Next.js) | `@sentry/nextjs` SDK + `withSentryConfig` | Source maps via Sentry Webpack plugin in CI build |
| Sentry (Rust) | `sentry` + `sentry-tower` Tower layer | DSN via `SENTRY_DSN` env var, server-only |
| Sentry (Python) | `sentry-sdk[fastapi,arq]` | Captures arq background worker failures too |
| tower_governor | Tower layer in Rust middleware stack | Per-IP + per-user limits, in-process dashmap storage |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Next.js proxy → Rust | HTTP/REST via proxy routes | 429 must be forwarded, not swallowed as 500 |
| Rust → Python AI | gRPC (proto in `packages/api-server/proto/`) | Errors captured by both Sentry SDKs; trace header forwarded |
| Component → Store | Zustand subscription | ObjectURL revoke must happen in component, not only in store |
| E2E tests → Full stack | HTTP against running dev/preview server | Full stack (Docker Compose) required for AI detection tests |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (< 1k users) | In-process dashmap rate limit sufficient; single Sentry project for all services |
| 1k–10k users | Redis-backed rate limiting (tower_governor supports this); separate Sentry projects per service for cleaner alerting |
| 10k+ users | Distributed rate limiting at edge (Cloudflare Workers); Sentry performance monitoring for bottleneck identification |

## Sources

- Direct codebase analysis: `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, `INTEGRATIONS.md`, `STACK.md`
- `packages/api-server/src/middleware/mod.rs` — existing middleware structure confirmed
- `packages/api-server/Cargo.toml` — workspace deps confirmed (no rate-limit or sentry crates present)
- `packages/ai-server/pyproject.toml` — Python deps confirmed (no sentry-sdk present)
- `packages/web/app/api/v1/` — proxy route inventory (41 route files inspected)
- Confidence: HIGH — all claims derived from direct file inspection

---

*Architecture research for: v10.0 Tech Debt Resolution — decoded-monorepo*
*Researched: 2026-03-26*
