# Feature Research

**Domain:** Tech debt resolution — production stability for a Next.js 16 + Rust/Axum + Python AI monorepo
**Researched:** 2026-03-26
**Confidence:** HIGH (codebase audit completed, CONCERNS.md sourced, patterns verified against known production standards)

## Context: What This Milestone Resolves

The decoded-monorepo has shipped through v9.0 with a well-structured multi-service architecture
(Next.js 16, Rust/Axum, Python gRPC AI). The codebase audit in `.planning/codebase/CONCERNS.md`
identified concrete gaps between the current state and production readiness. This milestone targets
those gaps — not new features, but stability, observability, and correctness.

**Five concern areas from the audit:**

1. **Rate limiting** — `POST /api/v1/posts/analyze` is unauthenticated and unprotected
2. **Error tracking** — errors only reach console; no production visibility
3. **E2E testing** — Playwright is installed but zero test files exist
4. **Component refactoring** — 4 files exceed 600 LOC with tightly coupled animation + state
5. **Memory leak prevention** — `URL.createObjectURL` leaks, GSAP context not guaranteed to clean up

---

## Feature Landscape

### Table Stakes (Must Have for Production Readiness)

Features required before any production traffic is acceptable. Missing these means the app cannot
be safely operated.

| Feature | Why Required | Complexity | Notes |
|---------|--------------|------------|-------|
| **Rate limiting on analyze endpoint** | `POST /api/v1/posts/analyze` is unauthenticated. Repeated calls drain AI backend costs with no defense. One abusive client can render the service unavailable. | MEDIUM | Implement at the Next.js route handler layer using an in-memory or Redis-backed window. The Rust backend has `moka` in-memory cache already; preferred location is Next.js middleware so it runs before the proxy. Use Upstash Ratelimit (`@upstash/ratelimit`) on Vercel or a sliding window with `lru-cache` if self-hosted. |
| **Structured error handling in API proxy** | All `/app/api/v1/**` route handlers currently swallow backend errors and return generic 500. Validation errors (422), auth errors (401), and rate limit responses (429) from the Rust backend are invisible to the client. | MEDIUM | Create a shared `proxyHandler` utility that reads `response.status` and `response.json()` from the upstream Rust API, then re-emits the same status + body to the browser. Eliminates the need to debug two layers for every error. See `CONCERNS.md` §3. |
| **Remove debug logging from production paths** | `ImageDetailModal.tsx` logs `imageId`, `image`, and `error` in a `useEffect` with no `NODE_ENV` guard. Auth store and proxy routes log full error objects. In-browser visibility of session state and backend URLs is a security concern. | LOW | Wrap all `console.log` calls in `if (process.env.NODE_ENV === 'development')`. For API routes, replace `console.error(error)` with `console.error(error.message)` at minimum. Next.js strips `development`-only branches during production build. |
| **Environment variable validation at startup** | Two env var names exist for the same backend URL (`API_BASE_URL` server-side, `NEXT_PUBLIC_API_BASE_URL` client-side). Missing values fail silently (default empty string). One misconfigured deployment produces hard-to-diagnose failures. | LOW | Create `packages/web/lib/config/env.ts` that throws at module load time if required server-side vars are absent. `NEXT_PUBLIC_*` vars cannot be validated at runtime on the server side, but a startup check in the custom server or a Next.js instrumentation hook (`instrumentation.ts`) covers server vars. |
| **Memory leak prevention: URL.createObjectURL** | `requestStore.ts` creates preview URLs via `URL.createObjectURL()` but relies on the caller invoking `clearImages()`. If the user navigates away mid-upload, error paths skip the `revoke()` call, leaking memory. On low-RAM devices this causes tab crashes over extended sessions. | MEDIUM | Wrap `createObjectURL` in a `useEffect` cleanup inside the component that creates the preview. The store should own tracking only (Set of active URLs); the React component guarantees revoke via `return () => URL.revokeObjectURL(url)` in the useEffect. Add a `beforeunload` listener as a final safety net. See `CONCERNS.md` §Fragile Area 2. |
| **GSAP context cleanup in modal** | `ImageDetailModal.tsx` creates a GSAP context in `useEffect` but cleanup is not guaranteed if the component unmounts during animation. Rapid open/close cycles produce conflicting animation states. | MEDIUM | Replace ad hoc `gsap.context()` in `useEffect` with `useGSAP()` from `@gsap/react`. The hook handles context creation and `revert()` on unmount automatically. Kill tweens on unmount via `context.revert()` in the cleanup return. See `CONCERNS.md` §Fragile Area 3. |

