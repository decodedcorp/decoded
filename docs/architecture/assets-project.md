---
title: Assets Supabase Project
owner: human
status: approved
updated: 2026-04-25
tags: [architecture, db, raw-posts, pipeline, agent]
---

# Assets Supabase Project (#333)

**한 줄 요약**: Pinterest/Instagram 등 외부 플랫폼에서 수집·파싱한 raw_posts 와 파이프라인 중간 상태를 별도 Supabase 프로젝트(`assets`)에 격리. prod 는 admin 이 검증 완료한 데이터만 보유.

## 왜 분리했나

PR #258 의 raw_posts 파이프라인이 prod Supabase 의 `warehouse.raw_post*` 테이블을 직접 사용하면서 두 가지 문제가 누적됐다:

1. **운영 경계 모호** — 검증된 prod posts 와 unverified raw 데이터가 같은 프로젝트에 섞여 있어 백업/복원, RLS, 권한 분리, 모니터링 모두 한꺼번에 다뤄야 했다.
2. **prod 스키마 오염** — 파이프라인 상태머신, dispatch 로그, parse 결과 등 운영성 메타데이터가 prod 의 schema diff 를 키웠다.

**원칙**: 두 프로젝트는 cross-ID 참조 없이 완전 독립. prod 는 assets 의 존재를 모르고, assets 도 prod 를 모른다.

## 구조

```
┌──────────────────────────────────────────────┐
│ Cloud Supabase: ASSETS  (파이프라인 스테이징)   │
│ public.raw_post_sources                       │
│ public.raw_posts                              │
│   └ status pipeline_status                    │
│   └ verified_at / verified_by                 │
│ public.pipeline_events                        │
│ + RLS: service-role only                      │
└──────────────▲──────────────┬─────────────────┘
               │ write         │ read
               │               │
   ┌───────────┴────┐  ┌───────┴──────────────┐
   │  ai-server     │  │  api-server          │ ──► R2 (raw bucket, 공유)
   │  ARQ pipeline  │  │  raw_posts domain    │
   │   ↓            │  │   verify endpoint    │
   │  status=COMPLETED ──────────►              │
   └────────────────┘  └────────┬─────────────┘
                                │ on verify ✓
                                ▼ INSERT
┌──────────────────────────────────────────────┐
│ Cloud Supabase: PROD  (검증본 — 실서비스)       │
│ public.posts (검증된 raw_post 의 복사본)        │
│ public.users / public.solutions / ...         │
│ public.artists / public.groups / public.brands│
│   (#335 warehouse → public 이관)              │
└──────────────────────────────────────────────┘
```

## 핵심 설계 결정

### 1. 검증(verify) 이 최종 액션 — "승격" 개념 없음

admin 이 COMPLETED raw_post 를 검증하면 **한 번의 액션**으로:

- assets `status = COMPLETED → VERIFIED` (production 환경에서만)
- prod `public.posts` 에 새 row INSERT

별도의 "promote" 단계나 후처리 없음. `verified_at`/`verified_by` 가 운영적 진실의 기준.

### 2. 중복 방지는 admin 운영 책임

prod `public.posts` 에 **DB UNIQUE 제약을 걸지 않는다**. admin UI 가 같은 raw_post 를 두 번 검증할 가능성을 시각적으로 막고, 실제로 중복이 발생하면 admin 이 수동 정리한다. 이유:

- 동일한 이미지가 여러 platform/external_id 로 들어올 수 있어 DB 레벨 dedupe 가 false positive 다발
- VERIFIED 가 cross-project ID(`source_raw_post_id`) 로 prod 에 새는 걸 막아야 함

### 3. 5-state 파이프라인 상태머신

```
NOT_STARTED → IN_PROGRESS → COMPLETED ──(admin verify)──► VERIFIED
                          ↘ ERROR
```

| 상태 | 의미 | 누가 전이시키는가 |
|---|---|---|
| `NOT_STARTED` | row 가 막 INSERT 됨 (default) | DB default |
| `IN_PROGRESS` | fetch / parse 진행 중 | ai-server (현재 architecture 에선 거의 사용되지 않음 — 단일 트랜잭션) |
| `COMPLETED` | 자동 처리 완료 (R2 업로드 + 기본 메타) | ai-server `upsert_raw_posts` |
| `VERIFIED` | admin 검증 완료, prod 에 반영됨 | api-server `verify_raw_post` |
| `ERROR` | 어느 단계든 실패 | ai-server `mark_raw_post_error` |

전환 시 `pipeline_events` 에 감사 row 가 동일 트랜잭션으로 INSERT 된다.

### 4. APP_ENV 분기로 cloud assets 보호

로컬 개발자가 cloud assets(공유) 데이터를 오염시키지 않도록 `APP_ENV=local` 일 때 verify 엔드포인트는 **prod INSERT 만** 수행하고 assets status write 를 스킵한다. production 배포에서만 status=VERIFIED 가 기록된다.

