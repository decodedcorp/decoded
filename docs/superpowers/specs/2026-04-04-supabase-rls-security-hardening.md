# Supabase RLS & Security Hardening

**Date:** 2026-04-04
**Status:** Draft
**Scope:** public 스키마 34개 테이블 RLS 적용 + 보안 advisor 이슈 전체 해소

---

## 1. Background

Supabase Security Advisor에서 CRITICAL/WARN 이슈 발견:
- **RLS 미적용**: public 스키마 34개 테이블
- **민감 컬럼 노출**: `user_social_accounts.access_token/refresh_token`이 anon key로 접근 가능
- **SECURITY DEFINER 뷰**: `explore_posts`가 뷰 생성자 권한으로 실행
- **search_path 미설정**: 4개 함수 (`handle_new_user`, `search_similar`, `update_updated_at_column`, `touch_updated_at`)
- **Extension 위치**: `unaccent`, `pg_trgm`이 public 스키마에 설치
- **Leaked password protection**: 비활성화 상태

### 아키텍처 전제

- **프론트엔드**: anon key로 Supabase client 직접 쿼리 → RLS 적용됨
- **Rust API**: SeaORM으로 PostgreSQL 직접 접속 → RLS 우회 (service role)
- **게스트 브라우징**: 지원됨 (`auth.uid()` = NULL 가능)
- **어드민**: app-layer에서 `is_admin` 플래그로 제어 (DB 정책 아님)

---

## 2. RLS 정책 설계

### 2.1 Public Read (18개 테이블)

`SELECT: true` — 모든 사용자(게스트 포함) 읽기 허용, 쓰기 차단.

```sql
-- 패턴: RLS 활성화 + public read 정책
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.{table} FOR SELECT USING (true);
```

**대상 테이블:**

| 테이블 | 비고 |
|--------|------|
| `categories` | 참조 데이터 |
| `subcategories` | 참조 데이터 |
| `badges` | 뱃지 목록 |
| `user_badges` | 뱃지 할당 (공개) |
| `posts` | 게스트 브라우징 |
| `spots` | 포스트 하위 |
| `solutions` | 포스트 하위 |
| `post_magazines` | 매거진 |
| `magazines` | 매거진 시스템 |
| `magazine_posts` | 매거진-포스트 연결 |
| `comments` | 공개 댓글 |
| `curations` | 큐레이션 |
| `curation_posts` | 큐레이션 연결 |
| `synonyms` | 검색 동의어 |
| `seaql_migrations` | 마이그레이션 기록 |
| `embeddings` | 벡터 임베딩 |
| `votes` | 투표 (공개) |
| `user_follows` | 팔로우 그래프 (공개 읽기) |

**`posts` 추가 정책** (소유자 쓰기):
```sql
CREATE POLICY "Owner insert posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);
```

**`comments` 추가 정책** (인증 사용자 쓰기):
```sql
CREATE POLICY "Auth insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);
```

**`user_follows` 추가 정책** (팔로우 관리):
```sql
CREATE POLICY "Auth insert follows" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Owner delete follows" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);
```

**`votes` 추가 정책**:
```sql
CREATE POLICY "Auth insert votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id);
```

### 2.2 User-scoped (10개 테이블)

소유자만 자신의 데이터에 접근. `auth.uid() = user_id` 기반.

```sql
-- 패턴: 소유자만 CRUD
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.{table} FOR SELECT USING (auth.uid() = {uid_col});
CREATE POLICY "Owner insert" ON public.{table} FOR INSERT WITH CHECK (auth.uid() = {uid_col});
CREATE POLICY "Owner update" ON public.{table} FOR UPDATE USING (auth.uid() = {uid_col});
CREATE POLICY "Owner delete" ON public.{table} FOR DELETE USING (auth.uid() = {uid_col});
```

| 테이블 | uid 컬럼 | SELECT 예외 | 비고 |
|--------|----------|------------|------|
| `users` | `id` | public read (프로필 공개) | UPDATE/DELETE만 소유자 |
| `user_social_accounts` | `user_id` | 없음 (완전 비공개) | **CRITICAL: 토큰 보호** |
| `user_magazines` | `user_id` | 없음 | 개인 매거진 컬렉션 |
| `user_collections` | `user_id` | 없음 | 개인 컬렉션 |
| `post_likes` | `user_id` | 없음 | 좋아요 (비공개) |
| `saved_posts` | `user_id` | 없음 | 저장 (비공개) |
| `click_logs` | `user_id` | 없음 | 클릭 로그 |
| `view_logs` | `user_id` | 없음 | 조회 로그 |
| `credit_transactions` | `user_id` | 없음 | 크레딧 내역 |
| `content_reports` | `reporter_id` | 없음 | 신고 내역 |