---

### Differentiators (Advanced Observability and Quality)

Features that raise operational quality above baseline. Not required for day-one production, but
critical for sustainable operation beyond the first few weeks of real traffic.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Sentry error tracking (frontend)** | Currently errors only appear in browser console — invisible to the team once the user closes the tab. Sentry captures exceptions with stack traces, user context, and release version. Enables error trend detection and regression alerts. | MEDIUM | `@sentry/nextjs` wraps Next.js App Router with zero-config error boundaries. Initialize in `instrumentation.ts` for server-side, `sentry.client.config.ts` for browser. Enable `tracesSampleRate: 0.1` for performance tracing. Scrub PII (user email, tokens) via `beforeSend`. |
| **Sentry error tracking (Rust API)** | The Rust/Axum backend has `tracing` + `tracing-subscriber` configured but no external sink. Errors are visible in server logs only when someone is watching. Production incidents cause silent data corruption or timeouts without alerting. | MEDIUM | Add `sentry` crate (`0.34+`) to `packages/api-server/Cargo.toml`. Initialize in `main.rs` before Axum starts. Use `sentry-tower` middleware to attach trace context to HTTP requests. Captures panics, `tracing::error!` events, and unhandled Axum errors. |
| **Web Vitals monitoring** | Next.js 16 exposes Core Web Vitals (LCP, FID, CLS) via `reportWebVitals`. Without capturing these, performance regressions from new animation or bundle additions go undetected until user complaints. | LOW | Implement `packages/web/app/reportWebVitals.ts`. Send to Sentry performance or a custom analytics endpoint. LCP target: <2.5s. CLS target: <0.1. The GSAP + Lenis + Spline stack makes CLS monitoring especially important. |
| **E2E test coverage for critical user paths** | Playwright is installed at v1.58 but no test files exist. PRs that break auth, upload, or image detail have no automated catch. Zero tests means every regression is caught by a human in review. | HIGH | Write tests covering: (1) auth flow (OAuth redirect → session cookie), (2) image upload → analysis → result display, (3) post detail modal open/close/escape. These three flows cover the highest-impact user paths. See `CONCERNS.md` §Testing Gaps for all 6 untested critical paths. |
| **Vitest unit tests for stores and utilities** | `requestStore.ts` (433 lines, 4-step state machine) has no tests. Invalid step transitions are only caught manually. `authStore` OAuth flow has no coverage. Type conversion utilities (`apiToStoreCoord`) have no edge case tests. | HIGH | Write tests for: `requestStore` step transition guards, `authStore` session init and error recovery, `apiToStoreCoord` edge cases (0%, 100%, decimal precision). Vitest 4.1 is installed; add `packages/web/__tests__/` directory. Mock Supabase with `vi.mock('@supabase/supabase-js')`. |
| **Component refactor: ThiingsGrid extraction** | `ThiingsGrid.tsx` (948 lines) embeds a custom physics engine (velocity, friction, grid cell management) inside the React component. Changes to either physics or rendering require understanding both simultaneously. High regression risk. | HIGH | Extract physics engine to `lib/utils/thiingsGridPhysics.ts` (pure class, no React imports). Component becomes a thin layer that calls physics utilities. Enables unit testing physics logic independently. See `CONCERNS.md` §Tech Debt 1. |
| **Component refactor: ImageDetailModal animation extraction** | `ImageDetailModal.tsx` (637 lines) mixes GSAP timeline orchestration, drawer state machine, scroll forwarding, and JSX rendering. The GSAP context issue and scroll forwarding bug (`CONCERNS.md` §Fragile Area 3+4) are symptoms of this entanglement. | HIGH | Extract animation logic to `useDrawerAnimation(ref, isOpen)` custom hook. Extract drawer state transitions to `useDrawerState()`. The main component file drops to <200 lines of JSX + props. Fixes the GSAP cleanup issue as a side effect. |
| **Bundle size monitoring in CI** | Three.js (`DecodedLogo.tsx`), GSAP, full lucide-react, and react-icons are loaded without tree-shaking verification or CI guards. No visibility into regressions as new dependencies are added. | MEDIUM | Add `size-limit` as a dev dependency. Configure thresholds in `.size-limit.json` (e.g., main bundle < 500KB gzipped). Add `bun run size` to CI after build. Configure lazy loading for `DecodedLogo` (`next/dynamic` with `ssr: false`). |
| **WebGL fallback for DecodedLogo** | `DecodedLogo.tsx` uses Three.js with WebGL. In-app browsers (Instagram, KakaoTalk, LINE) frequently disable WebGL. No capability detection means the logo silently fails to render for a portion of Korean social app users — the primary target demographic. | MEDIUM | Add `canvas.getContext('webgl')` detection. Wrap in `<ErrorBoundary>` to catch Three.js initialization errors. Provide an SVG or static image `<img>` fallback that renders when WebGL is unavailable. |

