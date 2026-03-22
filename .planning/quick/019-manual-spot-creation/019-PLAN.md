# Quick Task 019: Manual Spot Creation Flow

## Goal

analyze API를 제거하고 사용자가 수동으로 spot을 찍는 플로우로 변경.

## Current Flow
```
upload → analyze (AI 자동 감지) → post 생성
```

## New Flow
```
upload → 사용자가 이미지 클릭으로 spot 위치 지정 → post 생성
```

## Tasks

### Task 1: requestStore 수정

- `startDetection()` 제거 또는 변경
- `addSpot(x, y)` 액션 추가 - 사용자가 클릭한 위치에 새 spot 추가
- `removeSpot(spotId)` 액션 추가

### Task 2: detect 페이지 수정

- analyze 호출 제거
- 이미지 클릭 시 `addSpot` 호출
- "Detecting Items" → "Add Spots" 타이틀 변경

### Task 3: DetectionView 수정

- 이미지 클릭 이벤트 추가 (`onImageClick`)
- 클릭 위치를 normalized coordinates (0-1)로 변환
- 새 spot 추가 시 마커 표시

### Task 4: Step 검증 로직 수정

- Step 2 진행 조건: spots가 1개 이상이면 Next 가능

## Success Criteria

- [ ] analyze API 호출 없음
- [ ] 이미지 클릭 시 spot 추가
- [ ] spot 삭제 가능
- [ ] spot 1개 이상이면 다음 단계 진행 가능
