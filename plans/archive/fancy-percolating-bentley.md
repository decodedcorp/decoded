# Plan: Supabase 스키마 & types.ts 동기화

## Context

`packages/web/lib/supabase/types.ts`가 2026-03-18 이후 업데이트되지 않아 실제 DB 스키마와 심각한 drift 발생. 4건의 마이그레이션이 반영 안 됨. 컬럼명 불일치(`media_title` vs `title`), 유령 컬럼(`price_amount`), 유령 테이블(`user_events`, `decoded_picks`) 등 다수 문제 확인. DB에 누락 테이블/컬럼을 생성하고, types.ts를 재생성하며, 코드 참조를 일괄 수정한다.

## Step 1: DB 마이그레이션 — 누락 테이블/컬럼 생성

### 1a. `decoded_picks` 테이블 생성
- 5개 파일에서 참조 중 (queries, admin API routes)
- types.ts의 기존 정의 기반으로 생성

```sql
CREATE TABLE IF NOT EXISTS public.decoded_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  pick_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  curated_by varchar NOT NULL DEFAULT 'system',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_decoded_picks_post_id ON public.decoded_picks(post_id);
CREATE INDEX idx_decoded_picks_pick_date ON public.decoded_picks(pick_date DESC);
ALTER TABLE public.decoded_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read decoded_picks" ON public.decoded_picks FOR SELECT USING (true);
```

### 1b. `user_events` 테이블 생성
- 3개 파일에서 참조 중 (events.ts, personalization, events route)
- v6.0 paused이지만 코드가 이미 존재

```sql
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type varchar NOT NULL,
  entity_id uuid,
  session_id varchar NOT NULL,
  page_path varchar NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_event_type ON public.user_events(event_type);
CREATE INDEX idx_user_events_created_at ON public.user_events(created_at DESC);
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own events" ON public.user_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own events" ON public.user_events FOR SELECT USING (auth.uid() = user_id);
```

### 1c. `solutions`에 `price_amount`/`price_currency` 컬럼 추가
- 8개 파일에서 참조 중 (queries, components, hooks)
- DB에 존재하지 않아 항상 null 반환

```sql
ALTER TABLE public.solutions
  ADD COLUMN IF NOT EXISTS price_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS price_currency varchar(10) DEFAULT 'KRW';
```

Tool: `mcp__supabase__apply_migration` 3회

## Step 2: types.ts 재생성

### 2a. `supabase gen types typescript` 실행
```bash
npx supabase gen types typescript --project-id fvxchskblyhuswzlcmql --schema public > /tmp/supabase-public-types.ts
```

### 2b. types.ts 교체
- 생성된 Database 타입으로 교체
- 기존 커스텀 타입 alias 유지: `PostRow`, `SolutionRow`, `SpotRow`, `UserEventRow`, `UserEventInsert`, `BadgeRow`, `Database`, `PostMagazineRow`, `CommentRow`, `UserRow`, `UserBadgeRow`, `CategoryRow`, `SubcategoryRow`, `UserTryonHistoryRow`
- `I18nText` 인터페이스 유지
- `ImageRow` (deprecated) 유지
- utility types (`Tables<T>`, `TablesInsert<T>`, `TablesUpdate<T>`, `Enums<T>`) 유지
- 파일 경로: `packages/web/lib/supabase/types.ts`

### 2c. warehouse-types.ts 확인
- warehouse 스키마는 현재 drift 없음 — 변경 불필요

## Step 3: `media_title` → `title` 코드 수정 (8개 파일, 13곳)

DB 컬럼은 이미 `title`로 rename 됨 (migration `m20260205_000005`). types.ts 재생성 시 자동으로 `title`이 됨. 프론트엔드 참조도 일괄 수정.

| # | 파일 | 라인 | 변경 |
|---|------|------|------|
| 1 | `lib/supabase/queries/main-page.server.ts` | 149 | `row.media_title` → `row.title` |
| 2 | `lib/supabase/queries/posts.ts` | 159 | `result.post.media_title` → `result.post.title` |
| 3 | `lib/supabase/queries/personalization.server.ts` | 55 | type `media_title` → `title` |
| 4 | `lib/supabase/queries/personalization.server.ts` | 66 | `row.media_title` → `row.title` |
| 5 | `app/api/v1/search/route.ts` | 115 | `post.media_title` → `post.title` |
| 6 | `lib/components/profile/PostsGrid.tsx` | 54 | `row.media_title` → `row.title` |
| 7 | `lib/hooks/useTries.ts` | 11 | type `media_title` → `title` |
| 8 | `lib/hooks/useImages.ts` | 392, 404 | `post.media_title` → `post.title` |
| 9 | `lib/components/detail/TryGallerySection.tsx` | 117 | `tryPost.media_title` → `tryPost.title` |

## Step 4: package.json에 타입 생성 스크립트 추가

```json
"gen:types": "npx supabase gen types typescript --project-id fvxchskblyhuswzlcmql --schema public > lib/supabase/generated-types.ts"
```

향후 drift 방지를 위한 재생성 명령어 등록.

## Step 5: 메모리 업데이트

- `project_supabase_typegen.md` 업데이트: drift 해소 완료, 재생성 명령어 기록

## 수정 대상 파일 요약

| 파일 | 변경 유형 |
|------|----------|
| `packages/web/lib/supabase/types.ts` | **전체 재생성** |
| `packages/web/lib/supabase/queries/main-page.server.ts` | media_title → title |
| `packages/web/lib/supabase/queries/posts.ts` | media_title → title |
| `packages/web/lib/supabase/queries/personalization.server.ts` | media_title → title (2곳) |
| `packages/web/app/api/v1/search/route.ts` | media_title → title |
| `packages/web/lib/components/profile/PostsGrid.tsx` | media_title → title |
| `packages/web/lib/hooks/useTries.ts` | media_title → title |
| `packages/web/lib/hooks/useImages.ts` | media_title → title (2곳) |
| `packages/web/lib/components/detail/TryGallerySection.tsx` | media_title → title |
| `packages/web/package.json` | gen:types 스크립트 추가 |

## 검증 방법

1. **마이그레이션 검증**: `mcp__supabase__execute_sql`로 3개 테이블/컬럼 존재 확인
2. **타입 검증**: `npx tsc --noEmit` — 타입 에러 0건 확인
3. **빌드 검증**: `bun run build` — 빌드 성공 확인
4. **런타임 검증**: `decoded_picks`, `user_events` 쿼리가 에러 없이 실행되는지 확인
