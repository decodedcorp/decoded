# [SCR-CREA-02] AI 검출 결과 (AI Detection)

| 항목 | 내용 |
|------|------|
| **문서 ID** | SCR-CREA-02 |
| **화면명** | AI 검출 결과 |
| **경로** | `/create/detect` |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: AI가 업로드된 이미지에서 자동으로 감지한 패션 아이템을 확인하고 편집
- **선행 조건**: SCR-CREA-01에서 이미지 업로드 완료
- **후속 화면**: SCR-CREA-03 (태그 편집)
- **관련 기능 ID**: C-02 AI Object Recognition

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px) - 로딩 상태

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [←] Create New Post                                    Step 2 of 4        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ○ Upload ━━━━ ● Detect ━━━━ ○ Tag ━━━━ ○ Link                            │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │                                                                        │ │
│  │                                                                        │ │
│  │                         [SPINNER]                                     │ │
│  │                            ⟳                                          │ │
│  │                                                                        │ │
│  │                    Analyzing your image...                            │ │
│  │                                                                        │ │
│  │               Our AI is detecting fashion items                       │ │
│  │                                                                        │ │
│  │                                                                        │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                        [LOADING-STATE]                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 데스크톱 (≥768px) - 검출 결과

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [←] Create New Post                                    Step 2 of 4        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ○ Upload ━━━━ ● Detect ━━━━ ○ Tag ━━━━ ○ Link                            │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │   ┌────────────────────────────────────────────────────────────────┐  │ │
│  │   │                                                                │  │ │
│  │   │                     [CANVAS-01]                                │  │ │
│  │   │                                                                │  │ │
│  │   │          ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐                                  │  │ │
│  │   │          │   [BOX-01]      │                                  │  │ │
│  │   │          │    Item 1       │    ← Bounding Box (dashed)       │  │ │
│  │   │          │    93%          │                                  │  │ │
│  │   │          └─ ─ ─ ─ ─ ─ ─ ─ ─┘                                  │  │ │
│  │   │                                                                │  │ │
│  │   │                    ┌─ ─ ─ ─ ─ ─ ─┐                            │  │ │
│  │   │                    │  [BOX-02]   │                            │  │ │
│  │   │                    │   Item 2    │                            │  │ │
│  │   │                    │   87%       │                            │  │ │
│  │   │                    └─ ─ ─ ─ ─ ─ ─┘                            │  │ │
│  │   │                                                                │  │ │
│  │   └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  │   Tools: [Select] [✏️ Draw Box] [🔍+] [🔍-]                          │ │
│  │          [TOOL-SELECT] [TOOL-DRAW] [TOOL-ZOOM-IN] [TOOL-ZOOM-OUT]   │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Found 2 items:                                  [TXT-COUNT]               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ┌────────┐                                                           │ │
│  │  │ [CROP] │  Item 1                                            [✕]   │ │
│  │  │        │  Category: [Top ▼]              Confidence: 93%          │ │
│  │  └────────┘  [Edit Box] [Remove]                                     │ │
│  │              [CARD-01]                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ┌────────┐                                                           │ │
│  │  │ [CROP] │  Item 2                                            [✕]   │ │
│  │  │        │  Category: [Bag ▼]              Confidence: 87%          │ │
│  │  └────────┘  [Edit Box] [Remove]                                     │ │
│  │              [CARD-02]                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [+ Add Item Manually]   [BTN-ADD-MANUAL]                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [← Back]                                    [Next: Add Tags →]     │   │
│  │  [BTN-BACK]                                  [BTN-NEXT]             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 바운딩 박스 편집 모드

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐  │
│   │                                                                    │  │
│   │          ┏━━━ ● ━━━━━━━━━━━━━ ● ━━━┓  ← Selected Box (solid)      │  │
│   │          ┃                        ●  ← Resize Handle (corner)      │  │
│   │          ●                        ┃                                │  │
│   │          ┃      [BOX-01]          ┃  ← Drag to move               │  │
│   │          ┃       (editing)        ┃                                │  │
│   │          ●                        ┃                                │  │
│   │          ┃                        ●                                │  │
│   │          ┗━━━ ● ━━━━━━━━━━━━━ ● ━━━┛                               │  │
│   │                                                                    │  │
│   │                    ┌─ ─ ─ ─ ─ ─ ─┐  ← Unselected Box (dashed)     │  │
│   │                    │  [BOX-02]   │                                 │  │
│   │                    │             │                                 │  │
│   │                    └─ ─ ─ ─ ─ ─ ─┘                                 │  │
│   │                                                                    │  │
│   └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│   Editing Item 1                                                          │
│   - Drag box to move                                                      │
│   - Drag corners to resize                                                │
│   - Press Enter or click outside to confirm                              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 수동 박스 그리기 모드

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   Tools: [Select] [✏️ Draw Box] [🔍+] [🔍-]                               │
│                   ^^^^^^^^^^^^^^ (active)                                  │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐  │
│   │                         cursor: crosshair                          │  │
│   │                                                                    │  │
│   │          ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                                    │  │
│   │          │                   │  ← Drawing in progress              │  │
│   │          │     [NEW BOX]     │    (dotted line)                    │  │
│   │          │                   │                                     │  │
│   │          └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                                    │  │
│   │                                                                    │  │
│   │                                                                    │  │
│   └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│   📝 Click and drag to draw a bounding box around an item               │
│      Release to confirm the selection                                     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 모바일 (<768px)

