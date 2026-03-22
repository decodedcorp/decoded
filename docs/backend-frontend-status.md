# DECODED 백엔드-프론트엔드 구현 현황 및 UI 기능 가능 여부

**작성일:** 2026-02-08  
**분석 대상:** `decoded-api/` (Rust/Axum 백엔드) ↔ `decoded-app/` (Next.js 프론트엔드)

---

## 요약

| 구분 | 수치 |
|------|------|
| 백엔드 총 API 엔드포인트 | **78개** |
| 프론트엔드에서 연동 완료 | **26개** (33%) |
| 프론트엔드 API 클라이언트 존재하나 미사용 | **2개** |
| 프론트엔드 미연동 (백엔드만 존재) | **50개** (64%) |
| Supabase 직접 조회 (백엔드 우회) | 홈/이미지 읽기 계열 |

---

## 1. 완전 연동 (백엔드 API + 프론트엔드 UI 모두 구현)

### 1.1 Posts (게시물)

| 상태 | 백엔드 엔드포인트 | 프론트엔드 위치 | UI 기능 |
|:----:|-------------------|-----------------|---------|
| :white_check_mark: | `GET /api/v1/posts` | `lib/api/posts.ts` → `useInfinitePosts` | Explore 그리드, Feed 무한스크롤 |
| :white_check_mark: | `GET /api/v1/posts/{post_id}` | `app/api/v1/posts/[postId]/route.ts` | Post 상세 페이지 |
| :white_check_mark: | `POST /api/v1/posts` | `lib/api/posts.ts` → `createPost` | 게시물 생성 (Request 플로우) |
| :white_check_mark: | `POST /api/v1/posts/with-solutions` | `lib/api/posts.ts` → `createPostWithSolution` | 솔루션 포함 게시물 생성 |
| :white_check_mark: | `POST /api/v1/posts/upload` | `lib/api/posts.ts` → `uploadImage` | 이미지 업로드 (DropZone) |
| :white_check_mark: | `POST /api/v1/posts/analyze` | `lib/api/posts.ts` → `analyzeImage` | AI 이미지 분석 |
| :white_check_mark: | `PATCH /api/v1/posts/{post_id}` | `lib/api/posts.ts` → `updatePost` | 게시물 수정 |
| :white_check_mark: | `DELETE /api/v1/posts/{post_id}` | `lib/api/posts.ts` → `deletePost` | 게시물 삭제 |

### 1.2 Users (사용자)

| 상태 | 백엔드 엔드포인트 | 프론트엔드 위치 | UI 기능 |
|:----:|-------------------|-----------------|---------|
| :white_check_mark: | `GET /api/v1/users/me` | `lib/api/users.ts` → `useMe` | 프로필 페이지 내 정보 표시 |
| :white_check_mark: | `PATCH /api/v1/users/me` | `lib/api/users.ts` → `useUpdateProfile` | 프로필 수정 모달 |
| :white_check_mark: | `GET /api/v1/users/me/stats` | `lib/api/users.ts` → `useUserStats` | 프로필 통계 카드 |
| :white_check_mark: | `GET /api/v1/users/me/activities` | `lib/api/users.ts` → `useUserActivities` | 프로필 활동 탭 (Hook 존재, **UI 미완성**) |
| :white_check_mark: | `GET /api/v1/users/{user_id}` | `lib/api/users.ts` → `useUser` | 타 사용자 프로필 조회 |

### 1.3 Categories (카테고리)

| 상태 | 백엔드 엔드포인트 | 프론트엔드 위치 | UI 기능 |
|:----:|-------------------|-----------------|---------|
| :white_check_mark: | `GET /api/v1/categories` | `lib/api/categories.ts` → `getCategories` | 카테고리 필터링 |

### 1.4 Spots (스팟)

