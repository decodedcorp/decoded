# Plan: Pretext.js 적용 + 드로어/상세 레이아웃 통일

## Context

드로어 패널(`ImageDetailPreview`)과 전체 상세 페이지(`ImageDetailContent`)의 에디토리얼 레이아웃이 불일치하며, 텍스트 레이아웃에 성능/CJK 이슈가 있음. Pretext.js를 도입하여 텍스트 측정을 최적화하고, 두 뷰의 레이아웃을 통일함.

## Step 1: Pretext.js 설치

```bash
cd packages/web && bun add @chenglou/pretext
```

## Step 2: usePretext 훅 생성

- **파일**: `packages/web/lib/hooks/usePretext.ts`
- `prepare(text, font)` → `useMemo`로 캐싱
- `layout(handle, containerWidth, lineHeight)` → 컨테이너 리사이즈 시 재계산
- `useContainerWidth` ref 기반으로 ResizeObserver 연동
- 한국어/CJK 텍스트 지원 (Intl.Segmenter 활용)

## Step 3: 드로어 패널 레이아웃 통일

현재 `ImageDetailPreview`에서 `MagazineContent`를 통째로 렌더링하고 있는데, 이것을 `ImageDetailContent`의 매거진 섹션 구조와 일치시킴.

**수정 파일**: `packages/web/lib/components/detail/ImageDetailPreview.tsx`
- `MagazineContent` 대신 `ImageDetailContent`의 매거진 섹션 구조 재사용
- `isModal={true}` prop으로 드로어용 축약 모드 분기

## Step 4: Pretext.js 적용 대상

### 4-1. MagazineEditorialSection (우선순위 높음)
- **파일**: `packages/web/lib/components/detail/magazine/MagazineEditorialSection.tsx`
- Drop cap의 float 레이아웃 → Pretext.js 측정 기반으로 개선
- 단락 높이 사전 계산으로 GSAP 애니메이션 오프셋 정확도 향상
- Pull quote 텍스트 높이 측정

### 4-2. MagazineTitleSection
- **파일**: `packages/web/lib/components/detail/magazine/MagazineTitleSection.tsx`
- Hero 타이틀 높이 사전 측정 → CLS 방지
- GSAP 애니메이션 오프셋을 실측 높이 기반으로 전환

### 4-3. MagazineItemsSection
- **파일**: `packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx`
- 상품명 truncation을 Pretext.js 측정 기반으로 개선
- `line-clamp-2`를 실제 텍스트 높이에 맞게 동적 적용

### 4-4. ImageDetailPreview (드로어 패널)
- **파일**: `packages/web/lib/components/detail/ImageDetailPreview.tsx`
- 매거진 타이틀의 높이를 사전 측정하여 레이아웃 안정성 확보

## Step 5: 검증

- `bunx vitest run` — 기존 테스트 통과 확인
- `bun run build` — 빌드 성공 확인
- 브라우저에서 editorial 페이지 → 포스트 클릭 → 드로어 패널과 전체 페이지의 레이아웃 일관성 확인
- 한국어 텍스트의 truncation/line-break가 정상 동작하는지 확인
