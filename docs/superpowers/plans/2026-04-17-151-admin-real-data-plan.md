# #151 Admin 실데이터 연동 잔여 범위 — 실행 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec**: [docs/superpowers/specs/2026-04-17-151-admin-real-data-design.md](../specs/2026-04-17-151-admin-real-data-design.md)
**Issue**: [#151](https://github.com/decodedcorp/decoded/issues/151)
**PR**: [#224](https://github.com/decodedcorp/decoded/pull/224)
**Branch**: `feature/151-admin-real-data` → `dev`
**Worktree**: `.worktrees/151-admin-real-data`

**Goal:** Admin 페이지 empty state 4개 적용 + Post Magazine 승인 워크플로우(DB+RPC+API+UI) 전체 빌드 + 분리 이슈(#152 Rust audit, #153 entities/seed) 생성.

**Architecture:** 기존 Next.js admin route 패턴 재사용. Magazine 승인은 `update_magazine_status` Postgres RPC로 UPDATE+audit INSERT 원자 처리. Admin mutation은 `createAdminSupabaseClient()` (service_role) 사용. UI는 `/admin/content?tab=magazines` 신규 탭.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9 strict, Supabase (public + warehouse), TanStack Query 5.90, vitest + RTL, Playwright 1.58, Tailwind 3.4.

**Harness:** TDD per task (Superpowers). Wave 1은 OMC `/team` 혹은 4 병렬 subagent 가능. 머지 전 gstack `/cso`, `/review`, `/qa`.

---

## File Structure

### 신규

```
packages/web/lib/supabase/admin-server.ts                 # service_role 클라이언트
packages/web/lib/api/admin/magazines.ts                    # MagazineStatus + fetcher
packages/web/lib/hooks/admin/useAdminMagazineList.ts       # GET 훅
packages/web/lib/hooks/admin/useUpdateMagazineStatus.ts    # PATCH 훅
packages/web/lib/components/admin/magazines/
  index.ts
  MagazineApprovalTable.tsx
  MagazineStatusFilter.tsx
  RejectModal.tsx
  MagazineActions.tsx
packages/web/app/api/v1/admin/posts/magazines/route.ts
packages/web/app/api/v1/admin/posts/magazines/[id]/status/route.ts

supabase/migrations/20260417120000_magazine_approval_fields.sql
supabase/migrations/20260417120001_update_magazine_status_rpc.sql

packages/web/tests/admin/magazine-approval.spec.ts         # Playwright E2E
```

### 수정

```
packages/web/app/admin/audit-log/page.tsx
packages/web/app/admin/content/page.tsx                    # ContentTab 확장
packages/web/app/admin/editorial-candidates/page.tsx
packages/web/app/admin/monitoring/page.tsx
packages/web/lib/supabase/types.ts                         # supabase:types 재생성
```

---

## Wave 0.5 — 선행 조사 및 셋업

### Task 1: RLS/is_admin 함수 존재 확인

**Files:**

- Inspect: `supabase/migrations/*.sql`, `packages/web/lib/api/admin/` 전체

- [ ] **Step 1: is_admin 함수 존재 확인**

```bash
grep -rn "CREATE OR REPLACE FUNCTION.*is_admin\|CREATE FUNCTION.*is_admin" supabase/migrations/
```

Expected: 기존 함수 정의 1건 이상 발견. 없으면 migration 파일에 함수 정의 포함 필요 (Task 8에서 처리).

- [ ] **Step 2: post_magazines RLS 정책 확인**

```bash
grep -n "post_magazines" supabase/migrations/20260409075040_remote_schema.sql | head -40
```

Expected: `ENABLE ROW LEVEL SECURITY` + `"Allow public read" FOR SELECT` 정책만. UPDATE/INSERT/DELETE 정책 없음 확인.

- [ ] **Step 3: checkIsAdmin 미들웨어 위치 확인**

```bash
grep -rn "checkIsAdmin\|export.*isAdmin" packages/web/lib/api packages/web/middleware 2>/dev/null
```

Expected: 기존 유틸 위치 특정 (magazine route에서 재사용).

- [ ] **Step 4: 결과를 스펙 §6 (조사 결과 기록)에 업데이트**

```bash
code docs/superpowers/specs/2026-04-17-151-admin-real-data-design.md
# §6 placeholder 3개 채움
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-17-151-admin-real-data-design.md
git commit -m "docs(#151): wave 0.5 선행 조사 결과 스펙 반영"
```

---

### Task 2: `createAdminSupabaseClient()` 유틸 생성

**Files:**

- Create: `packages/web/lib/supabase/admin-server.ts`
- Test: `packages/web/lib/supabase/__tests__/admin-server.test.ts`

**배경**: 기존 `createSupabaseServerClient()`는 anon key + 쿠키. Magazine UPDATE는 RLS 통과 위해 service_role 필요.

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// packages/web/lib/supabase/__tests__/admin-server.test.ts
import { describe, it, expect, vi } from "vitest";
import { createAdminSupabaseClient } from "../admin-server";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ mocked: true })),
}));

describe("createAdminSupabaseClient", () => {
  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    const orig = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => createAdminSupabaseClient()).toThrow(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
    process.env.SUPABASE_SERVICE_ROLE_KEY = orig;
  });

  it("returns a client with service_role key when env set", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    const client = createAdminSupabaseClient();
    expect(client).toBeDefined();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd packages/web && bun test lib/supabase/__tests__/admin-server.test.ts
```

Expected: FAIL (파일 없음).

- [ ] **Step 3: 구현**

```typescript
// packages/web/lib/supabase/admin-server.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getEnv } from "./env";

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");

/**
 * Server-only Supabase client with service_role key.
 * Bypasses RLS. Use ONLY in admin-authenticated route handlers
 * after `checkIsAdmin()` has verified the caller.
 */
export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Admin mutations require service_role.",
    );
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 4: 테스트 재실행 → 통과**

```bash
cd packages/web && bun test lib/supabase/__tests__/admin-server.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/supabase/admin-server.ts \
        packages/web/lib/supabase/__tests__/admin-server.test.ts
git commit -m "feat(admin): add createAdminSupabaseClient for service_role mutations"
```

---

## Wave 1 — Empty state 4개 페이지 (병렬 가능)

> **병렬 힌트**: Task 3~6은 독립적. OMC `/team` 혹은 4 subagent로 동시 실행 가능. 본문은 순차 기술이지만 실행은 병렬로.

### Task 3: `audit-log` 페이지 empty state

**Files:**

- Modify: `packages/web/app/admin/audit-log/page.tsx`
- Test: `packages/web/app/admin/audit-log/__tests__/page.test.tsx`

- [ ] **Step 1: 실패 테스트**

