# 홈 화면 간소화 계획 (MVP Launch)

**목표:** 초기 플랫폼 데이터 한계를 인정하고, 실데이터로 즉시 동작 가능한 섹션만으로 구성하여 빠르게 런칭 → 이터레이션

---

## 왜 간소화해야 하는가?

| 문제 | 설명 |
|------|------|
| **데이터 부족** | 초기 런칭 시 게시물 수, 유저 상호작용, 검색 이력 등이 절대적으로 부족 |
| **빈 섹션 문제** | 11개 섹션 중 대다수가 하드코딩 fallback에 의존 → 실사용자에게 신뢰도 저하 |
| **유지보수 부담** | 섹션마다 별도 Supabase 쿼리 + fallback 로직 + 백엔드 매핑 필요 |
| **사용자 집중도** | 너무 많은 섹션은 핵심 가치("셀럽 패션 디코딩")를 희석 |

---

## 섹션 분류: 유지 vs 제거

### 유지 (4개 섹션)

| # | 섹션 | 유지 근거 | 데이터 요건 |
|:-:|------|----------|------------|
| 1 | **Hero** | 플랫폼 첫인상. 캐러셀/슬라이드로 여러 게시물 노출 | `posts` 5개 (view_count DESC) |
| 2 | **Artist Spotlight** | 핵심 가치 전달 ("셀럽 패션"). artist_name이 있는 게시물이면 충분 | `posts` WHERE `artist_name IS NOT NULL` (2~4개) |
| 3 | **What's New** | 신규 콘텐츠를 두 가지로 구분 노출 | **(3a)** 솔루션 있는 post: 최신순. **(3b)** 솔루션 없는 post: 최신순 + "이 spot에 솔루션 제안하기" 유도 |
| 4 | **Weekly Best** | 인기 콘텐츠 갤러리. view_count 기반이라 게시물만 있으면 동작 | `posts` 4~8개 (view_count DESC) |

### 제거 (7개 섹션)

| # | 섹션 | 제거 근거 |
|:-:|------|----------|
| 2 | **Decoded's Pick** | 에디터 큐레이션 로직 없음. 초기에는 큐레이션할 콘텐츠 풀 자체가 부족 |
| 3 | **Today's Decoded** | 100% 하드코딩. `stylingTip` 백엔드 미지원. 완전 신규 개발 필요 |
| 6 | **Badge Grid** | 배지 시스템은 유저 활동 데이터가 쌓인 후에 의미. 홈 핵심 가치와 무관 |
| 7 | **Discover Items** | API가 항상 빈 배열 반환. 아티스트별 아이템 전용 API 없음 |
| 8 | **Discover Products** | click_count 초기 0. 카테고리 필터링 불가. 의미 있는 데이터 불가 |
| 9 | **Best Item** | Discover Products와 동일 데이터 재사용. 중복 |
| 11 | **Trending Now** | 검색 이력/아티스트 빈도 모두 초기에 의미 없는 데이터 |

---

## 간소화된 홈 화면 구성

```
┌─────────────────────────────────────────────┐
│                  Header                      │
│  DECODED   Home   Explore   [+]   🔍   👤                │
├─────────────────────────────────────────────┤
│  ── Hero (캐러셀, 5개 포스트) ──              │
│  ●───●───●───●───●   view_count DESC        │
│              Section 1: Hero                 │
├─────────────────────────────────────────────┤
│  ── Global Perspectives ──                   │
│  Artist Spotlight          DISCOVER ALL →    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ StyleCard │ │ StyleCard │ │ View More│     │
│  └──────────┘ └──────────┘ └──────────┘     │
│              Section 2: Artist Spotlight     │
├─────────────────────────────────────────────┤
│  ── What's New ──           EXPLORE FEED →  │
│  (3a) 솔루션과 함께 등록된 post               │
│  posts (spot+solution 존재) 최신순, 스타일+아이템 │
│  (3b) 솔루션 없이 등록된 post                 │
│  posts (spot만 있음) 최신순 + CTA: "이 스팟     │
│  디코딩하기" → 유저가 솔루션 제안하도록 유도   │
│              Section 3: What's New          │
├─────────────────────────────────────────────┤
│  ── Editor's Weekly Roll ──                  │
│  Weekly Best           ●───●───●───●         │
│  posts 4~8개 (view_count DESC)               │
│              Section 4: Weekly Best         │
├─────────────────────────────────────────────┤
│                  Footer                      │
└─────────────────────────────────────────────┘
```

**Header 네비:** Home, Explore(탭), **[+]** Request(포스트 생성), **🔍** 검색(magnifying glass), **👤** 프로필(person 아이콘). Feed 제거.

---

## 섹션별 구현 계획

### Section 1: Hero

