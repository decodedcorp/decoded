# Excalidraw JSON 스키마 상세 참조

## 파일 루트 구조

```typescript
interface ExcalidrawFile {
  type: "excalidraw";
  version: 2;
  source: string;
  elements: ExcalidrawElement[];
  appState: AppState;
  files: Record<string, BinaryFile>;
}
```

## AppState

```typescript
interface AppState {
  viewBackgroundColor: string;  // 배경색 (기본: "#ffffff")
  gridSize: number | null;      // 그리드 크기 (null = 그리드 없음)
}
```

## 공통 요소 속성

모든 요소가 공유하는 속성:

```typescript
interface BaseElement {
  id: string;                   // 고유 ID
  type: ElementType;            // 요소 타입
  x: number;                    // X 좌표
  y: number;                    // Y 좌표
  width: number;                // 너비
  height: number;               // 높이
  angle: number;                // 회전 각도 (라디안, 기본: 0)
  strokeColor: string;          // 테두리 색상
  backgroundColor: string;      // 배경 색상
  fillStyle: FillStyle;         // 채우기 스타일
  strokeWidth: number;          // 테두리 두께
  strokeStyle: StrokeStyle;     // 테두리 스타일
  roughness: number;            // 거칠기 (0-2)
  opacity: number;              // 불투명도 (0-100)
  groupIds: string[];           // 그룹 ID 배열
  frameId: string | null;       // 프레임 ID
  roundness: Roundness | null;  // 모서리 둥글기
  seed: number;                 // 랜덤 시드
  version: number;              // 버전
  versionNonce: number;         // 버전 논스
  isDeleted: boolean;           // 삭제 여부
  boundElements: BoundElement[] | null;  // 바인딩된 요소
  updated: number;              // 업데이트 타임스탬프
  link: string | null;          // 링크 URL
  locked: boolean;              // 잠금 여부
}
```

## 타입 정의

### ElementType
```typescript
type ElementType =
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "line"
  | "arrow"
  | "text"
  | "freedraw"
  | "image"
  | "frame";
```

### FillStyle
```typescript
type FillStyle = "solid" | "hachure" | "cross-hatch";
```

### StrokeStyle
```typescript
type StrokeStyle = "solid" | "dashed" | "dotted";
```

### Roundness
```typescript
interface Roundness {
  type: 1 | 2 | 3;  // 1: 없음, 2: 약간, 3: 많이
  value?: number;
}
```

## 요소별 상세 스키마

### Rectangle (사각형)

```json
{
  "id": "rect_1",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 100,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#a5d8ff",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": { "type": 3 },
  "seed": 12345,
  "version": 1,
  "versionNonce": 67890,
  "isDeleted": false,
  "boundElements": null,
  "updated": 1704067200000,
  "link": null,
  "locked": false
}
```

### Text (텍스트)

```json
{
  "id": "text_1",
  "type": "text",
  "x": 120,
  "y": 130,
  "width": 160,
  "height": 25,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "strokeStyle": "solid",
  "roughness": 1,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": null,
  "seed": 11111,
  "version": 1,
  "versionNonce": 22222,
  "isDeleted": false,
  "boundElements": null,
  "updated": 1704067200000,
  "link": null,
  "locked": false,
  "text": "텍스트 내용",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "baseline": 18,
  "containerId": null,
  "originalText": "텍스트 내용",
  "lineHeight": 1.25
}
```

**텍스트 전용 속성:**
- `text`: 표시할 텍스트
- `fontSize`: 글꼴 크기
- `fontFamily`: 1 (Hand-drawn), 2 (Normal), 3 (Code)
- `textAlign`: "left" | "center" | "right"
- `verticalAlign`: "top" | "middle" | "bottom"
- `containerId`: 컨테이너 요소 ID (사각형 안에 있을 때)

### Arrow (화살표)

```json
{
  "id": "arrow_1",
  "type": "arrow",
  "x": 300,
  "y": 150,
  "width": 100,
  "height": 50,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": { "type": 2 },
  "seed": 33333,
  "version": 1,
  "versionNonce": 44444,
  "isDeleted": false,
  "boundElements": null,
  "updated": 1704067200000,
  "link": null,
  "locked": false,
  "points": [[0, 0], [100, 50]],
  "lastCommittedPoint": null,
  "startBinding": {
    "elementId": "rect_1",
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "rect_2",
    "focus": 0,
    "gap": 5
  },
  "startArrowhead": null,
  "endArrowhead": "arrow"
}
```

