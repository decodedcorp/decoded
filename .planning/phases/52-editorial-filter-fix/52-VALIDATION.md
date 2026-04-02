---
phase: 52
slug: editorial-filter-fix
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 52 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification + TypeScript type check + bun build |
| **Config file** | `packages/web/tsconfig.json` |
| **Quick run command** | `cd packages/web && bunx tsc --noEmit` |
| **Full suite command** | `cd packages/web && bun run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bunx tsc --noEmit`
- **After every plan wave:** Run `cd packages/web && bun run build`
- **Before `/gsd:verify-work`:** Full build must succeed
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 52-01-01 | 01 | 1 | FILT-01 | grep+tsc | `grep -q 'post_magazine_id' packages/web/lib/hooks/useImages.ts && cd packages/web && bunx tsc --noEmit` | ✅ | ⬜ pending |
| 52-02-01 | 02 | 1 | FILT-02 | grep+build | `grep -q 'has_magazine' packages/api-server/openapi.json && cd packages/web && bun run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. TypeScript compiler and bun build are already configured.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| /editorial shows different content than /explore | FILT-01 | Visual comparison of two pages | Navigate to both pages, verify editorial shows fewer posts (magazine-connected only) |
| /explore unchanged | FILT-01 | Visual regression check | Navigate to /explore, verify same content as before |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
