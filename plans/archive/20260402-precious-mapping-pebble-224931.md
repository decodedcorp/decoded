# Plan: #60 메인페이지 섹션 정리 및 The Magazine 카드 리디자인

## Context
1차 릴리즈 준비. 메인페이지에서 미완성/불필요 섹션을 제거(향후 재사용 대비 컴포넌트는 보존)하고, The Magazine을 post_magazines 데이터 기반으로 리디자인.

## Step 1: page.tsx — 섹션 제거 (JSX + 관련 데이터 로직)

**파일:** `packages/web/app/page.tsx`

**JSX에서 제거:**
- Section 2: `<DecodeShowcase data={decodeShowcaseData} />` (라인 542)
- Section 5: `<VirtualTryOnTeaser data={vtonTeaserData} />` (라인 556)
- `<MainFooter />` (라인 581)

**데이터/로직 제거:**
- `decodeShowcaseData` 빌드 로직 (라인 381~423, `showcaseSource` 포함)
- `vtonTeaserData` 빌드 로직 (라인 478~492)
- `fetchBestItemsServer` fetch 및 `bestItems` 변수 (Promise.all 라인 91)
- import: `DecodeShowcase`, `VirtualTryOnTeaser` (라인 3~4)
- import: `MainFooter` (라인 19)
- type import: `DecodeShowcaseData`, `VTONTeaserData` (라인 12~13)

**컴포넌트 파일은 삭제하지 않음** — 추후 재사용 가능하므로 import만 제거.

## Step 2: DomeGallerySection — "Try On Now" 버튼에 Coming Soon

**파일:** `packages/web/lib/components/main/DynamicHomeFeed.tsx`

**변경:** 라인 382~391의 `<button>` 수정
- 기존: `onClick={openVton}`, 텍스트 "Try On Now"
- 변경: `onClick` 제거, 텍스트 → "Coming Soon", 스타일 → 비활성 상태 (opacity 낮춤, cursor-not-allowed)
- 버튼 위 설명 텍스트 유지

## Step 3: EditorialMagazine — post_magazines 데이터 기반 카드

**파일:** `packages/web/lib/components/main-renewal/EditorialMagazine.tsx`
**파일:** `packages/web/app/page.tsx` (데이터 빌드 변경)

### 3-1. page.tsx — Magazine 데이터 소스 변경
현재: weeklyBest/spotlight/whatsNew에서 혼합 빌드
변경: `has_magazine: true` 필터로 post_magazine이 있는 포스트만 사용
- API에 `has_magazine` param이 이미 존재 (`ListPostsParams.has_magazine`)
- 서버에서 `post_magazine_title`이 반환됨 (PostListItem)
- magazine 있는 포스트만 필터링하여 `editorialMagazineData.cards` 빌드
- 카드의 `title`에 `post_magazine_title` 사용 (editorial title)

### 3-2. EditorialMagazine.tsx — 카드 디자인 수정
- title: `post_magazine_title` (editorial 제목) 강조 — 기존 artist name → editorial title
- category 라벨: "Editorial" 고정 또는 magazine keyword 사용
- 카드 클릭 시 `/posts/{postId}` 이동 (Link 래핑)

## 커밋 전략
1. `refactor(main): remove DecodeShowcase, VirtualTryOnTeaser, Footer sections`
2. `feat(main): add Coming Soon state to VTON Try On button`
3. `feat(main): editorial magazine cards from post_magazines data`

## 검증
- `cd packages/web && bun run build` 성공
- 제거된 섹션이 렌더링되지 않음
- DomeGallery의 Try On Now → Coming Soon 표시
- Magazine 카드에 editorial title 표시 (post_magazine 있는 포스트만)
