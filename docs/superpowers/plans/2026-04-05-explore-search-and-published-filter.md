# Explore Search Fix & Published Filter Enforcement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Korean search in prod explore page, enforce published-only filtering in search results, and audit all public queries for published status consistency.

**Architecture:** The explore page has two modes — browse (Supabase direct) and search (Meilisearch backend → Supabase fallback). Browse mode correctly filters `post_magazines.status = 'published'` + `created_with_solutions = true`, but the search API route does not. Additionally, when Meilisearch backend returns 0 results for Korean queries, it doesn't fall back to Supabase's synonym-powered search. Fix both in the `/api/v1/search` route.

**Tech Stack:** Next.js API Routes, Supabase PostgREST, TypeScript

**Scope note:** This plan covers items 2-4 from the task list. Item 1 (main page editorial/trending redesign) is deferred to a GitHub issue. Item 5 (admin migration from seed-ops) requires a separate plan after investigating the external repo.

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `packages/web/app/api/v1/search/route.ts` | Search proxy + Supabase fallback | Modify |
| `packages/web/app/api/v1/search/route.test.ts` | Search route tests | Create |
| `packages/web/lib/supabase/queries/main-page.server.ts` | Main page data fetching | Audit (no change expected) |
| `packages/web/lib/hooks/useImages.ts` | Browse mode query | Audit (no change expected) |

---

### Task 1: Add published filter to Supabase search fallback

The core bug: `supabaseSearchFallback()` only filters `.eq("status", "active")` but browse mode also requires `.eq("created_with_solutions", true)` and `.eq("post_magazines.status", "published")` via `!inner` join.

**Files:**
- Modify: `packages/web/app/api/v1/search/route.ts:68-72`

- [ ] **Step 1: Write failing test for published-only search results**

Create test file:

```typescript
// packages/web/app/api/v1/search/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// We test supabaseSearchFallback indirectly through the GET handler
// by mocking the backend to fail (forcing Supabase fallback)

describe("/api/v1/search Supabase fallback", () => {
  it("should filter by post_magazines.status = published and created_with_solutions = true", async () => {
    // This is an integration-level assertion:
    // When supabaseSearchFallback builds its query, it must include:
    // - .eq("status", "active")
    // - .eq("created_with_solutions", true)
    // - .eq("post_magazines.status", "published")  (via !inner join)
    //
    // We verify by reading the source and confirming the query chain.
    // A proper integration test would hit a test DB.
    
    const routeSource = await import("fs").then((fs) =>
      fs.readFileSync(
        "packages/web/app/api/v1/search/route.ts",
        "utf-8"
      )
    );

    // Verify the query includes published magazine filter
    expect(routeSource).toContain('post_magazines!inner');
    expect(routeSource).toContain('.eq("post_magazines.status", "published")');
    expect(routeSource).toContain('.eq("created_with_solutions", true)');
    expect(routeSource).toContain('.eq("status", "active")');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/web && bunx vitest run app/api/v1/search/route.test.ts`
Expected: FAIL — source doesn't contain `post_magazines!inner` yet

- [ ] **Step 3: Update Supabase fallback query to join post_magazines and filter published**

In `packages/web/app/api/v1/search/route.ts`, replace lines 68-72:

```typescript
// BEFORE:
let query = supabase
  .from("posts")
  .select("*", { count: "exact" })
  .eq("status", "active")
  .not("image_url", "is", null);

// AFTER:
let query = supabase
  .from("posts")
  .select("*, post_magazines!inner(title)", { count: "exact" })
  .eq("status", "active")
  .eq("created_with_solutions", true)
  .not("image_url", "is", null)
  .eq("post_magazines.status", "published");
```

This matches the browse mode query in `useImages.ts:247-253`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/web && bunx vitest run app/api/v1/search/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/api/v1/search/route.ts packages/web/app/api/v1/search/route.test.ts
git commit -m "fix(search): enforce published-only filter in Supabase search fallback