```typescript
// packages/web/app/admin/audit-log/__tests__/page.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuditLogPage from "../page";

vi.mock("@/lib/hooks/admin/useAuditLog", () => ({
  useAuditLogList: () => ({
    data: { data: [], total: 0 },
    isLoading: false,
    isError: false,
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("audit-log page", () => {
  it("renders AdminEmptyState when no filters and no results", () => {
    renderWithClient(<AuditLogPage />);
    expect(screen.getByText(/no audit log entries yet|감사 로그 없음/i))
      .toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd packages/web && bun test app/admin/audit-log/__tests__/page.test.tsx
```

- [ ] **Step 3: 페이지 수정**

`page.tsx`의 렌더 파트에 `AdminEmptyState` 분기 추가 (ai-audit 패턴 참조: `app/admin/ai-audit/page.tsx:71`).

```tsx
import { AdminEmptyState } from "@/lib/components/admin/common";
import { ClipboardListIcon } from "lucide-react"; // 또는 기존 아이콘

// ... 기존 코드 ...

const isEmpty =
  !listQuery.isLoading &&
  (listQuery.data?.data?.length ?? 0) === 0 &&
  !currentAction &&
  !currentTable;

// render 영역
{isEmpty ? (
  <AdminEmptyState
    icon={<ClipboardListIcon className="w-12 h-12" />}
    title="No audit log entries yet"
    description="Administrator actions will appear here as they happen."
  />
) : (
  <AuditTable ... />
)}
```

- [ ] **Step 4: 테스트 재실행 → 통과**

```bash
cd packages/web && bun test app/admin/audit-log/__tests__/page.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/admin/audit-log/
git commit -m "feat(admin): add empty state to audit-log page"
```

---

### Task 4: `content` 페이지 empty state (posts/reports 각 탭)

**Files:**

- Modify: `packages/web/app/admin/content/page.tsx`
- Test: `packages/web/app/admin/content/__tests__/page.test.tsx`

- [ ] **Step 1: 실패 테스트 (posts 탭 빈 상태)**

```typescript
// packages/web/app/admin/content/__tests__/page.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ContentPage from "../page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("tab=posts"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/hooks/admin/useAdminPosts", () => ({
  useAdminPostList: () => ({ data: { data: [] }, isLoading: false }),
}));
vi.mock("@/lib/hooks/admin/useAdminReports", () => ({
  useAdminReports: () => ({ data: { data: [] }, isLoading: false }),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("content page", () => {
  it("shows empty state on posts tab when no data", () => {
    renderWithClient(<ContentPage />);
    expect(screen.getByText(/no posts found|게시물 없음/i))
      .toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd packages/web && bun test app/admin/content/__tests__/page.test.tsx
```

- [ ] **Step 3: 구현 — 탭별 분기**

탭 렌더 함수 내부에서 data.length===0 일 때 `AdminEmptyState` 렌더. Posts/Reports 탭 각각.

```tsx
{posts.length === 0 ? (
  <AdminEmptyState
    icon={<FileTextIcon className="w-12 h-12" />}
    title="No posts found"
    description="Posts submitted by users will appear here."
  />
) : (
  <PostsTable items={posts} ... />
)}

{reports.length === 0 ? (
  <AdminEmptyState
    icon={<FlagIcon className="w-12 h-12" />}
    title="No reports to review"
    description="User-submitted reports will appear here for moderation."
  />
) : (
  <ReportsTable items={reports} ... />
)}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/admin/content/
git commit -m "feat(admin): add empty states to content page posts/reports tabs"
```

---

### Task 5: `editorial-candidates` 페이지 empty state

**Files:**

- Modify: `packages/web/app/admin/editorial-candidates/page.tsx`
- Test: `packages/web/app/admin/editorial-candidates/__tests__/page.test.tsx`

- [ ] **Step 1: 테스트**

```typescript
vi.mock("@/lib/hooks/admin/useEditorialCandidates", () => ({
  useEditorialCandidates: () => ({ data: { data: [] }, isLoading: false }),
}));

it("shows empty state when no candidates", () => {
  renderWithClient(<EditorialCandidatesPage />);
  expect(
    screen.getByText(/no editorial candidates|에디토리얼 후보 없음/i),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```tsx
{candidates.length === 0 && !isLoading ? (
  <AdminEmptyState
    icon={<SparklesIcon className="w-12 h-12" />}
    title="No editorial candidates"
    description="Candidate posts awaiting editorial promotion will appear here."
  />
) : (
  // 기존 후보 목록
)}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/admin/editorial-candidates/
git commit -m "feat(admin): add empty state to editorial-candidates page"
```

---

### Task 6: `monitoring` 페이지 empty state

**Files:**

- Modify: `packages/web/app/admin/monitoring/page.tsx`
- Test: `packages/web/app/admin/monitoring/__tests__/page.test.tsx`

**주의**: monitoring은 KPI + 차트 섹션 별로 다루기. 데이터 없을 때 섹션별 명시 메시지 (skeleton이 아닌 명시적 empty).

- [ ] **Step 1: 테스트**

```typescript
vi.mock("@/lib/hooks/admin/useMonitoring", () => ({
  useMonitoringMetrics: () => ({
    data: { metrics: [], uptime: null, errorRate: null },
    isLoading: false,
  }),
}));

