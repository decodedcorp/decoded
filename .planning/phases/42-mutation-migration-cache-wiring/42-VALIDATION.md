---
phase: 42
slug: mutation-migration-cache-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (bun run typecheck) |
| **Config file** | packages/web/tsconfig.json |
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
| 42-01-01 | 01 | 1 | MIG-05 | typecheck | `bun run typecheck` | ✅ | ⬜ pending |
| 42-02-01 | 02 | 2 | MIG-06 | typecheck + grep | `bun run typecheck` | ✅ | ⬜ pending |
| 42-02-02 | 02 | 2 | MIG-09 | typecheck + grep | `bun run typecheck` | ✅ | ⬜ pending |
| 42-03-01 | 03 | 3 | MIG-07 | typecheck + file check | `bun run typecheck && ! test -f packages/web/lib/api/client.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. TypeScript compiler is the primary validation mechanism.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Profile update → header avatar updates | MIG-06 | Zustand store visual side-effect | Edit profile → verify header avatar changes immediately |
| Post create → feed refresh | MIG-05 | Cache invalidation visual | Create post → navigate to feed → verify new post appears |
| Comment create → list refresh | MIG-05 | Cache invalidation visual | Add comment → verify it appears in comment list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
