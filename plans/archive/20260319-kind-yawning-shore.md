# 메인페이지 B안 — "No Section" 에디토리얼 레이아웃

## Context

Stitch 디자인 도구에서 생성한 "no sectino main page" 스크린을 기반으로 메인페이지 대안(B안)을 구현한다. 현재 A안(MainHero + MasonryGrid + DynamicHomeFeed 섹션 구조)과 달리, B안은 **전통적인 섹션 구분 없이** 패션 아이템이 캔버스 위에 자유롭게 흩뿌려진 에디토리얼/매거진 감성의 실험적 레이아웃이다.

**디자인 핵심 요소:**
- 거대한 "DECODED" 타이포그래피 3줄 반복 배경 (watermark)
- 중앙 원형 네비게이션 허브 (SHOP, EDITORIAL, DECODED, ARCHIVE, MY)
- 패션 아이템 이미지가 절대 위치로 자유롭게 배치
- 네온 그린(#eafd67) 손그림 스타일 화살표 SVG 연결선
- "Quick Peek" 카드 — 호버 시 아이템 상세 팝업
- "NEW ARRIVALS" 라벨
- 다크 배경 (#050505)

## 구현 계획

### 1. 새 컴포넌트 디렉토리 생성

```
packages/web/lib/components/main-b/
├── MainPageB.tsx          # 메인 오케스트레이터 (client)
├── DecodedTypography.tsx  # 배경 대형 타이포그래피
├── CircularNav.tsx        # 중앙 원형 네비게이션
├── ScatteredCanvas.tsx    # 흩뿌려진 아이템 캔버스
├── ScatteredItem.tsx      # 개별 아이템 (위치/회전/호버)
├── QuickPeekCard.tsx      # 호버 팝업 카드
├── NeonArrows.tsx         # SVG 화살표 연결선
├── types.ts               # B안 전용 타입
└── index.ts               # Barrel export
```

### 2. 컴포넌트별 구현 상세

#### `MainPageB.tsx` — 오케스트레이터
- `'use client'` — 마우스 인터랙션, GSAP 애니메이션 필요
- Props: 기존 page.tsx에서 전달하는 데이터 재활용
  - `heroData`, `gridItems`, `bestItemCards` 등에서 이미지/제목/링크 추출
- 전체 뷰포트 높이 (100vh) 단일 캔버스 레이아웃
- Z-index 레이어링: 배경 타이포 (0) → 네온 화살표 (1) → 흩뿌려진 아이템 (2) → 원형 네비 (3) → Quick Peek (4)

#### `DecodedTypography.tsx` — 배경 타이포
- "DECODED" 텍스트 3줄 반복, `font-size: ~15vw`
- 낮은 opacity (0.08~0.12), stroke-only 또는 semi-transparent
- GSAP 스크롤 시 subtle parallax 효과
- `pointer-events-none`

#### `CircularNav.tsx` — 원형 네비게이션
- 원형 테두리 안에 카테고리 텍스트 (SHOP, EDITORIAL, DECODED, ARCHIVE, MY) 배치
- CSS `rotate()` + `translateX()` 로 원형 배열
- 중앙에 DECODED 로고/텍스트
- 호버 시 카테고리 하이라이트 + 연관 아이템 강조
- GSAP 진입 애니메이션 (scale 0→1, rotate)

#### `ScatteredCanvas.tsx` + `ScatteredItem.tsx` — 아이템 배치
- 8~10개 아이템을 미리 정의된 좌표에 절대 배치
- 각 아이템: 이미지 + 회전각 + 크기 변화
- 호버 시 scale up + Quick Peek 카드 표시
- GSAP 진입: stagger fade-in + 살짝 떠오르는 효과
- 기존 `GridItemData` 타입 재활용

#### `QuickPeekCard.tsx` — 상세 팝업
- 아이템 호버 시 표시되는 간결한 카드
- 브랜드명, 상품명, 가격 표시
- 기존 `GridItemSpot` 데이터 활용
- 반투명 배경 + 블러 효과

#### `NeonArrows.tsx` — 연결선
- SVG 기반 곡선 화살표
- 네온 그린 (#eafd67) 색상
- 손그림 느낌: `stroke-dasharray` + 불규칙 곡선
- GSAP `drawSVG` 느낌의 진입 애니메이션 (stroke-dashoffset)

### 3. 라우트 구성

`packages/web/app/page.tsx`는 수정하지 않고, 별도 경로에 B안을 배치:

**Option: `/lab/main-b` 경로**
- `packages/web/app/lab/main-b/page.tsx` 생성
- 기존 page.tsx의 데이터 fetch 로직을 공유 함수로 추출하거나 복제
- A/B 테스트 준비 완료 상태로 유지

### 4. 재활용 요소

| 기존 자산 | 위치 | B안 활용 |
|-----------|------|---------|
| NeonGlow | main-renewal/NeonGlow.tsx | 배경 글로우 효과 |
| GSAP 패턴 | MainHero.tsx | 진입 애니메이션 타임라인 |
| GridItemData 타입 | main-renewal/types.ts | ScatteredItem 데이터 |
| 디자인 토큰 | design-system/tokens.ts | 색상, 타이포그래피 |
| 데이터 fetch 함수 | supabase/queries/main-page.server.ts | 동일 데이터 소스 |
| Mock 데이터 | main-renewal/mock/ | 개발 시 폴백 |

### 5. 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `lib/components/main-b/MainPageB.tsx` | **신규** |
| `lib/components/main-b/DecodedTypography.tsx` | **신규** |
| `lib/components/main-b/CircularNav.tsx` | **신규** |
| `lib/components/main-b/ScatteredCanvas.tsx` | **신규** |
| `lib/components/main-b/ScatteredItem.tsx` | **신규** |
| `lib/components/main-b/QuickPeekCard.tsx` | **신규** |
| `lib/components/main-b/NeonArrows.tsx` | **신규** |
| `lib/components/main-b/types.ts` | **신규** |
| `lib/components/main-b/index.ts` | **신규** |
| `app/lab/main-b/page.tsx` | **신규** — 라우트 엔트리 |

기존 파일은 일절 수정하지 않음.

## 검증 방법

1. `yarn dev` 후 `http://localhost:3000/lab/main-b` 접속
2. 다크 배경에 DECODED 타이포가 보이는지 확인
3. 원형 네비게이션 동작 확인
4. 아이템 호버 시 Quick Peek 카드 표시 확인
5. 진입 애니메이션 동작 확인
6. 반응형 (모바일 뷰) 기본 대응 확인