it("shows empty state when no metrics available", () => {
  renderWithClient(<MonitoringPage />);
  expect(
    screen.getByText(/no monitoring data|모니터링 데이터 없음/i),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현 — KPI/차트 섹션별 empty**

```tsx
{
  !metrics || metrics.length === 0 ? (
    <AdminEmptyState
      icon={<ActivityIcon className="w-12 h-12" />}
      title="No monitoring data yet"
      description="Once the backend starts reporting metrics, dashboards will appear here."
    />
  ) : (
    <>
      <KPIRow data={metrics} />
      <LatencyChart data={metrics} />
    </>
  );
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/admin/monitoring/
git commit -m "feat(admin): add empty state to monitoring page"
```

---

## Wave 2a — DB Migration + RPC

### Task 7: Magazine 승인 필드 마이그레이션

**Files:**

- Create: `supabase/migrations/20260417120000_magazine_approval_fields.sql`

- [ ] **Step 1: Migration 파일 작성**

```sql
-- 20260417120000_magazine_approval_fields.sql
-- #151 Post Magazine 승인 워크플로우: 필드 추가 + CHECK 제약 + RLS UPDATE 정책

-- 1) 승인 메타데이터 컬럼
ALTER TABLE public.post_magazines
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2) 기존 NULL 레코드 안전하게 'draft'로 백필
UPDATE public.post_magazines SET status = 'draft' WHERE status IS NULL;

-- 3) status CHECK 제약
ALTER TABLE public.post_magazines
  DROP CONSTRAINT IF EXISTS post_magazines_status_check;
ALTER TABLE public.post_magazines
  ADD CONSTRAINT post_magazines_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'rejected'));

-- 4) 관리자 UPDATE RLS 정책
-- 전제: public.is_admin(uuid) 함수가 존재해야 함. 없으면 Task 8에서 함수 정의 추가.
DROP POLICY IF EXISTS "admin_can_update_magazines" ON public.post_magazines;
CREATE POLICY "admin_can_update_magazines"
  ON public.post_magazines
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5) 인덱스: status 필터링
CREATE INDEX IF NOT EXISTS post_magazines_status_idx
  ON public.post_magazines(status)
  WHERE status IN ('pending', 'draft');
```

- [ ] **Step 2: is_admin 함수 존재 확인 (Task 1 결과 재확인)**

만약 함수가 없으면, 이 migration 시작부에 다음 추가:

```sql
-- 함수가 없을 때만 생성 (전제: auth.users에 role 또는 admins 테이블 존재 확인 후 수정)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = is_admin.user_id
  );
$$;
```

- [ ] **Step 3: 로컬 Supabase 적용**

```bash
bunx supabase migration up --local
```

Expected: 성공. 에러 시 `is_admin` 함수 누락 등 확인 후 Step 2 수정.

- [ ] **Step 4: 수동 검증**

```bash
bunx supabase db query "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name='post_magazines' AND column_name IN ('approved_by','rejection_reason');
"
```

Expected: 2행 반환.

```bash
bunx supabase db query "
  INSERT INTO public.post_magazines (title, status) VALUES ('x','invalid');
"
```

Expected: CHECK 제약 위반 에러.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260417120000_magazine_approval_fields.sql
git commit -m "feat(db): add magazine approval fields + CHECK + admin RLS policy"
```

---

### Task 8: `update_magazine_status` RPC

**Files:**

- Create: `supabase/migrations/20260417120001_update_magazine_status_rpc.sql`

- [ ] **Step 1: RPC migration 작성**

```sql
-- 20260417120001_update_magazine_status_rpc.sql
-- #151 UPDATE post_magazines + INSERT admin_audit_log 원자 처리

CREATE OR REPLACE FUNCTION public.update_magazine_status(
  p_magazine_id UUID,
  p_new_status VARCHAR,
  p_admin_user_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
) RETURNS SETOF public.post_magazines
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, warehouse, pg_temp
AS $$
DECLARE
  v_before public.post_magazines;
  v_after public.post_magazines;
  v_action TEXT;
BEGIN
  SELECT * INTO v_before FROM public.post_magazines
    WHERE id = p_magazine_id FOR UPDATE;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'magazine_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- 전이 유효성
  IF NOT (
    (v_before.status = 'draft'     AND p_new_status = 'pending')   OR
    (v_before.status = 'pending'   AND p_new_status = 'published') OR
    (v_before.status = 'pending'   AND p_new_status = 'rejected')  OR
    (v_before.status = 'rejected'  AND p_new_status = 'pending')   OR
    (v_before.status = 'published' AND p_new_status = 'draft')
  ) THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', v_before.status, p_new_status
      USING ERRCODE = 'P0001';
  END IF;

  IF p_new_status = 'rejected' AND (p_rejection_reason IS NULL OR length(trim(p_rejection_reason)) = 0) THEN
    RAISE EXCEPTION 'rejection_reason_required' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.post_magazines
  SET status = p_new_status,
      approved_by = CASE WHEN p_new_status = 'published' THEN p_admin_user_id ELSE approved_by END,
      published_at = CASE WHEN p_new_status = 'published' THEN now() ELSE published_at END,
      rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      updated_at = now()
  WHERE id = p_magazine_id
  RETURNING * INTO v_after;

  v_action := CASE p_new_status
    WHEN 'published' THEN 'magazine_approve'
    WHEN 'rejected'  THEN 'magazine_reject'
    WHEN 'pending'   THEN 'magazine_submit'
    WHEN 'draft'     THEN 'magazine_unpublish'
    ELSE 'magazine_status_change'
  END;

  INSERT INTO warehouse.admin_audit_log (
    admin_user_id, action, target_table, target_id,
    before_state, after_state, metadata
  ) VALUES (
    p_admin_user_id, v_action, 'post_magazines', p_magazine_id,
    row_to_json(v_before)::jsonb,
    row_to_json(v_after)::jsonb,
    jsonb_build_object('rejection_reason', p_rejection_reason)
  );

  RETURN QUERY SELECT * FROM public.post_magazines WHERE id = p_magazine_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) TO authenticated, service_role;
```

- [ ] **Step 2: Migration 적용**

```bash
bunx supabase migration up --local
```

- [ ] **Step 3: 수동 RPC 호출 검증**

```sql
-- 1. draft → pending
SELECT * FROM public.update_magazine_status(
  '<magazine_id>', 'pending', '<admin_user_id>', NULL
);
-- 2. pending → published
SELECT * FROM public.update_magazine_status(
  '<magazine_id>', 'published', '<admin_user_id>', NULL
);
-- 3. invalid transition (draft → published)
-- expected: exception 'invalid_transition: draft -> published'
-- 4. reject without reason → exception 'rejection_reason_required'
-- 5. warehouse.admin_audit_log 3 rows 확인 (submit, approve)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260417120001_update_magazine_status_rpc.sql
git commit -m "feat(db): add update_magazine_status RPC with atomic audit logging"
```

---

### Task 9: Supabase 타입 재생성

**Files:**

- Modify: `packages/web/lib/supabase/types.ts` (regenerated)

- [ ] **Step 1: types.ts 재생성**

```bash
cd packages/web && bun run supabase:types
```

Expected: `post_magazines` Row 타입에 `approved_by`, `rejection_reason` 추가됨. `Functions.update_magazine_status` 시그니처 생성.

- [ ] **Step 2: 타입 확인**

```bash
grep -A 3 "approved_by" packages/web/lib/supabase/types.ts | head -10
grep -A 5 "update_magazine_status" packages/web/lib/supabase/types.ts | head -12
```

- [ ] **Step 3: 타입 체크**

```bash
cd packages/web && bun run type-check
```

Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add packages/web/lib/supabase/types.ts
git commit -m "chore(db): regenerate Supabase types for magazine approval fields"
```

---

## Wave 2b — Admin Magazine API

### Task 10: `MagazineStatus` 타입 + fetcher 모듈

**Files:**

- Create: `packages/web/lib/api/admin/magazines.ts`
- Test: `packages/web/lib/api/admin/__tests__/magazines.test.ts`

- [ ] **Step 1: 실패 테스트**

```typescript
// packages/web/lib/api/admin/__tests__/magazines.test.ts
import { describe, it, expect } from "vitest";
import {
  MAGAZINE_STATUSES,
  isValidMagazineStatus,
  type MagazineStatus,
} from "../magazines";

describe("MagazineStatus", () => {
  it("exports all 4 statuses", () => {
    expect(MAGAZINE_STATUSES).toEqual([
      "draft",
      "pending",
      "published",
      "rejected",
    ]);
  });

  it("isValidMagazineStatus returns true for valid", () => {
    expect(isValidMagazineStatus("pending")).toBe(true);
    expect(isValidMagazineStatus("published")).toBe(true);
  });

  it("isValidMagazineStatus returns false for invalid", () => {
    expect(isValidMagazineStatus("foo")).toBe(false);
    expect(isValidMagazineStatus("")).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd packages/web && bun test lib/api/admin/__tests__/magazines.test.ts
```

- [ ] **Step 3: 구현**

```typescript
// packages/web/lib/api/admin/magazines.ts
export const MAGAZINE_STATUSES = [
  "draft",
  "pending",
  "published",
  "rejected",
] as const;

export type MagazineStatus = (typeof MAGAZINE_STATUSES)[number];

export function isValidMagazineStatus(s: string): s is MagazineStatus {
  return (MAGAZINE_STATUSES as readonly string[]).includes(s);
}

export interface AdminMagazineListItem {
  id: string;
  title: string | null;
  status: MagazineStatus;
  author_id: string | null;
  submitted_at: string | null;
  published_at: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
}

export interface AdminMagazineListResponse {
  data: AdminMagazineListItem[];
  total: number;
  page: number;
  limit: number;
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/api/admin/magazines.ts \
        packages/web/lib/api/admin/__tests__/magazines.test.ts
git commit -m "feat(admin): add MagazineStatus types and list response shape"
```

---

### Task 11: `GET /api/v1/admin/posts/magazines` 라우트

**Files:**

- Create: `packages/web/app/api/v1/admin/posts/magazines/route.ts`
- Test: `packages/web/app/api/v1/admin/posts/magazines/__tests__/route.test.ts`

- [ ] **Step 1: 실패 테스트**

```typescript
// packages/web/app/api/v1/admin/posts/magazines/__tests__/route.test.ts
import { describe, it, expect, vi } from "vitest";
import { GET } from "../route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: async () => ({ data: [], count: 0, error: null }),
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/api/admin/auth", () => ({
  checkIsAdmin: async () => ({ isAdmin: true, userId: "admin-1" }),
}));

function makeRequest(url: string) {
  return new Request(url);
}

describe("GET /api/v1/admin/posts/magazines", () => {
  it("returns 403 when not admin", async () => {
    vi.doMock("@/lib/api/admin/auth", () => ({
      checkIsAdmin: async () => ({ isAdmin: false }),
    }));
    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/posts/magazines"),
    );
    expect(res.status).toBe(403);
  });

  it("returns list with pending filter", async () => {
    const res = await GET(
      makeRequest(
        "http://localhost/api/v1/admin/posts/magazines?status=pending",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("total");
  });

  it("rejects invalid status", async () => {
    const res = await GET(
      makeRequest("http://localhost/api/v1/admin/posts/magazines?status=foo"),
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```typescript
// packages/web/app/api/v1/admin/posts/magazines/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/api/admin/auth";
import {
  isValidMagazineStatus,
  type AdminMagazineListResponse,
} from "@/lib/api/admin/magazines";

export async function GET(req: Request) {
  const auth = await checkIsAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)),
  );

  if (status && !isValidMagazineStatus(status)) {
    return NextResponse.json(
      {
        error: "invalid_status",
        validStatuses: ["draft", "pending", "published", "rejected"],
      },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("post_magazines")
    .select(
      "id,title,status,author_id,submitted_at,published_at,rejection_reason,approved_by",
      { count: "exact" },
    )
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (status) query = query.eq("status", status);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, count, error } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response: AdminMagazineListResponse = {
    data: (data ?? []) as AdminMagazineListResponse["data"],
    total: count ?? 0,
    page,
    limit,
  };
  return NextResponse.json(response);
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/api/v1/admin/posts/magazines/route.ts \
        packages/web/app/api/v1/admin/posts/magazines/__tests__
git commit -m "feat(admin): add GET /api/v1/admin/posts/magazines route"
```

---

### Task 12: `PATCH /api/v1/admin/posts/magazines/[id]/status` 라우트

**Files:**

- Create: `packages/web/app/api/v1/admin/posts/magazines/[id]/status/route.ts`
- Test: `packages/web/app/api/v1/admin/posts/magazines/[id]/status/__tests__/route.test.ts`

- [ ] **Step 1: 실패 테스트 (approve happy path + invalid transition + 403 + reject reason 필수)**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "../route";

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin-server", () => ({
  createAdminSupabaseClient: () => ({ rpc }),
}));
vi.mock("@/lib/api/admin/auth", () => ({
  checkIsAdmin: async () => ({ isAdmin: true, userId: "admin-1" }),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/x", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH magazines/[id]/status", () => {
  beforeEach(() => rpc.mockReset());

  it("approves (pending→published)", async () => {
    rpc.mockResolvedValue({
      data: [{ id: "m1", status: "published" }],
      error: null,
    });
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("update_magazine_status", {
      p_magazine_id: "m1",
      p_new_status: "published",
      p_admin_user_id: "admin-1",
      p_rejection_reason: null,
    });
  });

  it("rejects invalid transition with 409", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message: "invalid_transition: draft -> published",
        code: "P0001",
      },
    });
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 404 on magazine_not_found", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "magazine_not_found", code: "P0002" },
    });
    const res = await PATCH(makeRequest({ status: "published" }), {
      params: Promise.resolve({ id: "m1" }),
    });
    expect(res.status).toBe(404);
  });

  it("rejects empty rejection reason with 400", async () => {
    const res = await PATCH(
      makeRequest({ status: "rejected", rejectionReason: "" }),
      { params: Promise.resolve({ id: "m1" }) },
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```typescript
// packages/web/app/api/v1/admin/posts/magazines/[id]/status/route.ts
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-server";
import { checkIsAdmin } from "@/lib/api/admin/auth";
import { isValidMagazineStatus } from "@/lib/api/admin/magazines";

interface PatchBody {
  status: string;
  rejectionReason?: string;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await checkIsAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isValidMagazineStatus(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  if (body.status === "rejected") {
    const reason = body.rejectionReason?.trim();
    if (!reason) {
      return NextResponse.json(
        { error: "rejection_reason_required" },
        { status: 400 },
      );
    }
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("update_magazine_status", {
    p_magazine_id: id,
    p_new_status: body.status,
    p_admin_user_id: auth.userId,
    p_rejection_reason: body.rejectionReason ?? null,
  });

  if (error) {
    if (error.message?.includes("magazine_not_found")) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (error.message?.includes("invalid_transition")) {
      return NextResponse.json(
        { error: "invalid_transition", message: error.message },
        { status: 409 },
      );
    }
    if (error.message?.includes("rejection_reason_required")) {
      return NextResponse.json(
        { error: "rejection_reason_required" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/app/api/v1/admin/posts/magazines/[id]/
git commit -m "feat(admin): add PATCH magazines/:id/status via RPC"
```

---

## Wave 2c — Hooks + UI

### Task 13: `useAdminMagazineList` 훅

**Files:**

- Create: `packages/web/lib/hooks/admin/useAdminMagazineList.ts`
- Test: `packages/web/lib/hooks/admin/__tests__/useAdminMagazineList.test.ts`

- [ ] **Step 1: 실패 테스트**

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAdminMagazineList } from "../useAdminMagazineList";

global.fetch = vi.fn();

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useAdminMagazineList", () => {
  it("fetches magazines with status filter", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], total: 0, page: 1, limit: 20 }),
    });
    const { result } = renderHook(
      () => useAdminMagazineList({ status: "pending", page: 1, limit: 20 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("status=pending&page=1&limit=20"),
      expect.anything(),
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```typescript
// packages/web/lib/hooks/admin/useAdminMagazineList.ts
import { useQuery } from "@tanstack/react-query";
import type {
  AdminMagazineListResponse,
  MagazineStatus,
} from "@/lib/api/admin/magazines";

interface Params {
  status?: MagazineStatus;
  page?: number;
  limit?: number;
}

export function useAdminMagazineList(params: Params = {}) {
  const { status, page = 1, limit = 20 } = params;
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  qs.set("page", String(page));
  qs.set("limit", String(limit));

  return useQuery<AdminMagazineListResponse>({
    queryKey: ["admin", "magazines", { status, page, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/posts/magazines?${qs}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
  });
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/hooks/admin/useAdminMagazineList.ts \
        packages/web/lib/hooks/admin/__tests__
git commit -m "feat(admin): add useAdminMagazineList hook"
```

---

### Task 14: `useUpdateMagazineStatus` 훅

**Files:**

- Create: `packages/web/lib/hooks/admin/useUpdateMagazineStatus.ts`
- Test: `packages/web/lib/hooks/admin/__tests__/useUpdateMagazineStatus.test.ts`

- [ ] **Step 1: 실패 테스트 (approve + invalidateQueries)**

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUpdateMagazineStatus } from "../useUpdateMagazineStatus";

global.fetch = vi.fn();
const invalidateSpy = vi.fn();

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.invalidateQueries = invalidateSpy as never;
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useUpdateMagazineStatus", () => {
  it("calls PATCH and invalidates list", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "m1", status: "published" }] }),
    });
    const { result } = renderHook(() => useUpdateMagazineStatus(), { wrapper });
    result.current.mutate({ id: "m1", status: "published" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["admin", "magazines"] }),
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```typescript
// packages/web/lib/hooks/admin/useUpdateMagazineStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MagazineStatus } from "@/lib/api/admin/magazines";

interface MutationInput {
  id: string;
  status: MagazineStatus;
  rejectionReason?: string;
}

export function useUpdateMagazineStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MutationInput) => {
      const res = await fetch(
        `/api/v1/admin/posts/magazines/${input.id}/status`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: input.status,
            rejectionReason: input.rejectionReason,
          }),
        },
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "magazines"] });
    },
  });
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/hooks/admin/useUpdateMagazineStatus.ts \
        packages/web/lib/hooks/admin/__tests__/useUpdateMagazineStatus.test.ts
git commit -m "feat(admin): add useUpdateMagazineStatus mutation hook"
```

---

### Task 15: `MagazineStatusFilter` 컴포넌트

**Files:**

- Create: `packages/web/lib/components/admin/magazines/MagazineStatusFilter.tsx`
- Test: `packages/web/lib/components/admin/magazines/__tests__/MagazineStatusFilter.test.tsx`

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MagazineStatusFilter } from "../MagazineStatusFilter";

describe("MagazineStatusFilter", () => {
  it("renders all 5 options (All + 4 statuses)", () => {
    render(<MagazineStatusFilter value={undefined} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pending/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /published/i }),
    ).toBeInTheDocument();
  });

  it("calls onChange with selected status", () => {
    const onChange = vi.fn();
    render(<MagazineStatusFilter value={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /pending/i }));
    expect(onChange).toHaveBeenCalledWith("pending");
  });

  it("calls onChange with undefined when All clicked", () => {
    const onChange = vi.fn();
    render(<MagazineStatusFilter value="pending" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /all/i }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```tsx
// packages/web/lib/components/admin/magazines/MagazineStatusFilter.tsx
"use client";
import {
  MAGAZINE_STATUSES,
  type MagazineStatus,
} from "@/lib/api/admin/magazines";

interface Props {
  value: MagazineStatus | undefined;
  onChange: (next: MagazineStatus | undefined) => void;
}

export function MagazineStatusFilter({ value, onChange }: Props) {
  return (
    <div
      className="flex gap-2"
      role="group"
      aria-label="Magazine status filter"
    >
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={`px-3 py-1.5 rounded text-sm ${
          value === undefined
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        All
      </button>
      {MAGAZINE_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded text-sm capitalize ${
            value === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/admin/magazines/MagazineStatusFilter.tsx \
        packages/web/lib/components/admin/magazines/__tests__/MagazineStatusFilter.test.tsx
git commit -m "feat(admin): add MagazineStatusFilter component"
```

---

### Task 16: `RejectModal` 컴포넌트 (사유 필수)

**Files:**

- Create: `packages/web/lib/components/admin/magazines/RejectModal.tsx`
- Test: `packages/web/lib/components/admin/magazines/__tests__/RejectModal.test.tsx`

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RejectModal } from "../RejectModal";

describe("RejectModal", () => {
  it("disables submit button when reason is empty", () => {
    render(<RejectModal open onClose={() => {}} onSubmit={() => {}} />);
    const submit = screen.getByRole("button", { name: /reject|거부/i });
    expect(submit).toBeDisabled();
  });

  it("enables submit after typing non-empty reason", () => {
    render(<RejectModal open onClose={() => {}} onSubmit={() => {}} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "off-topic" } });
    expect(
      screen.getByRole("button", { name: /reject|거부/i }),
    ).not.toBeDisabled();
  });

  it("calls onSubmit with trimmed reason", () => {
    const onSubmit = vi.fn();
    render(<RejectModal open onClose={() => {}} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  off-topic  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /reject|거부/i }));
    expect(onSubmit).toHaveBeenCalledWith("off-topic");
  });
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```tsx
// packages/web/lib/components/admin/magazines/RejectModal.tsx
"use client";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  submitting?: boolean;
}

export function RejectModal({ open, onClose, onSubmit, submitting }: Props) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Reject Magazine</h2>
        <label className="block text-sm font-medium mb-2">
          Reason (required)
        </label>
        <textarea
          className="w-full rounded border border-gray-300 dark:border-gray-700 p-2 min-h-[100px]"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this magazine is rejected"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onSubmit(trimmed)}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/admin/magazines/RejectModal.tsx \
        packages/web/lib/components/admin/magazines/__tests__/RejectModal.test.tsx
git commit -m "feat(admin): add RejectModal with required reason"
```

---

### Task 17: `MagazineActions` 컴포넌트

**Files:**

- Create: `packages/web/lib/components/admin/magazines/MagazineActions.tsx`
- Test: `packages/web/lib/components/admin/magazines/__tests__/MagazineActions.test.tsx`

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MagazineActions } from "../MagazineActions";

describe("MagazineActions", () => {
  it("shows Approve/Reject for pending status", () => {
    render(
      <MagazineActions
        status="pending"
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /approve/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("shows Revert only for published", () => {
    render(
      <MagazineActions
        status="published"
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(
      screen.getByRole("button", { name: /revert|unpublish/i }),
    ).toBeInTheDocument();
  });

  it("calls onApprove when Approve clicked", () => {
    const onApprove = vi.fn();
    render(
      <MagazineActions
        status="pending"
        onApprove={onApprove}
        onReject={() => {}}
        onRevert={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    expect(onApprove).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```tsx
// packages/web/lib/components/admin/magazines/MagazineActions.tsx
"use client";
import type { MagazineStatus } from "@/lib/api/admin/magazines";

interface Props {
  status: MagazineStatus;
  disabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
}

export function MagazineActions({
  status,
  disabled,
  onApprove,
  onReject,
  onRevert,
}: Props) {
  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onApprove}
          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onReject}
          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }
  if (status === "published") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onRevert}
        className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded disabled:opacity-50"
      >
        Unpublish
      </button>
    );
  }
  return null;
}
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/admin/magazines/MagazineActions.tsx \
        packages/web/lib/components/admin/magazines/__tests__/MagazineActions.test.tsx
git commit -m "feat(admin): add MagazineActions component"
```

---

### Task 18: `MagazineApprovalTable` + index export

**Files:**

- Create: `packages/web/lib/components/admin/magazines/MagazineApprovalTable.tsx`
- Create: `packages/web/lib/components/admin/magazines/index.ts`
- Test: `packages/web/lib/components/admin/magazines/__tests__/MagazineApprovalTable.test.tsx`

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MagazineApprovalTable } from "../MagazineApprovalTable";

const items = [
  {
    id: "m1",
    title: "Sample",
    status: "pending" as const,
    author_id: "u1",
    submitted_at: "2026-04-17T10:00:00Z",
    published_at: null,
    rejection_reason: null,
    approved_by: null,
  },
];

describe("MagazineApprovalTable", () => {
  it("renders title and status", () => {
    render(
      <MagazineApprovalTable
        items={items}
        onApprove={() => {}}
        onReject={() => {}}
        onRevert={() => {}}
      />,
    );
    expect(screen.getByText("Sample")).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it("fires onApprove with item id", () => {
    const onApprove = vi.fn();
    render(
      <MagazineApprovalTable
        items={items}
        onApprove={onApprove}
        onReject={() => {}}
        onRevert={() => {}}
      />,
    );
    screen.getByRole("button", { name: /approve/i }).click();
    expect(onApprove).toHaveBeenCalledWith("m1");
  });
});
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 구현**

```tsx
// packages/web/lib/components/admin/magazines/MagazineApprovalTable.tsx
"use client";
import type { AdminMagazineListItem } from "@/lib/api/admin/magazines";
import { MagazineActions } from "./MagazineActions";

interface Props {
  items: AdminMagazineListItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevert: (id: string) => void;
  mutatingId?: string | null;
}

export function MagazineApprovalTable({
  items,
  onApprove,
  onReject,
  onRevert,
  mutatingId,
}: Props) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-gray-500">
        <tr>
          <th className="py-2">Title</th>
          <th>Author</th>
          <th>Submitted</th>
          <th>Status</th>
          <th className="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((m) => (
          <tr
            key={m.id}
            className="border-t border-gray-100 dark:border-gray-800"
          >
            <td className="py-3 font-medium">{m.title ?? "Untitled"}</td>
            <td className="text-gray-500">{m.author_id ?? "—"}</td>
            <td className="text-gray-500">
              {m.submitted_at ? new Date(m.submitted_at).toLocaleString() : "—"}
            </td>
            <td>
              <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 capitalize">
                {m.status}
              </span>
            </td>
            <td className="text-right">
              <MagazineActions
                status={m.status}
                disabled={mutatingId === m.id}
                onApprove={() => onApprove(m.id)}
                onReject={() => onReject(m.id)}
                onRevert={() => onRevert(m.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

```ts
// packages/web/lib/components/admin/magazines/index.ts
export { MagazineApprovalTable } from "./MagazineApprovalTable";
export { MagazineStatusFilter } from "./MagazineStatusFilter";
export { MagazineActions } from "./MagazineActions";
export { RejectModal } from "./RejectModal";
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: Commit**

```bash
git add packages/web/lib/components/admin/magazines/
git commit -m "feat(admin): add MagazineApprovalTable + barrel export"
```

---

### Task 19: `ContentTab` 확장 + magazines 탭 렌더

**Files:**

- Modify: `packages/web/app/admin/content/page.tsx`

**참고**: Task 4에서 empty state를 추가한 파일을 다시 수정. Task 4 commit 이후 이어서.

- [ ] **Step 1: ContentTab 타입 확장**

```tsx
// content/page.tsx (상단)
type ContentTab = "posts" | "reports" | "magazines";

const TAB_OPTIONS: { value: ContentTab; label: string }[] = [
  { value: "posts", label: "Posts" },
  { value: "reports", label: "Reports" },
  { value: "magazines", label: "Magazines" },
];
```

- [ ] **Step 2: magazines 탭 내용 추가**

```tsx
import { useState } from "react";
import { useAdminMagazineList } from "@/lib/hooks/admin/useAdminMagazineList";
import { useUpdateMagazineStatus } from "@/lib/hooks/admin/useUpdateMagazineStatus";
import {
  MagazineApprovalTable,
  MagazineStatusFilter,
  RejectModal,
} from "@/lib/components/admin/magazines";
import { AdminEmptyState } from "@/lib/components/admin/common";
import { FileTextIcon } from "lucide-react";
import type { MagazineStatus } from "@/lib/api/admin/magazines";

function MagazinesTab() {
  const [filterStatus, setFilterStatus] = useState<MagazineStatus | undefined>(
    "pending",
  );
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const listQuery = useAdminMagazineList({ status: filterStatus, limit: 20 });
  const mutation = useUpdateMagazineStatus();

  const handleApprove = (id: string) =>
    mutation.mutate({ id, status: "published" });
  const handleReject = (id: string) => setRejectTargetId(id);
  const handleRevert = (id: string) => mutation.mutate({ id, status: "draft" });
  const handleConfirmReject = (reason: string) => {
    if (!rejectTargetId) return;
    mutation.mutate(
      { id: rejectTargetId, status: "rejected", rejectionReason: reason },
      { onSuccess: () => setRejectTargetId(null) },
    );
  };

  const items = listQuery.data?.data ?? [];
  const isEmpty = !listQuery.isLoading && items.length === 0;

  return (
    <div className="space-y-4">
      <MagazineStatusFilter value={filterStatus} onChange={setFilterStatus} />
      {isEmpty ? (
        <AdminEmptyState
          icon={<FileTextIcon className="w-12 h-12" />}
          title="No magazines in this bucket"
          description="Magazines matching the current filter will appear here."
        />
      ) : (
        <MagazineApprovalTable
          items={items}
          onApprove={handleApprove}
          onReject={handleReject}
          onRevert={handleRevert}
          mutatingId={mutation.isPending ? mutation.variables?.id : null}
        />
      )}
      <RejectModal
        open={!!rejectTargetId}
        onClose={() => setRejectTargetId(null)}
        onSubmit={handleConfirmReject}
        submitting={mutation.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 3: 탭 렌더링에 magazines 케이스 추가**

```tsx
{
  currentTab === "magazines" && <MagazinesTab />;
}
```

- [ ] **Step 4: 타입 체크 + lint**

```bash
cd packages/web && bun run type-check && bun run lint
```

- [ ] **Step 5: 수동 검증**

```bash
bun run dev
# http://localhost:3000/admin/content?tab=magazines 접속
# 탭 필터, Approve/Reject 동작 확인
```

- [ ] **Step 6: Commit**

```bash
git add packages/web/app/admin/content/page.tsx
git commit -m "feat(admin): wire magazine approval tab into content page"
```

---

### Task 20: Playwright E2E — 매거진 승인 흐름

**Files:**

- Create: `packages/web/tests/admin/magazine-approval.spec.ts`

- [ ] **Step 1: 기존 admin 테스트 셋업 확인**

```bash
ls packages/web/tests/admin/ 2>/dev/null
grep -rn "service_role\|admin session" packages/web/tests/ 2>/dev/null | head -20
```

세션 셋업 유틸이 있으면 재사용. 없으면 Step 2에서 생성.

- [ ] **Step 2: E2E 스펙 작성**

```typescript
// packages/web/tests/admin/magazine-approval.spec.ts
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

test.describe("magazine approval", () => {
  let magazineId: string;

  test.beforeEach(async () => {
    const { data, error } = await supabaseAdmin
      .from("post_magazines")
      .insert({ title: "E2E Test Magazine", status: "pending" })
      .select()
      .single();
    if (error) throw error;
    magazineId = data!.id;
  });

  test.afterEach(async () => {
    await supabaseAdmin.from("post_magazines").delete().eq("id", magazineId);
  });

  test("admin approves a pending magazine", async ({ page }) => {
    await page.goto("/admin/content?tab=magazines");
    await expect(page.getByText("E2E Test Magazine")).toBeVisible();
    await page
      .getByRole("button", { name: /approve/i })
      .first()
      .click();
    await expect(page.getByText("E2E Test Magazine")).not.toBeVisible();

    const { data } = await supabaseAdmin
      .from("post_magazines")
      .select("status, approved_by, published_at")
      .eq("id", magazineId)
      .single();
    expect(data?.status).toBe("published");
    expect(data?.approved_by).not.toBeNull();
    expect(data?.published_at).not.toBeNull();
  });

  test("admin rejects with reason", async ({ page }) => {
    await page.goto("/admin/content?tab=magazines");
    await page
      .getByRole("button", { name: /reject/i })
      .first()
      .click();
    await page.getByRole("textbox").fill("Off-topic content");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /reject/i })
      .click();

    const { data } = await supabaseAdmin
      .from("post_magazines")
      .select("status, rejection_reason")
      .eq("id", magazineId)
      .single();
    expect(data?.status).toBe("rejected");
    expect(data?.rejection_reason).toBe("Off-topic content");
  });

  test("audit log records approval", async ({ page }) => {
    await page.goto("/admin/content?tab=magazines");
    await page
      .getByRole("button", { name: /approve/i })
      .first()
      .click();

    const { data } = await supabaseAdmin
      .schema("warehouse")
      .from("admin_audit_log")
      .select("action, target_id")
      .eq("target_id", magazineId)
      .eq("action", "magazine_approve");
    expect(data?.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: 로컬 E2E 실행**

```bash
cd packages/web && bun run test:e2e -- tests/admin/magazine-approval.spec.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/tests/admin/magazine-approval.spec.ts
git commit -m "test(admin): e2e magazine approval + reject + audit log"
```

---

## Wave 3 — Next.js audit 갭 보완

### Task 21: Next.js mutation route 감사 갭 조사

**Files:**

- Inspect only

- [ ] **Step 1: Next.js mutation route 목록화**

```bash
grep -rln "export async function \(POST\|PATCH\|DELETE\|PUT\)" packages/web/app/api/admin packages/web/app/api/v1/admin 2>/dev/null
```

- [ ] **Step 2: writeAuditLog 호출처 대비**

```bash
grep -L "writeAuditLog" $(grep -rln "export async function \(POST\|PATCH\|DELETE\|PUT\)" packages/web/app/api/admin packages/web/app/api/v1/admin 2>/dev/null)
```

Expected: 누락 route 목록. (Magazine status는 RPC에서 자동 처리 — 제외)

- [ ] **Step 3: 각 누락 route에 대해 추가 여부 판단**

- 진짜 mutation이면 추가
- 내부 조회/캐시 API면 skip
- Rust로 proxy하는 경우 → #152로 이관

- [ ] **Step 4: 결과를 체크리스트로 다음 Task에 반영**

---

### Task 22: 감사 갭 보완 구현 (조사 결과에 따라)

**Files:**

- Modify: Task 21에서 식별된 Next.js route 각각

> 조사 결과 누락이 없다면 이 Task는 `skip` commit으로 마무리. 있으면 각 route에 `writeAuditLog` 호출 추가.

- [ ] **Step 1: 각 route 수정 (패턴)**

```typescript
import { writeAuditLog } from "@/lib/api/admin/audit-log";
import { getAdminUserId } from "@/lib/api/admin/audit-log";

// 기존 mutation 직후
const adminUserId = await getAdminUserId();
if (adminUserId) {
  await writeAuditLog({
    adminUserId,
    action: "<action_name>", // 예: "report_status_change"
    targetTable: "<table>",
    targetId: id,
    beforeState: before,
    afterState: after,
    metadata: {
      /* optional */
    },
  });
}
```

- [ ] **Step 2: 각 수정 건에 대한 최소 테스트 추가**

- [ ] **Step 3: 타입 체크 + 테스트**

```bash
cd packages/web && bun run type-check && bun test
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/app/api/
git commit -m "feat(admin): wave 3 Next.js audit 갭 보완"
```

---

### Task 23: 분리 이슈 #152 / #153 생성 + #151 본문 업데이트

**Files:**

- GitHub issues (gh CLI)
- Modify (optional): issue body template

- [ ] **Step 1: #152 생성 (Rust audit 통합)**

```bash
gh issue create \
  --repo decodedcorp/decoded \
  --title "Rust API audit 통합 (picks, posts status 등)" \
  --body "$(cat <<'EOF'
## 배경
#151 에서 Next.js admin route의 audit log는 거의 완성됨.
그러나 `picks` CRUD, `posts/:id/status` 등은 Rust API server에서 처리하므로
현재 `warehouse.admin_audit_log`에 기록되지 않음.

## 범위
- [ ] Rust 측에서 `writeAuditLog` 상응 유틸 설계
- [ ] 또는 Next.js proxy route를 생성해 통합
- [ ] picks CRUD 감사 기록
- [ ] posts status change 감사 기록
- [ ] bulk operation metadata 강화 (affectedIds)

## 참고
- 감사 RPC: `public.update_magazine_status` (트랜잭션 패턴 참고)
- 현재 Next.js 유틸: `packages/web/lib/api/admin/audit-log.ts`
EOF
)"
```

- [ ] **Step 2: #153 생성 (entities/seed 실데이터 강화)**

```bash
gh issue create \
  --repo decodedcorp/decoded \
  --title "Admin entities/seed 서브라우트 실데이터 점검 및 empty state" \
  --body "$(cat <<'EOF'
## 배경
#151 에서 `entities/{artists,brands,group-members}`와
`seed/{candidates,post-images,post-spots}` 는 기본 동작 확인 완료.

개별 페이지별 실데이터 검증과 empty state 추가는 별도 스코프로 이관.

## 범위
- [ ] 각 페이지 실데이터 흐름 재검증
- [ ] 누락된 empty state UI 적용
- [ ] 필요 시 리팩토링
EOF
)"
```

- [ ] **Step 3: #151 본문에 분리 이슈 링크**

```bash
# 본문을 수동 편집 혹은 댓글 추가
gh issue comment 151 --repo decodedcorp/decoded --body "$(cat <<'EOF'
분리 이슈:
- #152 Rust API audit 통합
- #153 entities/seed 실데이터 강화
- Editorial 승인 워크플로우 — 추후 별도 이슈 생성

이 PR(#224) 머지 후 #151은 클로즈 가능.
EOF
)"
```

- [ ] **Step 4: Commit (문서 링크 업데이트 있을 경우)**

스펙 문서 §2.2에 새 이슈 번호 반영:

```bash
git add docs/superpowers/specs/2026-04-17-151-admin-real-data-design.md
git commit -m "docs(#151): 분리 이슈 #152/#153 링크 반영" --allow-empty
```

---

## 머지 준비

### Task 24: gstack `/cso` 보안 점검

- [ ] **Step 1: cso skill 호출**

```
/cso
```

대상: admin route 신규 2개, RPC 함수, RLS 정책.

- [ ] **Step 2: 지적사항 반영**

---

### Task 25: gstack `/review` 코드 리뷰

- [ ] **Step 1: review 호출**

```
/review
```

- [ ] **Step 2: 지적사항 반영 + 커밋**

---

### Task 26: gstack `/qa` QA 실행

- [ ] **Step 1: qa 호출**

```
/qa
```

admin 페이지 순회 + magazine approval 플로우 집중 확인.

- [ ] **Step 2: 버그 수정 루프**

---

### Task 27: Draft PR → Ready for Review

- [ ] **Step 1: 타입 체크/린트/테스트 모두 통과 확인**

```bash
cd packages/web && bun run type-check && bun run lint && bun test
bun run test:e2e -- tests/admin/magazine-approval.spec.ts
```

- [ ] **Step 2: PR 설명 업데이트**

```bash
gh pr edit 224 --body "$(cat <<'EOF'
## Summary
- Empty state 4 페이지 (audit-log, content, editorial-candidates, monitoring)
- Post Magazine 승인 UI/API/RPC 전체 신규
- audit log 갭 일부 보완 (Next.js 한정)

## 분리 이슈
- #152 Rust API audit 통합
- #153 entities/seed 실데이터 강화

## 설계
docs/superpowers/specs/2026-04-17-151-admin-real-data-design.md

## Test plan
- [x] vitest 유닛 테스트 모두 pass
- [x] Playwright E2E (magazine approval, reject, audit log) pass
- [x] 로컬에서 수동 매거진 승인/거부 확인
- [x] gstack /cso /review /qa 통과
EOF
)"
```

- [ ] **Step 3: Ready for review**

```bash
gh pr ready 224
```

---

## Self-Review

**1. Spec coverage** — 각 Wave별 task:

- Wave 0.5 → Task 1, 2 ✓
- Wave 1 empty state → Task 3~6 ✓
- Wave 2a DB → Task 7~9 ✓
- Wave 2b API → Task 10~12 ✓
- Wave 2c UI → Task 13~20 ✓
- Wave 3 audit → Task 21, 22 ✓
- 분리 이슈 → Task 23 ✓
- 머지 준비 → Task 24~27 ✓

**2. 타입 일관성** — `MagazineStatus`, `AdminMagazineListItem`, `AdminMagazineListResponse` Task 10에서 정의, 이후 Task 11~19에서 같은 이름 사용 ✓. RPC 파라미터 `p_magazine_id/p_new_status/p_admin_user_id/p_rejection_reason` Task 8, 12 일치 ✓.

**3. Placeholder** — 각 step 실제 코드/커맨드 포함. Task 21/22는 "조사 후 적용"이지만 구체적 커맨드 + 패턴 제시. ✓

**4. 파일명/경로** — 모두 절대 기준 상대 경로로 일관. `packages/web/...` 형식.