| 상태 | 백엔드 엔드포인트 | 프론트엔드 위치 | UI 기능 |
|:----:|-------------------|-----------------|---------|
| :white_check_mark: | `GET /api/v1/posts/{post_id}/spots` | `lib/api/spots.ts` → `fetchSpots` | Post 상세 내 아이템 스팟 표시 |
| :white_check_mark: | `POST /api/v1/posts/{post_id}/spots` | `lib/api/spots.ts` → `createSpot` | 스팟 생성 |
| :white_check_mark: | `PATCH /api/v1/spots/{spot_id}` | `lib/api/spots.ts` → `updateSpot` | 스팟 수정 |
| :white_check_mark: | `DELETE /api/v1/spots/{spot_id}` | `lib/api/spots.ts` → `deleteSpot` | 스팟 삭제 |

### 1.5 Solutions (솔루션)

| 상태 | 백엔드 엔드포인트 | 프론트엔드 위치 | UI 기능 |
|:----:|-------------------|-----------------|---------|
| :white_check_mark: | `GET /api/v1/spots/{spot_id}/solutions` | `lib/api/solutions.ts` → `fetchSolutions` | 스팟 내 솔루션 목록 |
| :white_check_mark: | `POST /api/v1/spots/{spot_id}/solutions` | `lib/api/solutions.ts` → `createSolution` | 솔루션 등록 |
| :white_check_mark: | `PATCH /api/v1/solutions/{solution_id}` | `lib/api/solutions.ts` → `updateSolution` | 솔루션 수정 |
| :white_check_mark: | `DELETE /api/v1/solutions/{solution_id}` | `lib/api/solutions.ts` → `deleteSolution` | 솔루션 삭제 |
| :white_check_mark: | `POST /api/v1/solutions/extract-metadata` | `lib/api/solutions.ts` → `extractSolutionMetadata` | 상품 링크 메타데이터 추출 |
| :white_check_mark: | `POST /api/v1/solutions/convert-affiliate` | `lib/api/solutions.ts` → `convertAffiliate` | 어필리에이트 링크 변환 |

---

## 2. 부분 연동 (연동 코드 존재하나 UI 미완성 또는 Mock 사용)

### 2.1 Search (검색)

| 상태 | 백엔드 엔드포인트 | 프론트엔드 위치 | 비고 |
|:----:|-------------------|-----------------|------|
| :large_orange_diamond: | `GET /api/v1/search` | `shared/api/search.ts` → `useUnifiedSearch` | **연동 코드 구현 완료**, Mock/실제 전환 가능 (`NEXT_PUBLIC_USE_MOCK_SEARCH`) |
| :large_orange_diamond: | `GET /api/v1/search/popular` | `shared/api/search.ts` → `usePopularSearches` | **연동 코드 구현 완료**, Mock/실제 전환 가능 |
| :large_orange_diamond: | `GET /api/v1/search/recent` | `shared/api/search.ts` → `fetchRecentSearches` | **함수 구현 완료**, Hook에서 아직 미사용 |
| :large_orange_diamond: | `DELETE /api/v1/search/recent/{id}` | `shared/api/search.ts` → `deleteRecentSearches` | **함수 구현 완료**, Hook에서 아직 미사용 |

> **참고:** Search UI 컴포넌트는 풍부하게 구현됨 (SearchOverlay, SearchTabs, SearchResults, RecentSearches 등 12개 컴포넌트). 하지만 Next.js API Route 프록시가 없어서 `/api/v1/search` 경로로 직접 호출. 환경변수 설정으로 Mock ↔ 실제 API 전환 가능.

### 2.2 Profile (프로필 내 활동 탭)

| 상태 | 연동 상태 | 비고 |
|:----:|----------|------|
| :large_orange_diamond: | `useUserActivities` Hook 구현 완료 | ProfileClient에서 `TODO: Connect to useUserActivities hook` 상태. 탭 UI는 존재하나 데이터가 항상 `EmptyState` 표시 |
| :large_orange_diamond: | Badge/Ranking 데이터 | API 호출 없이 **Mock 데이터** 사용 중 (`MOCK_BADGES`, `MOCK_RANKINGS`) |

---

## 3. 미연동 (백엔드 구현 완료, 프론트엔드 미구현)

