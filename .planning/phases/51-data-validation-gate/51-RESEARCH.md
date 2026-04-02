# Phase 51: Data Validation Gate - Research

**Researched:** 2026-04-01
**Domain:** Database validation — Supabase SQL query, editorial data existence check
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Validation Scope**: 행 수 확인 + 핵심 필드 샘플 검사 (count만으로 불충분)
  - `post_magazine_title IS NOT NULL` 행 수 카운트
  - 대표 행 3-5개의 핵심 필드 완성도 확인: `post_magazine_id`, `post_magazine_title`, `ai_summary`, `spots` 존재 여부
  - Supabase MCP `execute_sql`로 직접 쿼리 실행
- **Escalation Threshold**: 0건이면 #38(editorial automation) 이슈를 블로킹 에스컬레이션으로 기록; 1건 이상이면 pass — Phase 52-55 진행 가능; ROADMAP.md success criteria와 정확히 일치
- **Result Documentation**: 페이즈 디렉토리에 검증 보고서 작성 (`51-data-validation-gate/`); 포함 내용: 행 수, 샘플 데이터 요약, pass/fail 판정, 다음 단계 가능 여부; fail 시 #38 이슈 링크 + 블로킹 사유 명시

### Claude's Discretion
- SQL 쿼리 세부 구조
- 검증 보고서 포맷 세부사항
- 샘플 행 선택 기준

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Editorial post가 DB에 존재하는지 검증 (post_magazine_title IS NOT NULL 행 확인, 없으면 #38 에스컬레이션) | SQL query pattern against posts + post_magazines tables via Supabase MCP execute_sql; escalation path via #38 issue documented |
</phase_requirements>

## Summary

Phase 51 is a zero-code data gate. Its sole purpose is to determine whether editorial posts exist in the Supabase database before any Phase 52-55 code changes begin. The entire phase is accomplished through two SQL queries executed via the Supabase MCP `execute_sql` tool, followed by writing a validation report Markdown file.

The critical schema fact is that `post_magazine_title` is NOT a database column. In the `posts` table, the relevant column is `post_magazine_id` (UUID, nullable). The `post_magazine_title` seen in API responses is derived at query time by the Rust API: it joins `posts.post_magazine_id` to `post_magazines.title`. This means the correct validation SQL must query `posts.post_magazine_id IS NOT NULL`, not a `post_magazine_title` column. The result is functionally identical to checking `post_magazine_title IS NOT NULL` at the API level, as a non-null `post_magazine_id` is the prerequisite for a non-null title in the response.

Secondary validation checks that sample rows have meaningful data: `ai_summary` (a column on `posts`, not `post_magazines`), and a spot count via a join or subquery against the `spots` table. The `post_magazines` table holds `title`, `status`, `layout_json`, and `ai_summary` is NOT in `post_magazines` — it is on the `posts` row directly.

**Primary recommendation:** Run two SQL queries via Supabase MCP — (1) count rows where `post_magazine_id IS NOT NULL`, (2) select 3-5 sample rows with key fields — then write a report. If count is 0, document #38 as blocking escalation. No code changes in this phase.

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Supabase MCP `execute_sql` | MCP tool | Direct SQL execution against production/dev DB | Already configured in project; no code required |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Markdown file | N/A | Validation report output | Single source of truth for Phase 52-55 gate decision |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase MCP execute_sql | Write a Next.js script | Script adds complexity; MCP is immediate with no code changes |
| Manual report | Automated test | Automated test requires test infra setup; a file is sufficient for a gate check |

## Architecture Patterns

### Key Schema Facts (HIGH confidence — from codebase inspection)

**`posts` table columns relevant to this phase:**
- `post_magazine_id` — `UUID`, nullable — FK to `post_magazines.id`; this is the column to query
- `ai_summary` — `TEXT`, nullable — AI-generated summary; lives on `posts`, not `post_magazines`

**`post_magazines` table columns relevant to this phase:**
- `id` — UUID PK
- `title` — `TEXT` NOT NULL — the value that becomes `post_magazine_title` in the API response
- `status` — `TEXT` — values include: `"generating"`, `"published"`, `"failed"`
- `layout_json` — JSONB, nullable — full editorial layout; only present after AI pipeline completes

**`spots` table:**
- `post_id` — FK to `posts.id`; count per post_id gives spot count

**Why `post_magazine_title` is not in the DB:**
The Rust API (`packages/api-server/src/domains/posts/service.rs`) batch-queries `post_magazines` for all `post_magazine_id`s in the page, builds a HashMap of `magazine_id → title`, then populates `post_magazine_title` in the `PostListItem` struct at serialization time. There is no `post_magazine_title` column in any migration.

### Pattern 1: Count Query

```sql
-- Count posts with editorial magazine linked
SELECT COUNT(*) AS editorial_post_count
FROM posts
WHERE post_magazine_id IS NOT NULL;
```

### Pattern 2: Sample Query with Field Completeness Check

```sql
-- Sample 5 editorial posts with key fields
SELECT
  p.id AS post_id,
  p.post_magazine_id,
  pm.title AS post_magazine_title,
  pm.status AS magazine_status,
  p.ai_summary,
  (
    SELECT COUNT(*)
    FROM spots s
    WHERE s.post_id = p.id
  ) AS spot_count
FROM posts p
JOIN post_magazines pm ON pm.id = p.post_magazine_id
WHERE p.post_magazine_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 5;
```

### Pattern 3: Status Distribution Check

```sql
-- Understand magazine pipeline completion status
SELECT pm.status, COUNT(*) AS count
FROM posts p
JOIN post_magazines pm ON pm.id = p.post_magazine_id
WHERE p.post_magazine_id IS NOT NULL
GROUP BY pm.status
ORDER BY count DESC;
```

This query is valuable for diagnosing partial pipeline completion: if rows exist but all have `status = 'generating'` or `status = 'failed'`, the pipeline ran but didn't complete — title exists but `layout_json` (needed for Phase 53) will be null.

### Validation Report Structure

Write to: `.planning/phases/51-data-validation-gate/51-VALIDATION-REPORT.md`

```markdown
# Phase 51: Data Validation Report

**Executed:** [date]
**Executed by:** [Claude/agent]

## Result: PASS / FAIL

## Query Results

### Count
- Editorial posts (post_magazine_id IS NOT NULL): {N}

### Magazine Status Distribution
| Status | Count |
|--------|-------|
| published | N |
| generating | N |
| failed | N |

### Sample Rows (up to 5)
| post_id | post_magazine_id | post_magazine_title | magazine_status | ai_summary present | spot_count |
|---------|------------------|--------------------|-----------------|--------------------|-----------|
| ... | ... | ... | ... | yes/no | N |

## Gate Decision

**PASS:** {N} editorial posts exist. Phase 52-55 visual validation is possible.
OR
**FAIL:** 0 editorial posts found. Blocking escalation: GitHub Issue #38 (editorial automation)
must complete before Phase 52-55 can proceed.

## Next Steps
- PASS: Proceed to Phase 52 (Editorial Filter Fix)
- FAIL: Block milestone. Reference #38. Do not implement Phase 52-55 until editorial data exists.
```

### Anti-Patterns to Avoid
- **Querying `post_magazine_title` as a column:** It does not exist in the DB. Use `post_magazine_id IS NOT NULL` instead.
- **Checking only count:** A count of 1+ with `status = 'generating'` means `layout_json` is null — Phase 53 detail migration will have no magazine content to show. Status distribution matters.
- **Assuming `ai_summary` is in `post_magazines`:** It is in `posts`. Sample query must pull from `posts.ai_summary`.
- **Using Supabase JS client for this check:** No code should be written. Use MCP `execute_sql` directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB connectivity | Custom script or migration | Supabase MCP execute_sql | Already configured; zero code overhead |
| Validation output | Automated test | Markdown report file | Proportionate to phase scope; test infra has no value for a one-time gate check |

**Key insight:** This phase is a pre-flight check, not an engineering task. The simplest possible execution (2 SQL queries + 1 file write) is the correct approach.

## Common Pitfalls

### Pitfall 1: Wrong Column Name
**What goes wrong:** Querying `post_magazine_title IS NOT NULL` instead of `post_magazine_id IS NOT NULL`
**Why it happens:** `post_magazine_title` appears in API responses and in `PostListItem.ts` but is not a DB column
**How to avoid:** Use the migration file as ground truth: `m20260316_000002_add_post_magazine_id_to_posts.rs` adds `post_magazine_id` (UUID) to `posts`
**Warning signs:** SQL error "column does not exist"

### Pitfall 2: Declaring PASS with Incomplete Pipeline
**What goes wrong:** Count is 5+ but all magazines have `status = 'generating'` — title exists but `layout_json` is null
**Why it happens:** Magazine row is created immediately when `POST /api/v1/post-magazines/generate` is called, before AI pipeline completes
**How to avoid:** Include status distribution in validation; note if `published` count is 0
**Warning signs:** Sample rows have null `layout_json` or `status != 'published'`

### Pitfall 3: Confusing `ai_summary` Location
**What goes wrong:** Looking for `ai_summary` in `post_magazines` table — it is on `posts`
**Why it happens:** Conceptually the summary seems like magazine content; actually it is a posts attribute set by AI processing
**How to avoid:** Entity file is ground truth: `packages/api-server/src/entities/posts.rs` line 43: `pub ai_summary: Option<String>`
**Warning signs:** NULL results for `ai_summary` from a `post_magazines` column query

### Pitfall 4: Escalating Without Detail
**What goes wrong:** Reporting "0 rows, blocked" without specifying what editorial automation means
**Why it happens:** #38 is an internal GitHub issue that downstream readers may not have context on
**How to avoid:** Validation report must include: issue #38 link, one-sentence description of what editorial automation does, and explicit statement that no Phase 52-55 work should begin

## Code Examples

### Full Validation Query Set

```sql
-- Query 1: Gate check count
-- Source: posts entity (packages/api-server/src/entities/posts.rs)
SELECT COUNT(*) AS editorial_post_count
FROM posts
WHERE post_magazine_id IS NOT NULL;
```

```sql
-- Query 2: Status distribution (detect partial pipeline completion)
-- Source: post_magazines entity (packages/api-server/src/entities/post_magazines.rs)
SELECT
  pm.status,
  COUNT(*) AS count,
  COUNT(pm.layout_json) AS with_layout
FROM posts p
JOIN post_magazines pm ON pm.id = p.post_magazine_id
WHERE p.post_magazine_id IS NOT NULL
GROUP BY pm.status
ORDER BY count DESC;
```

```sql
-- Query 3: Sample rows for field completeness
-- Source: posts.rs + post_magazines.rs entity inspection
SELECT
  p.id AS post_id,
  p.post_magazine_id,
  pm.title AS post_magazine_title,
  pm.status AS magazine_status,
  CASE WHEN p.ai_summary IS NOT NULL THEN 'yes' ELSE 'no' END AS has_ai_summary,
  CASE WHEN pm.layout_json IS NOT NULL THEN 'yes' ELSE 'no' END AS has_layout_json,
  (SELECT COUNT(*) FROM spots s WHERE s.post_id = p.id) AS spot_count
FROM posts p
JOIN post_magazines pm ON pm.id = p.post_magazine_id
WHERE p.post_magazine_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 5;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No validation gate (build first, discover data missing during QA) | Explicit Phase 51 data gate before any code changes | v11.0 roadmap (2026-04-01) | Prevents building editorial filter fix with no data to verify it |

**Key context from prior research (STATE.md):**
- `hasMagazine` filter in `useInfinitePosts` has an explicit code comment: `// Note: hasMagazine filter not yet supported` — means even if data exists, the filter needs Phase 52 to work
- `post_magazine_title` is already denormalized into the API response via batch join in `service.rs` — no schema change needed for Phase 52-55

## Open Questions

1. **Are there any `published` status magazines in production?**
   - What we know: The AI pipeline writes `status = 'generating'` on creation, then updates to `published` or `failed` on completion
   - What's unclear: Whether the editorial automation pipeline (#38) has been run against any posts in production
   - Recommendation: Query 2 (status distribution) answers this directly

2. **Do any editorial posts have `layout_json` populated?**
   - What we know: `layout_json` is the JSONB column in `post_magazines` that holds the full editorial content
   - What's unclear: Whether any pipeline runs have completed successfully
   - Recommendation: Include `COUNT(pm.layout_json) AS with_layout` in status distribution query; Phase 53 detail migration requires `layout_json` for magazine drawer content

## Validation Architecture

> Note: workflow.nyquist_validation key is absent from .planning/config.json — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | N/A — this phase has no code changes |
| Config file | none |
| Quick run command | n/a — validation is SQL execution via MCP |
| Full suite command | n/a |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Editorial post rows exist in DB with post_magazine_id IS NOT NULL | manual-only (SQL query) | N/A — MCP execute_sql, not automated | N/A |

**Manual-only justification for DATA-01:** This requirement is a one-time data existence check against a live database. There is no application code to unit-test. The validation is "run SQL, read number, write report." An automated test would require a running Supabase instance and would provide no additional value beyond the manual query.

### Wave 0 Gaps
None — no test infrastructure needed. This phase produces a Markdown report, not code.

## Sources

### Primary (HIGH confidence)
- `packages/api-server/src/entities/posts.rs` — posts table schema; confirmed `post_magazine_id` (UUID, nullable) and `ai_summary` (TEXT, nullable) columns
- `packages/api-server/src/entities/post_magazines.rs` — post_magazines table schema; confirmed `title`, `status`, `layout_json`, `published_at` columns; confirmed `ai_summary` is NOT in this table
- `packages/api-server/migration/src/m20260316_000002_add_post_magazine_id_to_posts.rs` — migration adding `post_magazine_id` UUID FK to posts
- `packages/api-server/src/domains/posts/service.rs` lines 715-757 — confirmed `post_magazine_title` is derived from batch HashMap join, not a DB column
- `packages/web/lib/api/generated/models/postListItem.ts` — confirmed `post_magazine_title` is an API response field with description "post_magazine_id가 있을 때만 설정"
- `.planning/research/SUMMARY.md` — prior research confirming editorial data availability is the Phase 51 gate

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — key decisions including "Phase 51 GATE: If zero rows exist, editorial automation (#38) is a blocking external dependency"
- `packages/ai-server/docs/post-editorial.md` — editorial automation pipeline description; confirms magazine row creation flow (status starts as `generating`)

## Metadata

**Confidence breakdown:**
- Schema facts (column names, table locations): HIGH — verified from entity files and migration
- SQL query correctness: HIGH — columns and table names confirmed from source
- Escalation path: HIGH — #38 issue referenced in CONTEXT.md and STATE.md
- `ai_summary` location (posts, not post_magazines): HIGH — verified from `posts.rs` entity file

**Research date:** 2026-04-01
**Valid until:** Stable — schema only changes with new migrations; no time-sensitive library versions in this phase
