---
phase: 51
slug: data-validation-gate
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-01
---

# Phase 51 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual SQL verification via Supabase MCP |
| **Config file** | none — no test framework needed |
| **Quick run command** | `Supabase MCP execute_sql` |
| **Full suite command** | `Supabase MCP execute_sql` (same — single query phase) |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run validation SQL queries via Supabase MCP
- **After every plan wave:** Verify validation report file exists and contains results
- **Before `/gsd:verify-work`:** Validation report must exist with pass/fail determination
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 51-01-01 | 01 | 1 | DATA-01 | manual-sql | `Supabase MCP execute_sql: SELECT COUNT(*) FROM posts WHERE post_magazine_id IS NOT NULL` | N/A | ⬜ pending |
| 51-01-02 | 01 | 1 | DATA-01 | manual-sql | `Supabase MCP execute_sql: SELECT status, COUNT(*) FROM post_magazines GROUP BY status` | N/A | ⬜ pending |
| 51-01-03 | 01 | 1 | DATA-01 | file-check | `test -f .planning/phases/51-data-validation-gate/51-VALIDATION-REPORT.md` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — this phase uses Supabase MCP for direct SQL execution and file writing for documentation.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Editorial post existence | DATA-01 | DB state verification — not automatable as unit test | Run SQL query via Supabase MCP, verify count > 0 |
| Post magazine status distribution | DATA-01 | DB state verification | Run GROUP BY status query, verify 'published' rows exist |
| Validation report accuracy | DATA-01 | Document review | Read report file, verify it contains query results and pass/fail |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
