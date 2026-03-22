# Quick Task 035: Summary

## Task
메인페이지 빈 섹션을 목업 데이터로 대체하고 각 섹션 필요 디자인/API 분석

## Problem
- DB 서버 쿼리가 일부 섹션에 빈 배열 `[]`을 반환
- 빈 배열은 컴포넌트의 default parameter (=sampleData)를 트리거하지 않음 (only `undefined` triggers defaults)
- 결과: 6개 섹션 헤더만 표시 (콘텐츠 없음), 1개 섹션 완전 숨김

## Changes

### 1. HomeAnimatedContent.tsx
- `orUndef()` 헬퍼 함수 추가: 빈 배열을 `undefined`로 변환
- `hasItems()` 헬퍼: Record 객체의 빈 배열 검사
- 모든 섹션 props에 적용하여 컴포넌트 내장 샘플 데이터 활성화

### 2. WhatsNewSection.tsx
- `sampleStyles` (2개 StyleCardData) 추가
- `sampleItems` (4개 ItemCardData) 추가
- 기본값을 `[]`에서 샘플 데이터로 변경
- `return null` 조건 제거 (빈 배열일 때도 샘플 표시)

### 3. HeroSection.tsx
- `defaultHeroData`에 Unsplash imageUrl 추가

## Section Design/API Requirements

| 섹션 | 필요한 API | 필요한 데이터 | 현재 상태 |
|------|-----------|-------------|----------|
| **HeroSection** | Featured post (최다 조회) | imageUrl, artistName, title, link | 실제 데이터 작동 |
| **DecodedPickSection** | Post + spots + solutions | styleData(이미지,spots좌표), items(브랜드,이름,이미지,가격) | 부분 작동 (목업 fallback) |
| **TodayDecodedSection** | Top 3 posts with item locations | spots(이미지,좌표,브랜드,가격,스타일링팁) | 항상 목업 |
| **ArtistSpotlightSection** | Posts by artist (인기순) | StyleCardData(이미지,아티스트,설명) | 부분 작동 (목업 fallback) |
| **WhatsNewSection** | 최신 posts + items | StyleCardData + ItemCardData(NEW badge) | 목업 표시 |
| **DiscoverItemsSection** | Items by category/artist | ItemCardData(브랜드,이름,이미지,가격) per tab | 목업 표시 |
| **DiscoverProductsSection** | Items by category | ItemCardData | 목업 표시 |
| **BestItemSection** | Top items by click_count | ItemCardData(랭킹 번호 포함) | 목업 표시 |
| **WeeklyBestSection** | Weekly popular posts | WeeklyBestStyle(이미지,아티스트) | 목업 표시 |
| **TrendingNowSection** | Popular search terms | TrendingKeyword(label,href) | 목업 표시 |

## 향후 TODO
1. **DB 쿼리 정상화**: `main-page.server.ts`의 `posts`/`spots`/`solutions` 쿼리를 실제 테이블 `post`/`post_image`/`item`에 맞게 수정
2. **TodayDecodedSection API 연결**: 현재 항상 하드코딩된 목업 사용
3. **DiscoverItemsSection 탭별 데이터**: artist별/category별 실제 아이템 조회 API 필요
4. **TrendingNowSection**: 실제 검색 통계 기반 키워드 API 필요

## Verification
- Build: PASS
- All 10 sections rendering: CONFIRMED (HTML analysis)
- R2 images (real) + Unsplash images (mockup) both loading
