# Plan: 메인페이지 Supabase 직접 쿼리 → REST API (Orval) 전환

## Context
메인페이지가 Supabase를 직접 쿼리하고 있어 generated types/API를 활용하지 못함.
REST API 엔드포인트가 이미 존재하고, Orval generated 타입도 준비되어 있으므로 전환.

## 현재 구조
- `page.tsx` (서버 컴포넌트) → `main-page.server.ts` → Supabase 직접
- `/api/v1/posts/route.ts` → 백엔드 프록시 (이미 존재)
- `customInstance.ts` → 브라우저 전용 (서버에서 사용 불가)

## 목표 구조
- **SSR 섹션**: `page.tsx` → `serverFetch()` → `/api/v1/posts` (Next.js 프록시)
- **CSR 섹션**: 클라이언트 컴포넌트 → `useListPosts()` (Orval hook)

## Step 1: 서버용 API fetch 유틸 생성

**새 파일:** `packages/web/lib/api/server-instance.ts`

```ts
// 서버 컴포넌트에서 REST API 호출용 유틸
// Next.js API 라우트를 통해 백엔드로 프록시
export async function serverApiGet<T>(path: string, init?: RequestInit): Promise<T>
```

- 서버에서 `fetch()`로 `/api/v1/*` 호출
- `NEXT_PUBLIC_SITE_URL` 또는 `localhost:3000` 기본값
- Orval generated 타입을 반환 타입으로 사용
- Next.js `fetch` 캐싱 옵션 지원 (`next: { revalidate }`)

## Step 2: page.tsx SSR 데이터를 REST API로 전환

**파일:** `packages/web/app/page.tsx`

### 2-1. Hero 데이터
- 현재: `fetchFeaturedPostServer()`, `fetchDecodedPickServer()`, `fetchWhatsNewPostsServer()`, `fetchArtistSpotlightServer()`, `fetchWeeklyBestPostsServer()`
- 변경: `serverApiGet<PaginatedResponsePostListItem>('/api/v1/posts?sort=popular&per_page=30')` 등
- 주의: 백엔드 API가 spots/items를 포함하는지 확인 필요 → `PostDetailResponse`에만 있음

### 2-2. Magazine 데이터
- 현재: `fetchMagazinePostsServer()` (Supabase 직접)
- 변경: `serverApiGet('/api/v1/posts?has_magazine=true&per_page=8')`
- `post_magazine_title` 필드가 `PostListItem`에 포함됨

### 2-3. Trending Keywords
- 현재: `fetchTrendingKeywordsServer()`
- 변경: 백엔드에 trending keywords API가 있는지 확인 필요

### 2-4. DomeGallery
- 현재: `weeklyBestPosts` 재사용
- 변경: 같은 posts 데이터 재사용

## Step 3: 제한사항 확인

백엔드 API가 제공하지 않는 데이터:
- **spots/items**: `listPosts`는 spots를 미포함 → Hero의 spot annotation 불가
- **trending keywords**: 별도 API 필요
- **artist profile enrichment**: `buildArtistProfileMap()` → warehouse 스키마

**결론:** Hero의 spot annotation과 artist enrichment 때문에 SSR에서는 **Supabase 일부 유지 + REST API 혼용**이 현실적.

## 최종 전환 범위

| 섹션 | 전환 | 이유 |
|------|------|------|
| Magazine | REST API ✅ | `has_magazine=true` + `post_magazine_title` 완벽 지원 |
| MasonryGrid | REST API ✅ | `listPosts(sort=popular)` 사용 |
| DomeGallery | REST API ✅ | 이미지 목록만 필요 |
| Hero | Supabase 유지 ⚠️ | spots/items join 필요 → API에 미포함 |
| Editorial+Trending | Supabase 유지 ⚠️ | trending keywords API 없음, spots join 필요 |

## 실행 순서

1. `lib/api/server-instance.ts` 생성
2. Magazine 데이터 → REST API 전환 (`fetchMagazinePostsServer` 교체)
3. MasonryGrid 데이터 → REST API 전환
4. DomeGallery 데이터 → REST API 전환
5. `page.tsx` import 정리
6. 빌드 검증

## 검증
- `bun run build` 성공
- Chrome MCP로 메인페이지 렌더링 확인
- Magazine 카드 타이틀 표시 확인
