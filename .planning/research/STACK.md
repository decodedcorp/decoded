# Stack Research

**Domain:** Production Stability & Tech Debt — Rate Limiting, Error Tracking, E2E Testing, Component Refactoring, Memory Leak Prevention
**Project:** decoded-monorepo v10.0
**Researched:** 2026-03-26
**Confidence:** HIGH for Sentry and Playwright additions; MEDIUM for Rust rate limiting version pinning

---

## Context: Existing Stack — Do Not Re-Research

All of these are installed and validated. Zero changes required:

| Package | Version | Status |
|---------|---------|--------|
| Next.js | 16.2.1 | Stays |
| React | 19 | Stays |
| TypeScript | 5.9.3 | Stays |
| @tanstack/react-query | 5.90.11 | Stays |
| Playwright | 1.58.1 | Stays — extends with new test patterns |
| bun | 1.3.10+ | Stays |
| Turborepo | (in use) | Stays |
| Axum | 0.8.8 | Stays — add rate limiting middleware |
| tower | 0.5 | Stays — tower-governor built on this |
| tracing / tracing-subscriber | 0.1 / 0.3 | Stays — Sentry Rust integrates via tracing |

---

## New Stack: What to Add

### 1. Rate Limiting

#### Next.js Layer (proxy routes protection)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| No new library needed | — | IP-based rate limiting in Next.js `app/api/v1/posts/analyze` and `/posts/upload` proxy routes | These routes are server-side Next.js Route Handlers; use a simple in-memory Map with timestamp buckets. No Redis dependency for this milestone — the AI API endpoints are the only high-cost targets, and in-memory limiting is sufficient for a single-process Vercel deployment. Introduce `@upstash/ratelimit` only if multi-region or multi-process deployment is required. |

**Decision:** Implement rate limiting directly in the Next.js proxy route handlers using a module-level `Map<string, number[]>` sliding window. This adds zero dependencies and is testable without external infrastructure. The Axum layer (below) handles the authoritative enforcement.

#### Axum Layer (backend enforcement — the real guard)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| tower-governor | 0.8.0 | Per-IP rate limiting Tower middleware for Axum | The standard rate limiting crate for the Tower/Axum ecosystem. Built on the `governor` crate (token bucket/GCRA algorithm). Supports `PeerIpKeyExtractor`, `SmartIpKeyExtractor` (proxy-header-aware), and `GlobalKeyExtractor`. Zero additional runtime deps beyond `governor` itself. v0.8.0 is current stable as of March 2026. |

Add to `packages/api-server/Cargo.toml` workspace dependencies:
```toml
tower-governor = { version = "0.8", features = ["axum"] }
```

**Key extractors to use:**
- `SmartIpKeyExtractor` on AI endpoints — reads `X-Forwarded-For` (Cloudflare/proxy-aware)
- `GlobalKeyExtractor` not recommended — would rate-limit all users together

---

### 2. Sentry Error Tracking

#### Frontend (Next.js)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @sentry/nextjs | ^10.45.0 | Error capture, performance tracing, session replay for Next.js App Router | Latest major (v10) as of March 2026. Supports Next.js 13.2+, 14, 15, and 16. Has dedicated App Router support via `instrumentation.ts`. The wizard (`npx @sentry/wizard@latest -i nextjs`) generates all required config files automatically. v8→v9→v10 migration guides exist — no blockers for a fresh install. |

**Setup pattern:** `npx @sentry/wizard@latest -i nextjs` generates:
- `instrumentation-client.ts` — browser-side SDK init
- `sentry.server.config.ts` — Node.js server-side init
- `sentry.edge.config.ts` — Edge runtime init
- `app/global-error.tsx` — React error boundary
- Wraps `next.config.js` with `withSentryConfig`

**What NOT to configure on first install:** Session Replay and Profiling — enable only after confirming baseline error capture works. Both increase bundle size.

