# Phase 47: Observability - Research

**Researched:** 2026-03-26
**Domain:** Sentry integration across Next.js 16 / Rust Axum / Python FastAPI+gRPC, Web Vitals monitoring
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SENT-01 | @sentry/nextjs 설치 및 설정 — instrumentation.ts, 소스맵 업로드, 클라이언트/서버 에러 수집 | @sentry/nextjs 10.46.0 supports Next.js 16; manual setup documented |
| SENT-02 | Rust 백엔드에 sentry + sentry-tower 레이어 연동 — 기존 tracing 스택과 통합 | sentry 0.47.0 `tower-axum-matched-path` feature + tracing integration; requires init before tokio runtime |
| SENT-03 | Python AI 서버에 sentry-sdk[fastapi] 연동 — gRPC 핸들러 에러 수집 | sentry-sdk 2.56.0; GRPCIntegration auto-instruments grpcio 1.39+; FastAPI auto-detected |
| SENT-04 | dev/prod 환경별 DSN 분리 설정 및 환경 태깅 | NEXT_PUBLIC_SENTRY_DSN + SENTRY_DSN for Next.js; SENTRY_DSN env var for Rust/Python; environment tagging documented |
| OBS-01 | Sentry 크로스 서비스 트레이스 (Rust → Python gRPC trace 전파) | sentry-tracing layer for Rust; GRPCIntegration propagates traces automatically; marked as v10.1+ "Future Requirements" |
| OBS-02 | Web Vitals 모니터링 (LCP, FID, CLS 대시보드) | @sentry/nextjs auto-captures Web Vitals as measurements on page load transactions |
| OBS-03 | Sentry 알림 룰 및 Slack 연동 | Sentry dashboard config (no code); outside codebase scope |
</phase_requirements>

---

## Scope Clarification

The REQUIREMENTS.md lists OBS-01/02/03 under **"Future Requirements (v10.1+)"** but the ROADMAP.md Phase 47 entry and the Traceability table map SENT-01 through SENT-04 to Phase 47. The phase goal description covers both SENT-* and OBS-* items.

**Primary deliverables for Phase 47 (code in repo):** SENT-01, SENT-02, SENT-03, SENT-04 + OBS-02 (Web Vitals auto-captured by @sentry/nextjs).

**OBS-01 (cross-service trace propagation):** The gRPC/tracing integrations set the foundation but deep trace stitching between Rust and Python requires additional header propagation config — noted as a stretch goal.

**OBS-03 (Sentry alert rules + Slack):** Pure Sentry dashboard configuration, zero code changes required.

---

## Summary

Phase 47 adds Sentry error tracking to all three services in the monorepo: Next.js 16 frontend, Rust/Axum backend, and Python FastAPI+gRPC AI server. Each service uses its own language-native Sentry SDK but all share the same Sentry project DSN (or separate projects depending on org preference).

The Next.js integration requires the most file scaffolding: five new files plus wrapping `next.config.js` with `withSentryConfig`. The Rust integration has a **critical constraint**: Sentry must be initialized before `tokio::main` starts — the existing `#[tokio::main]` attribute macro in `main.rs` must be replaced with a manual tokio runtime builder. The Python integration is the simplest: one `sentry_sdk.init()` call with `[FastAPIIntegration(), GRPCIntegration()]` before the FastAPI app starts.

Web Vitals (OBS-02) are captured automatically by `@sentry/nextjs` with no additional code once the Next.js integration is configured.

**Primary recommendation:** Follow service-by-service installation order: Next.js (most visible, validate DSN first) → Python (simplest integration) → Rust (most invasive due to tokio runtime change). Use a single Sentry project with `environment` tags to separate dev/prod.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sentry/nextjs | 10.46.0 | Next.js error + performance monitoring | Official SDK; supports Next.js 16 App Router, React 19, Web Vitals auto-capture |
| sentry (Rust) | 0.47.0 | Rust/Axum error + performance | Official SDK; `tower-axum-matched-path` feature integrates with existing tower middleware |
| sentry-sdk (Python) | 2.56.0 | Python FastAPI + gRPC error tracking | Official SDK; auto-detects FastAPI; GRPCIntegration instruments grpcio 1.39+ |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sentry-tracing (Rust) | bundled with sentry 0.47 | Bridges tracing-subscriber → Sentry | Needed for OBS-01 cross-service traces; can be added in same PR |
| sentry-sdk[fastapi] extra | 2.56.0 | FastAPI auto-integration | Activates automatically when fastapi is installed — no separate install needed |
| sentry-sdk[grpcio] extra | 2.56.0 | gRPC auto-integration | Required for GRPCIntegration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @sentry/nextjs | OpenTelemetry + custom exporter | OTel requires significantly more setup; Sentry SDK handles source maps, Web Vitals, session replay out-of-box |
| sentry Rust crate | tracing + OpenTelemetry | Already have tracing; OTel needs full exporter setup; Sentry is simpler for error-first monitoring |