---

### Anti-Features (Do Not Build at This Stage)

Features that seem appropriate for a tech debt milestone but create more problems than they solve.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **XState for RequestStore state machine** | `requestStore.ts` has invalid state transition risk. XState would formalize the 4-step flow with explicit guards. | XState adds ~23KB to bundle, requires learning a new paradigm, and the current store's issues are fixable with input validation guards in Zustand without a full state machine library. Converting mid-milestone introduces high regression risk. | Add Zod validation at each `setStep()` call in the existing Zustand store. Guard `startDetection()` to require step 1 complete. Guard `setRevealReady()` to require step 2 complete. Same correctness, zero new dependency. |
| **Immer middleware for Zustand** | `requestStore.ts` mutation risk (spots mutated after `setDetectedSpots`). Immer would enforce immutability. | Immer adds bundle weight and changes how all store updates are written. The actual risk is one function without deep clone. Over-engineering for an isolated issue. | Add `structuredClone(spots)` in `setDetectedSpots()` and add `Readonly<DetectedSpot[]>` to the type signature. Resolves the specific issue without middleware migration. |
| **Full CI/CD pipeline with deploy automation** | The codebase lacks a CI/CD pipeline entirely. Seems adjacent to tech debt. | Deploy automation involves infrastructure decisions (Vercel vs self-hosted), secret management, and environment promotion that are out of scope for a stability milestone. Rushing this creates security gaps. | Scope CI to build + lint + typecheck + test only. Gate PR merges on passing CI. Deploy automation is a separate infrastructure milestone. |
| **Sentry Session Replay** | Session Replay provides video-like reproduction of user issues. Sounds valuable. | Session Replay captures DOM content including potentially sensitive K-pop/fashion content and user-generated data. PII scrubbing is non-trivial. Adds ~25KB to the bundle. The decoded app's primary issue is unreported errors, not reproduction difficulty. | Enable Sentry error tracking first. Add breadcrumbs and user context tags. Only consider Session Replay after error volume is characterized and a specific reproduction gap is identified. |
| **LogRocket or FullStory as Sentry alternative** | More product analytics features. | LogRocket and FullStory are session recording tools with error monitoring as a secondary feature. Sentry is purpose-built for error tracking and has a free tier suitable for current scale. Adding a product analytics tool at tech debt stage conflates error observability with product analytics. | Use Sentry for errors + performance. Use dedicated product analytics (PostHog, Mixpanel) as a separate initiative when product-market fit decisions require behavioral data. |
| **Replacing Playwright with Cypress** | Some developers prefer Cypress DX. | Playwright 1.58 is already installed and configured. The project already has 40 visual QA tests written for Playwright. Migrating to Cypress would throw away existing infrastructure and tests for subjective DX preference. | Write the E2E tests in Playwright, the installed framework. Add a `playwright.config.ts` that covers the critical paths before expanding scope. |
| **Full component storybook** | Isolated component development and documentation. | Storybook setup requires significant configuration for Next.js App Router and GSAP animation dependencies. It is not a prerequisite for the refactoring work. The existing 45-component design system has its own Visual QA suite. | Write Vitest tests for logic extracted from components during refactoring. Storybook is a documentation tool; address it as a dedicated documentation milestone after the design system stabilizes further. |

---

## Feature Dependencies

