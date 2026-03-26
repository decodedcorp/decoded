# Phase 45: Security Foundation - Research

**Researched:** 2026-03-26
**Domain:** Rust/Axum rate limiting (tower-governor) + Next.js in-memory rate limiting + proxy error propagation + debug log removal + env validation
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RATE-01 | Axum에 tower-governor 미들웨어를 추가하여 AI 분석 엔드포인트에 GCRA 기반 Rate Limiting 적용 | tower_governor 0.8.0 is axum 0.8-compatible; apply as per-route layer on `/api/v1/posts/analyze` |
| RATE-02 | Per-user JWT 기반 커스텀 키 추출기 구현 (IP 대신 유저 ID로 제한) | KeyExtractor trait + bearer token extraction pattern confirmed in tower-governor examples |
| RATE-03 | Next.js proxy 레이어(image-proxy 등)에 in-memory sliding window 방어 Rate Limiting 추가 | Map-based in-memory limiter (no Redis) matches the "single server" constraint from REQUIREMENTS.md |
| RATE-04 | 제한 초과 시 429 Too Many Requests 응답 + Retry-After 헤더 반환 | tower-governor emits 429 by default; Retry-After header configurable via GovernorHeaderCompatible |
| SEC-01 | 디버그 로깅 제거 — console.log/debug를 production에서 제거 | 28 API route files have console.log; ImageDetailModal.tsx has explicit debug useEffect |
| SEC-02 | 환경변수 검증 — 필수 변수 누락 시 startup에서 명시적 실패 | AppConfig.from_env() already uses .expect() for critical vars; Next.js side has silent fallbacks via `\|\| ""` |
| SEC-03 | 프록시 에러 전파 — 백엔드 429/401/422를 클라이언트로 정확히 전파 | Current proxy routes already forward status codes on happy path; catch block swallows to 502/500 |

Note: SEC-01, SEC-02, SEC-03 are not listed in REQUIREMENTS.md but are referenced in the ROADMAP.md Phase 45 description. They represent implicit requirements for the phase goal "디버그 로깅 제거, 환경변수 검증, 프록시 에러 전파."
</phase_requirements>

---

## Summary

Phase 45 has four distinct work streams: (1) Axum-side rate limiting with tower-governor targeting the `/posts/analyze` AI endpoint; (2) a custom JWT-based KeyExtractor so limits apply per-user rather than per-IP; (3) a Next.js-side in-memory sliding window limiter for proxy routes like `image-proxy`; and (4) hardening work on the proxy layer — removing debug `console.log` statements, validating env vars at startup, and ensuring backend error status codes (429, 401, 422) propagate faithfully to the client.

The Rust backend already has a working JWT auth middleware that extracts `User` from Bearer tokens; the GCRA key extractor for rate limiting should extract the same `sub` claim. The Next.js proxy routes follow a consistent pattern but have two recurring problems: `console.error()` called in catch blocks that expose internal details, and a `const API_BASE_URL = process.env.API_BASE_URL` check that silently returns 500 instead of failing at module load time.

The single-server deployment constraint (documented in REQUIREMENTS.md Out of Scope: "Redis 기반 분산 Rate Limiting — 현재 단일 서버 배포") means in-memory solutions (Rust `governor` crate state + Next.js `Map<string, number[]>`) are the correct choice.

**Primary recommendation:** Add `tower_governor = "0.8"` to Cargo.toml, implement a `JwtUserKeyExtractor`, apply it as a route-layer on `/analyze`. On the Next.js side, create `packages/web/lib/rate-limit.ts` with a shared sliding-window utility and apply it in `image-proxy/route.ts` and `posts/analyze/route.ts`.

---

## Standard Stack

### Core — Rust (Axum)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tower_governor | 0.8.0 | GCRA-based rate limiting layer for Tower/Axum | Official ecosystem crate; axum ^0.8 explicit support; built-in 429 + Retry-After |
| governor (transitive) | latest | Underlying GCRA algorithm implementation | Pulled in by tower_governor |

