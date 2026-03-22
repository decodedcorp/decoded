# Quick Task 035: Replace Empty Main Sections with Mockup Data

## Goal
메인페이지 섹션들이 DB 스키마 불일치로 데이터가 없어 빈 상태로 표시되는 문제를 목업 데이터로 대체하여 디자인이 보이도록 수정

## Problem Analysis
- `main-page.server.ts`가 `posts`, `spots`, `solutions` 테이블을 쿼리하지만 실제 DB는 `post`, `post_image`, `item` 사용
- 모든 서버 쿼리가 실패하여 빈 배열 반환
- 빈 배열 `[]`이 컴포넌트에 전달되면 default parameter (=sampleData)가 작동하지 않음 (only `undefined` triggers default)
- 6개 섹션이 헤더만 보이고 콘텐츠 없음, 1개 섹션 완전히 숨겨짐

## Tasks

### Task 1: HomeAnimatedContent에서 빈 배열을 undefined로 변환
**File:** `packages/web/lib/components/main/HomeAnimatedContent.tsx`
**Changes:**
- 각 섹션에 전달되는 props에서 빈 배열일 때 undefined로 변환
- `arr.length > 0 ? arr : undefined` 패턴 적용
- 영향 섹션: ArtistSpotlightSection, DiscoverItemsSection, DiscoverProductsSection, BestItemSection, WeeklyBestSection, TrendingNowSection

### Task 2: WhatsNewSection에 샘플 데이터 추가
**File:** `packages/web/lib/components/main/WhatsNewSection.tsx`
**Changes:**
- styles/items가 빈 배열이면 내장 샘플 데이터 사용하도록 수정
- 다른 섹션들과 동일한 Unsplash 기반 샘플 데이터 추가

### Task 3: HeroSection defaultHeroData에 이미지 추가
**File:** `packages/web/lib/components/main/HeroSection.tsx`
**Changes:**
- defaultHeroData에 imageUrl 추가하여 gradient 대신 이미지 표시

## Section API/Design Requirements Report

각 섹션이 제대로 작동하려면 필요한 API와 데이터:

| 섹션 | 필요한 API | 필요한 데이터 | 디자인 요소 |
|------|-----------|-------------|-----------|
| HeroSection | featured post with image | imageUrl, artistName, title, link | 풀스크린 히어로 이미지, 패럴랙스, CTA 버튼 |
| DecodedPickSection | post with spots+solutions | styleData(이미지,spots좌표), items(브랜드,이름,이미지) | 스팟 인터랙션, 아이템 리스트 |
| TodayDecodedSection | posts with item_locations | spots(이미지,좌표,브랜드,가격,팁) | 3-column 카드, 스팟 마커 |
| ArtistSpotlightSection | posts by artist with items | StyleCardData(이미지,아티스트,아이템) | 횡스크롤 카드 |
| WhatsNewSection | recent posts with items | StyleCardData + ItemCardData | 2-column 스타일+아이템 그리드 |
| DiscoverItemsSection | items by category/artist | ItemCardData(브랜드,이름,이미지,가격) | 6-column 탭 그리드 |
| DiscoverProductsSection | items by category | ItemCardData | 6-column 탭 그리드 |
| BestItemSection | top items by popularity | ItemCardData(랭킹 포함) | 3-column 랭킹 리스트 |
| WeeklyBestSection | weekly popular posts | WeeklyBestStyle(이미지,아티스트) | 4-column 인터랙티브 갤러리 |
| TrendingNowSection | popular search keywords | TrendingKeyword(label,href) | 키워드 칩/태그 |

## Acceptance Criteria
- [ ] 모든 메인페이지 섹션이 목업 데이터와 함께 표시됨
- [ ] 숨겨진 WhatsNewSection이 표시됨
- [ ] HeroSection에 이미지가 표시됨
- [ ] 빌드 에러 없음