```
[Environment Variable Validation]
    └──required-before──> [Rate Limiting] (rate limiter config reads env vars)
    └──required-before──> [Sentry Setup] (DSN is an env var)

[Remove Debug Logging]
    └──required-before──> [Sentry Setup]
    (Sentry captures console.error calls; unguarded debug logs create noise in Sentry)

[Structured Error Handling in Proxy]
    └──required-before──> [Sentry Frontend Error Tracking]
    (errors swallowed at proxy level never surface to Sentry)

[GSAP Cleanup Fix (useGSAP migration)]
    └──required-before──> [ImageDetailModal Refactor]
    (extraction of animation hook only makes sense after cleanup semantics are correct)

[Memory Leak Fix: URL.createObjectURL]
    └──independent──> [all other features]

[Rate Limiting on analyze endpoint]
    └──enhances──> [Structured Error Handling] (429 must propagate correctly)

[Vitest Unit Tests: requestStore]
    └──required-before──> [RequestStore State Machine Guards]
    (tests verify the guards work after implementation)

[E2E Tests: upload flow]
    └──required-after──> [Memory Leak Fix]
    (upload E2E exercises the exact code path with URL.createObjectURL)

[Component Refactor: ThiingsGrid]
    └──enables──> [Vitest Unit Tests: physics engine]
    (pure utility class is testable; React component is not)

[Component Refactor: ImageDetailModal]
    └──requires──> [GSAP Cleanup Fix]
    └──enables──> [Vitest Unit Tests: drawer state]

[Bundle Size Monitoring]
    └──requires──> [CI pipeline (build step exists)]
    └──enhances──> [Component Refactors] (validates refactors don't increase bundle)

[WebGL Fallback for DecodedLogo]
    └──independent──> [all other features]
    └──note──> [prioritize only if in-app browser traffic is significant]
```

### Dependency Notes

- **Env validation and debug logging cleanup are prerequisites for Sentry.** Sentry configured before these are fixed produces noisy, low-value error reports that train the team to ignore alerts.
- **Proxy error forwarding must precede frontend error tracking.** If backend errors are swallowed at the proxy layer, Sentry only sees "generic 500" — the same information you have today, just with more infrastructure overhead.
- **GSAP cleanup (useGSAP migration) must precede the ImageDetailModal refactor.** Extracting animation logic into a custom hook while the cleanup semantics are broken means the extracted hook inherits the bug.
- **Component refactors are independent of observability features.** They can proceed in parallel with Sentry/rate limiting work across different team members or phases.
- **E2E tests should be written after the fragile areas are fixed**, not before. Writing a test against a leaking component verifies broken behavior — write tests to verify fixes.

---

## MVP Definition

### Launch With (Phase 1: Safety Foundation)

The minimum changes needed to make the app safe for real production traffic.

- [ ] **Rate limiting on `POST /api/v1/posts/analyze`** — prevent AI cost abuse
- [ ] **Remove unguarded debug logging** — security and console hygiene
- [ ] **Environment variable validation at startup** — prevent silent misconfiguration
- [ ] **Memory leak fix: URL.createObjectURL** — prevent tab crashes on extended sessions
- [ ] **GSAP context cleanup (useGSAP migration)** — prevent animation conflicts on rapid navigation

### Add After Safety Foundation (Phase 2: Observability)

Add once the app is safe to operate and the signal-to-noise ratio in production is acceptable.

- [ ] **Sentry frontend error tracking** — gain visibility into production errors
- [ ] **Sentry Rust API error tracking** — correlate frontend errors with backend causes
- [ ] **Structured proxy error handling** — ensure Sentry sees real error codes, not generic 500s
- [ ] **Web Vitals reporting** — detect performance regressions

### Add After Observability (Phase 3: Quality)

Add once the team can observe what is breaking and has evidence of which paths need coverage.

- [ ] **Vitest unit tests: requestStore and authStore** — verify state machine correctness
- [ ] **E2E tests: auth flow + upload flow + modal** — regression catch for critical paths
- [ ] **Component refactor: ThiingsGrid extraction** — reduce cognitive load for grid changes
- [ ] **Component refactor: ImageDetailModal animation extraction** — reduce regression risk for modal
- [ ] **Bundle size monitoring in CI** — prevent performance regressions from new dependencies
- [ ] **WebGL fallback for DecodedLogo** — serve in-app browser users (Instagram, KakaoTalk)

---

## Feature Prioritization Matrix