### Core — Next.js Proxy

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (no new npm dep) | — | In-memory sliding window via module-level Map | REQUIREMENTS.md explicitly excludes Redis; a 15-line utility avoids dep bloat |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| moka (already in Cargo.toml) | 0.12 | Async TTL cache for rate limit state | Could back the rate limiter store if DashMap isn't desired; tower_governor uses governor internally so moka is not needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tower_governor | axum_gcra | axum_gcra is lighter but less maintained; tower_governor has 0.8 compat confirmed |
| Module-level Map | next-limitr npm package | Adds a dep for ~20 lines of code; in-memory Map is sufficient for single-server |
| Map<string,number[]> | LRU-cache npm | LRU adds dep; not needed at current scale |

**Installation (Rust):**
```toml
# packages/api-server/Cargo.toml [dependencies]
tower_governor = { version = "0.8", features = [] }
```

**Version verification:** Confirmed `tower_governor 0.8.0` on docs.rs (2026-03-26). Axum ^0.8 compatibility explicitly listed.

---

## Architecture Patterns

### Recommended Project Structure Changes

```
packages/api-server/src/middleware/
├── mod.rs            # add pub mod rate_limit; pub use rate_limit::*;
├── rate_limit.rs     # NEW: JwtUserKeyExtractor + GovernorConfig builder

packages/web/lib/
├── rate-limit.ts     # NEW: sliding window utility (module-level Map)

packages/web/app/api/v1/
├── image-proxy/route.ts    # apply rateLimit()
├── posts/analyze/route.ts  # apply rateLimit()
└── lib/env.ts (or config/) # NEW or update: validated env loader
```

### Pattern 1: tower-governor per-route layer on Axum

**What:** Apply `GovernorLayer` only on the expensive AI endpoint, not globally.
**When to use:** When you want coarse global limits + fine-grained per-endpoint limits.

```rust
// Source: https://docs.rs/tower_governor/latest/tower_governor/
// packages/api-server/src/middleware/rate_limit.rs

use axum::{extract::Request, http::StatusCode, response::Response};
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::KeyExtractor, GovernorLayer,
};
use std::net::IpAddr;

/// Extracts the Supabase JWT `sub` claim as rate-limit key.
/// Falls back to client IP if no valid Bearer token present.
#[derive(Clone)]
pub struct JwtUserKeyExtractor;

impl KeyExtractor for JwtUserKeyExtractor {
    type Key = String;

    fn extract<T>(&self, req: &Request<T>) -> Result<Self::Key, tower_governor::GovernorError> {
        // Try Bearer token first
        if let Some(auth) = req.headers().get("Authorization") {
            if let Ok(s) = auth.to_str() {
                if let Some(token) = s.strip_prefix("Bearer ") {
                    // Decode without verification just to extract sub (verification
                    // already done by auth_middleware upstream)
                    if let Ok(claims) = decode_sub_only(token) {
                        return Ok(claims);
                    }
                }
            }
        }
        // Anonymous fallback: use peer IP
        req.extensions()
            .get::<std::net::SocketAddr>()
            .map(|addr| addr.ip().to_string())
            .ok_or(tower_governor::GovernorError::UnableToExtractKey)
    }
}

/// Build a GovernorConfig for AI endpoint: 10 req/min, burst 3
pub fn ai_endpoint_governor() -> GovernorLayer<JwtUserKeyExtractor, tower_governor::governor::clock::DefaultClock> {
    let config = GovernorConfigBuilder::default()
        .per_second(10)         // replenish 10 tokens/s (= 10 req/min with burst)
        .burst_size(3)          // allow short bursts up to 3
        .key_extractor(JwtUserKeyExtractor)
        .use_headers()          // emit X-RateLimit-* and Retry-After headers
        .finish()
        .unwrap();
    GovernorLayer::new(config)
}
```