### Installation

**Next.js:**
```bash
cd packages/web && bun add @sentry/nextjs
```

**Rust (Cargo.toml workspace.dependencies + decoded-api dependencies):**
```toml
sentry = { version = "0.47.0", features = ["tower-axum-matched-path", "tracing"] }
```

**Python:**
```bash
cd packages/ai-server && uv add "sentry-sdk[fastapi,grpcio]"
```

**Version verification:**
```bash
npm view @sentry/nextjs version        # confirmed 10.46.0
cargo search sentry                    # 0.47.0 (as per official Axum guide)
pip index versions sentry-sdk          # confirmed 2.56.0 (PyPI, 2026-03-24)
```

---

## Architecture Patterns

### Recommended Project Structure (Next.js additions)
```
packages/web/
├── instrumentation-client.ts    # Browser Sentry init (NEW)
├── sentry.server.config.ts      # Node.js Sentry init (NEW)
├── sentry.edge.config.ts        # Edge runtime Sentry init (NEW)
├── instrumentation.ts           # Next.js instrumentation hook (NEW)
├── next.config.js               # Wrap with withSentryConfig (MODIFY)
└── app/
    └── global-error.tsx         # React error boundary for App Router (NEW)
```

### Pattern 1: Next.js App Router Setup (SENT-01)
**What:** Five files + withSentryConfig in next.config.js. The `instrumentation.ts` file is the Next.js hook; `instrumentation-client.ts` runs in browser.
**When to use:** Next.js 15+ App Router with React 19

```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// instrumentation-client.ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Web Vitals captured automatically — no extra config needed
});

// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});

// instrumentation.ts (Next.js hook)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
export { onRequestError } from "@sentry/nextjs/server";
```

```javascript
// next.config.js — wrap with withSentryConfig
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = { /* existing config */ };

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Source maps uploaded automatically during `next build`
});
```

### Pattern 2: Rust Axum Setup (SENT-02)
**What:** Replace `#[tokio::main]` with manual runtime builder so Sentry guard outlives async runtime. Add two tower middleware layers.
**When to use:** Axum with tower-based middleware stack

```rust
// Source: https://docs.sentry.io/platforms/rust/guides/axum/
// main.rs — critical: init BEFORE tokio runtime

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Sentry MUST be initialized before the async runtime
    let _guard = sentry::init((
        std::env::var("SENTRY_DSN").unwrap_or_default(),
        sentry::ClientOptions {
            release: sentry::release_name!(),
            environment: Some(
                std::env::var("APP_ENV").unwrap_or_else(|_| "development".into()).into()
            ),
            traces_sample_rate: if cfg!(debug_assertions) { 1.0 } else { 0.1 },
            ..Default::default()
        },
    ));

    // Manual runtime replaces #[tokio::main]
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?
        .block_on(async_main())
}

async fn async_main() -> Result<(), Box<dyn std::error::Error>> {
    // ... existing tracing setup ...

    let app = axum::Router::new()
        // existing routes
        .layer(
            tower::ServiceBuilder::new()
                .layer(sentry_tower::NewSentryLayer::<axum::body::Body>::new_from_top())
                .layer(sentry_tower::SentryHttpLayer::new().enable_transaction())
                // existing middleware layers after
        )
        .with_state(state);
    // ... existing server start ...
}
```

**Cargo.toml addition:**
```toml
# workspace.dependencies
sentry = { version = "0.47.0", features = ["tower-axum-matched-path", "tracing"] }

# decoded-api [dependencies]
sentry = { workspace = true }
```

### Pattern 3: Python FastAPI + gRPC Setup (SENT-03)
**What:** Single `sentry_sdk.init()` call at app startup before FastAPI app creation, with both integrations listed.
**When to use:** FastAPI with grpcio-based gRPC server

