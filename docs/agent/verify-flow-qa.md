---
title: Verify Flow — Manual QA Checklist (#333)
owner: human
status: approved
updated: 2026-04-25
tags: [agent, testing, db]
---

# Verify Flow — Manual QA Checklist (#333)

검증 엔드포인트 (`POST /api/v1/raw-posts/{id}/verify`) 의 end-to-end 동작을 수동으로 확인하는 체크리스트. 기능을 만지거나 배포하기 전에 한 번씩 돌리세요.

배경: [`docs/architecture/assets-project.md`](../architecture/assets-project.md)

## 사전 준비

- [ ] 로컬: `just dev` 로 api-server / ai-server / web 모두 기동
- [ ] 로컬: api-server 로그에 `Database connection established` + `Assets DB connection established` 둘 다 출력 확인
- [ ] env 확인:
  - `APP_ENV=local` 인지
  - `ASSETS_DATABASE_URL` 이 cloud assets 를 가리키거나 비어있다면 fallback 메시지("falling back to DATABASE_URL")가 떴는지
- [ ] cloud assets 에 COMPLETED 상태의 raw_post 가 최소 1건 (없으면 ai-server 스케줄러를 켜서 채우거나 SQL 로 직접 seed)

## 본 체크

### 1. 소스 등록 → admin UI 노출 (회귀)

- [ ] `/admin/raw-post-sources` 진입 → 활성 소스 1건 등록 (platform=mock 등)
- [ ] api-server 응답 200, 신규 row 가 목록에 즉시 보임

### 2. 파이프라인 자동 처리 → COMPLETED 도달

- [ ] ai-server scheduler 가 한 번 tick 한 뒤 (≤ 5분) cloud assets 에 raw_post row 가 INSERT 됨
- [ ] `status = COMPLETED` 로 INSERT 됐는지 확인 (assets 직접 SQL):
  ```sql
  SELECT id, status, parse_status, created_at
    FROM public.raw_posts
   ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] `pipeline_events` 에 `(NULL → COMPLETED)` 행이 함께 INSERT 됐는지 확인:
  ```sql
  SELECT raw_post_id, from_status, to_status, actor, occurred_at
    FROM public.pipeline_events
   ORDER BY occurred_at DESC LIMIT 5;
  ```

### 3. admin 검증 큐 화면

- [ ] `/admin/raw-posts` 진입 → COMPLETED 탭이 기본
- [ ] 위 2번에서 만들어진 raw_post 가 표에 보임
- [ ] R2 썸네일이 정상 표시됨 (`image_url` 단일 컬럼; #347 에서 r2_url/r2_key 통합)
- [ ] caption / author / created 컬럼 채워짐
- [ ] 페이지네이션 / 플랫폼 필터 동작
- [ ] querystring 동기화 — 새 탭으로 URL 복사 후 열어도 같은 화면

### 4. 검증 액션 (성공 경로)

- [ ] "검증" 버튼 클릭 → confirm() 다이얼로그가 dedupe 책임을 명시함 ("DB UNIQUE 제약 없음")
- [ ] 확인 → 200 응답, list 자동 invalidate (UI 새로고침 없이 행 사라짐 또는 VERIFIED 탭으로 이동)
- [ ] 로컬 prod `public.posts` 에 새 row 생성:
  ```sql
  SELECT id, user_id, image_url, title, status, created_at
    FROM public.posts
   ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] `/posts/{new_id}` 또는 explore 화면에 새 포스트가 표시됨

### 5. APP_ENV=local 가드 (오염 방지)

- [ ] 위 4번 직후 cloud assets 의 raw_post status 가 **여전히 COMPLETED** 인지 확인:
  ```sql
  SELECT id, status, verified_at, verified_by FROM public.raw_posts WHERE id = $1;
  ```
- [ ] api-server 로그에 `APP_ENV=local → skipping assets status write (cloud assets not polluted)` WARN 출력
- [ ] `pipeline_events` 에 `COMPLETED → VERIFIED` 새 행이 **추가되지 않았는지** 확인 (Local 분기는 이벤트도 기록 안 함)

### 6. 상태 가드 (실패 경로)

- [ ] `IN_PROGRESS` / `ERROR` / `VERIFIED` 탭에서는 "검증" 버튼이 보이지 않음
- [ ] cloud assets SQL 로 `status` 를 `IN_PROGRESS` 로 강제 변경 후 verify API 호출 → **400 BadRequest** + 메시지에 현재 상태 명시
- [ ] 존재하지 않는 id 로 verify 호출 → **404 NotFound**

### 7. ai-server 상태 전환 로그

- [ ] ai-server 로그에서 `raw_posts.scheduler` / `raw_posts.fetch` 로그 정상
- [ ] 위 2번 새 row 에 대해 `pipeline_events` 가 자동 기록됐는지 (3번 항목과 동일)
- [ ] `mark_raw_post_error` 경로 (의도적으로 R2 credential 을 한 번 깨뜨려 ERROR 마킹 검증) — optional

## 회귀 가드

- [ ] `/api/v1/raw-posts/stats` 200, COMPLETED count 가 위 시나리오로 +1 됨
- [ ] `/api/v1/posts` 가 정상 동작 (warehouse → public 이관 회귀 없음)
- [ ] `/admin/raw-post-sources` 페이지가 그대로 동작 (#327 회귀 없음)

## production 배포 후 추가 체크

- [ ] `GET /api/v1/raw-posts/stats` 통계 정상
- [ ] ai-server 로그에 `NOT_STARTED → IN_PROGRESS → COMPLETED` 또는 `→ COMPLETED` 직접 전이 관찰
- [ ] admin 에서 첫 cloud verify 1건 수행 후 prod `public.posts` 증가 + assets `status=VERIFIED` 전환 확인
- [ ] `pipeline_events` 에 `COMPLETED → VERIFIED` 행 기록됨 (production 환경에서만)