Apply in the posts router:
```rust
// packages/api-server/src/domains/posts/handlers.rs
use crate::middleware::ai_endpoint_governor;

pub fn router(config: AppConfig) -> Router<AppState> {
    let public_routes = Router::new()
        .route("/analyze", post(analyze_image))
        .layer(ai_endpoint_governor());  // <-- only on /analyze

    Router::new()
        // ...protected routes...
        .merge(public_routes)
}
```

### Pattern 2: Next.js in-memory sliding window

**What:** Module-level `Map<string, number[]>` keyed by IP (image-proxy) or user header.
**When to use:** Single-server deployments, no Redis, defense-in-depth before the Axum layer.

```typescript
// Source: freecodecamp.org/news/how-to-build-an-in-memory-rate-limiter-in-nextjs
// packages/web/lib/rate-limit.ts

const requestLog = new Map<string, number[]>();

interface RateLimitOptions {
  windowMs: number;   // window duration in ms
  max: number;        // max requests per window
}

export function checkRateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  const timestamps = (requestLog.get(key) ?? []).filter(t => t > windowStart);
  timestamps.push(now);
  requestLog.set(key, timestamps);

  return timestamps.length <= opts.max;
}

export function getClientKey(req: Request): string {
  // In Next.js App Router, use x-forwarded-for or a fallback
  const forwarded = (req as any).headers?.get?.("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
```

Usage in a route:
```typescript
// packages/web/app/api/v1/image-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const key = getClientKey(request);
  if (!checkRateLimit(key, { windowMs: 60_000, max: 60 })) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }
  // ... existing fetch logic
}
```

### Pattern 3: Proxy error propagation fix

**What:** Forward backend status codes faithfully — especially 429, 401, 422.
**When to use:** All proxy routes that call `${API_BASE_URL}`.

The current pattern is correct for happy paths but catch blocks override status to 500/502:

```typescript
// BEFORE (current — loses backend status in catch):
} catch (error) {
  console.error("Analyze proxy error:", error);        // SEC-01: remove
  return NextResponse.json({ message: "..." }, { status: 502 });
}

// AFTER (propagate properly):
} catch (error) {
  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.error("Analyze proxy error:", error);
  }
  return NextResponse.json(
    { message: error instanceof Error ? error.message : "Proxy error" },
    { status: 502 }
  );
}
```

For the `response.status` path, the routes already pass through status codes correctly via `NextResponse.json(data, { status: response.status })`. No change needed there.

### Pattern 4: Environment variable validation

**What:** Validate required env vars once at module load, not per-request.
**When to use:** Any Next.js API route that reads `API_BASE_URL` or other server vars.

```typescript
// packages/web/lib/server-env.ts (new file)
function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

// Evaluated at module load time — fails fast on misconfiguration
export const API_BASE_URL = requireEnv("API_BASE_URL");
```

Then in route files replace:
```typescript
// BEFORE:
const API_BASE_URL = process.env.API_BASE_URL;
if (!API_BASE_URL) {
  console.error("API_BASE_URL environment variable is not configured");
  return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
}

// AFTER:
import { API_BASE_URL } from "@/lib/server-env";
// No runtime check needed — throws at startup if missing
```

