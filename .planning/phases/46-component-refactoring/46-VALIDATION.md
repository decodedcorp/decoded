---
phase: 46
slug: component-refactoring
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
| **Framework** | vitest (existing) + wc -l line count |
| **Config file** | `packages/web/vitest.config.ts` |
| **Quick run command** | `wc -l <target_file>` |
| **Full suite command** | `cd packages/web && bunx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** `wc -l` on modified component (must be < 300)
- **After every plan wave:** Run full test suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 46-01-T1 | 01 | 1 | REF-01 | line count | `wc -l packages/web/lib/components/ThiingsGrid.tsx` (< 300) | ⬜ pending |
| 46-02-T1 | 02 | 1 | REF-02 | line count | `wc -l packages/web/lib/components/vton/VtonModal.tsx` (< 300) | ⬜ pending |
| 46-03-T1 | 03 | 1 | REF-03 | line count | `wc -l packages/web/lib/components/detail/ItemDetailCard.tsx` (< 300) | ⬜ pending |
| 46-04-T1 | 03 | 1 | REF-04 | line count | `wc -l packages/web/lib/components/detail/ImageDetailModal.tsx` (< 300) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ThiingsGrid physics still works | REF-01 | Requires visual check of grid animation | Load main page, verify grid items animate correctly |
| VtonModal flow works end-to-end | REF-02 | Requires VTON service running | Open VTON modal, select item, run try-on |
| ItemDetailCard adopt flow | REF-03 | Requires auth + solution data | View item detail, adopt solution, verify UI updates |
| ImageDetailModal gestures | REF-04 | Requires touch/gesture interaction | Open image detail, pinch/zoom/swipe, verify animations |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
