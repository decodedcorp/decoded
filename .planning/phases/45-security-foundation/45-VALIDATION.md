---
phase: 45
slug: security-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
updated: 2026-03-26
---

# Phase 45 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) + manual curl for rate limiting |
| **Config file** | `packages/web/vitest.config.ts` |
| **Quick run command** | `cd packages/web && bunx vitest run --reporter=verbose` |
| **Full suite command** | `cd packages/web && bunx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bunx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd packages/web && bunx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 45-01-01 | 01 | 1 | RATE-01 | grep | `grep -r "tower_governor" packages/api-server/Cargo.toml` | ⬜ pending |
| 45-01-02 | 01 | 1 | RATE-02, RATE-04 | grep | `grep -r "impl KeyExtractor" packages/api-server/src/middleware/rate_limit.rs && grep "use_headers" packages/api-server/src/middleware/rate_limit.rs` | ⬜ pending |
| 45-01-03 | 01 | 1 | RATE-04 | grep | `grep "ai_rate_limit_layer" packages/api-server/src/domains/posts/handlers.rs` | ⬜ pending |
| 45-02-01 | 02 | 1 | RATE-03, RATE-04 | grep | `grep -c "checkRateLimit" packages/web/app/api/v1/image-proxy/route.ts packages/web/app/api/v1/posts/analyze/route.ts` | ⬜ pending |
| 45-02-02 | 02 | 1 | SEC-01, SEC-02, SEC-03 | grep | `grep -rn "console\.(log\|error)" packages/web/app/api/v1/posts/ packages/web/app/api/v1/vton/ packages/web/app/api/v1/users/ --include="*.ts" \| grep -v NODE_ENV \| wc -l` | ⬜ pending |
| 45-02-03 | 02 | 1 | SEC-01, SEC-02, SEC-03 | grep | `grep -rn "console\.(log\|error)" packages/web/app/api/v1/ --include="*.ts" \| grep -v NODE_ENV \| wc -l` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing vitest infrastructure covers web package
- Rate limiting verification is grep-based (no new test files needed)
- Rust changes verified via `cargo check` and `cargo test` in api-server

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rate limit 429 response (Axum) | RATE-01, RATE-04 | Requires running server + repeated requests | `curl -X POST localhost:8080/api/v1/posts/analyze` x 4+ times within 60s — expect 429 with Retry-After header |
| Rate limit 429 response (Next.js) | RATE-03, RATE-04 | Requires running server + repeated requests | `curl localhost:3000/api/v1/image-proxy?url=...` x 61+ times within 60s — expect 429 with Retry-After header |
| Catch block sanitization | SEC-03 | Requires inducing a network error on proxy fetch | Shut down api-server, hit any proxy route — verify response body has no stack trace or internal URL |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