Note: Rust `AppConfig::from_env()` already uses `.expect()` for `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. No Rust-side change needed for these. Other optional vars (R2, Meilisearch, etc.) fall back to empty strings by design.

### Anti-Patterns to Avoid

- **Global rate limiting on all routes:** Do not apply GovernorLayer at the `app` level — it will rate-limit health checks and non-AI routes.
- **Decoding JWT with signature verification in KeyExtractor:** The auth middleware already verifies the JWT. In the KeyExtractor, decode without verify (just parse the claims) to avoid duplicate verification and JWKS fetching overhead.
- **Storing rate limit state in a Zustand store or request-scoped variable:** Module-level Map is required for persistence across Next.js requests (serverless functions per-process).
- **Removing `console.error` in catch blocks entirely:** Production errors still need logging. Change to `if (process.env.NODE_ENV === "development")` guard, not deletion.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GCRA algorithm implementation | Custom token bucket in Rust | `tower_governor` 0.8 | Handles burst, starvation, atomic ops — non-trivial to get right |
| Tower Layer/Service wrapping | Custom `Service` impl | `tower_governor::GovernorLayer` | Tower layer composition is boilerplate-heavy |
| 429 header formatting | Custom Retry-After calculation | `use_headers()` on GovernorConfig | tower_governor computes correct Retry-After from GCRA state |
| JWT `sub` decoding (no verify) | Full JWT decode pipeline | `jsonwebtoken::dangerous_insecure_decode` or manual base64 split | Simple enough for KeyExtractor, but use existing `jsonwebtoken` crate already in Cargo.toml |

**Key insight:** The `governor` crate's GCRA implementation handles the hard parts: atomic cell updates, burst estimation, and correct Retry-After computation. Building this from scratch is a multi-day effort.

---

## Common Pitfalls

### Pitfall 1: tower_governor version mismatch with axum
**What goes wrong:** `axum_layer` feature flag changes between tower_governor versions; older 0.3.x docs do not match 0.8.0 API.
**Why it happens:** The crate was renamed and restructured between minor versions.
**How to avoid:** Pin to `tower_governor = "0.8"` and read docs.rs/tower_governor/latest, not blog posts from 2023.
**Warning signs:** Compilation errors about `GovernorLayer::new` not accepting `Arc<GovernorConfig>`.

### Pitfall 2: JWT decode in KeyExtractor causes double JWKS fetch
**What goes wrong:** Full `verify_supabase_token` inside KeyExtractor triggers an HTTP call to Supabase JWKS endpoint for every rate-limited request.
**Why it happens:** Auth middleware and KeyExtractor both run on the same request.
**How to avoid:** In the KeyExtractor, only decode the JWT claims without signature verification. The auth middleware (which runs first) already rejected invalid tokens. Use `jsonwebtoken::dangerous_insecure_decode::<Claims>` or parse the base64-encoded payload manually.
**Warning signs:** Latency spikes on `/analyze`, JWKS endpoint throttling.

### Pitfall 3: Next.js in-memory Map not shared across serverless invocations
**What goes wrong:** On serverless deployments (Vercel), each function instance has its own Map — rate limiting is per-instance, not global.
**Why it happens:** Node.js module state is not shared across Lambda invocations.
**How to avoid:** This is acceptable for the current single-server deployment (REQUIREMENTS.md documents Redis as out of scope). Document this limitation in the code comment.
**Warning signs:** Rate limits appear to reset unexpectedly on Vercel or edge deployments.

### Pitfall 4: `console.error` removal breaks production error visibility
**What goes wrong:** If all `console.error` calls are removed, production errors become invisible before Sentry is added (Phase 47).
**Why it happens:** Over-eager cleanup.
**How to avoid:** Wrap in `if (process.env.NODE_ENV === "development")` guard, not delete. Phase 47 (Sentry) will provide structured error tracking.
**Warning signs:** 502 errors in production with zero log output.

### Pitfall 5: `debug-env` route exposes env var presence in production
**What goes wrong:** `GET /api/v1/debug-env` returns `has_supabase_url: true/false` — information leakage.
**Why it happens:** The route was built for development debugging and never guarded.
**How to avoid:** Add `if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Not found" }, { status: 404 });` at the top, or delete the route entirely.
**Warning signs:** The route responds 200 in production.

### Pitfall 6: GovernorLayer applied before auth middleware — anonymous users consume user quota
**What goes wrong:** If GovernorLayer runs before auth_middleware, unauthenticated requests fall back to IP key and exhaust the IP quota before the JWT fallback path is reached.
**Why it happens:** Axum applies layers in reverse order of `.layer()` calls.
**How to avoid:** For the `/analyze` route (currently unauthenticated per CONCERNS.md), the fallback-to-IP behavior is acceptable. If auth is added to `/analyze` later, ensure auth_middleware wraps the route before the GovernorLayer.

