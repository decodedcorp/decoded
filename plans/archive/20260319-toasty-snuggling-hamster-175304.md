# 메인 페이지 섹션 점검 및 조정

## Context

현재 메인 페이지에 섹션이 많아지면서 **데이터 중복, 이미지 피로, 미사용 데이터** 문제가 발생. 투머치하지 않게 정리하면서 빠진 핵심(개인화)을 채운다.

### 현재 문제
1. **TopItemsSection + GridMotionSection** — 둘 다 `bestItemCards` 동일 데이터 (중복)
2. **이미지 섹션 4연속** — Hero → TopItems → MasonryGrid → Style Radar → 피로
3. **ForYou 데이터 fetch하지만 렌더 안 됨** — 개인화가 핵심인데 버려짐
4. **Editorial+Trending이 너무 아래** — 유저 도달률 낮음

## 변경사항

### 1. GridMotionSection(Style Radar) 제거

**이유:** TopItemsSection과 데이터 중복, 이미지 피로 가중, 모바일에서 마우스 인터랙션 불가

**파일:** `packages/web/app/page.tsx`
- `<GridMotionSection>` JSX 제거
- `GridMotionSection` import 제거

### 2. 섹션 순서 재배치

**변경 전:**
```
Hero → TopItems → MasonryGrid → [Style Radar] → Editorial+Trending → DomeGallery → Footer
```

**변경 후:**
```
Hero → TopItems → Editorial+Trending → MasonryGrid → DomeGallery → Footer
```

**이유:** Editorial+Trending을 위로 올려 도달률 향상, MasonryGrid(포스트)와 DomeGallery(VTON) 사이 자연스러운 흐름

**파일:** `packages/web/app/page.tsx`
- `<DynamicHomeFeed>` (editorial+trending)을 MasonryGrid 위로 이동
- `newSections`에서 `"dome-gallery"` 제거 → MasonryGrid 아래 별도 렌더

### 3. ForYou 섹션 활성화 (로그인 시)

**파일:** `packages/web/app/page.tsx`
- `newSections` 배열에 `"for-you"` 조건부 추가 (userId 있을 때)
- Editorial+Trending 아래, MasonryGrid 위에 배치

**변경:**
```ts
const newSections: HomeSectionType[] = [
  "editorial-feature",
  "trending-list",
  ...(userId ? ["for-you" as const] : []),
];
```

### 4. DomeGallery를 DynamicHomeFeed에서 분리

**이유:** DomeGallery는 풀블리드 섹션이라 DynamicHomeFeed의 패딩/마진 간섭 없이 독립 렌더가 나음

**파일:** `packages/web/app/page.tsx`
- MasonryGrid 아래에 직접 `<DomeGallerySection>` 렌더
- `newSections`에서 `"dome-gallery"` 제거

**파일:** `packages/web/lib/components/main/DynamicHomeFeed.tsx`
- `DomeGallerySection`을 export하여 page.tsx에서 직접 사용 가능하게

## 최종 레이아웃

```
1. MainHero              — 브랜드 임팩트
2. TopItemsSection       — 인기 아이템 (hero 겹침)
3. Editorial + Trending  — 콘텐츠 + 키워드 (나란히)
4. ForYou (로그인 시)     — 개인화 추천
5. MasonryGrid           — DECODED PICKS
6. DomeGallery           — VTON CTA (풀블리드)
7. MainFooter            — 푸터
```

## 수정 파일

- `packages/web/app/page.tsx` — 섹션 순서 변경, GridMotion 제거, ForYou 활성화
- `packages/web/lib/components/main/DynamicHomeFeed.tsx` — DomeGallerySection export

## 검증

- localhost:3000에서 섹션 순서 확인
- GridMotionSection이 없는지 확인
- 로그인 상태에서 ForYou 섹션 표시 여부 확인
- Editorial+Trending이 MasonryGrid 위에 오는지 확인
- DomeGallery가 풀블리드로 정상 렌더되는지 확인
