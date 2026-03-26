---
phase: 45
slug: security-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 45-01-01 | 01 | 1 | RATE-01 | grep | `grep -r "tower_governor" packages/api-server/` | ❌ W0 | ⬜ pending |
| 45-01-02 | 01 | 1 | RATE-02 | grep | `grep -r "KeyExtractor" packages/api-server/` | ❌ W0 | ⬜ pending |
| 45-02-01 | 02 | 1 | RATE-03 | grep | `grep -r "rateLimitMap" packages/web/app/api/` | ❌ W0 | ⬜ pending |
| 45-03-01 | 03 | 2 | SEC-01 | grep | `grep -rn "console\.\(log\|error\)" packages/web/app/api/ \| wc -l` | ✅ | ⬜ pending |
| 45-03-02 | 03 | 2 | SEC-02 | grep | `grep -r "requiredEnvVars" packages/web/` | ❌ W0 | ⬜ pending |
| 45-03-03 | 03 | 2 | SEC-03 | grep | `grep -r "originalStatus\|upstream" packages/web/app/api/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing vitest infrastructure covers web package
- Rate limiting verification is grep-based (no new test files needed)
- Rust changes verified via `cargo check` in api-server

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rate limit 429 response | RATE-01 | Requires running server + repeated requests | `curl -X POST localhost:8080/api/v1/posts/analyze` x 11 times within 60s |
| Proxy error propagation | SEC-03 | Requires backend returning specific error codes | Trigger 422/503 from backend, verify proxy passes status through |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