---

## Code Examples

### Rust: Decode JWT sub-only (no signature verify)

```rust
// Source: jsonwebtoken crate docs (https://docs.rs/jsonwebtoken)
use jsonwebtoken::{dangerous_insecure_decode, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Deserialize)]
struct SubClaim { sub: String }

fn extract_sub(token: &str) -> Option<String> {
    let mut validation = Validation::default();
    validation.insecure_disable_signature_validation();
    dangerous_insecure_decode::<SubClaim>(token)
        .ok()
        .map(|t| t.claims.sub)
}
```

### Rust: Apply GovernorLayer per-route

```rust
// Source: https://docs.rs/tower_governor/0.8.0/tower_governor/
use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};

let analyze_governor = {
    let config = GovernorConfigBuilder::default()
        .per_second(1)      // 1 token per second (60/min)
        .burst_size(5)      // burst of 5
        .key_extractor(JwtUserKeyExtractor)
        .use_headers()
        .finish()
        .expect("valid governor config");
    GovernorLayer::new(config)
};

Router::new()
    .route("/analyze", post(analyze_image))
    .layer(analyze_governor)
```

### TypeScript: Rate limit response with Retry-After

```typescript
// Standard HTTP 429 + Retry-After response for Next.js routes
return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
  status: 429,
  headers: {
    "Content-Type": "application/json",
    "Retry-After": "60",
  },
});
```

---

## Current Codebase State (Audit)

### Files with `console.log` / `console.debug` in API routes (28 files)
Key files to address:
- `packages/web/app/api/v1/posts/analyze/route.ts` — `console.error` in catch + on non-JSON response
- `packages/web/app/api/v1/posts/route.ts` — `console.error` on missing env + in catch
- `packages/web/app/api/v1/vton/route.ts` — `console.log` for debug
- 25 additional route files with `console.log`/`console.error`

### `debug-env` endpoint
- `packages/web/app/api/v1/debug-env/route.ts` — exposes env var presence, no env guard.

### Env validation pattern (current — Next.js side)
```typescript
const API_BASE_URL = process.env.API_BASE_URL;  // silent undefined
if (!API_BASE_URL) {
  console.error("...");
  return NextResponse.json({ ... }, { status: 500 });  // per-request check
}
```
28 proxy route files repeat this check. A single `lib/server-env.ts` module would consolidate.

### Proxy error propagation gap
Current routes forward backend status codes correctly via `NextResponse.json(data, { status: response.status })`. The gap is in `catch` blocks which emit generic 502/500 and swallow original backend errors.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tower-governor 0.3 (axum 0.6) | tower_governor 0.8 (axum 0.8) | 2024 | API changed: GovernorLayer::new takes config directly, not Arc |
| IP-only rate limiting | Per-key with KeyExtractor trait | 0.4+ | Enables per-user limits without Redis |
| next-rate-limit (abandoned) | In-memory Map or upstash/ratelimit | 2024 | next-rate-limit package unmaintained; custom Map is idiomatic |

**Deprecated/outdated:**
- `tower_governor::GovernorLayer::new(Arc<GovernorConfig>)`: Old API. Current 0.8 uses `GovernorLayer::new(GovernorConfig)` directly.
- `:param` path syntax in Axum: Project already uses `{param}` syntax (per CLAUDE.md rule 2.3).

---

## Open Questions

1. **Rate limits for `/posts/analyze` — authenticated or unauthenticated?**
   - What we know: CONCERNS.md notes `/analyze` "doesn't require authentication and has no rate limiting." REQUIREMENTS.md says RATE-01 applies to "AI 분석 엔드포인트."
   - What's unclear: RATE-02 says "per-user JWT" — but if analyze is unauthenticated, there's no JWT.
   - Recommendation: Implement per-IP fallback for unauthenticated requests (tower-governor KeyExtractor already supports this pattern). Do not block the rate limiting work on adding auth.