**`users` 특수 정책** (공개 프로필 + 소유자 수정):
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Owner update profile" ON public.users FOR UPDATE USING (auth.uid() = id);
```

### 2.3 Internal-only (6개 테이블)

RLS 활성화 + 정책 없음 = deny all. Rust 백엔드(SeaORM)에서만 접근.

```sql
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = 모든 접근 차단 (anon key)
```

| 테이블 | 이유 |
|--------|------|
| `agent_sessions` | AI 에이전트 세션 |
| `checkpoints` | LangGraph 체크포인트 |
| `checkpoint_blobs` | LangGraph 블롭 |
| `checkpoint_writes` | LangGraph 쓰기 |
| `checkpoint_migrations` | LangGraph 마이그레이션 |
| `processed_batches` | ETL 배치 처리 |
| `failed_batch_items` | ETL 실패 항목 |
| `search_logs` | 서버 로깅 |
| `point_logs` | 포인트 내부 기록 |
| `earnings` | 정산 |
| `settlements` | 정산 |

---

## 3. 추가 보안 조치

### 3.1 explore_posts 뷰 — SECURITY INVOKER 전환

현재 SECURITY DEFINER로 정의되어 뷰 생성자 권한으로 실행됨.
SECURITY INVOKER로 전환하여 쿼리하는 사용자의 권한으로 실행.

```sql
CREATE OR REPLACE VIEW public.explore_posts
WITH (security_invoker = true) AS
SELECT p.id, p.user_id, p.image_url, p.media_type, p.title,
       p.media_metadata, p.group_name, p.artist_name, p.context,
       p.view_count, p.status, p.created_at, p.updated_at,
       p.trending_score, p.created_with_solutions, p.post_magazine_id,
       p.ai_summary, p.artist_id, p.group_id,
       pm.title AS post_magazine_title
FROM posts p
JOIN post_magazines pm ON pm.id = p.post_magazine_id
WHERE p.status = 'active'
  AND p.image_url IS NOT NULL
  AND p.created_with_solutions = true
  AND pm.status = 'published';
```

### 3.2 함수 search_path 고정 (4개)

```sql
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.search_similar(vector, int, float) SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION warehouse.touch_updated_at() SET search_path = '';
```

### 3.3 Extension 스키마 이동

```sql
ALTER EXTENSION unaccent SET SCHEMA extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
```

> **주의**: `unaccent`를 사용하는 함수/인덱스가 있으면 스키마 참조 업데이트 필요. 백필 마이그레이션에서 `unaccent()` 사용 중 — 함수 이름을 `extensions.unaccent()`로 변경하거나, search_path에 extensions를 포함해야 함.

### 3.4 Leaked Password Protection 활성화

Supabase 대시보드 > Authentication > Settings에서 활성화.
(SQL 마이그레이션 아닌 대시보드 설정)

---

## 4. 마이그레이션 전략

총 4개 마이그레이션으로 분리:

| # | 마이그레이션 | 내용 |
|---|-------------|------|
| 1 | `rls_public_read_tables` | 18개 Public Read 테이블 RLS + 정책 |
| 2 | `rls_user_scoped_tables` | 10개 User-scoped 테이블 RLS + 정책 |
| 3 | `rls_internal_only_tables` | 11개 Internal 테이블 RLS (정책 없음) |
| 4 | `security_hardening_views_functions` | explore_posts 뷰 전환 + search_path + extension 이동 |

### 롤백 전략

모든 마이그레이션에 롤백 SQL 포함:
```sql
-- Rollback: ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY;
-- Rollback: DROP POLICY IF EXISTS "policy_name" ON public.{table};
```

---

## 5. 검증 방법

1. **마이그레이션 후**: `mcp__supabase__get_advisors` security 재실행 → ERROR 0건 확인
2. **프론트엔드 테스트**: 게스트 모드에서 explore, 검색, 상세페이지 정상 동작 확인
3. **인증 사용자**: 프로필, 좋아요, 저장 기능 정상 동작 확인
4. **토큰 보호**: anon key로 `user_social_accounts` SELECT 시 빈 결과 확인
5. **Rust 백엔드**: SeaORM CRUD 작업 영향 없음 확인

---

## 6. 범위 외

- Supabase Auth 설정 (leaked password protection) — 대시보드에서 수동 활성화
- 테이블별 컬럼 단위 권한 (Column-level security) — 현재 불필요
- Admin RLS 정책 — app-layer에서 `is_admin` 체크로 충분