**화살표 전용 속성:**
- `points`: 점 배열 [[x1,y1], [x2,y2], ...]
- `startBinding`: 시작점 바인딩
- `endBinding`: 끝점 바인딩
- `startArrowhead`: "arrow" | "bar" | "dot" | "triangle" | null
- `endArrowhead`: "arrow" | "bar" | "dot" | "triangle" | null

### Binding 구조
```typescript
interface Binding {
  elementId: string;    // 연결된 요소 ID
  focus: number;        // 연결 위치 (-1 ~ 1)
  gap: number;          // 요소와의 간격
}
```

### Line (선)

화살표와 유사하지만 화살촉 없음:

```json
{
  "id": "line_1",
  "type": "line",
  "x": 100,
  "y": 200,
  "width": 200,
  "height": 0,
  "points": [[0, 0], [200, 0]],
  "strokeColor": "#868e96",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "dashed",
  "roughness": 1,
  "opacity": 100
}
```

### Ellipse (타원)

```json
{
  "id": "ellipse_1",
  "type": "ellipse",
  "x": 100,
  "y": 100,
  "width": 120,
  "height": 80,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#b2f2bb",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "opacity": 100,
  "roundness": null
}
```

### Diamond (다이아몬드)

```json
{
  "id": "diamond_1",
  "type": "diamond",
  "x": 100,
  "y": 100,
  "width": 120,
  "height": 80,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#ffec99",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "opacity": 100,
  "roundness": { "type": 2 }
}
```

## 그룹핑

여러 요소를 그룹으로 묶으려면:
1. 각 요소의 `groupIds` 배열에 동일한 그룹 ID 추가
2. 중첩 그룹은 배열에 여러 ID 포함

```json
{
  "id": "rect_1",
  "groupIds": ["group_1"],
  ...
},
{
  "id": "text_1",
  "groupIds": ["group_1"],
  ...
}
```

## BoundElements

요소에 텍스트가 바인딩되어 있을 때:

```json
{
  "id": "rect_1",
  "type": "rectangle",
  "boundElements": [
    {
      "id": "text_1",
      "type": "text"
    }
  ],
  ...
}
```

텍스트 요소에서:
```json
{
  "id": "text_1",
  "type": "text",
  "containerId": "rect_1",
  ...
}
```

## 최소 필수 필드

간소화된 요소 (필수 필드만):

```json
{
  "id": "rect_1",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 100,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#a5d8ff",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100
}
```

## 색상 코드 참조

### Excalidraw 기본 팔레트

| 이름 | 코드 |
|------|------|
| Black | `#1e1e1e` |
| Gray | `#868e96` |
| Red | `#fa5252` |
| Pink | `#e64980` |
| Grape | `#be4bdb` |
| Violet | `#7950f2` |
| Indigo | `#4c6ef5` |
| Blue | `#228be6` |
| Cyan | `#15aabf` |
| Teal | `#12b886` |
| Green | `#40c057` |
| Lime | `#82c91e` |
| Yellow | `#fab005` |
| Orange | `#fd7e14` |

### 연한 배경색 (권장)

| 이름 | 코드 |
|------|------|
| Light Blue | `#a5d8ff` |
| Light Green | `#b2f2bb` |
| Light Yellow | `#ffec99` |
| Light Red | `#ffc9c9` |
| Light Violet | `#d0bfff` |
| Light Orange | `#ffd8a8` |
| Light Cyan | `#99e9f2` |
| Light Teal | `#96f2d7` |

## 좌표 계산 팁

### 요소 중앙 정렬
```
centerX = canvasWidth / 2 - elementWidth / 2
centerY = canvasHeight / 2 - elementHeight / 2
```

### 텍스트를 사각형 중앙에 배치
```
textX = rectX + (rectWidth - textWidth) / 2
textY = rectY + (rectHeight - textHeight) / 2
```

### 화살표 연결점 계산
```
// 오른쪽에서 왼쪽으로 연결
arrowX = rect1.x + rect1.width + gap
arrowWidth = rect2.x - arrowX - gap
points = [[0, 0], [arrowWidth, 0]]
```