| 항목 | 내용 |
|------|------|
| **데이터 소스** | `posts` **5개** 조회 (view_count DESC). 기존 `fetchFeaturedPostServer()` → `fetchFeaturedPostsServer(5)` 또는 limit 5로 확장 |
| **Fallback** | 게시물 0개일 때 `defaultHeroData` 하드코딩 |
| **필요 작업** | Hero UI가 캐러셀/슬라이드인 경우 5개 데이터 전달. 단일 배너면 1개만 사용 가능 |

### Section 2: Artist Spotlight

| 항목 | 내용 |
|------|------|
| **데이터 소스** | `fetchArtistSpotlightStylesServer()` (Supabase SSR) 유지 |
| **Fallback** | 아티스트 게시물 부족 시 `sampleSpotlightData` 하드코딩 |

### Section 3: What's New (두 하위 섹션)

What's New를 **두 블록**으로 나눈다.

| 하위 | 제목 | 데이터 | UX 목표 |
|------|------|--------|--------|
| **3a** | 솔루션과 함께 등록된 post | `posts` 중 **최소 1개 spot + solution** 있는 것만, `created_at` DESC. 기존 StyleCard + ItemCard 형태 (최신 2개 + solutions 4개 등) | 방금 디코딩된 콘텐츠 노출 |
| **3b** | 솔루션 없이 등록된 post | `posts` 중 **spot은 있으나 solution이 0개**인 것, `created_at` DESC | 다른 유저가 해당 **spot에 솔루션을 제안**하도록 유도. CTA 예: "이 스팟 디코딩하기" → 상세/편집 플로우로 연결 (문구는 추후 확정) |

| 항목 | 내용 |
|------|------|
| **데이터 소스** | **(3a)** `fetchWhatsNewWithSolutionsServer()` (기존 fetchWhatsNewStylesServer + fetchWhatsNewItemsServer 유사). **(3b)** `fetchPostsWithoutSolutionsServer()` 신규: post–spots JOIN 후 solution 개수 0인 post만 필터, 최신순 |
| **Fallback** | (3a)(3b) 각각 데이터 없으면 해당 블록만 숨김. 둘 다 없으면 What's New 섹션 전체 `return null` |
| **필요 작업** | (3b) 상세/포스트 페이지에서 "이 스팟 디코딩하기" 버튼 또는 스팟 클릭 시 솔루션 제안 UI 연결. CTA 문구는 추후 확정 |

### Section 4: Weekly Best

| 항목 | 내용 |
|------|------|
| **데이터 소스** | `fetchWeeklyBestImagesServer(8)` (Supabase SSR) 유지 |
| **Fallback** | `sampleWeeklyStyles` 하드코딩 |

---

## 코드 변경 사항

### `page.tsx`

- **제거할 쿼리:**  
  `fetchDecodedPickStyleServer`, `fetchTrendingKeywordsServer`, `fetchBestItemsServer`, `fetchItemsByAccountServer`, `fetchAllBadgesServer`
- **유지·수정할 쿼리:**  
  - **Hero:** `fetchFeaturedPostServer()` → **`fetchFeaturedPostsServer(5)`** (또는 동일 함수에 limit 5 적용)  
  - `fetchArtistSpotlightStylesServer()`
  - **What's New (3a):** `fetchWhatsNewWithSolutionsServer()` (기존 스타일+아이템 쿼리)
  - **What's New (3b):** `fetchPostsWithoutSolutionsServer()` 신규 — spot은 있으나 solution 0개인 post 최신순
  - `fetchWeeklyBestImagesServer()`

### `HomeAnimatedContent.tsx`

- **제거:** DecodedPickSection, TodayDecodedSection, BadgeGridSection, DiscoverItemsSection, DiscoverProductsSection, BestItemSection, TrendingNowSection
- **유지:** HeroSection(5개 데이터), ArtistSpotlightSection, **WhatsNewSection(3a 데이터 + 3b 데이터)**, WeeklyBestSection

---

## 성능 개선 효과

| 지표 | Before (11 섹션) | After (4 섹션) |
|------|:----------------:|:---------------:|
| **SSR 쿼리 수** | 11개 Promise.all | 5개 Promise.all |
| **번들 크기** | 11개 섹션 컴포넌트 | 4개 섹션 컴포넌트 |
| **하드코딩 fallback** | 8개 섹션 | 3개 섹션 (Hero, Spotlight, Weekly) |
| **빈 데이터 리스크** | 높음 | 낮음 (What's New만 자동 숨김) |

---

## 이터레이션 로드맵

| Phase | 내용 |
|-------|------|
| **1. MVP Launch** | 4개 섹션 간소화, Supabase SSR 유지, Hero 5개 포스트 반영 |
| **2. 백엔드 전환** | Supabase → 백엔드 API, `GET /api/v1/feed` 등 활용 |
| **3. 데이터 축적 후** | Trending Now, Decoded's Pick, Today's Decoded, Discover Products 등 복원 검토 |
| **4. 개인화** | 유저별 맞춤 피드, 팔로우 아티스트 기반 섹션 |
