---
phase: 41
slug: read-hook-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (not yet installed — typecheck via `bun run typecheck`) |
| **Config file** | packages/web/tsconfig.json (typecheck) |
| **Quick run command** | `cd packages/web && bun run typecheck` |
| **Full suite command** | `cd packages/web && bun run typecheck && bun run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bun run typecheck`
- **After every plan wave:** Run `cd packages/web && bun run typecheck && bun run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 41-01-01 | 01 | 1 | MIG-01 | typecheck | `bun run typecheck` | ✅ | ⬜ pending |
| 41-01-02 | 01 | 1 | MIG-08 | typecheck + grep | `bun run typecheck && grep -r "from.*types" packages/web/lib/api/ --include="*.ts"` | ✅ | ⬜ pending |
| 41-02-01 | 02 | 1 | MIG-02 | typecheck | `bun run typecheck` | ✅ | ⬜ pending |
| 41-03-01 | 03 | 2 | MIG-03 | typecheck | `bun run typecheck` | ✅ | ⬜ pending |
| 41-04-01 | 04 | 2 | MIG-04 | typecheck | `bun run typecheck` | ✅ | ⬜ pending |
| 41-04-02 | 04 | 2 | MIG-08 | typecheck + grep | `bun run typecheck && ! test -f packages/web/lib/api/types.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. TypeScript compiler and ESLint are already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Post list renders correctly after hook swap | MIG-03 | Visual rendering check | Navigate to `/`, verify post cards show images/titles |
| Admin dashboard stats display | MIG-04 | Visual + data check | Navigate to `/admin`, verify dashboard stats load |
| User profile loads via REST | MIG-03 | Functional data source change | Login → `/profile`, verify user data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