### 3.1 Feed (피드) - 전용 API 미연동

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 |
|-------------------|------|----------------|
| `GET /api/v1/feed` | 홈 피드 (개인화) | **미사용** — Feed 페이지는 `/api/v1/posts`를 직접 사용 |
| `GET /api/v1/feed/trending` | 트렌딩 피드 | **미사용** — 트렌딩 전용 피드 UI 없음 |
| `GET /api/v1/feed/curations` | 큐레이션 목록 | **미사용** |
| `GET /api/v1/feed/curations/{id}` | 큐레이션 상세 | **미사용** |

> **현황:** Feed 페이지(`/feed`)는 `useInfinitePosts`로 `/api/v1/posts` 엔드포인트만 사용. 백엔드의 개인화 피드, 트렌딩, 큐레이션 API는 프론트엔드에서 아직 호출하지 않음.

### 3.2 Rankings (랭킹)

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 |
|-------------------|------|----------------|
| `GET /api/v1/rankings` | 전체 랭킹 | **미연동** — Profile에서 Mock 랭킹만 표시 |
| `GET /api/v1/rankings/{category}` | 카테고리별 랭킹 | **미연동** |
| `GET /api/v1/rankings/me` | 나의 랭킹 상세 | **미연동** |

### 3.3 Badges (배지)

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 |
|-------------------|------|----------------|
| `GET /api/v1/badges` | 배지 목록 | **미연동** — Profile에서 `MOCK_BADGES` 사용 |
| `GET /api/v1/badges/me` | 내 배지 | **미연동** |
| `GET /api/v1/badges/{badge_id}` | 배지 상세 | **미연동** |

> **참고:** 홈 페이지에서 `fetchAllBadgesServer()`로 **Supabase 직접 조회**하여 배지 표시 중. 백엔드 API 연동은 없음.

### 3.4 Comments (댓글)

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 |
|-------------------|------|----------------|
| `POST /api/v1/posts/{post_id}/comments` | 댓글 작성 | **미연동** — API 클라이언트 없음 |
| `GET /api/v1/posts/{post_id}/comments` | 댓글 목록 | **미연동** |
| `PATCH /api/v1/comments/{comment_id}` | 댓글 수정 | **미연동** |
| `DELETE /api/v1/comments/{comment_id}` | 댓글 삭제 | **미연동** |

### 3.5 Votes (투표)

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 |
|-------------------|------|----------------|
| `POST /api/v1/solutions/{id}/votes` | 솔루션 투표 | **미연동** — API 클라이언트 없음 |
| `DELETE /api/v1/solutions/{id}/votes` | 투표 취소 | **미연동** |
| `GET /api/v1/solutions/{id}/votes` | 투표 통계 | **미연동** |
| `POST /api/v1/solutions/{id}/adopt` | 솔루션 채택 | **미연동** |
| `DELETE /api/v1/solutions/{id}/adopt` | 채택 취소 | **미연동** |

### 3.6 Earnings (수익)

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 | 백엔드 상태 |
|-------------------|------|----------------|-------------|
| `POST /api/v1/earnings/clicks` | 클릭 기록 | **미연동** | 구현 완료 |
| `GET /api/v1/earnings/clicks/stats` | 클릭 통계 | **미연동** | 구현 완료 |
| `GET /api/v1/earnings/earnings` | 수익 현황 | **미연동** | *임시 구현 (빈 데이터)* |
| `GET /api/v1/earnings/settlements` | 정산 내역 | **미연동** | *임시 구현 (빈 배열)* |
| `POST /api/v1/earnings/settlements/withdraw` | 출금 요청 | **미연동** | *임시 구현 (400 에러)* |
| `GET /api/v1/earnings/settlements/withdraw/{id}` | 출금 상태 | **미연동** | *임시 구현 (404 에러)* |

### 3.7 Subcategories (하위 카테고리)

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 |
|-------------------|------|----------------|
| `GET /api/v1/subcategories` | 전체 하위 카테고리 | **미연동** |
| `GET /api/v1/subcategories/{category_id}` | 카테고리별 하위 | **미연동** |

