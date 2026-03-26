---
phase: 46
slug: follow-system-backend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 46 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | cargo test (Rust) |
| **Config file** | `packages/api-server/Cargo.toml` |
| **Quick run command** | `cd packages/api-server && cargo check` |
| **Full suite command** | `cd packages/api-server && cargo test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/api-server && cargo check`
- **After every plan wave:** Run `cd packages/api-server && cargo test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 46-01-01 | 01 | 1 | FLLW-01 | manual | SQL migration file exists | N/A | ⬜ pending |
| 46-01-02 | 01 | 1 | FLLW-02, FLLW-03 | unit | `cargo check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Cargo test framework is already configured.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration creates user_follows table in Supabase | FLLW-01 | Requires live database | Apply migration, verify table with `\d user_follows` |
| RLS allows public read | FLLW-01 | Requires live Supabase | Query as anonymous/different user |
| UserResponse includes follow counts | FLLW-03 | OpenAPI spec check | Run server, GET /api/v1/users/me, verify JSON |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