```python
# Source: https://docs.sentry.io/platforms/python/integrations/fastapi/
# Source: https://docs.sentry.io/platforms/python/integrations/grpc/
# packages/ai-server/src/bootstrap.py (or config container init)

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.grpc import GRPCIntegration
import os

def init_sentry():
    dsn = os.environ.get("SENTRY_DSN", "")
    if not dsn:
        return  # gracefully skip in local dev without DSN
    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get("APP_ENV", "development"),
        traces_sample_rate=0.1 if os.environ.get("APP_ENV") == "production" else 1.0,
        integrations=[
            StarletteIntegration(),
            FastApiIntegration(),
            GRPCIntegration(),  # auto-instruments grpcio.aio.server()
        ],
        send_default_pii=False,
    )
```

### Pattern 4: Environment-Based DSN Configuration (SENT-04)
**What:** Separate DSN env vars per environment; same codebase reads from env, not hardcoded.

| Service | Variable | Scope |
|---------|----------|-------|
| Next.js client | `NEXT_PUBLIC_SENTRY_DSN` | Public (browser-accessible) |
| Next.js server/edge | `SENTRY_DSN` | Server-only |
| Next.js source maps | `SENTRY_AUTH_TOKEN` | Build-time CI only |
| Rust API server | `SENTRY_DSN` | Server runtime |
| Python AI server | `SENTRY_DSN` | Server runtime |

All services also read `APP_ENV` (or `NODE_ENV` for Next.js) to set Sentry's `environment` tag.

### Anti-Patterns to Avoid
- **Hardcoding DSN in source code:** DSN is semi-public but still should live in env vars for environment separation
- **Initializing Sentry inside `#[tokio::main]`:** The guard is dropped before async tasks complete — errors are lost; must init before runtime
- **Setting `tracesSampleRate: 1.0` in production:** Captures 100% of traces; causes performance overhead and Sentry quota consumption; use 0.05–0.1 in prod
- **Not wrapping next.config.js with `withSentryConfig`:** Source maps won't be uploaded; stack traces in Sentry will be minified and unreadable
- **Omitting `global-error.tsx`:** React render errors in App Router are not caught by the Node.js error handler; this file is the only way to capture them

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error grouping and fingerprinting | Custom error aggregation | Sentry SDK + Sentry dashboard | Fingerprinting, grouping, deduplication are non-trivial; Sentry handles automatically |
| Web Vitals collection | Manual PerformanceObserver code | @sentry/nextjs (auto) | SDK auto-captures LCP, FID/INP, CLS, TTFB as measurements on transactions |
| Source map handling | Manual source map upload scripts | `withSentryConfig` build plugin | Handles source map generation, upload, and hiding from public automatically |
| Request-to-error correlation | Custom request ID middleware | sentry-tower layers | NewSentryLayer + SentryHttpLayer handle Hub isolation and transaction creation |
| gRPC error interception | Custom gRPC interceptors | `GRPCIntegration()` | SDK adds interceptors automatically as of sentry-sdk 1.35.0 |

**Key insight:** Each language SDK handles the hardest parts (context isolation, async propagation, framework-specific hooks) that are subtle to implement correctly. The integration surface is small — init + middleware — but the internals are complex.

---

## Common Pitfalls

### Pitfall 1: Rust `#[tokio::main]` Incompatibility
**What goes wrong:** `sentry::init()` returns a guard that must be held for the process lifetime. Inside `#[tokio::main]`, the guard drops when `main()` returns, which is before all async tasks complete. Final error flushes are lost.
**Why it happens:** The macro expands to a blocking call that drops locals after the future resolves.
**How to avoid:** Replace `#[tokio::main]` with manual `tokio::runtime::Builder::new_multi_thread().build()?.block_on(...)`. Store the guard in `main()` scope, pass async logic to a separate `async_main()` function.
**Warning signs:** Sentry receives no events despite the init succeeding; final panics or shutdown errors are never captured.

### Pitfall 2: Next.js `next.config.js` vs `next.config.ts`
**What goes wrong:** The project uses `next.config.js` (CommonJS). The Sentry docs show `next.config.ts`. Mixing `withSentryConfig` import styles causes build failures.
**Why it happens:** `@sentry/nextjs` exports differ for ESM/CJS.
**How to avoid:** Use `const { withSentryConfig } = require("@sentry/nextjs");` in the existing `next.config.js` file (not `.ts`). Do not convert to `.ts` just for Sentry.