#### Backend (Axum / Rust)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| sentry | 0.46.2 | Error capture and performance tracing for Rust/Axum | Official Sentry Rust SDK. The `tower-axum-matched-path` feature adds per-route transaction naming — critical for identifying which endpoint caused errors. Integrates with the existing `tracing`/`tracing-subscriber` stack already in the project via `sentry-tracing`. Version 0.46.2 is the current stable. |

Add to `packages/api-server/Cargo.toml`:
```toml
sentry = { version = "0.46", features = ["tower-axum-matched-path", "tracing"] }
sentry-tracing = "0.46"
```

**Integration point:** Add `sentry_tower::SentryLayer` to the Axum router's existing Tower middleware stack. The `tracing` integration means existing `tracing::error!()` / `tracing::warn!()` calls automatically flow into Sentry with no code changes beyond init.

#### AI Server (Python / FastAPI)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| sentry-sdk[fastapi] | ^2.0 | Error capture for Python FastAPI gRPC server | The `[fastapi]` extra installs the ASGI middleware automatically. FastAPI is already in use (`fastapi>=0.115.11`). Init in the FastAPI app startup with `sentry_sdk.init()`. Minimal config — DSN from environment variable. |

Add to `packages/ai-server/pyproject.toml`:
```toml
sentry-sdk = { version = ">=2.0,<3.0", extras = ["fastapi"] }
```

---

### 3. E2E Testing (Playwright Extension)

Playwright 1.58.1 is already installed. The existing `playwright.config.ts` covers visual QA only. v10.0 adds **business logic E2E** — a separate test tier.

No new packages required. What changes:

| Pattern | Current State | v10.0 Addition |
|---------|--------------|----------------|
| Test scope | Visual QA (`tests/visual-qa.spec.ts`) | Add `tests/e2e/` directory for flow tests |
| Auth strategy | Not addressed | `storageState` fixture — login once per worker, reuse session across tests |
| Test organization | Single spec file | Page Object Model (`tests/e2e/pages/`, `tests/e2e/fixtures/`) |
| webServer command | `yarn dev` (stale — project migrated to bun) | `bun dev` |

#### Playwright Config Additions

```typescript
// playwright.config.ts additions for E2E tier
projects: [
  // Existing visual QA project stays
  { name: "chromium-visual", testMatch: /visual-qa\.spec\.ts/, ... },

  // New: auth setup (runs once before e2e tests)
  { name: "auth-setup", testMatch: /auth\.setup\.ts/ },

  // New: E2E business logic tests
  {
    name: "e2e",
    testMatch: /tests\/e2e\/.*\.spec\.ts/,
    dependencies: ["auth-setup"],
    use: { storageState: "playwright/.auth/user.json" },
  },
],
```

**Why storageState over logging in each test:** Each Supabase OAuth login takes 5-15 seconds. With 20+ E2E tests, reusing auth state saves 5-10 minutes of CI time per run. The `.auth/user.json` file must be in `.gitignore`.

#### Priority flows to cover (no new packages needed):

1. Post creation flow — image upload → AI analysis → spot annotation → submit
2. Item discovery flow — search → filter → item detail
3. Auth gate — unauthenticated redirect to login

---

### 4. Component Refactoring Tooling

No new packages required. The existing TypeScript strict mode + ESLint catches the patterns that cause 600+ line component files. The work is structural, not tooling.

**Patterns to enforce in ESLint (already installed):**

Use the existing `eslint-plugin-react` rules already in `eslint.config.mjs` — no new plugins:

| Rule | What it catches |
|------|-----------------|
| `react/no-multi-comp` | Multiple component definitions in one file — enforce one component per file |
| `max-lines` (ESLint core) | Flag files over 300 lines — forces splits |
| `react-hooks/exhaustive-deps` | Already enabled — catches missing cleanup deps |

**For ThiingsGrid and ImageDetailContent refactoring:** The split strategy is extraction into co-located sub-component files, not a new tooling dependency. TypeScript's existing strict null checks and `import` boundary enforcement are sufficient guardrails.