2. **Which Next.js proxy routes get rate limiting (RATE-03)?**
   - What we know: `image-proxy` is explicitly mentioned in REQUIREMENTS.md. The analyze proxy route also processes AI calls.
   - What's unclear: Whether all 28 proxy routes or only the expensive ones get rate limited.
   - Recommendation: Apply to `image-proxy` (external fetch, bandwidth cost) and `posts/analyze` proxy (AI cost). Skip pure CRUD proxy routes.

3. **SEC-01/SEC-02/SEC-03 scope — all 28 route files or targeted?**
   - What we know: 28 files have console.log/error. The `lib/server-env.ts` pattern would touch all routes that read `API_BASE_URL`.
   - Recommendation: Address all 28 files for console.log removal (mechanical change), but scope env-validation fix to the `API_BASE_URL` pattern (most critical). The `debug-env` route should be removed entirely.

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Rust: `cargo test` (built-in); Next.js: no test runner configured yet (added in Phase 48) |
| Config file | `packages/api-server/` — no separate config; `cargo test` runs inline `#[cfg(test)]` modules |
| Quick run command | `cd packages/api-server && cargo test middleware::rate_limit` |
| Full suite command | `cd packages/api-server && cargo test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RATE-01 | GovernorLayer blocks 4th request after burst=3 | unit | `cargo test rate_limit` | ❌ Wave 0 |
| RATE-02 | JwtUserKeyExtractor extracts sub from valid Bearer | unit | `cargo test jwt_key_extractor` | ❌ Wave 0 |
| RATE-03 | checkRateLimit returns false after max requests | unit (ts) | Phase 48 (no runner yet) | ❌ manual verification |
| RATE-04 | 429 + Retry-After header present on limit exceeded | integration | `cargo test rate_limit_429_response` | ❌ Wave 0 |
| SEC-01 | No console.log in API routes (prod build) | lint/grep | `grep -r "console\\.log" packages/web/app/api/ \| wc -l` (should be 0) | ✅ grep |
| SEC-02 | Missing API_BASE_URL throws at startup | unit (ts) | Phase 48 | ❌ manual |
| SEC-03 | 429 from backend propagates as 429 to client | integration | Phase 48 E2E | ❌ manual verification |

### Sampling Rate
- **Per task commit:** `cd packages/api-server && cargo test`
- **Per wave merge:** `cargo test` + `grep -r "console\.log" packages/web/app/api/`
- **Phase gate:** Rust tests green + zero console.log grep hits + manual 429 smoke test

### Wave 0 Gaps
- [ ] `packages/api-server/src/middleware/rate_limit.rs` — `#[cfg(test)] mod tests` block covering RATE-01, RATE-02, RATE-04
- [ ] Manual test script for RATE-03 (Next.js in-memory) and SEC-03 (proxy propagation) — document in plan

---

## Sources

### Primary (HIGH confidence)
- docs.rs/tower_governor/0.8.0 — version confirmed 0.8.0, axum ^0.8 compatibility, KeyExtractor API
- github.com/benwis/tower-governor/examples/src/custom_key_bearer.rs — per-user bearer token extraction pattern
- packages/api-server/src/middleware/ (local codebase) — existing middleware patterns
- packages/web/app/api/v1/\*\*/route.ts (local codebase) — current console.log audit (28 files), error propagation patterns

### Secondary (MEDIUM confidence)
- shuttle.dev/blog/2024/02/22/api-rate-limiting-rust — GCRA usage patterns with governor crate
- freecodecamp.org/news/how-to-build-an-in-memory-rate-limiter-in-nextjs — sliding window Map pattern

### Tertiary (LOW confidence)
- WebSearch results for "next-limitr" — npm package mentioned but not evaluated for fitness

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tower_governor 0.8.0 axum compatibility confirmed on docs.rs
- Architecture: HIGH — based on direct codebase audit of all affected files
- Pitfalls: HIGH — derived from actual code patterns found in codebase + confirmed GCRA behavior

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable crates; tower_governor unlikely to have breaking changes within 30 days)
