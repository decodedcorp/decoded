---
name: excalidraw-generator
description: Excalidraw 다이어그램 JSON 파일 생성. 아키텍처, 플로우차트, ERD, 시퀀스 다이어그램 등 시각화 요청 시 자동 적용.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Excalidraw 다이어그램 생성기

## 개요
사용자 요청에 따라 `.excalidraw` 파일(JSON)을 생성합니다.
생성된 파일은 Excalidraw.com, VS Code Excalidraw 확장, 또는 Obsidian에서 열 수 있습니다.

## 트리거 조건
다음 키워드가 포함된 요청에서 자동 활성화:
- "다이어그램", "diagram"
- "아키텍처", "architecture"
- "플로우차트", "flowchart"
- "ERD", "entity relationship"
- "시퀀스", "sequence"
- "Excalidraw", "시각화", "visualize"

## 파일 저장 위치
```
docs/diagrams/{파일명}.excalidraw
```

## 기본 JSON 구조

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": null
  },
  "files": {}
}
```

## 요소 생성 규칙

### ID 생성
- 형식: `{type}_{index}` (예: `rect_1`, `text_2`, `arrow_3`)
- 고유해야 함

### 좌표 시스템
- 원점: 좌측 상단 (0, 0)
- X축: 오른쪽으로 증가
- Y축: 아래쪽으로 증가

### 요소 간격
- 최소 간격: 40px
- 권장 간격: 60-80px
- 그룹 간 간격: 120px

## 색상 팔레트

### 배경색 (backgroundColor)
| 색상 | 코드 | 용도 |
|------|------|------|
| 파랑 | `#a5d8ff` | 서비스, API |
| 초록 | `#b2f2bb` | 성공, 완료 |
| 노랑 | `#ffec99` | 주의, 처리중 |
| 빨강 | `#ffc9c9` | 오류, 경고 |
| 보라 | `#d0bfff` | 외부 시스템 |
| 주황 | `#ffd8a8` | 데이터베이스 |
| 투명 | `transparent` | 그룹 경계 |

### 선 색상 (strokeColor)
| 색상 | 코드 | 용도 |
|------|------|------|
| 검정 | `#1e1e1e` | 기본 테두리 |
| 회색 | `#868e96` | 보조 선 |
| 파랑 | `#1971c2` | 강조 |

## 텍스트 설정

| 용도 | fontSize | fontFamily |
|------|----------|------------|
| 제목 | 24 | 1 (Hand-drawn) |
| 소제목 | 20 | 1 |
| 본문 | 16 | 1 |
| 레이블 | 14 | 1 |

## 요소 타입별 템플릿

### 사각형 (컴포넌트/서비스 박스)
```json
{
  "id": "rect_1",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 180,
  "height": 80,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#a5d8ff",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100,
  "roundness": { "type": 3 }
}
```

### 텍스트
```json
{
  "id": "text_1",
  "type": "text",
  "x": 120,
  "y": 130,
  "width": 140,
  "height": 25,
  "text": "컴포넌트 이름",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "roughness": 1,
  "opacity": 100
}
```

### 화살표 (연결선)
```json
{
  "id": "arrow_1",
  "type": "arrow",
  "x": 280,
  "y": 140,
  "width": 60,
  "height": 0,
  "points": [[0, 0], [60, 0]],
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100,
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

### 다이아몬드 (결정/조건)
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
  "roughness": 1,
  "opacity": 100
}
```

### 타원 (시작/종료)
```json
{
  "id": "ellipse_1",
  "type": "ellipse",
  "x": 100,
  "y": 100,
  "width": 100,
  "height": 60,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#b2f2bb",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100
}
```

## 다이어그램 유형별 가이드

### 1. 아키텍처 다이어그램
- 계층 구조: 위에서 아래로 (Client → Server → Database)
- 컴포넌트: 사각형
- 연결: 화살표 (단방향/양방향)
- 그룹핑: 점선 사각형으로 경계 표시

### 2. 플로우차트
- 시작/종료: 타원 (초록)
- 프로세스: 사각형 (파랑)
- 결정: 다이아몬드 (노랑)
- 흐름: 화살표

### 3. ERD
- 테이블: 사각형 (주황)
- 관계: 화살표 + 레이블
- PK/FK 표시: 텍스트로 명시

### 4. 시퀀스 다이어그램
- 액터: 상단 사각형
- 생명선: 점선 (아래로)
- 메시지: 화살표 (좌우)

## 출력 요구사항

1. 파일 경로: `docs/diagrams/{적절한_이름}.excalidraw`
2. JSON 유효성: 파싱 가능한 JSON
3. 요소 배치: 겹침 없이 적절한 간격
4. 완전한 구조: 모든 필수 필드 포함

## 생성 후 안내

파일 생성 후 사용자에게 다음 안내:
1. Excalidraw.com에서 열기: 메뉴 → Open → 파일 선택
2. VS Code: Excalidraw 확장 설치 후 더블클릭
3. 수동 조정이 필요하면 Excalidraw에서 직접 편집

## 참조
- 상세 스키마: `references/schema.md`
