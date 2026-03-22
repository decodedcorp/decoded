# Quick Task 018: Solution Input UI

## Goal

DetectedItemCard에 solution 입력 폼을 추가하여 사용자가 상품 정보를 입력할 수 있게 함.

## Design

선택된 카드가 확장되어 solution 입력 폼이 나타나는 방식:

```
┌─────────────────────────────┐
│ [썸네일] TOP - Jacket       │  ← 기본 카드 (축소)
│          Detected: 85%      │
└─────────────────────────────┘

┌─────────────────────────────┐
│ [썸네일] TOP - Jacket       │  ← 선택된 카드 (확장)
│          Detected: 85%      │
├─────────────────────────────┤
│ 🔗 상품 정보 추가 (선택)    │
│                             │
│ 상품명 [________________]   │
│ 구매 링크 [______________]  │
│ 가격 [______] KRW           │
│                             │
│ [저장] [취소]               │
└─────────────────────────────┘
```

## Tasks

### Task 1: SolutionInputForm 컴포넌트 생성

**파일**: `packages/web/lib/components/request/SolutionInputForm.tsx`

Props:
- `spotId: string`
- `initialData?: SpotSolutionData`
- `onSave: (solution: SpotSolutionData) => void`
- `onCancel: () => void`

Fields:
- title (필수)
- originalUrl (필수)
- priceAmount (선택)
- priceCurrency (선택, 기본값 KRW)

### Task 2: DetectedItemCard 확장

**파일**: `packages/web/lib/components/request/DetectedItemCard.tsx`

- `isExpanded` prop 추가 (선택 시 확장)
- 확장 시 SolutionInputForm 표시
- solution이 이미 있으면 요약 표시

### Task 3: Layout 컴포넌트 연동

**파일**:
- `MobileDetectionLayout.tsx`
- `DesktopDetectionLayout.tsx`

- setSpotSolution 액션 연결
- 확장/축소 상태 관리

## Success Criteria

- [ ] 카드 선택 시 solution 입력 폼 표시
- [ ] solution 저장 시 store 업데이트
- [ ] 저장된 solution 요약 표시
- [ ] 타입 안전성 유지