### Pitfall 3: Python gRPC Async Server Not Instrumented
**What goes wrong:** `GRPCIntegration` instruments `grpc.server()` (sync). The AI server uses `grpc.aio.server()` (async). Documentation notes async support was added in sentry-sdk 1.35.0 — verify the installed version handles `aio`.
**Why it happens:** Async gRPC support came later; older docs only show sync examples.
**How to avoid:** Install `sentry-sdk>=1.35.0` (current 2.56.0 is fine). Confirm `grpc.aio.server()` is instrumented by sending a test event via a gRPC call.
**Warning signs:** HTTP endpoint errors appear in Sentry but gRPC errors do not.

### Pitfall 4: `SENTRY_DSN` Empty String in Dev Causes Noise
**What goes wrong:** If `SENTRY_DSN` is set to an empty string or a stub, Sentry may log warnings or silently fail to send events, causing confusion about whether the setup works.
**Why it happens:** The SDK doesn't raise an error for invalid DSN in all cases.
**How to avoid:** In Python, guard initialization with `if dsn:` check. In Rust, `sentry::init("")` creates a disabled client — valid behavior, but test in a real environment before assuming dev is fine.

### Pitfall 5: Source Map Upload Requires `SENTRY_AUTH_TOKEN`
**What goes wrong:** `withSentryConfig` silently skips source map upload when `SENTRY_AUTH_TOKEN` is missing. Stack traces in Sentry remain minified.
**Why it happens:** Auth token is optional in config; the plugin fails gracefully but gives no prominent warning.
**How to avoid:** Add `SENTRY_AUTH_TOKEN` to `.env.local.example` (as a reminder) and to the production build environment. Verify source maps are uploaded by checking Sentry project settings > Source Maps.

---

## Code Examples

### Web Vitals in Sentry (OBS-02)
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/
// Web Vitals are captured AUTOMATICALLY — no code needed beyond standard init.
// They appear as measurements on page load transactions in Sentry Performance.
// Verify: Sentry > Performance > Web Vitals tab after first page load in production.

// Optional: control sample rate per-transaction
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // profilesSampleRate: 0.1, // optional continuous profiling
});
```

### Sentry Tracing Integration for Rust (foundation for OBS-01)
```rust
// Source: https://docs.sentry.io/platforms/rust/guides/tracing/
// Add to tracing_subscriber setup in async_main():
use sentry_tracing::EventFilter;

tracing_subscriber::registry()
    .with(env_filter)
    .with(tracing_subscriber::fmt::layer().json())
    .with(sentry_tracing::layer().event_filter(|md| {
        match *md.level() {
            tracing::Level::ERROR => EventFilter::Exception,
            tracing::Level::WARN  => EventFilter::Breadcrumb,
            _                     => EventFilter::Ignore,
        }
    }))
    .init();
