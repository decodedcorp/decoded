---
phase: 39
slug: setup-spec-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in packages/web) |
| **Config file** | `packages/web/vitest.config.ts` or "none — Wave 0 installs" |
| **Quick run command** | `cd packages/web && bun run test --run` |
| **Full suite command** | `cd packages/web && bun run test --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bun run test --run`
- **After every plan wave:** Run `cd packages/web && bun run test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 39-01-01 | 01 | 1 | INFRA-01 | integration | `bun install --dry-run` | ✅ | ⬜ pending |
| 39-01-02 | 01 | 1 | SPEC-03 | unit | `bun run test --run` | ❌ W0 | ⬜ pending |
| 39-02-01 | 02 | 1 | SPEC-01 | integration | `curl localhost:3001/api-docs/openapi.json \| jq .openapi` | ✅ | ⬜ pending |
| 39-02-02 | 02 | 1 | SPEC-02 | script | `node scripts/audit-operationids.mjs` | ❌ W0 | ⬜ pending |
| 39-02-03 | 02 | 1 | SPEC-05 | script | `grep -c '"in":"query"' openapi.json` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/web/orval.config.ts` — skeleton config file
- [ ] `scripts/audit-operationids.mjs` — operationId audit script stub
- [ ] Verify vitest is installed and working in packages/web

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Backend server starts | SPEC-01 | Requires running Rust server | Start `cargo run` in api-server, verify `/api-docs/openapi.json` responds |
| Spec version visual check | SPEC-01 | One-time confirmation | Open spec JSON, verify `"openapi": "3.1.0"` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
