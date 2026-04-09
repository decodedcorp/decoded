# Admin Seed-Ops Migration Design

> **Issue**: decodedcorp/decoded-monorepo#101
> **Branch**: `feat/admin-seed-ops-migration`
> **Date**: 2026-04-06

## Overview

외부 레포 [decoded-seed-ops](https://github.com/decodedcorp/decoded-seed-ops)의 전체 기능을 모노레포 `/admin`으로 마이그레이션하고, 벌크 액션/Audit Log/변경 이력 등 추가 기능을 구현한다. Admin 로그인도 Google Auth에서 이메일/패스워드 방식으로 변경한다.

## Scope

### 마이그레이션 대상 (seed-ops 전체)

| seed-ops 페이지 | 모노레포 라우트 | 설명 |
|-----------------|----------------|------|
| `/candidates` | `/admin/seed/candidates` | seed 후보 목록 (draft/approved/rejected 필터) |
| `/candidates/[id]` | `/admin/seed/candidates/[id]` | 후보 상세 + source 확정 + 검수 |
| `/review` | `/admin/review` | 통합 검수 큐 |
| `/artists` | `/admin/entities/artists` | 아티스트 CRUD |
| `/brands` | `/admin/entities/brands` | 브랜드 CRUD |
| `/group-members` | `/admin/entities/group-members` | 그룹 멤버 관리 |
| `/post-images` | `/admin/seed/post-images` | 포스트 이미지 대시보드 |
| `/post-spots` | `/admin/seed/post-spots` | 스팟/솔루션 대시보드 |

### 추가 기능 (신규)

- **벌크 액션**: 다중 선택 → 일괄 approve/reject/delete
- **Audit Log**: 관리자 액션 기록, 필터, 조회
- **변경 이력/롤백**: before/after 스냅샷 기반 롤백
- **Admin Auth 변경**: Google Auth → 이메일/패스워드 (Supabase Auth)

## Architecture

### 라우트 맵

```
/admin/                          (기존 Dashboard)
/admin/login/                    (변경: 이메일/패스워드)
/admin/content/                  (기존)
/admin/editorial-candidates/     (기존)
/admin/picks/                    (기존)
/admin/seed/                     ← NEW: Seed 파이프라인
  /candidates/                   후보 목록
  /candidates/[id]/              후보 상세
  /post-images/                  이미지 대시보드
  /post-spots/                   스팟/솔루션 대시보드
/admin/entities/                 ← NEW: 엔티티 관리
  /artists/                      아티스트 CRUD
  /brands/                       브랜드 CRUD
  /group-members/                그룹 멤버 관리
/admin/review/                   ← NEW: 통합 검수 큐
/admin/audit-log/                ← NEW: 관리자 액션 로그
/admin/ai-audit/                 (기존)
/admin/ai-cost/                  (기존)
/admin/pipeline-logs/            (기존)
/admin/server-logs/              (기존)
```

### 데이터 접근 (하이브리드)

| 작업 | 방식 | 이유 |
|------|------|------|
| 목록 조회, 필터, 검색 | Supabase 직접 (warehouse schema) | 빠른 읽기, 실시간 필터 |
| 상태 변경, CRUD 쓰기 | Next.js API Routes → Supabase service_role | seed-ops 패턴 유지 |
| Audit log 기록 | Next.js API Route 미들웨어 (자동) | 모든 변경 중앙 로깅 |

### Admin Auth 변경

- **현재**: Google OAuth → `checkIsAdmin()` (admin 테이블 확인)
- **변경**: Supabase Auth 이메일/패스워드 → `checkIsAdmin()` 유지
- **영향 범위**: `/admin/login/page.tsx`, `proxy.ts` admin 인증 로직
- admin 테이블 기반 권한 검증은 그대로 유지

### API Routes (Next.js)

```
/api/admin/
  /candidates/              GET (목록), POST (생성)
  /candidates/[id]/         GET (상세), PATCH (수정)
  /candidates/[id]/approve  POST
  /candidates/[id]/reject   POST
  /candidates/[id]/source   POST (source 확정)
  /entities/artists/        GET, POST
  /entities/artists/[id]/   GET, PATCH, DELETE
  /entities/brands/         GET, POST
  /entities/brands/[id]/    GET, PATCH, DELETE
  /entities/group-members/  GET, POST, DELETE
  /post-images/             GET
  /post-spots/              GET
  /review/                  GET (검수 큐)
  /bulk/                    POST (벌크 액션)
  /audit-log/               GET (로그 조회)
```

### Audit Log 스키마

```sql
-- warehouse.admin_audit_log
CREATE TABLE warehouse.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,          -- 'approve', 'reject', 'update', 'delete', 'bulk_approve'
  target_table text NOT NULL,    -- 'seed_posts', 'artists', 'brands' 등
  target_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb,                -- IP, bulk_id, 추가 컨텍스트
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_admin ON warehouse.admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_target ON warehouse.admin_audit_log(target_table, target_id);
CREATE INDEX idx_audit_log_created ON warehouse.admin_audit_log(created_at DESC);
```

### 공통 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `AdminDataTable` | 정렬/필터/페이지네이션/벌크 선택 테이블 |
| `AdminStatusBadge` | draft/approved/rejected 상태 뱃지 |
| `AdminBulkActionBar` | 벌크 액션 툴바 (선택된 항목에 대한 일괄 작업) |
| `AdminDetailPanel` | 상세 보기 슬라이드 패널 |
| `AdminImagePreview` | 이미지 프리뷰 (외부 URL 지원) |
| `AuditLogEntry` | audit log 한 줄 표시 + diff 뷰어 |

## Implementation Phases

### Phase 0: Admin Auth + 공통 기반
- Admin 로그인을 이메일/패스워드로 변경
- `AdminDataTable`, `AdminStatusBadge`, `AdminBulkActionBar` 공통 컴포넌트
- 사이드바에 Seed Pipeline, Entities 메뉴 그룹 추가
- Audit log DDL 마이그레이션 + 로깅 유틸리티
- **순차 실행** (공통 패턴 확립)

### Phase 1: 엔티티 관리
- `/admin/entities/artists` — 아티스트 목록/CRUD
- `/admin/entities/brands` — 브랜드 목록/CRUD
- `/admin/entities/group-members` — 그룹 멤버 관리
- **순차 실행** (공통 테이블 패턴 검증)

### Phase 2: Seed 파이프라인 (병렬)
- **Agent A**: `/admin/seed/candidates` + `/admin/seed/candidates/[id]`
- **Agent B**: `/admin/seed/post-images` + `/admin/seed/post-spots`
- **Agent C**: `/admin/review` — 통합 검수 큐

### Phase 3: 추가 기능 (병렬)
- **Agent A**: 벌크 액션 (AdminBulkActionBar 연동)
- **Agent B**: `/admin/audit-log` — 이력 조회/필터 UI
- **Agent C**: 변경 이력 diff 뷰어 + 롤백 기능

## Design Decisions

1. **디자인 시스템**: seed-ops 코드를 복사하지 않고, decoded.pen 디자인 시스템 + 기존 admin 패턴으로 재작성
2. **Supabase service_role**: seed-ops와 동일하게 warehouse 스키마에 service_role로 접근 (admin은 인증된 관리자만 접근 가능하므로 안전)
3. **Audit log**: DB trigger가 아닌 API 미들웨어 방식 — 관리자 정보(who) + 컨텍스트(why) 포함 가능
4. **벌크 액션**: 트랜잭션으로 묶어 all-or-nothing, 실패 시 전체 롤백

## Success Criteria

- [ ] seed-ops의 7개 페이지 기능이 모두 admin에서 동작
- [ ] Admin 로그인이 이메일/패스워드로 동작
- [ ] 벌크 액션으로 다수 항목 일괄 처리 가능
- [ ] 모든 관리자 액션이 audit log에 기록
- [ ] 변경 이력 조회 및 롤백 가능
- [ ] 기존 admin 기능(Dashboard, Content, Picks 등)에 영향 없음

## Issue Management

- **Parent**: #101 — [Feature] 관리자 페이지 마이그레이션
- Sub-issues per phase (GitHub issue로 생성)