| Feature | User/Ops Value | Implementation Cost | Priority |
|---------|---------------|---------------------|----------|
| Rate limiting (analyze endpoint) | HIGH | MEDIUM | P1 |
| Remove debug logging | HIGH | LOW | P1 |
| Env variable validation | HIGH | LOW | P1 |
| Memory leak fix (createObjectURL) | HIGH | MEDIUM | P1 |
| GSAP cleanup (useGSAP migration) | HIGH | MEDIUM | P1 |
| Structured proxy error handling | HIGH | MEDIUM | P1 |
| Sentry frontend error tracking | HIGH | MEDIUM | P2 |
| Sentry Rust API error tracking | HIGH | MEDIUM | P2 |
| Vitest unit tests (stores) | HIGH | HIGH | P2 |
| E2E tests (critical paths) | HIGH | HIGH | P2 |
| Web Vitals reporting | MEDIUM | LOW | P2 |
| Component refactor: ThiingsGrid | MEDIUM | HIGH | P2 |
| Component refactor: ImageDetailModal | MEDIUM | HIGH | P2 |
| Bundle size monitoring in CI | MEDIUM | MEDIUM | P2 |
| WebGL fallback for DecodedLogo | MEDIUM | MEDIUM | P3 |
| RequestStore state machine guards | MEDIUM | LOW | P2 |
| Zustand immutability fix (structuredClone) | LOW | LOW | P2 |

**Priority key:**
- P1: Must have before real production traffic
- P2: Should have, ship when P1 is complete
- P3: Nice to have, schedule after milestone validates

---

## Existing Code Impact Map

Files and directories directly affected by this milestone's work.

| File / Directory | Issue | Action |
|-----------------|-------|--------|
| `packages/web/app/api/v1/posts/analyze/route.ts` | No auth, no rate limiting | Add rate limit middleware + auth check |
| `packages/web/app/api/v1/**/*.ts` | Inconsistent error forwarding | Extract shared `proxyHandler` utility |
| `packages/web/lib/components/detail/ImageDetailModal.tsx` | Debug logs, GSAP leak, scroll forwarding incomplete | Remove logs; migrate to `useGSAP`; extract animation hook |
| `packages/web/lib/stores/requestStore.ts` | `URL.createObjectURL` leak, step transitions unguarded, immutability gap | Fix leak in component; add Zod guards to steps; `structuredClone` on spots |
| `packages/web/lib/stores/authStore.ts` | Logs full error objects | Sanitize error logging |
| `packages/web/lib/components/ThiingsGrid.tsx` | 948 LOC, physics engine inline | Extract physics to `lib/utils/thiingsGridPhysics.ts` |
| `packages/web/lib/components/DecodedLogo.tsx` | No WebGL detection, no error boundary | Add detection + fallback + ErrorBoundary |
| `packages/web/lib/config/env.ts` | Does not exist | Create with startup validation for `API_BASE_URL`, `SUPABASE_*` |
| `packages/web/instrumentation.ts` | Does not exist | Create for Sentry server-side init + env validation hook |
| `packages/web/sentry.client.config.ts` | Does not exist | Create for browser Sentry init |
| `packages/api-server/src/main.rs` | No external error sink | Add `sentry` crate init before Axum startup |
| `packages/web/__tests__/` | Does not exist | Create with store tests and E2E test files |

---

## Sources

- `.planning/codebase/CONCERNS.md` — primary source; codebase audit identifying all issues addressed here (HIGH confidence — first-party audit)
- `packages/web/lib/stores/requestStore.ts`, `ImageDetailModal.tsx`, `ThiingsGrid.tsx` — direct file analysis (HIGH confidence — first-party code)
- Sentry Next.js SDK documentation — `@sentry/nextjs` App Router integration, `instrumentation.ts` pattern (HIGH confidence — official)
- `@gsap/react` `useGSAP` hook documentation — context lifecycle and cleanup guarantees (HIGH confidence — official GSAP docs)
- Upstash Ratelimit + Next.js Route Handlers — sliding window rate limiting pattern for Vercel/Edge (MEDIUM confidence — widely used pattern)
- Next.js 16 `instrumentation.ts` startup hook — official mechanism for server-side initialization (HIGH confidence — Next.js docs)
- Vitest 4.1 + Playwright 1.58 installed in `packages/web/package.json` — confirmed available (HIGH confidence — direct inspection)

---

*Feature research for: Tech debt resolution milestone — production stability*
*Researched: 2026-03-26*
