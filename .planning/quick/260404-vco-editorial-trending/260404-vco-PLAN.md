# Quick Task 260404-vco: Editorial+Trending 메인페이지 섹션 키우기

## Task 1: Editorial+Trending 및 EditorialMagazine 섹션 사이즈 업

### Changes

**1. page.tsx — 2-column wrapper 확대**
- `py-10 lg:py-14` → `py-14 lg:py-20` (수직 여백 증가)
- `max-w-6xl` → `max-w-7xl` (최대 너비 확대)
- `gap-6` → `gap-8` (컬럼 간격 확대)

**2. EditorialSection.tsx — 이미지 영역 확대**
- `aspect-[16/10]` → `aspect-[3/2]` (모바일 이미지 더 키움)
- Right panel `lg:grid-cols-[1fr_260px]` → `lg:grid-cols-[1fr_280px]` (트렌딩 패널 약간 확대)
- Thumbnail `w-[72px] h-[72px]` → `w-[80px] h-[80px]` (썸네일 확대)

**3. TrendingListSection.tsx — 리스트 높이 확대**
- Non-embedded: `clamp(320px, 50vh, 500px)` → `clamp(380px, 55vh, 560px)`

**4. EditorialMagazine.tsx — 카드 사이즈 확대**
- Track height: `h-[80vh]` → `h-[85vh]`
- Card height: `h-[65vh]` → `h-[70vh]`
- Card width: `lg:w-[30vw]` → `lg:w-[32vw]`

### Files
- packages/web/app/page.tsx
- packages/web/lib/components/main/EditorialSection.tsx
- packages/web/lib/components/main/TrendingListSection.tsx
- packages/web/lib/components/main-renewal/EditorialMagazine.tsx
