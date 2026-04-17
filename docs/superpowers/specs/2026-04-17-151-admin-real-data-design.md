# #151 Admin 실데이터 연동 잔여 범위 — 설계 스펙

**Issue**: [#151](https://github.com/decodedcorp/decoded/issues/151)
**Draft PR**: [#224](https://github.com/decodedcorp/decoded/pull/224)
**Worktree**: `.worktrees/151-admin-real-data`
**Branch**: `feature/151-admin-real-data`
**Status**: Design v2 (architect + critic 리뷰 반영)
**Estimated effort**: 6일 (코딩 5일 + 리뷰/QA 왕복 1일)

---

## 1. 배경

### 1.1 이전 작업 상태

- PR #147 (커밋 `80755a7a`)로 admin 페이지 5개의 mock→real 전환 및 empty state 완료:
  `ai-audit`, `ai-cost`, `picks`, `pipeline-logs`, `server-logs`
- Mock 데이터 생성기 5개 삭제 (~1,200 lines)
- 이후 `review`도 완료. 총 **6페이지 완료**.

### 1.2 탐색 결과 (3-agent 병렬 매핑)

| 영역                                           | 상태                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Admin 페이지 실데이터                          | 13개 중 6개 완료, 4개(`audit-log`, `content`, `editorial-candidates`, `monitoring`)는 real API 연결됐으나 **empty state 미흡** |
| `entities/*` (artists, brands, group-members)  | 실데이터 훅 사용 중 — 기능 동작 확인됨                                                                                         |
| `seed/*` (candidates, post-images, post-spots) | GET route 동작 중                                                                                                              |
| Audit log (Next.js)                            | DB(`warehouse.admin_audit_log`) + API + UI + `writeAuditLog()` 헬퍼 + 10개 엔드포인트 호출부 → **거의 완성**                   |
| Audit log (Rust API)                           | **없음** — Rust 쪽 mutation은 감사 사각                                                                                        |
| Post Magazine 승인 UI/API                      | **완전 없음** — `post_magazines.status` 필드만 존재 (draft/pending/published 값은 관행)                                        |
| Editorial 승인                                 | 후보 생성만 있음. #151에서 **분리**                                                                                            |

### 1.3 아키텍처 사실 (설계의 전제)

1. **`createSupabaseServerClient`는 anon key + 쿠키 기반**. service_role 아님 (`packages/web/lib/supabase/server.ts:31`).
   → admin mutation은 RLS 정책이 admin role을 허용하거나, service_role 클라이언트를 별도 사용해야 함.
2. **Next.js route vs Rust route 혼재**:
   - Next.js: `/api/admin/*`, `/api/v1/admin/audit-log/*`, `/api/v1/admin/posts/magazines/*` (신규)
   - Rust: `/api/v1/admin/picks`, `/api/v1/admin/posts/:postId/status`, dashboard, monitoring, AI cost, pipeline logs, server logs 등
   - `writeAuditLog()`는 **Next.js 전용**. Rust route 호출에는 적용 불가.
3. **`post_magazines` 테이블**:
   - `status varchar` — CHECK 제약 **없음** (`20260409075040_remote_schema.sql:416`)
   - `published_at` — 존재하지만 현재 흐름에서 **populating 안 됨**
   - `approved_by` — **존재하지 않음**
   - RLS: `Allow public read` SELECT 정책만 있음, UPDATE/INSERT 정책 없음
4. **Admin 쪽 Magazine 존재도 0**:
   - `packages/web/app/admin/` 하위에 magazine 관련 파일 없음
   - `packages/web/app/api/admin/` 하위에도 magazine 관련 route 없음
   - `ContentTab` 타입이 `"posts" | "reports"` — `magazines` 추가 필요

---

## 2. 범위 결정

### 2.1 이번 PR 포함

| Wave                               | 산출물                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| **0.5 선행 조사**                  | RLS/클라이언트 확인, 기존 empty state 패턴 확인                                 |
| **1 Empty state 4개**              | `audit-log`, `content`, `editorial-candidates`, `monitoring`                    |
| **2 Magazine 승인 전체 빌드**      | Migration + RPC + API + UI + 훅 (2a/2b/2c로 세분)                               |
| **3 Next.js audit 갭 확인 & 기록** | 실제 누락된 Next.js route에만 `writeAuditLog` 추가. 현재는 사실상 완성에 가까움 |

### 2.2 #151에서 **분리**

| 분리 이슈                                   | 사유                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| **#152 Rust API audit 통합** (신규)         | `picks`, `post status` 등 Rust route의 audit은 Rust 서버 수정 필요. 별도 PR. |
| **#153 entities/seed 실데이터 강화** (신규) | "점검"은 unbounded scope. 발견 시 개별 이슈화.                               |
| **Editorial 승인 워크플로우** (추후 이슈)   | `editorial_posts` 테이블 신규 + 승인 흐름 = 별도 스펙.                       |
| **Magazine 알림/rollback/역할 세분화**      | Wave 2 내 defer. 후속 이슈로.                                                |

### 2.3 #151 종료 기준

이 PR 머지 후 #151이 "closed"되기 위한 조건:

- Wave 1/2/3 모두 머지
- Issue body에 남은 작업(#152, #153, editorial 등) 링크 추가
- PR 설명에 "이 PR로 끝나지 않는 항목" 섹션 명시

---

## 3. Magazine 상태 머신 (신규 정의)

```typescript
// packages/web/lib/api/admin/magazines.ts (신규)
export type MagazineStatus =
  | "draft" // 초안, 검토 대기 전
  | "pending" // 검토 대기
  | "published" // 승인 완료 + 공개
  | "rejected"; // 거부됨 (사유 기록)
```

### 3.1 유효한 상태 전이

| from        | to          | action    | 메타데이터                    |
| ----------- | ----------- | --------- | ----------------------------- |
| `draft`     | `pending`   | submit    | —                             |
| `pending`   | `published` | approve   | `approved_by`, `published_at` |
| `pending`   | `rejected`  | reject    | `rejection_reason`            |
| `rejected`  | `pending`   | resubmit  | —                             |
| `published` | `draft`     | unpublish | — (관리자 권한)               |

### 3.2 금지된 전이

- `draft → published` (pending을 거쳐야 함)
- `draft → rejected`
- `published → rejected` (unpublish 후 reject)

---

## 4. 데이터 모델 변경

### 4.1 Migration: `20260417_XXXX_magazine_approval_fields.sql`

```sql
-- post_magazines 승인 흐름 지원
ALTER TABLE public.post_magazines
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- status CHECK 제약
ALTER TABLE public.post_magazines
  ADD CONSTRAINT post_magazines_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'rejected'));

-- 관리자 UPDATE 정책 (service_role은 RLS bypass, admin role도 허용)
CREATE POLICY "admin_can_update_magazines"
  ON public.post_magazines
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 기존 데이터 안전: NULL 상태 레코드는 'draft'로 백필
UPDATE public.post_magazines SET status = 'draft' WHERE status IS NULL;
```

### 4.2 RPC: `update_magazine_status`

트랜잭션 원자성 보장 (UPDATE + audit log INSERT 한 번에).

```sql
CREATE OR REPLACE FUNCTION public.update_magazine_status(
  p_magazine_id UUID,
  p_new_status VARCHAR,
  p_admin_user_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
) RETURNS SETOF public.post_magazines
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_before public.post_magazines;
  v_after public.post_magazines;
  v_action TEXT;
BEGIN
  SELECT * INTO v_before FROM public.post_magazines WHERE id = p_magazine_id FOR UPDATE;
  IF v_before IS NULL THEN
    RAISE EXCEPTION 'magazine_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- 전이 검증
  IF NOT (
    (v_before.status = 'draft'     AND p_new_status = 'pending')  OR
    (v_before.status = 'pending'   AND p_new_status = 'published') OR
    (v_before.status = 'pending'   AND p_new_status = 'rejected')  OR
    (v_before.status = 'rejected'  AND p_new_status = 'pending')   OR
    (v_before.status = 'published' AND p_new_status = 'draft')
  ) THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', v_before.status, p_new_status
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.post_magazines
  SET status = p_new_status,
      approved_by = CASE
        WHEN p_new_status = 'published' THEN p_admin_user_id
        ELSE approved_by
      END,
      published_at = CASE
        WHEN p_new_status = 'published' THEN now()
        ELSE published_at
      END,
      rejection_reason = CASE
        WHEN p_new_status = 'rejected' THEN p_rejection_reason
        ELSE NULL
      END,
      updated_at = now()
  WHERE id = p_magazine_id
  RETURNING * INTO v_after;

  v_action := CASE p_new_status
    WHEN 'published' THEN 'magazine_approve'
    WHEN 'rejected' THEN 'magazine_reject'
    WHEN 'pending' THEN 'magazine_submit'
    WHEN 'draft' THEN 'magazine_unpublish'
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

-- admin만 실행
REVOKE ALL ON FUNCTION public.update_magazine_status FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_magazine_status TO authenticated;
```

**근거**: `writeAuditLog()` 현재 패턴은 fire-and-forget (에러 swallow, `lib/api/admin/audit-log.ts:30-32`). Audit INSERT 실패 시 승인만 기록되고 감사 유실. RPC로 원자성 확보. 이 RPC는 향후 Rust 서버가 호출해도 같은 동작을 보장.

---

## 5. Wave 별 상세 설계

### Wave 0.5 — 선행 조사 (0.5일)

**조사 항목**:

1. `createSupabaseServerClient()` 호출 시 service_role 키를 사용하는 admin 전용 변형이 있는지 확인
   - 없으면 **신규 `createAdminSupabaseClient()` 유틸** 생성 (service_role + 쿠키 미사용)
   - 파일: `packages/web/lib/supabase/admin-server.ts`
2. 기존 `AdminEmptyState` 컴포넌트 props/variants 확인 (`packages/web/lib/components/admin/common/AdminEmptyState.tsx` 존재 확인)
3. Rust API에 audit 관련 구조 존재 여부 재확인 (#152 범위 확정용)

**산출물**: 코드 변경 없음. 조사 결과 스펙에 주석 형태로 남김 (본 문서 6절).

### Wave 1 — Empty state 4개 (1일)

**대상 페이지 및 적용 위치**:
| 페이지 | 기존 컴포넌트 | 변경 |
|--------|---------------|------|
| `app/admin/audit-log/page.tsx` | `AdminDataTable` | items.length===0 분기에 `AdminEmptyState` 렌더 |
| `app/admin/content/page.tsx` | 탭 구조 (posts/reports) | 각 탭 내부 목록 empty 처리 |
| `app/admin/editorial-candidates/page.tsx` | 후보 목록 | `AdminEmptyState` with "승인 대기 후보 없음" |
| `app/admin/monitoring/page.tsx` | KPI + 차트 | 데이터 없을 때 KPI/차트 자리에 명시 메시지 (스켈레톤 아닌) |

**기존 패턴 준수**: PR #147에서 완성된 5개 페이지와 동일한 `AdminEmptyState` 사용. 새 패턴 도입 금지.

### Wave 2 — Magazine 승인 (3일)

#### 2a — DB & RPC (0.5일)

- `supabase/migrations/20260417_XXXX_magazine_approval_fields.sql` 작성 (§4.1)
- `supabase/migrations/20260417_XXXX_update_magazine_status_rpc.sql` 작성 (§4.2)
- 로컬 Supabase에 적용 + typegen 재실행 (`bun run supabase:types`)

#### 2b — API route (1일)

```
packages/web/app/api/v1/admin/posts/magazines/
  route.ts                              # GET list (status filter, pagination)
  [id]/
    status/
      route.ts                          # PATCH status (RPC 호출)
```

**`GET /api/v1/admin/posts/magazines?status=pending&page=1&limit=20`**

- `supabase.from("post_magazines").select(...).eq("status", status)`
- anon client OK (SELECT 정책 허용)

**`PATCH /api/v1/admin/posts/magazines/:id/status`**

- body: `{ status: MagazineStatus, rejectionReason?: string }`
- `checkIsAdmin()` → admin user id 획득
- `createAdminSupabaseClient()` 사용 (service_role)
- `supabase.rpc("update_magazine_status", { ... })`
- 에러 매핑:
  - `magazine_not_found` → 404
  - `invalid_transition` → 409
  - 기타 → 500

#### 2c — UI (1.5일)

**신규 파일**:

```
packages/web/lib/components/admin/magazines/
  MagazineApprovalTable.tsx      # status/title/author/submitted_at/actions
  MagazineStatusFilter.tsx       # All/Draft/Pending/Published/Rejected
  RejectModal.tsx                # reason 입력 필수
  MagazineActions.tsx            # Approve/Reject/Revert 버튼

packages/web/lib/hooks/admin/
  useAdminMagazineList.ts        # GET 훅
  useUpdateMagazineStatus.ts     # PATCH mutation 훅
```

**기존 파일 수정**:

- `packages/web/app/admin/content/page.tsx`: `ContentTab = "posts" | "reports" | "magazines"`, `TAB_OPTIONS`에 추가
- 새 탭 `magazines` 렌더 시 `MagazineApprovalTable` + filter

**UX 규칙**:

- Reject 시 사유 **필수** (빈 문자열 차단, 클라이언트 검증 + 서버 검증)
- Approve 후 토스트 + 목록 refetch
- 낙관적 업데이트는 **하지 않음** (RPC 결과로 행 상태 갱신)

### Wave 3 — Next.js audit 일관화 (0.5일)

**실제 gap 조사** (critic 검증 결과 반영):

- Next.js mutation route 중 `writeAuditLog` 누락:
  - Wave 2에서 신규로 추가되는 magazine status → RPC가 처리하므로 자동 커버
  - `reports-status` (Next.js route 여부 확인 필요)
  - `post-images`, `post-spots` (조회만 있을 수 있음)
- **Rust route(`picks` CRUD, `posts/status`)는 이 PR에서 다루지 않음** → #152로 이관

**변경**: 누락된 Next.js route handler에 `writeAuditLog({ action, target_table, target_id, before, after, metadata })` 추가.

---

## 6. 조사 결과 기록 (Wave 0.5 완료)

> 2026-04-17 조사 완료. 후속 wave에서 이 결과를 전제로 진행.

### 6.1 `is_admin` SQL 함수 존재 여부

- **결론: 존재하지 않음** (`grep -rn "CREATE OR REPLACE FUNCTION.*is_admin\|CREATE FUNCTION.*is_admin" supabase/migrations/` → 0건)
- 단 **`users.is_admin` boolean 컬럼**은 존재 (`20260409075040_remote_schema.sql:866`).
- **영향**: §4.1 migration의 `USING (public.is_admin(auth.uid()))` 정책이 그대로 적용 시 실패함.
- **결정**: Task 7 migration 파일에 `is_admin(uuid)` SQL 함수를 **반드시 포함**해야 함. 권장 정의:

  ```sql
  CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
  RETURNS BOOLEAN
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public, pg_temp
  AS $$
    SELECT COALESCE((SELECT is_admin FROM public.users WHERE id = user_id), false);
  $$;
  REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;
  ```

  - SECURITY DEFINER + STABLE: RLS 정책에서 호출 시 plan 캐시 가능
  - `users.is_admin` 컬럼을 단일 진실원으로 사용 (TS 쪽 `checkIsAdmin`과 동일 의미)

### 6.2 `post_magazines` RLS 정책 현황

- `ENABLE ROW LEVEL SECURITY` 활성 (line 2686).
- 정책: **`"Allow public read" FOR SELECT USING (true)` 단 1건**만 존재 (line 2427).
- INSERT/UPDATE/DELETE 정책 **없음** → §4.1의 `admin_can_update_magazines` 정책 추가가 정확한 처방.
- GRANT는 anon/authenticated/service_role 모두 ALL이지만 RLS가 막고 있음.

### 6.3 `checkIsAdmin` 미들웨어 위치

- **파일**: `packages/web/lib/supabase/admin.ts:19`
- **시그니처**: `checkIsAdmin(supabase: SupabaseClient<Database>, userId: string): Promise<boolean>`
- **동작**: `users` 테이블에서 `is_admin` 컬럼 조회, 에러/null/false 모두 false 반환.
- **사용처**: 35+ admin route (proxy.ts, app/admin/layout.tsx, app/api/admin/**, app/api/v1/admin/**)에서 광범위 사용 중.
- **Task 11/12 import 경로**: `import { checkIsAdmin } from "@/lib/supabase/admin";`

### 6.4 `createAdminSupabaseClient` (service-role 클라이언트) 존재 여부

- **결론: 존재하지 않음** (`grep -rn "createAdminSupabaseClient\|createAdminClient" packages/web` → 0건).
- 현재 admin route는 모두 `createSupabaseServerClient()` (anon + 쿠키)만 사용.
- **영향**: §5 Wave 0.5 산출물대로 `packages/web/lib/supabase/admin-server.ts`에 신규 service_role 유틸을 만들어야 함.
- **단 Wave 2 한정 대안**: `update_magazine_status` RPC가 `SECURITY DEFINER`라면, anon 클라이언트로도 호출 가능. RPC 도입 시 service_role 클라이언트 신규 생성을 **선택 사항**으로 격하 가능 (단, RPC 내부에서 `checkIsAdmin(p_admin_user_id)` 검증을 권장).

### 6.5 `AdminEmptyState` 사용 패턴

- **실제 경로**: `packages/web/lib/components/admin/common/AdminEmptyState.tsx` (스펙 §5 Wave 0.5에 기재된 `shared/` 경로는 **오타** — `common/` 으로 정정 필요).
- **Import 패턴**: `import { AdminEmptyState } from "@/lib/components/admin/common";` (배럴 export 사용).
- **Props**: `icon`, `title`, `description`.
- **기존 사용처 (4개)**: `app/admin/ai-audit/page.tsx`, `app/admin/ai-cost/page.tsx`, `app/admin/pipeline-logs/page.tsx`, `app/admin/server-logs/page.tsx`에서 동일 패턴으로 적용 (검증 명령: `grep -rln "AdminEmptyState" packages/web/app/admin/`). 컴포넌트 정의 파일과 배럴(`index.ts`)은 사용처 카운트에서 제외. (`audit-log`는 본 PR Wave 1에서 추가 예정.)
- **Wave 1 가이드**: 기존 4개 페이지(`ai-audit`, `ai-cost`, `pipeline-logs`, `server-logs`) 어느 것이든 모범 예시로 사용. 새 패턴 도입 금지.

### 6.6 Rust audit 인프라

- `packages/api-server/src/` 트리에 `audit` 명칭의 파일/모듈 **없음** (`grep -rn "audit" packages/api-server/src/` → 0건, 관련 모듈 부재 확인).
- 디렉토리 구성: `batch/ bin/ config.rs constants.rs domains/ entities/ error.rs grpc/ handlers.rs lib.rs main.rs metrics/ middleware/ observability/ openapi.rs router.rs services/ tests/ utils/`.
- **결론**: Rust 쪽은 audit 인프라가 전무 → **#152 별도 이슈로 분리**한다는 §2.2 결정이 정확. 본 PR에서 다루지 않음.

### 6.7 후속 task 영향 요약

| 후속 Task              | 본 조사로 인한 변경                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Task 7 (migration)     | **`is_admin(UUID)` 함수 정의를 migration 파일에 추가** (§6.1 정의 사용). `approved_by`/`rejection_reason` 추가는 동일. |
| Task 7 (RLS 정책)      | `admin_can_update_magazines` 정책의 `public.is_admin(auth.uid())` 호출은 함수 추가 후 정상 동작.                       |
| Task 11/12 (API route) | `import { checkIsAdmin } from "@/lib/supabase/admin"` 사용. service_role 클라이언트 신규 생성은 RPC 도입 시 선택.      |
| Wave 1 (empty state)   | `AdminEmptyState` 경로는 `common/` (스펙 §5의 `shared/` 표기는 정정 필요). 기존 5개 사용처를 모범 예시로.              |
| #152 분리 결정         | Rust audit 인프라 부재 재확인 → 별도 이슈 처리 결정 유지.                                                              |

---

## 7. 테스트 전략

### 7.1 Migration 검증

- 로컬 Supabase에 적용 후 기존 레코드 status NOT NULL 확인
- CHECK 제약 위반 케이스 수동 테스트
- RPC 4가지 전이 수동 테스트 (approve/reject/submit/unpublish)

### 7.2 Unit (vitest + RTL)

- **Wave 1**: 각 empty state 분기 렌더 (items=[] / items=[...])
- **Wave 2b**: API route handler
  - approve happy path
  - reject with reason
  - invalid transition → 409
  - not found → 404
  - non-admin → 403
- **Wave 2c**: `MagazineApprovalTable` 상호작용
  - Reject 버튼 클릭 → 모달 열림, 사유 없이 제출 차단
  - Approve 성공 후 mutation 호출 검증

### 7.3 E2E (Playwright)

- Admin 로그인 (service_role 쿠키 주입 — 기존 admin Playwright 셋업 재사용, 없으면 `packages/web/tests/admin/` 하위에 신규 작성)
- Magazine 생성 (seed fixture) → status=pending
- `/admin/content?tab=magazines` 접속 → pending 목록에 표시
- Approve 클릭 → 성공 토스트 → 목록에서 사라짐 (Published 필터에선 등장)
- `/admin/audit-log` 에서 `magazine_approve` 액션 레코드 확인

### 7.4 수동 QA

- gstack `/qa` 스킬로 실브라우저 머지 전 확인
- 거부 사유 한글/영문 모두 테스트

---

## 8. 에러 핸들링

| 레이어          | 에러                 | 처리                                                  |
| --------------- | -------------------- | ----------------------------------------------------- |
| RPC             | `magazine_not_found` | SQL 예외 → Next.js 404 응답                           |
| RPC             | `invalid_transition` | SQL 예외 → Next.js 409 응답 + 에러 메시지 클라 노출   |
| RPC             | DB 실패              | 트랜잭션 롤백 → Next.js 500                           |
| API route       | non-admin            | `checkIsAdmin` 미들웨어 → 403                         |
| Client mutation | 네트워크 오류        | React Query `onError` → 토스트 "요청 실패, 다시 시도" |
| UI              | Reject 사유 빈 값    | 버튼 비활성화 + 인라인 에러                           |

**원칙**: fire-and-forget 감사 쓰기 금지. RPC 내부 트랜잭션으로 보장.

---

## 9. 브랜치 / PR 전략

- 현재 `feature/151-admin-real-data` 유지
- Draft PR #224 재활용
- 커밋 단위:
  1. `feat(admin): wave 0.5 선행 조사 — admin supabase 유틸 추가`
  2. `feat(admin): wave 1 empty state 4개 페이지 적용`
  3. `feat(admin): wave 2a DB — magazine 승인 필드 + RPC`
  4. `feat(admin): wave 2b API — magazine 승인 엔드포인트`
  5. `feat(admin): wave 2c UI — magazine 승인 탭 + 테이블`
  6. `feat(admin): wave 3 Next.js audit 갭 보완`
  7. `docs(issue): #151 분리 이슈(#152/#153) 링크 및 완료 기준`
- 리뷰 → **dev 브랜치로 머지 1 PR** (feature/151 → dev, main은 GIT-WORKFLOW 따라 dev→main PR로 별도 승격)
- 후속: #152 (Rust audit), #153 (entities/seed 실데이터)

---

## 10. 하니스 배치

| 단계             | Harness / Skill                       |
| ---------------- | ------------------------------------- |
| 설계 리뷰 (완료) | OMC `architect` + `critic` 병렬       |
| Wave 1 병렬 구현 | OMC `/team` 또는 4개 Explore 에이전트 |
| Wave 2 TDD 구현  | Superpowers `test-driven-development` |
| Wave 2 UI 리뷰   | gstack `/design-review` (선택)        |
| Security 체크    | gstack `/cso` (admin route)           |
| 코드 리뷰        | gstack `/review`                      |
| QA               | gstack `/qa` + Playwright skill       |

---

## 11. 위험과 완화

| 위험                                                                          | 완화                                                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| RLS 정책이 `public.is_admin(uuid)` 함수 가정 — 존재하지 않으면 migration 실패 | Wave 0.5에서 존재 확인. 없으면 migration에 함수 정의 포함 or admin role 체크 방식 변경 |
| Orval 자동 생성 API에 magazine 추가가 맞물릴 수 있음                          | magazine 승인은 Next.js route라 Orval 영향 없음. Rust 쪽은 #152에서 처리               |
| `#148 editorial OG fix`가 QA 브랜치에만 있어 관련 컴포넌트 충돌 가능          | QA 머지 완료 후 dev → feature 리베이스                                                 |
| Magazine seed 데이터 부재로 E2E 테스트 어려움                                 | Playwright setup에서 fixture seed 스크립트 작성                                        |
| 마이그레이션 순서 꼬임 (RPC가 컬럼보다 먼저)                                  | Migration 파일명 타임스탬프로 순서 보장                                                |

---

## 12. 성공 기준 (완료 정의)

- [ ] 4개 페이지 모두 empty state 렌더 검증
- [ ] Magazine 승인 UI에서 pending→published, pending→rejected 모두 동작
- [ ] `warehouse.admin_audit_log`에 각 액션 레코드 생성
- [ ] E2E 테스트 통과
- [ ] PR #224 머지
- [ ] 이슈 #152, #153 생성 + #151 본문에 링크
- [ ] `gstack /qa` 통과
