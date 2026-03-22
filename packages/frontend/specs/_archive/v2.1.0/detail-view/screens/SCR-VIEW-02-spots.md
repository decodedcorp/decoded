# [SCR-VIEW-02] 스팟 시스템 (Spot System)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-VIEW-02 |
| **경로** | (이미지 상세 내 컴포넌트) |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 이미지 위 검출된 아이템 위치에 스팟 마커 표시, 카드와 양방향 인터랙션
- **선행 조건**: 이미지 상세 페이지 진입, 아이템 좌표 데이터 존재
- **후속 화면**: 아이템 카드 선택, 구매 페이지
- **관련 기능 ID**: [V-02](../spec.md#v-02-spot-interaction)

---

## 2. UI 와이어프레임

### 2.1 스팟 오버레이 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│ InteractiveShowcase.tsx                                                     │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ 이미지 컨테이너 (position: relative)                                   │ │
│ │                                                                        │ │
│ │  ┌────────────────────────────────────────────────────────────────┐   │ │
│ │  │ <Image />                                                       │   │ │
│ │  │ z-index: 0                                                      │   │ │
│ │  │                                                                 │   │ │
│ │  │                                                                 │   │ │
│ │  └────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                        │ │
│ │  ┌────────────────────────────────────────────────────────────────┐   │ │
│ │  │ SpotOverlay.tsx (position: absolute, inset: 0)                  │   │ │
│ │  │ z-index: 10                                                     │   │ │
│ │  │ pointer-events: none (컨테이너), auto (개별 스팟)               │   │ │
│ │  │                                                                 │   │ │
│ │  │      ●1 ────────────────────▶ SpotMarker (left: 32%, top: 45%) │   │ │
│ │  │                                                                 │   │ │
│ │  │              ●2 ────────────▶ SpotMarker (left: 67%, top: 28%) │   │ │
│ │  │                                                                 │   │ │
│ │  │   ●3 ───────────────────────▶ SpotMarker (left: 23%, top: 72%) │   │ │
│ │  │                                                                 │   │ │
│ │  └────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                        │ │
│ │  ┌────────────────────────────────────────────────────────────────┐   │ │
│ │  │ ConnectorLayer.tsx (SVG, position: absolute)                    │   │ │
│ │  │ z-index: 5                                                      │   │ │
│ │  │ pointer-events: none                                            │   │ │
│ │  │                                                                 │   │ │
│ │  │  <svg viewBox="0 0 100 100">                                    │   │ │
│ │  │    <path d="M 32,45 C 50,45 85,30 100,30" /> (스팟1 → 카드1)   │   │ │
│ │  │    <path d="M 67,28 C 80,28 85,45 100,45" /> (스팟2 → 카드2)   │   │ │
│ │  │    <path d="M 23,72 C 50,72 85,60 100,60" /> (스팟3 → 카드3)   │   │ │
│ │  │  </svg>                                                         │   │ │
│ │  │                                                                 │   │ │
│ │  └────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 스팟 마커 상태

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SpotMarker STATES                                                           │
│                                                                            │
│ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│ │ STATE: default   │  │ STATE: hover     │  │ STATE: selected  │          │
│ │                  │  │                  │  │                  │          │
│ │    ┌───┐         │  │    ┌───┐         │  │    ╭───╮         │          │
│ │    │ 1 │         │  │    │ 1 │         │  │    │ 1 │         │          │
│ │    └───┘         │  │    └───┘         │  │    ╰───╯         │          │
│ │                  │  │                  │  │      │           │          │
│ │ bg: white        │  │ bg: primary-100  │  │ bg: primary      │          │
│ │ border: gray-400 │  │ border: primary  │  │ color: white     │          │
│ │ size: 24px       │  │ size: 28px       │  │ size: 32px       │          │
│ │ shadow: sm       │  │ shadow: md       │  │ shadow: lg+glow  │          │
│ │ scale: 1         │  │ scale: 1.1       │  │ scale: 1.2       │          │
│ │ cursor: pointer  │  │ cursor: pointer  │  │ ring animation   │          │
│ │                  │  │                  │  │                  │          │
└──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                            │
│ 좌표 계산:                                                                 │
│ item.center = { x: 0.32, y: 0.45 }  ← 정규화된 0-1 값                     │
│      ↓                                                                     │
│ style = {                                                                  │
│   position: 'absolute',                                                    │
│   left: `${0.32 * 100}%`,      // 32%                                     │
│   top: `${0.45 * 100}%`,       // 45%                                     │
│   transform: 'translate(-50%, -50%)'  // 중앙 정렬                        │
│ }                                                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 연결선 상태

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ConnectorLayer STATES                                                       │
│                                                                            │
│ [Default - 연결선 숨김 또는 점선]                                           │
│                                                                            │
│    ●1 · · · · · · · · · · · · · · · · · · · ▶ [Card 1]                    │
│                                                                            │
│ stroke: gray-300                                                           │
│ strokeDasharray: "4,4"                                                     │
│ strokeWidth: 1                                                             │
│ opacity: 0.5                                                               │
│                                                                            │
│ ─────────────────────────────────────────────────────────────────────────  │
│                                                                            │
│ [Selected - 실선 + 색상]                                                    │
│                                                                            │
│    ●1 ─────────────────────────────────────▶ [Card 1 ✓]                  │
│                                                                            │
│ stroke: primary                                                            │
│ strokeDasharray: "none"                                                    │
│ strokeWidth: 2                                                             │
│ opacity: 1                                                                 │
│ animation: dash-flow (optional)                                            │
│                                                                            │
│ ─────────────────────────────────────────────────────────────────────────  │
│                                                                            │
│ [Hover - 프리뷰]                                                            │
│                                                                            │
│    ●1 - - - - - - - - - - - - - - - - - - -▶ [Card 1]                    │
│                                                                            │
│ stroke: primary-300                                                        │
│ strokeDasharray: "2,2"                                                     │
│ strokeWidth: 1.5                                                           │
│ opacity: 0.8                                                               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 모바일 스팟 표시

```
┌────────────────────────────────┐
│                                    │
│  ┌──────────────────────────────┐  │
│  │ [IMAGE]                      │  │
│  │                              │  │
│  │   ●1  (터치 시 팝업)         │  │
│  │        ┌─────────────────┐   │  │
│  │        │ Celine Jacket   │   │  │
│  │        │ $2,850          │   │  │
│  │        │ [View →]        │   │  │
│  │        └─────────────────┘   │  │
│  │                              │  │
│  │        ●2                    │  │
│  │                              │  │
│  │   ●3                         │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  하단 아이템 리스트로 스크롤       │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 1. Celine Jacket [highlighted]│ │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 2. Prada Bag                 │  │
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 스팟 마커

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **SPOT** | 마커 | 스팟 번호 표시 | - Size: 24-32px<br>- Shape: Circle<br>- Number: 1, 2, 3... | **Click**: 카드 선택 + 스크롤<br>**Hover**: 확대 + 색상 변경 |
| **SPOT-LABEL** | 텍스트 | 번호 | - Font: 12px Bold<br>- Color: dark (기본), white (선택) | - |
| **SPOT-RING** | 효과 | 선택 링 | - Animation: pulse<br>- Color: primary/30 | 선택 시 펄스 애니메이션 |

### 연결선

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **CONNECTOR** | SVG Path | 연결선 | - Type: Bezier Curve<br>- Start: 스팟 위치<br>- End: 카드 위치 | 스팟/카드 선택 시 활성화 |
| **CONNECTOR-DEFAULT** | 상태 | 기본 | - Stroke: gray-300<br>- Dasharray: "4,4"<br>- Opacity: 0.5 | - |
| **CONNECTOR-SELECTED** | 상태 | 선택됨 | - Stroke: primary<br>- Dasharray: none<br>- Width: 2px | - |

### 모바일 팝업

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **SPOT-POPUP** | 팝업 | 아이템 미리보기 | - Position: 스팟 근처<br>- Auto-dismiss: 3초 | **Tap**: 아이템 카드로 스크롤 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **기본** | 선택 없음 | 모든 스팟 default 스타일, 연결선 점선 |
| **스팟 호버** | 스팟에 마우스 올림 | 해당 스팟 hover 스타일, 연결선 프리뷰 |
| **스팟 선택** | 스팟 클릭 | 해당 스팟 selected 스타일, 연결선 실선, 카드 하이라이트 |
| **카드 선택** | 카드 클릭 | 해당 스팟 selected + pulse 애니메이션 |
| **좌표 없음** | center 값 없음 | 스팟 숨김 또는 기본 위치 (0.5, 0.5) |
| **스팟 겹침** | 여러 스팟 근접 | 선택된 스팟 z-index 최상위 |

### 스팟-카드 동기화 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SYNCHRONIZATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [selectedSpotId 상태 (useState)]                                       │
│       │                                                                 │
│       ├─── SpotOverlay에 전달 ─────────────────────────────┐            │
│       │    각 SpotMarker가 isSelected 체크                  │            │
│       │                                                    │            │
│       ├─── ConnectorLayer에 전달 ─────────────────────────┤            │
│       │    선택된 연결선 스타일 변경                        │            │
│       │                                                    │            │
│       └─── ItemList에 전달 ───────────────────────────────┤            │
│            선택된 카드 하이라이트 + scrollIntoView         │            │
│                                                                         │
│  [상태 변경 트리거]                                                      │
│                                                                         │
│  SpotMarker onClick                                                      │
│       └─── setSelectedSpotId(item.id)                                   │
│                   │                                                     │
│                   ▼                                                     │
│            모든 관련 컴포넌트 리렌더링                                   │
│                                                                         │
│  ItemCard onClick                                                        │
│       └─── setSelectedSpotId(item.id)                                   │
│                   │                                                     │
│                   ▼                                                     │
│            모든 관련 컴포넌트 리렌더링                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 요구사항

### 5.1 좌표 데이터

```typescript
interface ItemPosition {
  id: string;
  index: number;  // 1, 2, 3... 순서
  center: {
    x: number;  // 0-1 정규화 (0 = 왼쪽, 1 = 오른쪽)
    y: number;  // 0-1 정규화 (0 = 위, 1 = 아래)
  };
}
```

### 5.2 좌표 변환

```typescript
// 정규화 좌표 → 백분율 위치
function toPercentPosition(center: { x: number; y: number }) {
  return {
    left: `${center.x * 100}%`,
    top: `${center.y * 100}%`,
  };
}

// 연결선 경로 계산
function calculateConnectorPath(
  spot: { x: number; y: number },
  cardIndex: number,
  totalCards: number
): string {
  const startX = spot.x * 100;
  const startY = spot.y * 100;
  const endX = 100;  // 오른쪽 패널
  const endY = (cardIndex / totalCards) * 100;

  // Bezier curve control points
  const cp1x = (startX + endX) / 2;
  const cp1y = startY;
  const cp2x = (startX + endX) / 2;
  const cp2y = endY;

  return `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;
}
```

---

## 6. 에러 처리

| 에러 상황 | 처리 방법 | 구현 위치 |
|:---|:---|:---|
| center 좌표 없음 | 기본값 (0.5, 0.5) 사용 | SpotOverlay.tsx |
| 좌표 범위 벗어남 | 0-1 범위로 clamp | SpotMarker.tsx |
| 스팟 10개 초과 | 최대 10개만 표시 | SpotOverlay.tsx |
| 이미지 크기 변경 | ResizeObserver로 재계산 | InteractiveShowcase.tsx |

---

## 7. 접근성 (A11y)

- **키보드 네비게이션**:
  - Tab: 스팟 간 이동 (tabIndex 적용)
  - Enter/Space: 스팟 선택
  - 1-9 숫자키: 해당 번호 스팟 직접 선택
- **스크린 리더**:
  - `aria-label="아이템 1: Celine Jacket"` (각 스팟)
  - `aria-pressed` (선택 상태)
- **시각적 피드백**: 선택 시 충분한 대비의 색상/크기 변화

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 이미지+스팟 래퍼 | InteractiveShowcase | `packages/web/lib/components/detail/InteractiveShowcase.tsx` |
| 스팟 컨테이너 | SpotOverlay | `packages/web/lib/components/detail/SpotOverlay.tsx` |
| 개별 스팟 | SpotMarker | `packages/web/lib/components/detail/SpotMarker.tsx` |
| 연결선 SVG | ConnectorLayer | `packages/web/lib/components/detail/ConnectorLayer.tsx` |
| 모바일 팝업 | SpotPopup | `packages/web/lib/components/detail/SpotPopup.tsx` |

---

## 9. 구현 체크리스트

- [x] 기본 스팟 렌더링
- [x] 좌표 기반 위치 지정
- [x] 연결선 (ConnectorLayer)
- [ ] 스팟 hover 상태
- [ ] 스팟 selected 상태 + pulse 애니메이션
- [ ] 스팟 클릭 → 카드 스크롤
- [ ] 카드 클릭 → 스팟 하이라이트
- [ ] 연결선 선택 시 스타일 변경
- [ ] ResizeObserver 반응형 재계산
- [ ] 모바일 터치 지원 + 팝업
- [ ] 접근성 (키보드, ARIA)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
| v1.1 | 2026-01-15 | PM | 용어 변경: Pin → Spot |