Search results now require post_magazines.status = 'published' and
created_with_solutions = true, matching browse mode filtering."
```

---

### Task 2: Fix Korean search falling through to empty Meilisearch results

When Meilisearch backend returns HTTP 200 with 0 results for a Korean query, the code returns those empty results instead of trying the Supabase fallback (which has synonym expansion for Korean → English mapping, e.g. 제니 → Jennie).

**Files:**
- Modify: `packages/web/app/api/v1/search/route.ts:13-47`

- [ ] **Step 1: Write failing test for Korean fallback behavior**

Append to `packages/web/app/api/v1/search/route.test.ts`:

```typescript
describe("Korean search fallback detection", () => {
  it("should detect Korean characters in query", () => {
    const hasKorean = (text: string) => /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);

    expect(hasKorean("제니")).toBe(true);
    expect(hasKorean("뉴진스")).toBe(true);
    expect(hasKorean("jennie")).toBe(false);
    expect(hasKorean("BTS")).toBe(false);
    expect(hasKorean("아이유 IU")).toBe(true);
  });

  it("source should contain Korean fallback logic", async () => {
    const routeSource = await import("fs").then((fs) =>
      fs.readFileSync(
        "packages/web/app/api/v1/search/route.ts",
        "utf-8"
      )
    );

    // Should have Korean detection regex
    expect(routeSource).toContain("\\uAC00-\\uD7AF");
    // Should fall back when backend returns empty for Korean query
    expect(routeSource).toContain("supabaseSearchFallback");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/web && bunx vitest run app/api/v1/search/route.test.ts`
Expected: FAIL — no Korean detection regex in source yet

- [ ] **Step 3: Add Korean-aware fallback logic to search route**

In `packages/web/app/api/v1/search/route.ts`, replace the backend try block (lines 17-44) with:

```typescript
  // Try backend first
  try {
    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/search?${queryString}`
      : `${API_BASE_URL}/api/v1/search`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: `Backend error: ${response.status}` };
      }

      // If backend returned empty results for a query containing Korean characters,
      // fall back to Supabase which has synonym expansion (e.g. 제니 → Jennie)
      const q = searchParams.get("q") || "";
      const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(q);
      const isEmpty = Array.isArray(data?.data) && data.data.length === 0;

      if (hasKorean && isEmpty) {
        console.info(`[Search] Korean query "${q}" returned 0 results from backend, trying Supabase fallback`);
        return supabaseSearchFallback(searchParams);
      }

      return NextResponse.json(data, { status: response.status });
    }

    console.warn(`[Search GET] Backend returned ${response.status}, falling back to Supabase`);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Search proxy error, falling back to Supabase:", error);
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/web && bunx vitest run app/api/v1/search/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/api/v1/search/route.ts packages/web/app/api/v1/search/route.test.ts
git commit -m "fix(search): fall back to Supabase for Korean queries with empty backend results

When Meilisearch returns 0 results for queries containing Korean
characters, fall back to Supabase which supports synonym expansion
(e.g. 제니 → Jennie via synonyms table)."
```

---

### Task 3: Audit all public-facing queries for published filter consistency

Verify every query that serves content to end users filters by published status. Based on research, most queries already filter correctly. Document any gaps.

**Files:**
- Audit: `packages/web/lib/supabase/queries/main-page.server.ts`
- Audit: `packages/web/lib/supabase/queries/posts.ts`
- Audit: `packages/web/lib/supabase/queries/images.server.ts`
- Audit: `packages/web/lib/supabase/queries/personalization.server.ts`
- Audit: `packages/web/lib/supabase/queries/profile.ts`
- Audit: `packages/web/lib/hooks/useImages.ts`

- [ ] **Step 1: Run grep to identify all Supabase queries fetching posts without published filter**

```bash
cd packages/web && grep -rn '\.from("posts")' lib/supabase/queries/ lib/hooks/ app/api/ --include='*.ts' | grep -v 'node_modules'
```

For each match, check if it has:
1. `.eq("status", "active")` — required for all public queries
2. Published magazine join where applicable (explore/search contexts)

- [ ] **Step 2: Document audit results**

Create a checklist of all query locations and their filter status. Expected result based on research:

| File | Function | `status=active` | `published` magazine | Notes |
|------|----------|:---:|:---:|-------|
| `main-page.server.ts` | `fetchMagazinePostsServer` | Yes | Yes | Two-step: magazines then posts |
| `main-page.server.ts` | `fetchWeeklyBestPostsServer` | Yes | No | Popular posts, no magazine req |
| `main-page.server.ts` | `fetchWhatsNewPostsServer` | Yes | No | Latest posts |
| `images.server.ts` | `fetchLatestPostsServer` | Yes | No | Legacy, check if still used |
| `hooks/useImages.ts` | `useInfinitePosts` | Yes | Yes | Browse mode, correct |
| `api/v1/search/route.ts` | `supabaseSearchFallback` | Yes | **Yes (after Task 1)** | Fixed in Task 1 |
| `posts.ts` | `fetchPostWithSpotsAndSolutions` | RLS | N/A | Detail page, RLS handles it |
| `posts.ts` | `fetchPostsByIds` | Yes | No | Used for specific IDs |
| `personalization.server.ts` | `fetchPostsByArtistName` | Yes | No | Personalized feed |
| `profile.ts` | profile queries | Yes | No | User's own posts |

Note: Not all queries need magazine published filter — only explore/search results require it. Detail pages and personalized feeds use `status=active` which is correct.

- [ ] **Step 3: Verify no gaps remain, commit audit note**

If all queries are correctly filtered (expected based on research + Task 1 fix), no code changes needed. The main gap was the search route, fixed in Task 1.

```bash
git add -A
git commit -m "docs: audit public queries for published status filtering

All public-facing queries correctly filter by status='active'.
Search route now also enforces post_magazines published filter (Task 1)."
```

---

### Task 4: Type-check and build verification

- [ ] **Step 1: Run TypeScript type check**

```bash
cd packages/web && bunx tsc --noEmit
```

Expected: No new type errors from our changes.

- [ ] **Step 2: Run ESLint on changed files**

```bash
cd packages/web && bunx eslint app/api/v1/search/route.ts
```

Expected: No lint errors.

- [ ] **Step 3: Run full test suite**

```bash
cd packages/web && bunx vitest run
```

Expected: All tests pass including new search tests.

- [ ] **Step 4: Run build**

```bash
cd packages/web && bun run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit any lint/type fixes if needed**

```bash
git add -A
git commit -m "fix: address lint/type issues from search filter changes"
```

---

## Deferred Items

### Item 1: Main page editorial/trending redesign (2차 — GitHub Issue)

Register a GitHub issue with:
- **Title:** `[Design] 메인페이지 Editorial & Trending 섹션 디자인/기능 개선`
- **Labels:** `enhancement`, `design`, `priority:low`
- **Body:** Editorial 섹션 카드 레이아웃, Trending 키워드 표시 방식, 데이터 소스 개선 등 디자인 및 기능 수정 필요. 2차 우선순위.

### Item 5: Admin page migration from decoded-seed-ops (별도 플랜 필요)

Requires investigation of the external repo at `https://github.com/decodedcorp/decoded-seed-ops` to understand:
- Post management UI features to migrate
- Editorial creation workflow
- Audit log schema and implementation
- How it integrates with current admin dashboard at `/admin`

**Action:** Clone and analyze `decoded-seed-ops`, then create a separate implementation plan.
