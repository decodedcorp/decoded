# Quick Task 009: COMPLETE

## Summary

Request 데스크톱 모달에서 이미지가 화면에 충분히 크게 표시되도록 수정했습니다.

## Changes

| File | Change |
|------|--------|
| `RequestFlowModal.tsx` | Modal width: `max-w-xl` → `max-w-4xl` (576px → 896px) |
| `ImagePreviewGrid.tsx` | Grid columns: 5 → 4 max, gap 증가 |
| `detect/page.tsx` | Image max width: 280px → 400px |

## Commit

- **Hash:** 04b5c4f
- **Message:** fix(request): expand modal size and image display area

## Result

- Upload 모달: 이미지 프리뷰가 더 크게 표시됨
- Detect 모달: 이미지 영역이 400px까지 확대되어 spot 확인 용이