```
┌─────────────────────────────────┐
│  [←]  Detect Items        [✕]  │
├─────────────────────────────────┤
│                                 │
│   ○ ━━━ ● ━━━ ○ ━━━ ○          │
│   1     2     3     4          │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   [Image with boxes]    │   │
│  │                         │   │
│  │    ┌─ ─ ─ ─ ─┐         │   │
│  │    │ Item 1  │         │   │
│  │    │ 93%     │         │   │
│  │    └─ ─ ─ ─ ─┘         │   │
│  │                         │   │
│  │       ┌─ ─ ─ ─┐        │   │
│  │       │Item 2 │        │   │
│  │       │ 87%   │        │   │
│  │       └─ ─ ─ ─┘        │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  [Select] [Draw] [Zoom]        │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Found 2 items                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ┌────┐ Item 1           │   │
│  │ │    │ Top • 93%    [✕] │   │
│  │ └────┘ [Edit] [Remove]  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ┌────┐ Item 2           │   │
│  │ │    │ Bag • 87%    [✕] │   │
│  │ └────┘ [Edit] [Remove]  │   │
│  └─────────────────────────┘   │
│                                 │
│  [+ Add Manually]              │
│                                 │
│  ┌─────────────────────────┐   │
│  │    [← Back] [Next →]    │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 2.6 검출 결과 없음 상태

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [←] Create New Post                                    Step 2 of 4        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │   ┌────────────────────────────────────────────────────────────────┐  │ │
│  │   │                                                                │  │ │
│  │   │                      [Uploaded Image]                          │  │ │
│  │   │                                                                │  │ │
│  │   │                    (no boxes detected)                         │  │ │
│  │   │                                                                │  │ │
│  │   └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │                         [ICON-EMPTY]                                  │ │
│  │                             🔍                                        │ │
│  │                                                                        │ │
│  │                   No items detected                                   │ │
│  │                                                                        │ │
│  │     Our AI couldn't find any fashion items in this image.            │ │
│  │     You can manually mark items using the draw tool.                 │ │
│  │                                                                        │ │
│  │            [✏️ Draw Items Manually]                                   │ │
│  │            [BTN-DRAW-MANUAL]                                          │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [← Back]                             [Skip Detection →]            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 캔버스/이미지 영역

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| CANVAS-01 | 컨테이너 | 이미지 캔버스 | position: relative, overflow: hidden | 확대/축소 지원 |
| IMG-01 | 이미지 | 업로드된 이미지 | object-fit: contain, max-height: 500px | - |
| BOX-01~n | 오버레이 | 바운딩 박스 | position: absolute, border-dashed 2px | 클릭 시 선택, 드래그 이동/리사이즈 |
| HANDLE-TL/TR/BL/BR | 핸들 | 리사이즈 핸들 | 8x8px circle, corners | 드래그로 크기 조절 |
| LABEL-01~n | 라벨 | 박스 라벨 | position: top of box, bg-black/70 | 카테고리 + 신뢰도 표시 |

### 3.2 도구 모음

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| TOOL-SELECT | 버튼 | 선택 도구 | Icon: MousePointer, toggle | 박스 선택/이동/리사이즈 모드 |
| TOOL-DRAW | 버튼 | 그리기 도구 | Icon: PenTool, toggle | 새 박스 그리기 모드 |
| TOOL-ZOOM-IN | 버튼 | 확대 | Icon: ZoomIn | 캔버스 확대 (최대 3x) |
| TOOL-ZOOM-OUT | 버튼 | 축소 | Icon: ZoomOut | 캔버스 축소 (최소 0.5x) |

### 3.3 검출된 아이템 목록

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| TXT-COUNT | 텍스트 | 검출 수 | "Found n items:" | - |
| CARD-01~n | 카드 | 아이템 카드 | flex, gap-3, border rounded | 클릭 시 캔버스에서 해당 박스 선택 |
| IMG-CROP | 이미지 | 크롭 이미지 | 64x64px, rounded, object-cover | AI가 자동 생성한 크롭 |
| TXT-ITEM-NAME | 텍스트 | 아이템명 | "Item n", font-semibold | - |
| SEL-CATEGORY | 선택 | 카테고리 | dropdown: Top, Bottom, Dress, etc. | 변경 시 박스 라벨 업데이트 |
| TXT-CONFIDENCE | 텍스트 | 신뢰도 | "Confidence: n%", text-muted | 93% 이상: green, 70-92%: yellow, <70%: red |
| BTN-EDIT-BOX | 버튼 | 박스 편집 | variant: ghost, size: sm | 캔버스에서 해당 박스 편집 모드 |
| BTN-REMOVE | 버튼 | 삭제 | variant: ghost, Icon: X | 해당 아이템 삭제 확인 모달 |

### 3.4 빈 상태/수동 추가

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| ICON-EMPTY | 아이콘 | 빈 상태 아이콘 | Icon: Search, size: 48px, color: muted | - |
| TXT-EMPTY-TITLE | 텍스트 | 빈 상태 제목 | "No items detected" | - |
| TXT-EMPTY-DESC | 텍스트 | 빈 상태 설명 | "Our AI couldn't find..." | - |
| BTN-ADD-MANUAL | 버튼 | 수동 추가 | variant: outline, Icon: Plus | 그리기 도구 활성화 |
| BTN-DRAW-MANUAL | 버튼 | 직접 그리기 | variant: primary, Icon: PenTool | 그리기 도구 활성화 + 안내 표시 |

### 3.5 하단 액션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| BTN-BACK | 버튼 | 이전 단계 | variant: outline | 업로드 화면으로 이동 |
| BTN-NEXT | 버튼 | 다음 단계 | variant: primary | 아이템 1개 이상 시 활성화 |
| BTN-SKIP | 버튼 | 건너뛰기 | variant: ghost, 검출 없을 때만 | 태그 편집으로 이동 (아이템 없이) |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 로딩 | API 호출 중 | 스피너 + "Analyzing..." 메시지 |
| 성공 (아이템 있음) | items.length > 0 | 바운딩 박스 + 아이템 목록 표시 |
| 성공 (아이템 없음) | items.length === 0 | 빈 상태 UI + 수동 그리기 안내 |
| 에러 | API 실패 | 에러 메시지 + 재시도 버튼 |
| 선택 모드 | tool === 'select' | 박스 클릭으로 선택, 드래그로 이동 |
| 그리기 모드 | tool === 'draw' | 커서 crosshair, 드래그로 새 박스 생성 |
| 박스 편집 중 | selectedBoxId !== null | 선택된 박스 강조, 리사이즈 핸들 표시 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 |
|-----|--------|----------|----------|
| AI 검출 | POST | `/api/ai/detect` | 페이지 마운트 시 (자동) |
| 크롭 생성 | (서버 자동) | - | 검출 결과와 함께 반환 |

```typescript
// Request
{
  imageUrl: string;
  options?: {
    minConfidence?: number;  // default: 0.5
    maxItems?: number;       // default: 10
  }
}

