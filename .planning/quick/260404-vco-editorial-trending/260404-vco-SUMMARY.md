# Quick Task 260404-vco: Editorial+Trending 메인페이지 섹션 키우기

## Changes

### 1. page.tsx — 2-column wrapper 확대
- 수직 패딩: `py-10 lg:py-14` → `py-14 lg:py-20`
- 최대 너비: `max-w-6xl` → `max-w-7xl`
- 컬럼 간격: `gap-6` → `gap-8`

### 2. EditorialSection.tsx — 에디토리얼 카드 확대
- 모바일 이미지 비율: `aspect-[16/10]` → `aspect-[3/2]` (더 키움)
- 트렌딩 패널 너비: `260px` → `280px`
- 썸네일 크기: `72px` → `80px` (sizes 속성 포함)

### 3. TrendingListSection.tsx — 리스트 높이 확대
- 비임베디드 높이: `clamp(320px, 50vh, 500px)` → `clamp(380px, 55vh, 560px)`

### 4. EditorialMagazine.tsx — 매거진 카드 확대
- 트랙 높이: `h-[80vh]` → `h-[85vh]`
- 카드 높이: `h-[65vh]` → `h-[70vh]`
- 카드 너비 (lg): `w-[30vw]` → `w-[32vw]`

## Files Modified
- `packages/web/app/page.tsx`
- `packages/web/lib/components/main/EditorialSection.tsx`
- `packages/web/lib/components/main/TrendingListSection.tsx`
- `packages/web/lib/components/main-renewal/EditorialMagazine.tsx`
