# Quick Task 009: Request 데스크톱 모달에서 이미지가 화면에 꽉차지 않음

## 문제 분석

현재 request 데스크톱 모달 (upload/detect)에서 이미지가 너무 작게 표시됨:

1. **RequestFlowModal**: `max-w-xl` (576px) 너비 제한
2. **ImagePreviewGrid**: 576px 안에 5개 컬럼 그리드 → 아이템당 ~100px
3. **DetectionView**: `max-w-[280px]` 제한으로 detect 화면에서도 이미지가 작음

## 수정 계획

### Task 1: RequestFlowModal 크기 확대

**파일:** `packages/web/lib/components/request/RequestFlowModal.tsx`

변경:
- `max-w-xl` → `max-w-4xl` (896px)
- 모달 크기 확대로 이미지가 더 크게 표시됨

### Task 2: ImagePreviewGrid 컬럼 수 조정

**파일:** `packages/web/lib/components/request/ImagePreviewGrid.tsx`

변경:
- `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` → `grid-cols-2 sm:grid-cols-2 md:grid-cols-3`
- 모달 내 맥락에 맞게 컬럼 수 축소하여 아이템 크기 확대

### Task 3: Detect 모달 이미지 크기 확대

**파일:** `packages/web/app/@modal/(.)request/detect/page.tsx`

변경:
- `max-w-[280px]` → `max-w-[400px]`
- 이미지 영역이 더 크게 표시됨

## 예상 결과

- Upload 모달: 이미지 프리뷰가 2-3열로 더 크게 표시
- Detect 모달: 이미지가 400px까지 확대되어 spot 확인 용이