---

### 5. Memory Leak Detection

No new runtime packages required. Use existing tooling:

| Tool | What it catches | Status |
|------|----------------|--------|
| Chrome DevTools Memory panel | ObjectURL not revoked, detached DOM nodes | Built into browser — no install |
| React DevTools Profiler | Component mount/unmount cycles, effect leaks | Already usable |
| Playwright `page.coverage` | Which code paths execute — indirect leak surface mapping | Built into Playwright 1.58.1 |

**Code patterns to enforce (no new deps):**

```typescript
// ObjectURL cleanup pattern — enforced via code review + ESLint
const url = URL.createObjectURL(file);
// ... use url ...
return () => URL.revokeObjectURL(url); // In useEffect cleanup

// AbortController pattern for fetch cleanup
const controller = new AbortController();
fetch(url, { signal: controller.signal });
return () => controller.abort();

// Event listener cleanup
window.addEventListener('resize', handler);
return () => window.removeEventListener('resize', handler);
```

**Optional (only if memory leaks prove hard to track down):** `why-did-you-render` (2.0.x) — a dev-only overlay that logs unnecessary React re-renders. Not required for v10.0 unless profiling reveals unexpected re-render patterns.

---

## Installation Summary

### Next.js (packages/web)

```bash
cd packages/web

# Sentry Next.js — use wizard for config file generation
bunx @sentry/wizard@latest -i nextjs

# Or install manually
bun add @sentry/nextjs
```

### Rust (packages/api-server/Cargo.toml)

Add to `[workspace.dependencies]`:
```toml
tower-governor = { version = "0.8", features = ["axum"] }
sentry = { version = "0.46", features = ["tower-axum-matched-path", "tracing"] }
sentry-tracing = "0.46"
```

Then reference in `packages/api-server/Cargo.toml` `[dependencies]`:
```toml
tower-governor = { workspace = true }
sentry = { workspace = true }
sentry-tracing = { workspace = true }
```

### Python (packages/ai-server/pyproject.toml)

```toml
# Add to [project] dependencies
"sentry-sdk[fastapi]>=2.0,<3.0",
```