### 3.8 Spots - 개별 조회

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 |
|-------------------|------|----------------|
| `GET /api/v1/spots/{spot_id}` | 스팟 단건 조회 | **미연동** (목록 조회만 사용) |

### 3.9 Solutions - 개별 조회

| 백엔드 엔드포인트 | 기능 | 프론트엔드 현황 |
|-------------------|------|----------------|
| `GET /api/v1/solutions/{solution_id}` | 솔루션 단건 조회 | **미연동** (목록 조회만 사용) |

### 3.10 Admin (관리자) - 전체 미연동

| 백엔드 엔드포인트 그룹 | 엔드포인트 수 | 프론트엔드 현황 |
|-----------------------|:---:|----------------|
| Admin - Posts | 2 | **미연동** — 관리자 페이지 없음 |
| Admin - Solutions | 2 | **미연동** |
| Admin - Categories | 4 | **미연동** |
| Admin - Synonyms | 5 | **미연동** |
| Admin - Curations | 4 | **미연동** |
| Admin - Dashboard | 3 | **미연동** |
| Admin - Badges | 4 | **미연동** |
| **합계** | **24** | |

---

## 4. Supabase 직접 조회 (백엔드 API 우회)

아래 데이터는 백엔드 API를 거치지 않고 Supabase에서 직접 조회합니다.

| 사용 위치 | Supabase 쿼리 | 관련 백엔드 API |
|-----------|--------------|----------------|
| 홈 페이지 (`/`) | `fetchWeeklyBestImagesServer()` | `GET /api/v1/feed` (미사용) |
| 홈 페이지 | `fetchFeaturedImageServer()` | `GET /api/v1/feed` (미사용) |
| 홈 페이지 | `fetchWhatsNewStylesServer()` | `GET /api/v1/feed` (미사용) |
| 홈 페이지 | `fetchDecodedPickServer()` | `GET /api/v1/feed/curations` (미사용) |
| 홈 페이지 | `fetchArtistSpotlightStylesServer()` | — |
| 홈 페이지 | `fetchTrendingKeywordsServer()` | `GET /api/v1/search/popular` (미사용) |
| 홈 페이지 | `fetchAllBadgesServer()` | `GET /api/v1/badges` (미사용) |
| 이미지 목록 (`/images`) | `fetchUnifiedImages()` | `GET /api/v1/posts` (대안 존재) |
| 이미지 상세 (`/images/[id]`) | `fetchImageByIdServer()` | `GET /api/v1/posts/{id}` (대안 존재) |
| 아이템/솔루션 | `fetchSolutionsBySpotId()` 등 | `GET /api/v1/spots/{id}/solutions` (대안 존재) |

---

## 5. 페이지별 UI 기능 가능 여부 종합

### :white_check_mark: 완전 동작 가능

| 페이지 | 데이터 소스 | 비고 |
|--------|-----------|------|
| `/` (홈) | Supabase 직접 조회 | 백엔드 API 없이도 SSR로 완전 동작 |
| `/explore` | 백엔드 API (`GET /posts`) | 무한 스크롤 + 카테고리 필터 동작 |
| `/feed` | 백엔드 API (`GET /posts`) | 수직 피드 동작 (단, 개인화/트렌딩은 미적용) |
| `/images` | Supabase 직접 조회 | 이미지 그리드 + 무한 스크롤 동작 |
| `/images/[id]` | Supabase 직접 조회 | 이미지 상세, Lightbox, 관련 이미지 동작 |
| `/posts/[id]` | 백엔드 API | Post 상세 동작 |
| `/request/upload` | 백엔드 API (`POST /posts/upload`) | 이미지 업로드 동작 |
| `/request/detect` | 백엔드 API (`POST /posts/analyze`) | AI 분석 동작 |
| `/login` | Supabase Auth | OAuth(Kakao, Google, Apple) 동작 |

### :large_orange_diamond: 부분 동작 (일부 기능 제한)

