# Hero Section Redesign: Scattered Draggable Images with Product Tags

## Context

현재 MainHero는 7개 이미지가 고정 슬롯에 떠다니는 단순 콜라주. 사용자가 원하는 것:
- decoded-app `lab/main-d`처럼 **스티커 형태로 드래그 가능한 이미지들**
- 각 이미지에 **상품 태그(spot annotations)** 연결
- 이미지 클릭 시 **나머지 dim 처리** → 선택된 이미지 + 태그만 강조
- 태그는 이미지와 함께 이동

## Files

### 새로 생성 (4)
| File | Purpose |
|------|---------|
| `main-renewal/scatter.ts` | Seeded PRNG 기반 결정적 scatter 배치 (main-d scatter.ts 포팅) |
| `main-renewal/HeroCard.tsx` | GSAP Draggable 카드 + spot 렌더링 + focus/dim |
| `main-renewal/HeroSpotMarker.tsx` | 상품 태그 dot + 호버 툴팁 |
| `main-renewal/useHeroFocus.ts` | 선택 상태 관리 hook (`focusedId`) |

### 수정 (3)
| File | Change |
|------|--------|
| `main-renewal/types.ts` | `FloatingHeroImage`에 `spots?: HeroSpotAnnotation[]` 추가 |
| `main-renewal/MainHero.tsx` | 전면 교체: scatter + HeroCard + focus 시스템 |
| `main/HeroItemSync.tsx` | post.items → spot annotations 매핑 추가 |

## Implementation

### Step 1: types.ts 수정
- `FloatingHeroImage`에 `spots?: HeroSpotAnnotation[]` 필드 추가
- `HeroSpotAnnotation`에 `price?: string`, `productLink?: string` 추가

### Step 2: scatter.ts 생성
- main-d의 `djb2` + `seededRandom` PRNG 함수 포팅
- 3행 18슬롯 zigzag 그리드 (hero 뷰포트에 맞게 축소)
  - Row 1: 4-14%, Row 2: 32-44%, Row 3: 62-74%
- 3단계 티어: hero `clamp(180px,24vw,340px)`, medium `clamp(120px,16vw,240px)`, small `clamp(80px,10vw,150px)`
- `computeScatterPosition(id, index, total) → ScatterPosition` 순수함수
- SSR-safe (Math.random 미사용)

### Step 3: useHeroFocus.ts 생성
```ts
// focusedId: string | null
// toggleFocus(id) — 같으면 해제, 다르면 전환
// clearFocus() — null로 초기화
// isFocused(id) / isDimmed(id) — 파생 boolean
```

### Step 4: HeroSpotMarker.tsx 생성
- 부모 이미지 컨테이너의 자식으로 `position: absolute; left/top: x%/y%`
- 호버 시 label + brand + price 툴팁
- `isFocused` true일 때만 표시 (GSAP stagger 진입 애니메이션)
- 태그는 부모 DOM 자식이므로 드래그 시 자동으로 함께 이동

### Step 5: HeroCard.tsx 생성
- **GSAP Draggable** 설정:
  - `onClick`: `toggleFocus(id)` (Draggable의 빌트인 onClick으로 드래그와 구분)
  - `onPress`: z-index → 50, float tween kill
  - `onDrag`: 탄성 회전 `clamp(-25, 25, deltaX * 0.4)`
  - `onDragEnd`: 회전 snap-back `elastic.out(1,0.5)`
  - `onRelease`: z-index 복원 (300ms delay), float tween 재시작
- **Focus/Dim 상태** (props 변경 시 GSAP 애니메이션):
  - `isDimmed=true`: opacity 0.3, blur(2px), brightness(0.6)
  - `isFocused=true`: opacity 1, filter none, z-index 40, spots 표시
  - 둘 다 false: 원래 상태
- **Float 애니메이션**: sine yoyo 반복 (드래그 시 kill, 릴리즈 시 재시작)
- **Spot 렌더링**: `<HeroSpotMarker>` 자식으로 렌더 (focused 시에만)

### Step 6: MainHero.tsx 전면 교체
- `scatter.ts`로 이미지 배치 계산
- `useHeroFocus` 훅으로 상태 관리
- `focusedId !== null`일 때 z-35 backdrop div (클릭 시 clearFocus)
- Neon glow 배경, gradient overlay, grain 유지
- z-index 체계: dimmed cards(2-22) < backdrop(35) < focused card(40) < dragging(50)

### Step 7: HeroItemSync.tsx 수정
- `post.items`를 `HeroSpotAnnotation[]`으로 변환
- x,y 좌표가 없으면 auto-distribute (균등 분배 fallback)
- `FloatingHeroImage.spots` 필드에 매핑

## 반응형
- Desktop (≥768px): 85vh, 전체 scatter, 7-12개 이미지
- Mobile (<768px): 70vh, 5-6개로 제한, 터치 드래그 지원, 툴팁 상하 배치

## 검증
1. `bun run typecheck` — 타입 에러 없음
2. 개발 서버에서 Hero 섹션 확인:
   - 이미지 scatter 배치 정상
   - 드래그 동작 확인
   - 클릭 시 dim/focus 전환
   - 상품 태그 표시/이동
3. 모바일 뷰포트 테스트
4. SSR hydration mismatch 없음 확인
