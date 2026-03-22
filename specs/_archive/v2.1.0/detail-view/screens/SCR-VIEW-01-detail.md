# [SCR-VIEW-01] 이미지 상세 (Image Detail)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-VIEW-01 |
| **경로** | `/images/[id]` (Full) / `/(.)images/[id]` (Modal) |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 이미지와 검출된 아이템을 상세 표시, 스팟 인터랙션 및 구매 연결 제공
- **선행 조건**: 유효한 이미지 ID
- **후속 화면**: 구매 링크 (외부), Cast/Media 페이지
- **관련 기능 ID**: [V-01](../spec.md#v-01-responsive-detail-view)

---

## 2. UI 와이어프레임

### 2.1 라우팅 구조

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ROUTING ARCHITECTURE                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Case 1: Soft Navigation - 카드 클릭]                                     │
│                                                                            │
│  CardCell onClick → router.push(`/(.)images/${id}`)                       │
│       ↓                                                                    │
│  Intercepting Route → 모달 오버레이                                        │
│       ↓                                                                    │
│  배경: 홈 피드 (blur + dim)                                                │
│  전경: ImageDetailModal                                                    │
│                                                                            │
│  ─────────────────────────────────────────────────────────────────────     │
│                                                                            │
│  [Case 2: Hard Navigation - 직접 URL 접근]                                 │
│                                                                            │
│  Direct URL: /images/[id]                                                  │
│       ↓                                                                    │
│  Full Page Route → ImageDetailPage                                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 데스크톱 모달 뷰 (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [BACKDROP - 배경 피드 blur + rgba(0,0,0,0.5)]                               │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [MODAL]                                                       [BTN-CLOSE] │  │
│  │                                                                        │  │
│  │ ┌─────────────────────────────────┬──────────────────────────────────┐│  │
│  │ │                                 │                                  ││  │
│  │ │  [IMAGE-SECTION]                │  [ITEM-SECTION]                  ││  │
│  │ │                                 │                                  ││  │
│  │ │  ┌───────────────────────────┐  │  ┌──────────────────────────────┐││  │
│  │ │  │                           │  │  │ [SMART-TAGS]                 │││  │
│  │ │  │    [IMAGE]                │  │  │ 🎬 Squid Game › 👤 Ho-yeon  │││  │
│  │ │  │                           │  │  └──────────────────────────────┘││  │
│  │ │  │       ●1                  │  │                                  ││  │
│  │ │  │              ●2           │  │  ┌──────────────────────────────┐││  │
│  │ │  │   ●3                      │  │  │ [ITEM-LIST]                  │││  │
│  │ │  │                           │  │  │                              │││  │
│  │ │  │                           │  │  │ ┌────────────────────────┐  │││  │
│  │ │  └───────────────────────────┘  │  │ │ 1. [ITEM-CARD]         │  │││  │
│  │ │                                 │  │ │ ┌────┐ Celine Jacket    │  │││  │
│  │ │  ┌───────────────────────────┐  │  │ │ │IMG │ $2,850           │  │││  │
│  │ │  │ [CONNECTOR-LAYER]         │  │  │ │ └────┘ [Buy →]          │  │││  │
│  │ │  │ (스팟-카드 연결선 SVG)      │  │  │ └────────────────────────┘  │││  │
│  │ │  └───────────────────────────┘  │  │                              │││  │
│  │ │                                 │  │ ┌────────────────────────┐  │││  │
│  │ │  ┌───────────────────────────┐  │  │ │ 2. [ITEM-CARD]         │  │││  │
│  │ │  │ [NAV-ARROWS]              │  │  │ │ ┌────┐ Prada Bag        │  │││  │
│  │ │  │ [←]              [→]      │  │  │ │ │IMG │ $1,950           │  │││  │
│  │ │  └───────────────────────────┘  │  │ │ └────┘ [Buy →]          │  │││  │
│  │ │                                 │  │ └────────────────────────┘  │││  │
│  │ │  width: 60%                     │  │                              │││  │
│  │ │                                 │  └──────────────────────────────┘││  │
│  │ │                                 │                                  ││  │
│  │ │                                 │  width: 40%                      ││  │
│  │ └─────────────────────────────────┴──────────────────────────────────┘│  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 모바일 풀페이지 뷰 (<768px)

```
┌────────────────────────────────────┐
│  [Header]                          │
│  [←]           Image Detail        │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │ [SMART-TAGS]                 │  │
│  │ 🎬 Squid Game › 👤 Ho-yeon  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │  [IMAGE]                     │  │
│  │                              │  │
│  │      ●1                      │  │
│  │           ●2                 │  │
│  │    ●3                        │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 1. Celine Jacket             │  │
│  │    $2,850         [Buy →]    │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 2. Prada Bag                 │  │
│  │    $1,950         [Buy →]    │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 3. Nike Shoes                │  │
│  │    $180           [Buy →]    │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─────────────────────────────────  │
│                                    │
│  [Comments Section]                │
│  ...                               │
│                                    │
└────────────────────────────────────┘
```

### 2.4 GSAP FLIP 전환 애니메이션

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    FLIP ANIMATION SEQUENCE                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [1. CAPTURE]     [2. NAVIGATE]     [3. ANIMATE]     [4. COMPLETE]        │
│                                                                            │
│  ┌────────┐                        ┌──────────────────────────────┐       │
│  │  Card  │ ────────────────────▶ │                              │       │
│  │  (small)                        │         Modal Image         │       │
│  │        │                        │          (large)            │       │
│  └────────┘                        │                              │       │
│     ↑                              └──────────────────────────────┘       │
│     │                                                                      │
│     GSAP Flip.getState()                                                  │
│     └─▶ 위치/크기 저장                                                    │
│         └─▶ Flip.from() 애니메이션                                        │
│             duration: 0.5s                                                 │
│             ease: "power2.out"                                             │
│                                                                            │
│  [REVERSE: 모달 닫기]                                                      │
│                                                                            │
│  ┌──────────────────────────────┐                        ┌────────┐       │
│  │         Modal Image         │ ────────────────────▶ │  Card  │       │
│  │          (large)            │                        │ (small) │       │
│  └──────────────────────────────┘                        └────────┘       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 모달/페이지 공통

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **BACKDROP** | 배경 | 모달 배경 | - BG: `rgba(0,0,0,0.5)`<br>- Blur: 4px | **Click**: 모달 닫기 |
| **BTN-CLOSE** | 버튼 | 닫기 | - Icon: × (24px)<br>- Position: Top-right | **Click**: router.back() |
| **IMG-HERO** | 이미지 | 메인 이미지 | - Priority: true<br>- Aspect: original | onLoad → FLIP 애니메이션 |
| **SPOT-OVERLAY** | 오버레이 | 스팟 컨테이너 | - Position: absolute<br>- Inset: 0 | 스팟 마커 렌더링 |
| **CONNECTOR-SVG-LINE** | SVG | 연결선 | - Stroke: gray/primary<br>- Dasharray: 선택 시 solid | 스팟-카드 시각적 연결 |
| **NAV-PREV** | 버튼 | 이전 이미지 | - Icon: ← <br>- Hidden: 첫 번째일 때 | **Click**: 이전 이미지로 |
| **NAV-NEXT** | 버튼 | 다음 이미지 | - Icon: → <br>- Hidden: 마지막일 때 | **Click**: 다음 이미지로 |
| **SMART-TAGS** | 컴포넌트 | 컨텍스트 태그 | - Format: Media › Cast › Context | **Click**: 해당 페이지 이동 |

### 아이템 섹션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **ITEM-LIST** | 리스트 | 아이템 목록 | - Scrollable: vertical<br>- Max-height: 70vh | 선택된 아이템으로 스크롤 |
| **ITEM-CARD** | 카드 | 아이템 카드 | - Number: 1, 2, 3...<br>- Highlight: 선택 시 ring | **Click**: 해당 스팟 선택<br>상세 정보 표시 |
| **ITEM-IMG** | 이미지 | 아이템 썸네일 | - Size: 60×60px<br>- Border-radius: 8px | - |
| **ITEM-NAME** | 텍스트 | 상품명 | - Font: Body Bold<br>- Max: 1줄 ellipsis | - |
| **ITEM-BRAND** | 텍스트 | 브랜드 | - Font: Caption<br>- Color: `text-muted` | - |
| **ITEM-PRICE** | 텍스트 | 가격 | - Font: Body Bold<br>- Format: $1,234 | - |
| **BTN-BUY** | 버튼 | 구매 | - Style: Primary<br>- Icon: → | **Click**: 외부 링크 (affiliate) |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **전환 중** | FLIP 애니메이션 | 이미지 확대/이동 애니메이션 |
| **로딩** | 이미지/데이터 로드 중 | 스켈레톤 UI |
| **데이터 표시** | 로드 완료 | 이미지 + 아이템 목록 |
| **스팟 선택** | 스팟 또는 카드 클릭 | 해당 스팟/카드 하이라이트 + 연결선 활성화 |
| **빈 아이템** | 아이템 0개 | "No items detected" 메시지 |
| **에러** | API 실패 | 에러 메시지 + 재시도 |
| **404** | 이미지 없음 | Not Found 페이지 |

### 스팟-카드 인터랙션 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SPOT-CARD INTERACTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Flow A: 스팟 클릭]                                                       │
│                                                                         │
│  SpotMarker onClick                                                       │
│       │                                                                 │
│       ├─── setSelectedSpotId(item.id) ───────────────────┐               │
│       │                                                  │               │
│       ├─── 스팟: selected 스타일 (scale 1.2, primary)      │               │
│       ├─── 연결선: solid stroke, primary color           │               │
│       └─── 카드: scrollIntoView + ring 하이라이트        │               │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  [Flow B: 카드 클릭]                                                     │
│                                                                         │
│  ItemCard onClick                                                        │
│       │                                                                 │
│       ├─── setSelectedSpotId(item.id) ───────────────────┐               │
│       │                                                  │               │
│       ├─── 스팟: pulse 애니메이션 + selected 스타일        │               │
│       └─── 연결선: 활성화                                │               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| 이미지 상세 | GET | `/api/images/:id` | SSR / 클라이언트 | `{ image, items[] }` |
| 인접 이미지 | GET | `/api/images/:id/adjacent` | 네비게이션 시 | `{ prev, next }` |

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| React Query | `["image", id]` | `QueryKey` | 이미지 상세 캐시 |
| Zustand | `transitionStore` | `object` | FLIP 애니메이션 상태 |
| Local State | `selectedSpotId` | `string \| null` | 현재 선택된 스팟 |

### 5.3 데이터 타입

```typescript
interface ImageDetail {
  id: string;
  imageUrl: string;
  aspectRatio: number;
  media?: Media;
  cast?: Cast[];
  contextType?: ContextType;
  items: ItemWithPosition[];
  createdAt: Date;
}

interface ItemWithPosition {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  currency?: string;
  thumbnailUrl?: string;
  purchaseUrl?: string;
  center: { x: number; y: number };  // 정규화 좌표 (0-1)
}

// transitionStore
interface TransitionState {
  isTransitioning: boolean;
  sourceState: FlipState | null;
  targetImageId: string | null;
  prepare: (state: FlipState, id: string) => void;
  complete: () => void;
  reset: () => void;
}
```

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---:|:---|:---|:---|
| 404 | 이미지 없음 | "Image not found" | Not Found 페이지 |
| 500 | 서버 오류 | "Failed to load image" | 재시도 버튼 |
| Image Error | 이미지 로드 실패 | placeholder 표시 | fallback 이미지 |

---

## 7. 접근성 (A11y)

- **키보드 네비게이션**:
  - Escape: 모달 닫기
  - Arrow Left/Right: 이전/다음 이미지
  - Tab: 아이템 카드 간 이동
  - Enter: 선택된 카드 구매 링크
- **ARIA**:
  - `role="dialog"` (모달)
  - `aria-labelledby` (이미지 제목)
  - `aria-describedby` (아이템 정보)
- **포커스 관리**: 모달 열릴 때 첫 번째 요소로 포커스

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 풀페이지 | ImageDetailPage | `packages/web/app/images/[id]/page.tsx` |
| 모달 | ImageDetailModal | `packages/web/app/@modal/(.)images/[id]/page.tsx` |
| 공유 컨텐츠 | ImageDetailContent | `packages/web/lib/components/detail/ImageDetailContent.tsx` |
| 이미지+스팟 | InteractiveShowcase | `packages/web/lib/components/detail/InteractiveShowcase.tsx` |
| 스팟 오버레이 | SpotOverlay | `packages/web/lib/components/detail/SpotOverlay.tsx` |
| 스팟 마커 | SpotMarker | `packages/web/lib/components/detail/SpotMarker.tsx` |
| 연결선 | ConnectorLayer | `packages/web/lib/components/detail/ConnectorLayer.tsx` |
| 아이템 카드 | ItemDetailCard | `packages/web/lib/components/detail/ItemDetailCard.tsx` |
| 스마트 태그 | SmartTags | `packages/web/lib/components/detail/SmartTags.tsx` |
| 전환 스토어 | transitionStore | `packages/shared/stores/transitionStore.ts` |

---

## 9. 구현 체크리스트

- [x] 모달 라우팅 (intercepting route)
- [x] 풀페이지 라우팅
- [x] 공유 컨텐츠 컴포넌트
- [x] GSAP FLIP 전환 애니메이션
- [ ] 스팟 클릭 → 카드 스크롤 연동
- [ ] 카드 클릭 → 스팟 하이라이트 연동
- [ ] 키보드 네비게이션 (←/→)
- [ ] 모바일 스와이프 제스처
- [ ] 인접 이미지 프리로드
- [ ] 스마트 태그 컴포넌트
- [ ] 접근성 테스트

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
| v1.1 | 2026-01-15 | PM | 용어 변경: Pin → Spot |