| 페이지 | 동작하는 기능 | 미동작/제한 기능 |
|--------|-------------|-----------------|
| `/profile` | 내 정보 표시, 통계 카드, 프로필 수정 | **배지:** Mock 데이터, **랭킹:** Mock 데이터, **활동 탭:** 항상 Empty State |
| `/search` | Search UI 전체, Mock 검색 결과 | **실제 검색:** env 설정 필요 (`NEXT_PUBLIC_USE_MOCK_SEARCH=false`), **최근 검색:** Hook 미연결 |

### :x: UI 없음 (백엔드만 구현)

| 기능 | 필요한 UI | 우선순위 제안 |
|------|----------|-------------|
| 댓글 시스템 | Post 상세 내 댓글 섹션 | **높음** — 사용자 인터랙션 핵심 |
| 투표/채택 시스템 | Solution 카드 내 투표 버튼 + 채택 표시 | **높음** — 솔루션 품질 관리 핵심 |
| 개인화 피드 | 피드 탭 전환 (홈/트렌딩/큐레이션) | **중간** — 현재 일반 피드로 대체 가능 |
| 큐레이션 | 큐레이션 목록/상세 페이지 | **중간** |
| 랭킹 | 랭킹 보드 페이지 또는 섹션 | **중간** |
| 배지 (실제 데이터) | 배지 API 연동 + Mock 제거 | **낮음** — Mock으로 UI는 동작 |
| 수익/정산 | 수익 대시보드 페이지 | **낮음** — 백엔드도 임시 구현 |
| 하위 카테고리 | 카테고리 드릴다운 필터 | **낮음** |
| 관리자 패널 | 관리자 전용 대시보드 (별도 앱 권장) | **별도** |

---

## 6. 아키텍처 특이사항

### 듀얼 데이터 소스 패턴

```
[프론트엔드]
  ├── Supabase 직접 조회 (읽기 전용, SSR)
  │   └── 홈 페이지, 이미지 목록/상세
  ├── 백엔드 REST API (CRUD, AI 기능)
  │   └── 게시물/스팟/솔루션 CUD, 사용자, 카테고리
  └── Next.js API Route 프록시 (/app/api/v1/)
      └── 백엔드 API를 프록시하여 CORS 해결
```

### 주의사항

1. **홈 페이지 데이터 이중화:** Supabase 직접 조회와 백엔드 Feed API가 겹침. 장기적으로 백엔드 API로 통일 권장.
2. **Search API Route 프록시 부재:** Search는 `shared/api/search.ts`에서 직접 호출. Next.js API Route 프록시 없음.
3. **Profile Mock 의존성:** 배지/랭킹이 Mock 데이터에 의존. API 연동 시 스토어 구조 변경 필요.
4. **Affiliate 링크:** 백엔드에서 `https://affiliate.example.com/{url}` 형태의 **Mock URL** 반환 중 (TODO).

---

## 7. 권장 연동 우선순위

| 순위 | 작업 | 이유 |
|:----:|------|------|
| 1 | **댓글 시스템 연동** | Post 상세 페이지의 핵심 인터랙션. 백엔드 완전 구현됨. |
| 2 | **투표/채택 연동** | 솔루션 품질 관리 핵심. 백엔드 완전 구현됨. |
| 3 | **Search 실제 API 전환** | UI 이미 완성됨. 환경변수 전환 + API Route 프록시 추가만 필요. |
| 4 | **Profile 활동 탭 연동** | Hook 이미 구현됨 (`useUserActivities`). UI 바인딩만 필요. |
| 5 | **Feed API 전환** | 현재 Posts API로 우회 중. Feed API로 전환하면 개인화/트렌딩 가능. |
| 6 | **배지/랭킹 API 연동** | Mock 제거하고 실제 데이터 사용. UI 이미 존재. |
| 7 | **클릭 기록 연동** | Earnings 수익 시스템의 기초. 어필리에이트 클릭 추적. |
| 8 | **관리자 패널** | 24개 Admin API 활용. 별도 앱 또는 라우트 그룹으로 구현 권장. |

---

*이 문서는 `decoded-api/src/domains/` 및 `decoded-app/packages/web/` 코드를 기반으로 자동 분석되었습니다.*