## verify 시퀀스

```
[Admin]
  │ /admin/raw-posts → COMPLETED 탭에서 행 클릭 → "검증" 버튼
  ▼
[web Next.js]
  │ POST /api/admin/raw-posts/items/{id}/verify
  ▼
[api-server proxy]
  │ Bearer 위임
  ▼
[api-server raw_posts::verify_raw_post]
  ├─ assets_db.find_by_id(id)  ← assets pool
  │     status == COMPLETED ?  → 아니면 400
  │
  ├─ posts::create_post_from_raw(prod_db, admin_id, raw, dto)  ← prod pool
  │     INSERT INTO public.posts ... RETURNING *
  │
  └─ if APP_ENV == Production:
        assets txn:
          UPDATE public.raw_posts SET status='VERIFIED' WHERE id=$1
          INSERT INTO public.pipeline_events (raw_post_id, from_status,
                                              to_status, actor) VALUES (...)
        commit
        (실패 시 prod 는 이미 INSERT 된 상태 — admin 이 시각적 dedupe)
```

## 실패 모드

| 시나리오 | 영향 | 완화 |
|---|---|---|
| cloud assets 장애 | `/api/v1/raw-posts/*` 503, posts CRUD 정상 | pool 분리. 장애 메시지에서 명시 |
| verify step 2 ✓ + step 3 ✗ | prod 에 새 row, assets 는 여전히 COMPLETED → 다음 클릭에서 중복 INSERT 가능 | admin 시각적 dedupe (설계 결정 #2). loud error log |
| assets URL stale (로컬) | DATABASE_URL fallback + WARN | `APP_ENV=production` 에서는 panic |
| 파이프라인 ERROR 재시도 | `mark_raw_post_error` 가 VERIFIED 는 보존 | `WHERE status <> 'VERIFIED'` 가드 |

## 마이그레이션 (#335)

prod 에서 `warehouse` 스키마를 완전 드롭하고 살아남는 엔티티 테이블(artists/groups/brands/group_members/admin_audit_log/instagram_accounts) 을 `public` 스키마로 SET SCHEMA. 자세한 절차는 [`docs/DATABASE-MIGRATIONS.md`](../DATABASE-MIGRATIONS.md) 와 `supabase/migrations/20260425000001_drop_warehouse_and_promote_entities.sql`.

## 관련 파일

- 스키마: `supabase-assets/migrations/20260424120000_initial.sql` (초기) + `20260426130000_drop_r2_columns.sql` (#347 r2_url/r2_key 드롭)
- api-server: `packages/api-server/src/domains/raw_posts/{handlers,service,dto}.rs`
- api-server entity: `packages/api-server/src/entities/{assets_raw_posts,assets_raw_post_sources}.rs`
- api-server config: `packages/api-server/src/config.rs::AppEnv` / `AssetsDatabaseConfig`
- api-server state: `packages/api-server/src/app_state.rs::AppState::assets_db`
- ai-server: `packages/ai-server/src/services/raw_posts/repository.py`
- ai-server pool: `packages/ai-server/src/managers/database/pool.py::DatabaseManager._resolve_dsn`
- web admin: `packages/web/app/admin/raw-posts/page.tsx`
- web hook: `packages/web/lib/api/admin/raw-posts.ts`
- 환경: [`docs/agent/environments.md`](../agent/environments.md)

## 컬럼 의미 (raw_posts 본체)

| 컬럼 | 의미 | 케이스별 |
|---|---|---|
| `external_url` | 외부 출처 페이지 URL (Pinterest 핀 페이지 등) | Pinterest/IG: 핀/포스트 URL — 합성: NULL |
| `image_url` | **이미지 위치 URL — 실질적으로 R2 퍼블릭 URL**. ai-server 가 R2 업로드 후 채움 (#347) | 모든 케이스 동일 |
| `caption` | 텍스트 (Pinterest description, IG caption 등) | 합성 케이스: NULL 또는 prompt |
| `author_name` | 저자/소스 명 (Pinterest pinner 등) | — |
| `platform_metadata` | 플랫폼별 자유 메타 (saves, board_id, hashtags 등) | 합성 케이스: 보통 NULL |
| `parse_result` | 비전파싱 결과 (아이템 bbox, 브랜드 후보 등) | 모든 케이스 동일 — Vision 결과 |
| `dispatch_id` | ai-server scheduler 의 1회 dispatch 추적 키 | — |

> #347 이전: `image_url`(외부 CDN) + `r2_url`(R2 복사본) + `r2_key`(R2 path) 3개 컬럼이었으나 단일화. 외부 CDN URL 은 운영상 거의 미사용이라 드롭, R2 URL 은 `image_url` 한 컬럼으로 통합.

## 변경 이력

- 2026-04-26: r2_url/r2_key 컬럼 드롭, image_url 단일화 (#347)
- 2026-04-25: 초기 작성 — 두 프로젝트 분리, 5-state 상태머신, verify 플로우 (#333)
