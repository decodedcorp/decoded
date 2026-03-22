# Section O Main Page 구현 계획

## Context

Stitch에서 디자인한 "section o main page"를 기반으로 데스크톱 메인 페이지를 리뉴얼한다. 현재 메인 페이지(`app/page.tsx`)는 MainHero → DynamicHomeFeed → MasonryGrid → DynamicHomeFeed → PersonalizeBanner → MainFooter 구조로 이미 섹션 기반이지만, Stitch 디자인에 맞게 섹션 순서/구조/스타일을 업데이트한다.

**레이아웃**: 풀 와이드 세로 스택 (데스크톱 1280px+)
**디자인 시스템**: #050505 배경, #eafd67 네온 액센트, #d946ef 마젠타 보조, Playfair Display(헤드라인), Inter(바디)

## Stitch 디자인 섹션 순서

1. **Header** — DECODED + SHOP, EDITORIAL, ARCHIVE, MY
2. **Hero** — 네온 글로우 인물 + "DECODED" 대형 타이포 + 아이템 핫스팟
3. **Weekly Best** — 매소니 그리드 (카테고리 라벨 포함)
4. **Top Items** — 가로 스크롤 아이템 카드 (신발, 드레스 등 + 가격)
5. **Editorial** — 에디토리얼 카드 + 이미지
6. **Trending** — 상품 리스트 (가격 포함, 세로 리스트)
7. **Latest Stories** — 스토리 카드
8. **Personalize Banner** — "CURATE YOUR STYLE" CTA
9. **Footer**

## 구현 단계

### Step 1: SmartNav 네비게이션 업데이트

**파일**: `packages/web/lib/components/main-renewal/SmartNav.tsx`

현재 nav items: Home, Explore, Upload
→ Stitch 디자인에 맞게 변경: **SHOP, EDITORIAL, ARCHIVE, MY**

- SHOP → `/explore` (기존 Explore 매핑)
- EDITORIAL → `/editorial`
- ARCHIVE → `/images` (기존 이미지 아카이브)
- MY → `/profile`
- Try On 버튼 유지 (네온 액센트)
- 검색, 장바구니 아이콘 유지

### Step 2: Top Items 섹션 추가 (가로 스크롤)

**새 파일**: `packages/web/lib/components/main/TopItemsSection.tsx`

현재 `best-items` 섹션이 DynamicHomeFeed에 있지만 가로 스크롤 카드로 스타일 변경 필요:
- 가로 스크롤 (snap scroll)
- 카드: 이미지 + 카테고리 라벨 (THE SILK COLLECTION, NEW ARRIVALS 등)
- 다크 카드 배경 + 라운드 코너
- ItemCardData 재사용

### Step 3: Trending 섹션 업데이트 (가격 리스트)

**새 파일**: `packages/web/lib/components/main/TrendingListSection.tsx`

현재 `trending-now`는 키워드 뱃지만 표시. Stitch 디자인은:
- 세로 리스트: 이미지 + 상품명 + 가격 ($650, $330 등)
- 네온 액센트 가격 텍스트
- 3개 아이템 + "View All" 링크

데이터: `bestItemCards`에서 파생하거나 새 쿼리 추가

### Step 4: Editorial 섹션 추가

**새 파일**: `packages/web/lib/components/main/EditorialSection.tsx`

현재 `decoded-pick` + `whats-new`를 EDITORIAL 섹션으로 통합:
- 대형 에디토리얼 이미지 카드
- "EDITORIAL" 헤더
- 데이터: `whatsNewStyles` 또는 `spotlightStyles` 재사용

### Step 5: Latest Stories 섹션

**새 파일**: `packages/web/lib/components/main/LatestStoriesSection.tsx`

- "LATEST STORIES" 헤더 + "FASHION DISPLAY" 라벨
- 스토리 카드 (기존 StyleCard 활용, variant 조정)
- 데이터: `whatsNewStyles` 활용

### Step 6: DynamicHomeFeed 섹션 타입 확장

**파일**: `packages/web/lib/components/main/DynamicHomeFeed.tsx`

새 섹션 타입 추가:
- `"top-items"` → TopItemsSection 렌더링
- `"trending-list"` → TrendingListSection 렌더링
- `"editorial-feature"` → EditorialSection 렌더링
- `"latest-stories"` → LatestStoriesSection 렌더링

### Step 7: page.tsx 섹션 순서 변경

**파일**: `packages/web/app/page.tsx`

현재 구조를 Stitch 디자인 순서에 맞게 재배치:
```
Hero → Weekly Best(Masonry) → Top Items → Editorial → Trending List → Latest Stories → Personalize Banner → Footer
```

`buildHomeLayout`의 sections 배열 또는 하드코딩으로 순서 지정.

### Step 8: 스타일 통일

모든 섹션에 일관된 Stitch 디자인 적용:
- 섹션 헤더: uppercase, letter-spacing, accent underline
- 카드: rounded-xl, bg-white/5, hover 시 glow
- 가격 텍스트: #eafd67 네온 컬러
- 섹션 간 여백: py-16 ~ py-24

## 핵심 파일

| 파일 | 변경 유형 |
|------|----------|
| `SmartNav.tsx` | 수정 (nav items) |
| `DynamicHomeFeed.tsx` | 수정 (새 섹션 타입) |
| `page.tsx` | 수정 (섹션 순서) |
| `TopItemsSection.tsx` | 신규 |
| `TrendingListSection.tsx` | 신규 |
| `EditorialSection.tsx` | 신규 |
| `LatestStoriesSection.tsx` | 신규 |
| `main/index.ts` | 수정 (export 추가) |

## 재사용할 기존 코드

- `StyleCard` / `StyleCardData` — 카드 렌더링
- `ItemCard` / `ItemCardData` — 아이템 카드
- `NeonGlow` — 네온 효과
- `MasonryGrid` / `MasonryGridItem` — Weekly Best
- `MainHero` — Hero (변경 없음)
- `PersonalizeBanner` — 배너 (변경 없음)
- `MainFooter` — 푸터 (변경 없음)
- GSAP + Motion 애니메이션 패턴 동일 적용

## 검증

1. `yarn dev`로 개발 서버 실행
2. 데스크톱(1280px+)에서 섹션 순서/레이아웃 확인
3. 각 섹션의 데이터 로딩 확인 (Supabase 쿼리)
4. 반응형: 모바일에서도 깨지지 않는지 확인
5. `yarn build`로 빌드 성공 확인