```

### Verifying Sentry Is Working
```typescript
// packages/web/app/api/sentry-test/route.ts — temporary, delete after verification
export async function GET() {
  throw new Error("Sentry test error from Next.js server");
}
```

```rust
// Add a /sentry-test route to verify Rust integration — temporary
async fn sentry_test() -> &'static str {
    sentry::capture_message("Sentry test from Rust", sentry::Level::Info);
    "ok"
}
```

```python
# Trigger via gRPC or HTTP endpoint — temporary
import sentry_sdk
sentry_sdk.capture_message("Sentry test from Python AI server")
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sentry.client.config.ts` + `sentry.server.config.ts` | `instrumentation-client.ts` + `sentry.server.config.ts` + `instrumentation.ts` | @sentry/nextjs v8+ | Client file rename; `instrumentation.ts` is the official Next.js hook |
| Manual gRPC interceptors in Python | `GRPCIntegration()` auto-instruments | sentry-sdk 1.35.0 | No interceptor code needed |
| Separate `sentry-tower` crate | Built into `sentry` crate as feature | sentry 0.31+ | One crate, `tower-axum-matched-path` feature flag |
| `tracesSampleRate: 1.0` everywhere | Environment-based sampling | Best practice | Production cost control |

**Deprecated/outdated:**
- `@sentry/react` + `@sentry/node` separate packages for Next.js: Use `@sentry/nextjs` (includes both)
- Sentry `v7` wizard output files: Current wizard generates `instrumentation-client.ts` not `sentry.client.config.ts`

---

## Open Questions

1. **Single Sentry project vs. multiple projects**
   - What we know: One project is simpler; multiple projects give per-service quotas and alert rules
   - What's unclear: Organization has no stated preference
   - Recommendation: Start with one project, use `environment` + `server_name` tags to distinguish services; split later if needed

2. **Rust tracing `sentry_tracing` layer — dual logging concern**
   - What we know: The existing tracing setup logs to stdout; adding sentry_tracing layer sends errors to Sentry too
   - What's unclear: Whether `ERROR` level tracing events from SeaORM/tower internals generate too much noise
   - Recommendation: Use custom `EventFilter` to only send application-level errors; filter out library internals

3. **OBS-01 cross-service trace propagation depth**
   - What we know: GRPCIntegration propagates Sentry trace headers automatically in outgoing gRPC calls
   - What's unclear: Whether the Rust → Python gRPC channel (via tonic) passes Sentry headers; tonic uses HTTP/2 metadata, not standard HTTP headers
   - Recommendation: Implement basic integration first; add OBS-01 trace propagation as follow-up if tonic metadata headers need custom propagation

---

## Validation Architecture

> nyquist_validation key is absent from .planning/config.json — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (packages/web) + pytest (packages/ai-server) + cargo test (packages/api-server) |
| Config file | `packages/web/vitest.config.ts` / `packages/ai-server/pytest.ini` |
| Quick run command | `cd packages/web && bun run test --run` |
| Full suite command | `cd packages/web && bun run test --run && cd ../api-server && cargo test && cd ../ai-server && uv run pytest` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SENT-01 | Sentry init doesn't throw in browser/server | smoke | `cd packages/web && bun run build` (build fails if sentry init broken) | ❌ Wave 0 |
| SENT-02 | Rust server starts with Sentry guard; events captured | smoke | `cd packages/api-server && cargo build` | ❌ Wave 0 |
| SENT-03 | Python server init with sentry_sdk succeeds | smoke | `cd packages/ai-server && uv run python -c "import sentry_sdk"` | ❌ Wave 0 |
| SENT-04 | DSN env var missing → Sentry disabled, server still starts | unit | `cd packages/web && bun run build` (NODE_ENV check) | ❌ Wave 0 |
| OBS-02 | Web Vitals captured in Sentry transactions | manual-only | Browser DevTools + Sentry Performance tab in staging | N/A — manual |

**Note:** Sentry integration is predominantly a configuration and startup concern. The primary automated validation is that `cargo build` and `next build` succeed with the new dependencies. Runtime validation (errors appearing in Sentry, Web Vitals showing up) requires a staging environment with real DSN.

### Wave 0 Gaps
- [ ] No Wave 0 test files needed — existing build commands (`cargo build`, `bun run build`) serve as smoke tests
- [ ] `.env.local.example` additions: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `APP_ENV`

---

## Sources

### Primary (HIGH confidence)
- https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/ — Next.js manual setup files list, env vars, withSentryConfig
- https://docs.sentry.io/platforms/rust/guides/axum/ — Axum integration, tokio runtime constraint, middleware layers, version 0.47.0
- https://docs.sentry.io/platforms/python/integrations/fastapi/ — FastAPI integration, auto-detection, version requirements
- https://docs.sentry.io/platforms/python/integrations/grpc/ — GRPCIntegration, async support, grpcio version requirements
- https://docs.sentry.io/platforms/rust/guides/tracing/ — sentry-tracing layer integration with tracing-subscriber
- npm registry — `@sentry/nextjs@10.46.0` peer deps confirm Next.js 16 support
- PyPI — `sentry-sdk 2.56.0` confirmed latest (2026-03-24)

### Secondary (MEDIUM confidence)
- https://docs.sentry.io/platforms/javascript/guides/nextjs/ — Web Vitals auto-capture in @sentry/nextjs
- https://github.com/getsentry/sentry-rust — Official Rust SDK repository

### Tertiary (LOW confidence)
- None — all critical claims verified with official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry, PyPI, and official docs
- Architecture: HIGH — patterns sourced from official Sentry docs for each platform
- Pitfalls: HIGH — tokio runtime constraint is documented explicitly; others derived from official docs
- Web Vitals: HIGH — official docs confirm auto-capture with no additional code

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (Sentry SDKs release frequently; verify versions at implementation time)
