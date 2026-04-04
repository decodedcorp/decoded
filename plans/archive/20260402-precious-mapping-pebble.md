# Plan: #60 메인페이지 섹션 정리 및 The Magazine 카드 리디자인

## Context
1차 릴리즈 준비. 메인페이지에서 미완성/불필요 섹션을 제거하고, 핵심 콘텐츠(Editorial Magazine)에 집중하도록 정리.

## 변경 대상 파일
- `packages/web/app/page.tsx` — 메인 페이지 서버 컴포넌트
- `packages/web/lib/components/main-renewal/EditorialMagazine.tsx` — Magazine 카드 리디자인
- `packages/web/lib/components/main/DynamicHomeFeed.tsx` — DomeGallerySection에 Coming Soon 추가

## 작업 순서

### Step 1: 섹션 제거 (page.tsx)
**제거할 섹션:**
- Section 2: `<DecodeShowcase>` (라인 542) — "See how it's Decoded" AI 감지 쇼케이스
- Section 5: `<VirtualTryOnTeaser>` (라인 556) — "Try it on yourself" Before/After
- Footer: `<MainFooter />` (라인 581)

**제거할 데이터/로직 (page.tsx):**
- `decodeShowcaseData` 관련 변수 및 빌드 로직 (라인 381~423)
- `vtonTeaserData` 관련 변수 및 빌드 로직 (라인 478~492)
- `bestItems` fetch (라인 91) 및 `fetchBestItemsServer` import
- `DecodeShowcase`, `VirtualTryOnTeaser` import (라인 3~4)
- `MainFooter` import (라인 19)
- 관련 타입 import: `DecodeShowcaseData`, `VTONTeaserData` (라인 12, 13)

**유지할 섹션:**
1. HeroItemSync (히어로)
2. ~~DecodeShowcase~~ → 제거
3. Editorial + Trending (combo row)
4. EditorialMagazine (수평 스크롤)
5. ~~VirtualTryOnTeaser~~ → 제거
6. MasonryGrid (DECODED PICKS)
7. ForYouSection (로그인 사용자)
8. ~~CommunityLeaderboard~~ → 이미 주석 처리
9. DomeGallerySection (VTON 돔) — Coming Soon 추가
10. ~~MainFooter~~ → 제거

### Step 2: DomeGallerySection에 "Coming Soon" 표시
`DynamicHomeFeed.tsx`의 DomeGallerySection에서:
- 기존 CTA 텍스트("Find Your Perfect Fit") 대신 또는 아래에 "Coming Soon" 배지/텍스트 추가
- 버튼 비활성화 또는 제거

### Step 3: The Magazine 카드 디자인 수정
`EditorialMagazine.tsx`에서:
- post_magazines 데이터 기반으로 카드에 Editorial Title 강조
- 카드 하단 텍스트 영역: title을 더 크게, category 라벨 스타일 개선
- (디자인 디테일은 현재 카드 구조 기반으로 개선, 큰 구조 변경 없이 스타일링 조정)

### Step 4: 미사용 컴포넌트 파일 정리
제거된 섹션의 컴포넌트 파일 자체는 삭제하지 않음 (추후 재사용 가능성). import만 제거.

## 커밋 전략
1. `refactor(main): remove DecodeShowcase, VirtualTryOnTeaser, MainFooter sections`
2. `feat(main): add Coming Soon to VTON DomeGallery section`
3. `style(main): update Magazine card design with editorial title emphasis`

## 검증
- `bun run build` 성공 (packages/web)
- 메인페이지 렌더링 확인 (dev 서버)
- 제거한 섹션이 표시되지 않는지 확인
- Magazine 카드 스타일 확인
- DomeGallery Coming Soon 표시 확인
