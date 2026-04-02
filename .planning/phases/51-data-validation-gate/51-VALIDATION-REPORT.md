# Phase 51: Data Validation Report

**Executed:** 2026-04-01
**Executed by:** Claude (Phase 51 executor)
**Method:** REST API queries against production backend (`https://dev.decoded.style/api/v1/`)

> Note: Supabase MCP `execute_sql` tool was unavailable. Equivalent validation performed via
> the Rust backend REST API which queries the same PostgreSQL database. The `has_magazine=true`
> filter on `GET /api/v1/posts` is functionally equivalent to `WHERE post_magazine_id IS NOT NULL`.

## Result: PASS

## Query Results

### 1. Editorial Post Count

- Posts with `post_magazine_id IS NOT NULL`: **169**
- Total posts in database: **603**
- Editorial post ratio: **28.0%** (169/603)

### 2. Magazine Status Distribution

| Status | Count (estimated) | With layout_json | With ai_summary |
|--------|-------------------|------------------|-----------------|
| published | ~41 | ~41 (yes) | ~41 (yes) |
| failed | ~128 | 0 (no) | 0 (no) |
| generating | 0 | 0 | 0 |

**Estimation method:** Counted posts with real titles (non-"Untitled") across all 9 pages via API.
Spot-checked 8 magazines to confirm pattern: real title = `published` + `layout_json` present;
"Untitled" = `failed` + no `layout_json`. Zero `generating` status found in any sample.

> NOTE: 128 of 169 editorial posts have `status = 'failed'` with no `layout_json`.
> These failed magazines show gRPC connection errors to the AI server (dns resolution failure).
> Phase 53 detail migration requires `layout_json` for magazine drawer content -- only the ~41
> published magazines will have complete drawer data.

### 3. Sample Rows (5 posts)

| post_id | post_magazine_id | title | status | ai_summary | layout_json | spot_count |
|---------|------------------|-------|--------|------------|-------------|------------|
| 92288cc9... | 43622742... | 리사의 시크한 오프-듀티 룩, 셀린느와 나우 프롬 덴의 절묘한 조우 | published | yes | yes | 5 |
| 74aaa571... | 548f8089... | Untitled | failed | no | no | 4 |
| 3f52c44b... | aba5b61c... | Untitled | failed | no | no | 5 |
| ddbdea26... | 733e2e26... | 뉴진스 혜인의 스트리트 스타일, 루이 비통 앰버서더의 가방 속 디테일을 파헤치다 | published | yes | yes | 3 |
| eeedf90b... | 4f9d6586... | 뉴진스 해린, 스트리트 무드에 스며든 Y2K 패션 미학 | published | yes | yes | 4 |

## Field Completeness Summary

Based on 5 sample rows and cross-referencing with status distribution:

- **post_magazine_id**: 5/5 rows have value (by definition -- filter selects these)
- **post_magazine_title** (via join): 5/5 rows have value (but 2/5 are "Untitled" from failed pipeline)
- **ai_summary**: 3/5 rows have value (all published magazines have it; failed ones do not)
- **layout_json**: 3/5 rows have value (all published magazines have it; failed ones do not)
- **spot_count > 0**: 5/5 rows have spots (3-5 spots per post)

**Extrapolated to full dataset (169 posts):**
- post_magazine_id: 169/169 (100%)
- Real title (non-Untitled): ~41/169 (24%)
- ai_summary: ~41/169 (24%) -- correlated with published status
- layout_json: ~41/169 (24%) -- correlated with published status
- spot_count > 0: 169/169 (100%) -- spots exist independently of magazine pipeline

## Gate Decision

**PASS**: **169** editorial posts exist in the database. Phase 52-55 visual validation is possible.

- Published magazines: ~41 (with complete `layout_json`, `ai_summary`, real titles)
- Failed magazines: ~128 (gRPC/AI server connection failures; "Untitled", no `layout_json`)
- Generating magazines: 0

**41 published magazines are sufficient for Phase 52-55 validation.** The failed magazines represent
an AI pipeline infrastructure issue (DNS resolution for gRPC to ai-server) that is orthogonal to
the frontend code changes in Phases 52-55.

### Phase-Specific Implications

| Phase | Requirement | Data Available | Notes |
|-------|-------------|----------------|-------|
| Phase 52: Editorial Filter Fix | Posts with `has_magazine=true` must appear in filtered list | 169 posts available | Filter works at API level; all 169 will appear |
| Phase 53: Detail Migration | `layout_json` needed for magazine drawer | ~41 published have `layout_json` | Failed magazines will show fallback/empty state |
| Phase 54: Card Enrichment | `post_magazine_title`, `spot_count` needed | 41 with real titles, all 169 with spots | Sufficient for visual verification |
| Phase 55: Visual QA | All above fields needed for end-to-end test | 41 complete editorial posts | Enough for representative testing |

## Next Steps

- **PASS**: Proceed to Phase 52 (Editorial Filter Fix)
- The ~128 failed magazines are a known AI infrastructure issue (gRPC DNS), not a data model problem
- Re-running the editorial automation pipeline (Issue #38) after fixing the AI server connectivity
  would convert failed magazines to published, increasing the published count
- No blocking escalation needed -- sufficient data exists for all Phase 52-55 work

## Raw Error from Failed Magazines

Sample error from a failed magazine (`548f8089-7170-4df3-ad6f-8b065f58e935`):
```
gRPC request failed: code: 'The service is currently unavailable',
message: "dns error",
source: tonic::transport::Error(Transport, ConnectError(ConnectError("dns error",
Custom { kind: Uncategorized, error: "failed to lookup address information:
Name or service not known" })))
```

This indicates the AI server gRPC endpoint was unreachable during magazine generation attempts,
not a data model or schema issue.