// Response
{
  success: boolean;
  items: Array<{
    id: string;
    bbox: { x: number; y: number; width: number; height: number };  // 0-1 정규화
    category: ItemCategory;
    confidence: number;      // 0-1
    croppedImageUrl: string;
  }>;
  processingTime: number;    // ms
}
```

### 5.2 상태 관리 (Zustand)

| 스토어 | 키 | 타입 | 설명 |
|--------|-----|------|------|
| createStore | detections | `DetectionResult[]` | 검출된 아이템 목록 |
| createStore | selectedDetectionId | `string \| null` | 선택된 박스 ID |
| createStore | canvasTool | `'select' \| 'draw'` | 현재 도구 |
| createStore | canvasZoom | `number` | 확대/축소 레벨 (0.5-3) |

```typescript
interface DetectionResult {
  id: string;
  imageId: string;
  bbox: BoundingBox;
  category: ItemCategory;
  confidence: number;
  croppedImageUrl: string;
  isManual: boolean;
}

type ItemCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'bag'
  | 'shoes'
  | 'accessory'
  | 'jewelry'
  | 'eyewear'
  | 'unknown';
```

---

## 6. 에러 처리

| 에러 상황 | 사용자 메시지 | 처리 방법 |
|----------|-------------|----------|
| API 타임아웃 | "Detection is taking too long. Please try again." | 재시도 버튼 + 수동 입력 옵션 |
| API 실패 | "Detection failed. You can manually mark items." | 에러 UI + 수동 그리기 옵션 |
| 이미지 로드 실패 | "Could not load image" | 업로드 단계로 돌아가기 안내 |
| 낮은 신뢰도 | (필터링됨) | 50% 미만은 결과에서 제외 |

---

## 7. 접근성 (A11y)

### 7.1 키보드 네비게이션
- `Tab`: 도구 버튼 → 아이템 카드들 → 액션 버튼
- `Arrow Keys`: 선택된 박스 미세 이동 (1px)
- `Shift + Arrow`: 선택된 박스 크게 이동 (10px)
- `Delete`: 선택된 박스 삭제
- `Escape`: 박스 선택 해제 / 그리기 모드 취소
- `Enter`: 그리기 완료 확인

### 7.2 스크린 리더
- 캔버스: `role="application"`, `aria-label="Detection canvas with n detected items"`
- 바운딩 박스: `role="button"`, `aria-label="Item 1, Top, 93% confidence. Press Enter to edit"`
- 도구 버튼: `aria-pressed="true/false"` (토글 상태)
- 카테고리 선택: `aria-label="Change category for Item 1"`

### 7.3 포커스 관리
- 검출 완료 시: 첫 번째 아이템 카드로 포커스
- 박스 삭제 시: 이전/다음 박스로 포커스
- 박스 추가 시: 새 박스로 포커스

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 페이지 | CreateDetectPage | `app/create/detect/page.tsx` |
| 캔버스 | DetectionCanvas | `lib/components/create/DetectionCanvas.tsx` |
| 바운딩 박스 | BoundingBox | `lib/components/create/BoundingBox.tsx` |
| 리사이즈 핸들 | ResizeHandle | `lib/components/create/ResizeHandle.tsx` |
| 도구 모음 | CanvasToolbar | `lib/components/create/CanvasToolbar.tsx` |
| 아이템 목록 | DetectedItemList | `lib/components/create/DetectedItemList.tsx` |
| 아이템 카드 | DetectedItemCard | `lib/components/create/DetectedItemCard.tsx` |
| 카테고리 선택 | CategorySelect | `lib/components/create/CategorySelect.tsx` |
| 빈 상태 | DetectionEmptyState | `lib/components/create/DetectionEmptyState.tsx` |
| 훅: AI 검출 | useAIDetection | `lib/hooks/useAIDetection.ts` |
| 훅: 캔버스 조작 | useCanvasInteraction | `lib/hooks/useCanvasInteraction.ts` |

---

## 9. 구현 체크리스트

- [ ] DetectionCanvas 컴포넌트 (이미지 + 오버레이)
- [ ] BoundingBox 컴포넌트 (드래그/리사이즈)
- [ ] 박스 선택/편집 모드
- [ ] 새 박스 그리기 기능
- [ ] 카테고리 변경 드롭다운
- [ ] 아이템 삭제 기능
- [ ] 확대/축소 기능
- [ ] AI 검출 API 연동 (useAIDetection)
- [ ] 로딩/에러/빈 상태 UI
- [ ] 크롭 이미지 표시
- [ ] 신뢰도 시각화 (색상 코딩)
- [ ] 반응형 레이아웃
- [ ] 터치 지원 (모바일 드래그)
- [ ] 접근성 테스트

---

## 10. 참고 사항

### 10.1 카테고리 목록
```typescript
const ITEM_CATEGORIES = [
  { value: 'top', label: 'Top (상의)' },
  { value: 'bottom', label: 'Bottom (하의)' },
  { value: 'dress', label: 'Dress (드레스/원피스)' },
  { value: 'outerwear', label: 'Outerwear (아우터)' },
  { value: 'bag', label: 'Bag (가방)' },
  { value: 'shoes', label: 'Shoes (신발)' },
  { value: 'accessory', label: 'Accessory (액세서리)' },
  { value: 'jewelry', label: 'Jewelry (주얼리)' },
  { value: 'eyewear', label: 'Eyewear (안경/선글라스)' },
  { value: 'unknown', label: 'Other (기타)' },
];
```

### 10.2 바운딩 박스 좌표
```typescript
// API 응답은 0-1 정규화 값
// 실제 렌더링 시 이미지 크기에 맞게 변환
interface BoundingBox {
  x: number;      // 왼쪽 상단 X (0-1)
  y: number;      // 왼쪽 상단 Y (0-1)
  width: number;  // 너비 (0-1)
  height: number; // 높이 (0-1)
}

// 픽셀 좌표로 변환
const toPixels = (bbox: BoundingBox, imgWidth: number, imgHeight: number) => ({
  x: bbox.x * imgWidth,
  y: bbox.y * imgHeight,
  width: bbox.width * imgWidth,
  height: bbox.height * imgHeight,
});
```

### 10.3 신뢰도 색상 코딩
```typescript
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.93) return 'text-green-500';
  if (confidence >= 0.70) return 'text-yellow-500';
  return 'text-red-500';
};
```
