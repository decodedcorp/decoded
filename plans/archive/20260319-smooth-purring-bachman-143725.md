# Section O Main Page 구현 계획

## Context

Stitch "section o main page" 디자인을 참고하여 데스크톱 메인 페이지를 리뉴얼한다.
- **기존 헤더(SmartNav) 유지** — nav items 변경하지 않음
- **기존 테마 컬러 유지** (#050505 배경, #eafd67 액센트) — Stitch 참고하여 심플하고 멋지게
- **레이아웃**: 풀 와이드 세로 스택

## Stitch 참고 섹션 순서

1. **Hero** — 기존 MainHero 유지
2. **Weekly Best** — 기존 MasonryGrid (카테고리 라벨 추가)
3. **Top Items** — 가로 스크롤 아이템 카드 (NEW)
4. **Editorial** — 에디토리얼 피처 카드 (NEW)
5. **Trending** — 상품 리스트 + 가격 (NEW)
6. **Latest Stories** — 스토리 카드 (NEW)
7. **Personalize Banner** — 기존 유지
8. **Footer** — 기존 유지

## 구현 단계

### Step 1: TopItemsSection — 가로 스크롤 아이템

**새 파일**: `packages/web/lib/components/main/TopItemsSection.tsx`

- 섹션 헤더: uppercase, tracking-widest, accent 밑줄
- 가로 스크롤 (overflow-x-auto, snap-x, no scrollbar)
- 카드: 다크 bg (white/5), rounded-2xl, 이미지 + 카테고리 라벨
- 기존 `ItemCardData` props 재사용 (brand, name, imageUrl, link)
- Motion: scroll-triggered fade-up 입장

### Step 2: EditorialSection — 에디토리얼 피처

**새 파일**: `packages/web/lib/components/main/EditorialSection.tsx`

- 2열 레이아웃: 큰 이미지 좌 + 설명 텍스트 우 (모바일: 스택)
- 기존 `StyleCardData` 활용 (whatsNewStyles 첫 번째 항목)
- "EDITORIAL" 헤더 + artist name + context 설명
- Motion: 이미지 parallax, 텍스트 stagger

### Step 3: TrendingListSection — 트렌딩 상품 리스트

**새 파일**: `packages/web/lib/components/main/TrendingListSection.tsx`

- "TRENDING" 헤더
- 세로 리스트: 썸네일(64px) + 상품명 + 가격 (accent 컬러)
- 구분선 (border-b white/10)
- 3~5개 아이템 + "View All" 링크
- 데이터: `bestItemCards` 활용 (price 필드 추가 필요 시 mock)

### Step 4: LatestStoriesSection — 최신 스토리

**새 파일**: `packages/web/lib/components/main/LatestStoriesSection.tsx`

- "LATEST STORIES" 헤더
- 3열 그리드 (모바일: 1열)
- 기존 `StyleCard` variant="medium" 재사용
- 데이터: `whatsNewStyles` 활용

### Step 5: DynamicHomeFeed 섹션 타입 확장

**파일**: `packages/web/lib/components/main/DynamicHomeFeed.tsx`

새 HomeSectionType 추가:
```
"top-items" | "editorial-feature" | "trending-list" | "latest-stories"
```
각 타입에 해당 컴포넌트 렌더링 추가.

### Step 6: page.tsx 섹션 순서 재배치

**파일**: `packages/web/app/page.tsx`

```
<MainHero />
<MasonryGrid />          ← Weekly Best
<DynamicHomeFeed sections={[
  "top-items",
  "editorial-feature",
  "trending-list",
  "latest-stories"
]} />
<PersonalizeBanner />
<MainFooter />
```

기존 decoded-pick, for-you, artist-spotlight 등은 제거하거나 editorial/trending으로 대체.

### Step 7: 스타일 통일

- 섹션 헤더 패턴: `text-xs uppercase tracking-[0.2em] text-white/50` + accent dot/line
- 섹션 간 여백: `py-16 lg:py-24`
- 카드 hover: `scale-[1.02]` + subtle glow
- 전체적으로 미니멀, 고급스러운 톤

## 핵심 파일

| 파일 | 변경 |
|------|------|
| `page.tsx` | 섹션 순서 재배치 |
| `DynamicHomeFeed.tsx` | 새 섹션 타입 4개 추가 |
| `TopItemsSection.tsx` | 신규 생성 |
| `EditorialSection.tsx` | 신규 생성 |
| `TrendingListSection.tsx` | 신규 생성 |
| `LatestStoriesSection.tsx` | 신규 생성 |
| `main/index.ts` | export 추가 |

## 재사용

- `StyleCard` / `StyleCardData` — 카드 렌더링
- `ItemCard` / `ItemCardData` — 아이템 카드
- `MasonryGrid` — Weekly Best (변경 없음)
- `MainHero` — Hero (변경 없음)
- `PersonalizeBanner` — 배너 (변경 없음)
- `MainFooter` — 푸터 (변경 없음)
- Motion/GSAP 애니메이션 패턴 동일

## 검증

1. `yarn dev` → 데스크톱에서 섹션 순서/레이아웃 확인
2. 각 섹션 데이터 로딩 (Supabase 쿼리 정상 동작)
3. 반응형 확인 (모바일/태블릿)
4. `yarn build` 성공
