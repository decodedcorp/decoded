# Pitfalls Research

**Domain:** Production hardening — adding Rate Limiting, Sentry error tracking, E2E tests, component refactoring, and memory leak fixes to an existing Next.js 16 + Rust/Axum + Python/gRPC monorepo (decoded v10.0)
**Researched:** 2026-03-26
**Confidence:** HIGH (memory leaks, GSAP cleanup, component splitting), MEDIUM (Sentry polyglot config, Axum rate limiting patterns), MEDIUM (Playwright auth with Supabase)

---

## Critical Pitfalls

Mistakes that cause rewrites, break production, or invalidate the work of a phase entirely.

---

### Pitfall 1: Axum Rate Limiter State Not Shared Across Clones

**What goes wrong:**
`tower::ServiceBuilder`'s built-in `RateLimitLayer` creates a new independent counter for each clone of the service. In Axum, the router is cloned per request handler (or per connection depending on the executor). The result: the rate limit never triggers because each request gets its own fresh counter. You think you have a 100 req/min limit but every request resets to 0.

**Why it happens:**
Developers add `ServiceBuilder::new().layer(RateLimitLayer::new(100, Duration::from_secs(60)))` to the Axum router following the Tower documentation, not realizing that `RateLimitLayer` clones its state (the `AtomicUsize` counter) into each service clone. This is a known behavioral issue filed against Axum (issue #2634) — the rate limit layer is not respected because each handler clone starts a new counter.

**How to avoid:**
Use a shared `Arc<Mutex<RateLimiter>>` or a purpose-built crate like `tower-governor` (which wraps the `governor` crate and uses a shared `Arc<GovernorConfig>` properly) or `axum-governor`. The shared state must be in an `Arc` that all handler clones reference, not a value that gets deep-copied. Store the rate limiter in `AppState` and check it in a middleware that reads from the shared state.

For AI endpoint cost protection (the primary goal here), use per-user rate limiting keyed on the JWT subject claim extracted from the Authorization header — not per-IP, which is trivially bypassed behind NAT.

**Warning signs:**
- Rate limiting appears to work in unit tests but never triggers under load testing
- Curl loop `for i in {1..200}; do curl -s /api/v1/posts/analyze; done` returns 200 for all requests
- Logs show no 429 responses despite traffic exceeding the configured limit

**Phase to address:** Rate Limiting phase (Phase 1). Validate with a load test before declaring done.

---

### Pitfall 2: In-Memory Rate Limiter State Grows Unboundedly for Per-User Keying

**What goes wrong:**
Per-user rate limiting stores a counter entry per user ID in memory. If the store is a `HashMap<UserId, RateLimitState>` with no eviction, it grows for the lifetime of the process — one entry per unique user who ever made a request. At 10k users, this is negligible. But if the AI endpoint is hit by authenticated users creating many accounts (or if state is keyed on IP which can be spoofed with many IPs), memory grows without bound and the process eventually OOMs.

**Why it happens:**
Teams implement a simple `HashMap` keyed on user/IP without reading about time-windowed expiry. The entries for users who haven't hit the endpoint in hours continue occupying memory.

**How to avoid:**
Use `tower-governor`'s built-in GC mechanism, or `axum_gcra` which has configurable GC intervals. If rolling a custom solution, use `moka` (a Rust concurrent cache with TTL eviction) as the backing store instead of `HashMap`. Set TTL to 2× the rate limit window. For this app's AI protection use case, per-authenticated-user keying on the JWT `sub` claim with a `moka::Cache<String, AtomicU32>` with TTL eviction is the correct pattern.

**Warning signs:**
- Axum process RSS grows monotonically over hours/days with no ceiling
- Memory profiling shows the rate limiter HashMap is the top allocator
- Restarting the process temporarily reclaims memory

**Phase to address:** Rate Limiting phase. Include a 24-hour soak test or memory profiling step as part of verification.

---

### Pitfall 3: Sentry User Context Set on Server Is Not Propagated to Client

**What goes wrong:**
In a Next.js App Router app, calling `Sentry.setUser({ id: userId })` in a Server Component or Route Handler does not propagate to the client-side Sentry SDK. Client errors are captured without user context — you see an error but don't know which user triggered it. The team looks at Sentry, sees errors without user IDs, and assumes the user context is working because the server-side errors do show user IDs.

**Why it happens:**
The Sentry SDK runs as two independent instances: one in the Next.js Node.js runtime (server) and one bundled into the browser (client). `setUser()` on the server writes to the server-side scope only. The client SDK has no knowledge of this call. This is documented in the Sentry GitHub discussion #10019 for App Router projects.

**How to avoid:**
Call `Sentry.setUser()` in both contexts independently. On the server: in a server action or layout that has access to the Supabase session. On the client: in the `AuthProvider` or `authStore` after session hydration completes. The client call should happen inside a `useEffect` after `supabase.auth.getUser()` resolves, not at module init time. Pattern:

```typescript
// In authStore or a client-side auth component
useEffect(() => {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}, [user]);
```

**Warning signs:**
- Server-side Sentry events have `user.id` populated; client-side events show `user: null`
- React Query fetch errors in the browser are attributed to anonymous users in Sentry
- `Sentry.getActiveSpan()` on the client returns a span without user context

**Phase to address:** Sentry integration phase. Verify with a test error thrown from a client component while logged in — confirm user ID appears in the Sentry event.

---

### Pitfall 4: Sentry Source Maps Not Uploading = Obfuscated Stack Traces

**What goes wrong:**
Sentry captures errors with minified stack traces like `at t (main-abc123.js:1:4821)`. Without source maps uploaded, every error in Sentry is useless — you cannot locate the line of code that failed. Teams deploy Sentry, see errors appear, and declare it "working" without verifying that the stack traces are readable.

**Why it happens:**
Next.js with `@sentry/nextjs` does upload source maps automatically during build, but only if `SENTRY_AUTH_TOKEN` is available at build time. In CI/CD pipelines, this environment variable is often forgotten or scoped incorrectly. On Vercel, it must be added as an environment variable in the project settings (not `.env.local`). Additionally, the `withSentryConfig` wrapper in `next.config.js` must be present — if someone wraps the config in another HOC (e.g., `withBundleAnalyzer(withSentryConfig(...))`) in the wrong order, the Sentry webpack plugin does not activate.

**How to avoid:**
1. Add `SENTRY_AUTH_TOKEN` to CI secrets and Vercel environment variables before the first production deploy.
2. After the first deploy, immediately check a Sentry event: click the stack trace frame and verify it shows your TypeScript source lines, not minified JS.
3. In `next.config.js`, wrap as `withSentryConfig(nextConfig, sentryOptions)` — Sentry must be the outermost wrapper.
4. The `SENTRY_AUTH_TOKEN` must NOT be in `.env.local` or committed to git — it is a build-time secret only.

**Warning signs:**
- Stack traces in Sentry show minified file names like `page-abc123.js` with no line mapping
- Sentry breadcrumbs show component names as `<anonymous>` instead of real component names
- `next build` output does not mention "Sentry: uploading source maps"

**Phase to address:** Sentry integration phase. Source map verification is a go/no-go gate before calling the phase complete.

---

### Pitfall 5: Sentry for Rust/Axum Does Not Auto-Capture Panic = Silent Crashes

**What goes wrong:**
The `sentry` crate for Rust captures panics automatically when initialized with `sentry::init(...)` and the `with_backtrace_support` feature. However, in an Axum server, panics in async handlers do not propagate as OS-level process panics — they are caught by Tokio's task supervisor and converted to a 500 response. The Sentry panic handler never sees them. The result: a handler `unwrap()` that panics in production causes a 500 response and the error is never sent to Sentry.

**Why it happens:**
Async runtimes like Tokio catch panics per-task to prevent one failing task from taking down the entire server. This is correct behavior for availability, but it means the standard Sentry panic hook (which hooks into `std::panic::set_hook`) is never called for async task panics in Axum handlers. The CONCERNS.md already notes that `unwrap()` is forbidden — but any remaining `unwrap()` in the codebase will silently drop errors.

**How to avoid:**
1. Audit the codebase for any remaining `unwrap()` calls in handler code — the api-server CLAUDE.md already forbids this, but verify compliance with `grep -r "\.unwrap()" src/`.
2. Add a Tower middleware layer that wraps handler execution in `catch_unwind` and sends the panic to Sentry before converting to a 500 response. The `sentry-tower` crate provides this as `SentryLayer`.
3. Configure the Sentry SDK with `sentry::ClientOptions { attach_stacktrace: true, ..Default::default() }` to attach backtraces to all events, not just panics.

**Warning signs:**
- A handler returns 500 responses but no corresponding events appear in Sentry
- `grep -r "\.unwrap()" packages/api-server/src/` returns results outside of test files
- Sentry events from Rust are being captured for `tracing::error!` calls but not for panics

**Phase to address:** Sentry integration phase (Rust/Axum component). Verify by intentionally triggering a recoverable error path in a non-production environment.

---

### Pitfall 6: Playwright E2E Tests Fail in CI Due to Supabase Auth Session Timing

**What goes wrong:**
E2E tests that require authentication hit a race condition: the Supabase auth session is stored in localStorage/cookies, but after `page.goto()` the session hydration happens asynchronously. Tests that click "add to collection" or trigger authenticated API calls immediately after navigation find the user is unauthenticated because the session hasn't loaded yet. The test passes locally (where the app is warm and hydration is faster) but fails in CI (cold start, slower).

**Why it happens:**
Supabase's `onAuthStateChange` fires asynchronously after the page loads. The browser's localStorage contains the session token, but the Supabase client hasn't yet called `getSession()` and populated the auth store. Any test that relies on `authStore.user` being non-null immediately after navigation is racing against this hydration.

**How to avoid:**
Use Playwright's `storageState` to pre-authenticate via the Supabase REST API (not the UI login flow) before the test suite runs. In `playwright.config.ts`, add a `setup` project that:
1. Calls `POST https://[project].supabase.co/auth/v1/token?grant_type=password` with test user credentials
2. Saves the response token to `localStorage["sb-[ref]-auth-token"]`
3. Saves the browser state to `.auth/user.json`

All test projects then use `storageState: '.auth/user.json'`. Additionally, add a `waitForFunction` after navigation that polls until `authStore.user !== null` (or a sentinel DOM element that only renders for authenticated users) before proceeding with authenticated actions.

**Warning signs:**
- Tests pass in `--headed` mode locally but fail headlessly in CI
- Intermittent 401 errors in network requests during test runs
- Tests pass on the second retry (Playwright's CI retry setting masks the root cause)

**Phase to address:** E2E testing phase. The auth setup fixture must be built before any authenticated test is written — do not defer it.

---

### Pitfall 7: E2E Tests Coupled to UI Labels Instead of Stable Selectors

**What goes wrong:**
Tests written as `page.getByText("아이템 발견하기")` or `page.locator(".hero-card-title")` break whenever the copy changes or the CSS class is refactored. The existing visual QA tests (visual-qa.spec.ts) take screenshots — this is appropriate for visual regression. But new business logic E2E tests written in the same style (text-based, style-based selectors) create a maintenance burden where every copy change breaks the test suite.

**Why it happens:**
Teams write tests against what they see on screen (text, visual appearance) because it's the fastest way to get a test passing. The tests become brittle because UI copy and styles change frequently while the underlying user intent does not.

**How to avoid:**
Add `data-testid` attributes to all interactive elements that E2E tests need to target: `data-testid="request-upload-button"`, `data-testid="item-spot-[id]"`, etc. Use `page.getByTestId("request-upload-button")` in tests. Keep `data-testid` attributes stable across refactors — they are test infrastructure, not styling. For the ThiingsGrid and ImageDetailContent components being refactored, add `data-testid` as part of the refactor work, not after.

**Warning signs:**
- A copy PR ("아이템 발견하기" → "아이템 찾기") causes test failures
- CSS class renaming during refactor breaks tests
- Tests pass after `npm run test -- --update-snapshots` but the change was a false pass (UI broke but screenshot accepted the broken state)

**Phase to address:** E2E testing phase. Establish the `data-testid` convention before writing tests. Component refactoring phase should add `data-testid` as part of the work.

---

### Pitfall 8: Refactoring Large Component Breaks Animation Timing Without Visual Evidence

**What goes wrong:**
`ThiingsGrid.tsx` (948 lines) and `ImageDetailContent.tsx` (671 lines) contain GSAP timeline orchestration tightly coupled to the component's internal DOM structure. When you extract a sub-section into a child component (`<ThiingsGridHeader>`, `<ItemSpotSection>`), the GSAP refs that target DOM nodes by `ref` or by querySelector lose their targets. The timeline runs but animates nothing — no error is thrown, no TypeScript violation, just silent animation failure.

**Why it happens:**
GSAP targets DOM elements via refs or CSS selectors scoped to the parent's container. When a section is extracted to a child component, the `ref` is now in the child's render scope. The parent's GSAP context still tries to target `containerRef.current.querySelector('.item-spot')`, which now returns null because the child component hasn't mounted yet when the parent's `useGSAP` runs.

**How to avoid:**
Refactor in this specific order:
1. First, convert all animation logic to `useGSAP` with explicit `scope` refs (not raw `querySelector` on the container) — this creates a stable targeting contract.
2. Extract presentational markup (no animation logic) into child components, passing `ref` via `forwardRef`.
3. Move animation hooks to the lowest component that owns both the DOM element and the animation trigger.
4. Test animation behavior after each extraction step — don't batch multiple extractions before testing.

For `ImageDetailModal.tsx` specifically, the GSAP context cleanup issue documented in CONCERNS.md must be fixed before the refactor — fixing cleanup after the split makes it much harder.

**Warning signs:**
- After extracting a child component, the animation timeline completes instantly (duration = 0ms visible effect)
- `gsap.getTweensOf(element)` returns empty array for elements that should be animated
- No TypeScript or console errors, but animations are absent
- GSAP DevTools (if available) shows tweens targeting null elements

**Phase to address:** Component refactoring phase. Each extraction must include a manual animation smoke test before moving to the next component.

---

### Pitfall 9: ObjectURL Cleanup Race Condition During Rapid Navigation

**What goes wrong:**
In `requestStore.ts`, `URL.createObjectURL()` creates blob URLs for image previews. The `revokeObjectURL()` is intended to be called on cleanup. However, if a user navigates away from the request flow (e.g., closes the modal or hits the back button) while an image compression is in progress, the cleanup path in the store is called before the compression Promise resolves. When compression resolves, it tries to render the revoked URL — the `<img>` tag briefly shows a broken image or the blob URL reference is now invalid.

Additionally, `browser-image-compression` (used in the stack) returns a `File` object. The `createObjectURL` called on this File is a separate URL from the original input URL — if both are created but only one is revoked, the other leaks permanently for the page session.

**Why it happens:**
The store's `clearImages()` is called synchronously when the component unmounts, but compression is async. The Promise callback runs after cleanup and attempts to create/use a URL from a cleared state.

**How to avoid:**
Use an `AbortController` pattern: pass the abort signal to the compression function and check `signal.aborted` in the `.then()` handler before creating any new ObjectURL. The CONCERNS.md already identifies this as the correct fix for `requestStore.ts`. Implementation:

```typescript
// In the store action
const controller = new AbortController();
set({ compressionAbortController: controller });

compress(file, { signal: controller.signal })
  .then((compressed) => {
    if (controller.signal.aborted) return; // don't create URL if navigated away
    const url = URL.createObjectURL(compressed);
    set({ previewUrl: url });
  });

// In cleanup
get().compressionAbortController?.abort();
URL.revokeObjectURL(get().previewUrl ?? "");
```

Track ALL created ObjectURLs in a `Set<string>` on the store so cleanup can revoke all of them, not just the last one.

**Warning signs:**
- Memory profiling shows blob URLs accumulating across navigation cycles (visible in Chrome DevTools Memory tab under "Blob URL count")
- Occasional broken image display when rapidly navigating to and from the request flow
- `performance.memory.usedJSHeapSize` grows on each request-flow visit without returning to baseline

**Phase to address:** Memory leak phase. Fix the AbortController pattern first, then add the URL tracking Set, then add a development-mode warning if any URLs are not revoked on page unload.

---

### Pitfall 10: GSAP Animations Created in Event Handlers Are Not Captured by useGSAP Context

**What goes wrong:**
Many components use `gsap.context(() => { ... })` manually or via `useGSAP`. However, any GSAP animation created inside a click handler, scroll handler, or `setTimeout` callback that runs after the hook executes is NOT registered with the context. When the component unmounts and the context calls `revert()`, these orphaned tweens continue running and targeting DOM nodes that no longer exist — causing `Cannot read properties of null` errors and memory leaks.

The codebase has multiple components creating timelines inside event handlers (e.g., `IssueSpine.tsx` creates `gsap.timeline()` inside `onMouseEnter`). These are the most common source of GSAP-related memory leaks.

**Why it happens:**
The GSAP official documentation explicitly warns about this: animations created after the `useGSAP` hook body executes are not recorded. Developers intuitively put animation code where it triggers (in the event handler) rather than in the hook body.

**How to avoid:**
Wrap all event handler animations with `contextSafe()` from the `useGSAP` hook:

```typescript
const { contextSafe } = useGSAP({ scope: containerRef });

const handleMouseEnter = contextSafe(() => {
  gsap.timeline().to(ref.current, { scaleX: 1.05 });
});
```

`contextSafe()` registers the animation with the context so it gets cleaned up on unmount. As part of the memory leak phase, audit every file matching `gsap.timeline()` or `gsap.to()` that appears inside an event handler body (not inside `useGSAP`) and wrap them.

**Warning signs:**
- Console error: `Cannot read properties of null (reading 'style')` after component unmounts with an animation in-flight
- Navigating away from the collection page while a Spline + GSAP animation is running causes React error boundaries to fire
- GSAP's global timeline (accessible via `gsap.globalTimeline.getChildren()`) grows with each component mount/unmount cycle

**Phase to address:** Memory leak phase. This is the highest-impact leak to fix given the animation-heavy codebase.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Rate limiting at the Next.js proxy layer only (not Axum) | One less Rust change | AI server still reachable if Axum is called directly; no protection for backend-to-AI gRPC calls | Never for cost protection — must be at Axum level |
| Sentry with `tracesSampleRate: 1.0` in production | Complete trace coverage | Performance degradation at scale; Sentry costs spike | Dev/staging only; production should be 0.1–0.2 |
| Writing E2E tests for every page (like visual-qa.spec.ts) | High coverage numbers | Slow test suite, flaky due to animation timeouts, maintenence burden | Visual regression only; business logic tests should be focused flows |
| Splitting components by line count alone (e.g., "everything over 400 lines") | Smaller files | Splits animation logic from its DOM targets, breaking GSAP | Never — split by responsibility, not size |
| Adding `data-testid` only when tests are already failing | Tests written quickly | Testids added reactively cover only what already broke | Always add proactively during component work |
| Fixing memory leaks only with `useEffect` cleanup | Works for React-managed resources | Does not handle stores, GSAP contexts, or non-React event listeners | Only for purely React-managed subscriptions |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sentry + Next.js 16 App Router | Not using `withSentryConfig` in `next.config.js` | Wrap `nextConfig` with `withSentryConfig(nextConfig, { org, project, authToken })` as the outermost config wrapper |
| Sentry + Supabase auth | Calling `Sentry.setUser()` only on the server | Call `Sentry.setUser()` in `authStore` on the client side after session hydration |
| Sentry + Python gRPC | Not adding `GRPCIntegration` to the Python SDK init | `sentry_sdk.init(dsn=..., integrations=[GRPCIntegration()])` — required since sentry-sdk 1.35.0 |
| Sentry source maps | Setting `SENTRY_AUTH_TOKEN` in `.env.local` | Set as CI secret and Vercel env var — never commit auth token |
| Playwright + Supabase | Logging in via UI for each test | Use `storageState` with REST API login in a `setup` project — UI login is slow and flaky |
| Axum rate limiting | Using `tower::ServiceBuilder::layer(RateLimitLayer::new(...))` | Use `tower-governor` or `axum-governor` with shared `Arc` state |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-IP rate limiting for AI endpoints | Auth bypass via VPN/proxy rotation — limits never triggered for bad actors | Use per-authenticated-user (JWT sub) rate limiting for AI endpoints | Immediately — determined users route around it |
| `HashMap<UserId, RateLimitState>` with no TTL eviction | Process RSS grows monotonically; restart reclaims memory | Use `moka::Cache` with TTL, or `tower-governor` with GC | ~10k unique users without eviction |
| `networkidle` in Playwright tests with GSAP/Lenis | Tests wait 30s for animations to stop creating network activity | Use explicit `waitForSelector` on a stable post-load element | Every test — animations create continuous JS timers |
| Running full Playwright suite (40 tests × 4 viewports) in CI for every PR | CI takes 20+ minutes | Separate visual-qa (scheduled weekly) from business logic E2E (every PR) | Immediately once suite grows |
| Sentry `tracesSampleRate: 1.0` with GSAP-heavy pages | Sentry performance traces overwhelm the quota; monthly Sentry bill spikes | Set `tracesSampleRate: 0.1` in production | First month in production with real traffic |

---

## Security Mistakes

Domain-specific security issues.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rate limiting only on the Next.js proxy, not on the Axum handler | Direct callers bypass the proxy entirely — unlimited AI API calls possible | Enforce rate limiting at the Axum middleware layer where auth is validated |
| Sentry DSN exposed as `NEXT_PUBLIC_SENTRY_DSN` without tunnel configuration | Anyone can spam fake events to your Sentry quota | Use `@sentry/nextjs` tunnel feature (`tunnelRoute: "/monitoring"`) to proxy Sentry calls through your own domain |
| `SENTRY_AUTH_TOKEN` in `.env.local` or committed to `.env.example` | Source maps can be downloaded and used to reverse-engineer minified code | Auth token is build-time CI secret only — never in any checked-in file |
| Per-IP rate limiting on AI endpoints | Trivially bypassed with many IPs or from behind a shared NAT (legitimate users blocked, bad actors not) | Key on authenticated user ID (JWT sub), not IP |
| Sentry error payloads containing `requestStore.detectedSpots` with user-uploaded image URLs | User image URLs logged to a third-party service without consent | Add `beforeSend` hook to strip image URL fields from Sentry event data |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but have critical pieces missing.

- [ ] **Rate Limiting:** Middleware is wired — verify with `for i in {1..200}; do curl -s -o /dev/null -w "%{http_code}\n" POST /api/v1/posts/analyze; done` and confirm 429 responses appear before request 101
- [ ] **Rate Limiting:** Added to Axum — verify it also applies when the backend is called directly (not through the Next.js proxy)
- [ ] **Sentry Next.js:** SDK initialized — verify that a manually triggered client-side error (`throw new Error("sentry-test")`) appears in Sentry with a readable stack trace showing TypeScript source lines
- [ ] **Sentry Next.js:** Event visible — verify that `user.id` is populated on the Sentry event (not just `user: null`)
- [ ] **Sentry Rust:** `sentry::init()` called — verify that a `tracing::error!()` call produces a Sentry event (not just a log line)
- [ ] **Sentry Python gRPC:** SDK initialized — verify that a gRPC handler exception produces a Sentry event with the correct environment tag
- [ ] **E2E Tests:** Tests pass locally — run `CI=true bun playwright test` to confirm they pass with CI worker constraints (1 worker, no headed mode)
- [ ] **E2E Tests:** Auth flow works — verify that authenticated-user tests use `storageState` and do not depend on UI login flow
- [ ] **Component Refactor:** Code split — open the refactored component and manually trigger every animation that existed before the split; confirm all play correctly
- [ ] **Memory Leaks:** ObjectURL cleanup added — visit the request flow 10 times without refreshing; check Chrome DevTools Memory → "Blob URLs" count stays constant
- [ ] **Memory Leaks:** GSAP cleanup — navigate to the collection page, interact with Spline, navigate away, and verify no `Cannot read properties of null` errors appear in console
- [ ] **Memory Leaks:** Event listeners — use Chrome DevTools → Performance Monitor → "DOM Nodes" counter; verify it returns to baseline after navigating away from animated pages

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Rate limiter not sharing state (all requests pass through) | LOW | Replace `RateLimitLayer` with `tower-governor`; verify shared Arc is in AppState; re-deploy |
| Sentry events without user context | LOW | Add `Sentry.setUser()` call to `authStore`; verify in one PR; no data migration needed |
| Sentry source maps missing (obfuscated traces) | LOW | Add `SENTRY_AUTH_TOKEN` to CI/Vercel env; trigger new build; old events stay obfuscated |
| Playwright tests failing in CI due to auth race | MEDIUM | Add `storageState` setup project; replace all `waitForLoadState('networkidle')` with explicit element waits; re-run |
| Component refactor broke GSAP animations | MEDIUM | Git revert the extraction; follow the prescribed refactor order (fix cleanup first, then extract with forwardRef, then move animation to child); re-test each step |
| ObjectURL accumulation causing page memory bloat | MEDIUM | Add URL tracking Set to the store; run cleanup on unmount; add AbortController to compression path |
| GSAP orphaned tweens after component unmount | HIGH | Audit all event handler animation calls; wrap each in `contextSafe()`; this requires touching many components |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Axum rate limiter state not shared | Phase: Rate Limiting | Load test shows 429 responses at correct threshold |
| Per-user state unbounded memory growth | Phase: Rate Limiting | 24h soak test or moka TTL config visible in code review |
| Sentry user context not in client events | Phase: Sentry | Test event in Sentry dashboard shows `user.id` from client-side error |
| Sentry source maps missing | Phase: Sentry | Stack trace shows TypeScript source lines, not minified JS |
| Rust panic not captured by Sentry | Phase: Sentry | `grep -r ".unwrap()" src/` returns zero results outside test files; sentry-tower layer present |
| Playwright auth race in CI | Phase: E2E Tests | `CI=true playwright test` passes on first attempt without retries |
| E2E tests coupled to UI labels | Phase: E2E Tests | All test locators use `data-testid` — no `getByText` in business logic tests |
| Component refactor breaks GSAP | Phase: Component Refactoring | Animation smoke test after each extraction step |
| ObjectURL race during navigation | Phase: Memory Leaks | Chrome blob URL count stable across 10 navigation cycles |
| GSAP orphaned tweens | Phase: Memory Leaks | GSAP global timeline empty after component unmount |

---

## Sources

- [Axum issue #2634 — RateLimitLayer not respected (cloned state)](https://github.com/tokio-rs/axum/issues/2634)
- [tower-governor — rate limiting middleware for Axum with shared Arc state](https://github.com/benwis/tower-governor)
- [axum_gcra — GCRA rate limiting with GC for Axum](https://docs.rs/axum_gcra)
- [Sentry GitHub discussion #10019 — setUser() not propagated from server to client in App Router](https://github.com/getsentry/sentry-javascript/discussions/10019)
- [Sentry Next.js Manual Setup — withSentryConfig and source maps](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Sentry Source Maps for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)
- [Sentry Python gRPC Integration — GRPCIntegration](https://docs.sentry.io/platforms/python/integrations/grpc/)
- [Sentry Rust Configuration Options](https://docs.sentry.io/platforms/rust/configuration/options/)
- [Playwright Authentication — storageState pattern](https://playwright.dev/docs/auth)
- [Login via Supabase REST API in Playwright — mokkapps.de](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test)
- [GSAP React official docs — useGSAP and contextSafe() for event handlers](https://gsap.com/resources/React/)
- [useGSAP automatic cleanup guide](https://medium.com/@hello.kweku/simplifying-react-animations-with-usegsap-automatic-cleanup-and-beyond-354edfec31dc)
- [GSAP community — onComplete in useGSAP cleanup behavior on unmount](https://gsap.com/community/forums/topic/41648-oncomplete-animations-in-usegsap-gets-cleaned-on-unmount/)
- [decoded-monorepo CONCERNS.md — existing known issues for this codebase](.planning/codebase/CONCERNS.md)

---
*Pitfalls research for: Production hardening — rate limiting, error tracking, E2E tests, component refactoring, memory leak fixes*
*Researched: 2026-03-26*
