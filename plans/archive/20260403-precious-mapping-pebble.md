# Plan: 메인페이지 Supabase → REST API (Orval generated 타입) 전환

## Context
메인페이지가 Supabase를 직접 쿼리하여 Orval/Zod generated 타입을 활용하지 못함.
REST API와 generated 타입이 이미 준비되어 있으므로 전환하여 타입 안전성과 일관성 확보.

## API 현황
- `listPosts(params)` → `PaginatedResponsePostListItem` (spots 미포함, `post_magazine_title` 포함)
- `getPost(postId)` → `PostDetailResponse` (spots 포함)
- `/api/v1/posts/route.ts` → 백엔드 프록시 (이미 존재)
- `customInstance.ts` → 브라우저 전용 (서버 사용 불가)

## Step 1: 서버용 API fetch 유틸 생성

**새 파일:** `packages/web/lib/api/server-instance.ts`

서버 컴포넌트에서 REST API를 호출하기 위한 fetch 래퍼.
- `fetch()`로 내부 Next.js API 라우트 (`/api/v1/*`) 호출
- Orval generated 타입을 제네릭으로 사용
- Next.js fetch 캐싱 지원 (`revalidate`)
- 에러 핸들링 + 빈 응답 fallback

## Step 2: page.tsx 데이터 fetch 전환

**파일:** `packages/web/app/page.tsx`

### 전환 대상
| 데이터 | 현재 | 변경 | API |
|--------|------|------|-----|
| Magazine | `fetchMagazinePostsServer()` | `serverApiGet` | `listPosts?has_magazine=true` |
| MasonryGrid (weeklyBest) | `fetchWeeklyBestPostsServer()` | `serverApiGet` | `listPosts?sort=popular&per_page=30` |
| Hero gallery | `fetchFeaturedPostServer()` + `fetchWeeklyBestPostsServer()` | `serverApiGet` | `listPosts?sort=popular` (같은 응답 재사용) |
| Editorial | `fetchWhatsNewPostsServer()` | `serverApiGet` | `listPosts?sort=recent&per_page=30` |
| DomeGallery | weeklyBest 재사용 | 그대로 | 위 결과 재사용 |
| Trending | `fetchTrendingKeywordsServer()` | Supabase 유지 | 별도 API 없음 |
| Artist enrichment | `buildArtistProfileMap()` | Supabase 유지 | warehouse 전용 |

### Hero spots 처리
- `listPosts`는 spots 미포함 → Hero spot annotation에 `getPost` 필요
- Hero에 표시할 첫 번째 post만 `getPost(postId)`로 상세 조회 (spots 포함)
- 또는 Hero spots 기능을 비활성화 (1차 릴리즈 scope에서 제외)

### 데이터 변환
- `PostListItem` → 기존 `PostData`/`StyleCardData` 매핑 함수 필요
- Orval 타입 필드명이 다름 (snake_case 그대로 vs 기존 camelCase)

## Step 3: Import 정리

- `main-page.server.ts`에서 전환된 함수 제거 (Magazine, WeeklyBest, Featured, WhatsNew, ArtistSpotlight)
- `main-page.server.ts`에 남는 것: `fetchTrendingKeywordsServer`, `fetchDecodedPickServer` (spots join)
- Orval generated 타입 import 추가

## 커밋 전략
1. `feat(api): add server-instance.ts for RSC API calls`
2. `refactor(main): migrate magazine/grid/dome to REST API with Orval types`
3. `chore(main): clean up unused Supabase query functions`

## 검증
- `bun run build` 성공
- dev 서버에서 메인페이지 렌더링 확인
- Magazine 카드, MasonryGrid, DomeGallery 데이터 표시 확인

## 핵심 파일
- `packages/web/lib/api/server-instance.ts` (신규)
- `packages/web/app/page.tsx` (수정)
- `packages/web/lib/api/generated/models/` (참조 — 수정 없음)
- `packages/web/lib/api/generated/posts/posts.ts` (참조 — 수정 없음)
- `packages/web/lib/supabase/queries/main-page.server.ts` (정리)
- `packages/web/app/api/v1/posts/route.ts` (참조 — 기존 프록시)