### Environment Variables to Add

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | `packages/web/.env.local` | Frontend Sentry DSN |
| `SENTRY_DSN` | `packages/api-server/.env` | Rust backend Sentry DSN |
| `SENTRY_DSN` | `packages/ai-server/.env` | Python AI server Sentry DSN |
| `SENTRY_AUTH_TOKEN` | CI environment + `.env.local` | Source map upload (build-time only) |
| `SENTRY_ORG` | CI environment | Sentry organization slug |
| `SENTRY_PROJECT` | CI environment | Sentry project slug |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| tower-governor 0.8 (Rust) | axum-governor (canmi21) | axum-governor is an independent reimplementation — smaller community, less battle-tested than tower-governor which directly wraps the `governor` crate. Use only if tower-governor's API doesn't fit. |
| In-memory sliding window (Next.js proxy) | @upstash/ratelimit + Redis | Use Upstash if deploying to multi-region Vercel Edge, or if multiple web server instances run in parallel. Single-process deployment does not need Redis for this scope. |
| @sentry/nextjs wizard setup | Manual sentry init | Wizard generates correct App Router files. Manual setup risks missing `instrumentation.ts` registration or wrong `withSentryConfig` wrapping. Only skip wizard if wizard is broken for Next.js 16. |
| storageState auth fixture (Playwright) | Per-test login via API call | API login is faster to write but creates Supabase rate limiting risk in CI; storageState logs in once per worker and is the Playwright-recommended pattern. |
| sentry-sdk[fastapi] (Python) | Rollbar, Bugsnag for Python | Sentry is already chosen for the other two services; unified DSN dashboard across all three services is worth the lock-in. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @upstash/ratelimit (for this milestone) | Requires Redis provisioning (Upstash account, env vars, cold start risk on Edge). Over-engineered for single-region API proxy protection at v10.0 scope. | In-memory sliding window in Next.js Route Handlers + tower-governor in Axum |
| New ESLint plugins for component size | `eslint-plugin-max-params`, `eslint-plugin-filelines`, etc. are unmaintained and add fragile toolchain deps. | Use ESLint core `max-lines` rule + TypeScript strict mode that already exists |
| `why-did-you-render` as a required dep | It is a dev debug tool, not a systematic fix. Memory leaks are fixed in code, not detected by overlay. | Fix cleanup patterns directly; add to devDeps only if re-render debugging is explicitly needed |
| `react-scan` or similar bundle analyzers | Out of scope for v10.0 — this milestone is stability, not performance optimization. | Defer to a dedicated perf milestone |
| Sentry Session Replay on install | Increases JS bundle by ~50KB. Enable only after confirming error capture baseline. | Configure in `_experiments` and toggle via environment feature flag |
| sentry-tracing standalone (npm) | Deprecated — absorbed into `@sentry/nextjs` v8+. Installing separately causes SDK conflicts. | The wizard handles this correctly; `@sentry/nextjs` already bundles tracing. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @sentry/nextjs@^10.45 | Next.js@^16.2 | Verified — Sentry CI tests against Next.js 16; wizard handles version detection |
| @sentry/nextjs@^10.45 | React@19 | Compatible — React 19 App Router instrumentation supported in v10 |
| sentry@0.46 (Rust) | axum@0.8.8 | Verified — `tower-axum-matched-path` feature targets Axum 0.8.x |
| sentry@0.46 (Rust) | tracing@0.1 | Compatible — `sentry-tracing` integrates with `tracing` 0.1 subscriber |
| tower-governor@0.8 | axum@0.8 | Compatible — tower-governor 0.8 targets tower 0.5 which axum 0.8 uses |
| sentry-sdk@^2.0 (Python) | fastapi@0.115 | Compatible — `[fastapi]` extra adds ASGI middleware; supports FastAPI 0.100+ |
| @playwright/test@^1.58.1 | storageState pattern | storageState is a stable Playwright API since v1.17; no version constraint |

---

## Sources

- https://www.npmjs.com/package/@sentry/nextjs — Version 10.45.0 confirmed as latest (March 26, 2026) (HIGH confidence — npm registry)
- https://docs.sentry.io/platforms/javascript/guides/nextjs/ — Next.js App Router setup via wizard; `instrumentation.ts` pattern (HIGH confidence — official Sentry docs)
- https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v9-to-v10/ — v9-to-v10 migration guide confirms no breaking changes for fresh installs (HIGH confidence — official docs)
- https://docs.sentry.io/platforms/rust/guides/axum/ — Rust/Axum integration; `tower-axum-matched-path` feature; sentry 0.46.2 (HIGH confidence — official Sentry docs)
- https://docs.rs/tower_governor/latest/tower_governor/ — tower-governor 0.8.0; SmartIpKeyExtractor, PeerIpKeyExtractor, GlobalKeyExtractor (HIGH confidence — official Rust docs)
- https://github.com/benwis/tower-governor — tower-governor maintained; version 0.8.0 confirmed (HIGH confidence — official GitHub)
- https://playwright.dev/docs/auth — storageState pattern; auth-setup project dependency pattern (HIGH confidence — official Playwright docs)
- https://upstash.com/blog/nextjs-ratelimiting — Upstash ratelimit for Next.js; useful for multi-region but overkill for single-process (MEDIUM confidence — vendor docs, informative for decision)
- https://github.com/getsentry/sentry-rust/releases — sentry-rust 0.46.2 latest release (HIGH confidence — official GitHub releases)

---

*Stack research for: decoded-monorepo v10.0 Tech Debt Resolution*
*Researched: 2026-03-26*
