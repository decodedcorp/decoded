# Hero 정리 + MasonryGrid 다채롭게

## Context
Hero 하단의 "FEATURED" 라벨 + 셀럽 이름 + "VIEW EDITORIAL" 버튼은 불필요한 정보를 차지하므로 제거. MasonryGrid(DECODED PICKS)는 현재 모든 카드가 동일한 스타일(검정 그라디언트 + 텍스트)이라 단조로움 → 카드 스타일 변형 추가.

## 변경사항

### 1. Hero 하단 info 섹션 제거
**파일:** `packages/web/lib/components/main-renewal/MainHero.tsx`
- `infoRef` 관련 코드 제거 (ref 선언, GSAP 애니메이션, JSX)
- z-[10] 하단 info 블록 전체 삭제 (FEATURED 라벨, 셀럽 이름, VIEW EDITORIAL 버튼)

### 2. MasonryGrid 카드 스타일 다양화
**파일:** `packages/web/lib/components/main-renewal/MasonryGridItem.tsx`

현재: 모든 카드가 동일한 스타일 (이미지 + 하단 검정 그라디언트 + 텍스트)

변경: index 기반으로 3가지 카드 변형 적용
- **기본 (index % 3 === 0)**: 현재와 동일 — 이미지 + 하단 그라디언트 오버레이 + 텍스트
- **텍스트 강조 (index % 3 === 1)**: 하단에 불투명 다크 바 + 카테고리 배지를 accent 색상 배경으로
- **미니멀 (index % 3 === 2)**: 그라디언트 없이 이미지만, hover 시에만 오버레이 + 텍스트 표시

## 수정 파일
- `packages/web/lib/components/main-renewal/MainHero.tsx`
- `packages/web/lib/components/main-renewal/MasonryGridItem.tsx`

## 검증
- 브라우저에서 localhost:3000 확인
- Hero에 FEATURED/VIEW EDITORIAL 없는지 확인
- MasonryGrid 카드가 3종 스타일로 번갈아 렌더링되는지 확인
