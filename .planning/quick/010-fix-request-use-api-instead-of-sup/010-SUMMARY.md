# Quick Task 008 Summary: Fix Request - Use API Instead of Supabase Storage

## Completed: 2026-02-05
## Commit: 1b23b3c

## Problem

Request flow에서 이미지 업로드 시 Supabase Storage 직접 사용으로 인한 에러:
```
StorageApiError: Bucket not found
```

`useImageUpload.ts`가 `uploadToSupabaseStorage` 함수를 사용하여 `request-images` 버킷에 직접 업로드하려 했으나, 해당 버킷이 Supabase에 존재하지 않음.

## Solution

이미 구현된 API (`/api/v1/posts/upload`)를 사용하도록 변경:
- `uploadToSupabaseStorage` (Supabase 직접) → `uploadImage` (API 통해)
- API는 Next.js proxy를 통해 백엔드로 전달되어 서버에서 이미지 처리

## Changes Made

| File | Change |
|------|--------|
| `packages/web/lib/hooks/useImageUpload.ts` | Supabase Storage → API 업로드로 변경 |

### Code Changes

```typescript
// Before
import { uploadToSupabaseStorage } from "@/lib/supabase/storage";
// ...
const publicUrl = await uploadToSupabaseStorage(compressedFile);

// After
import { uploadImage } from "@/lib/api/posts";
// ...
const { image_url } = await uploadImage({
  file: compressedFile,
  onProgress: (progress) => updateImageStatus(id, "uploading", progress),
});
```

## Notes

- `uploadImage` 함수는 인증을 요구함 (로그인 필요)
- 비로그인 상태에서 업로드 시도 시 "로그인이 필요합니다" 에러 메시지 표시
- Progress 콜백이 10% → 70% → 100%로 시뮬레이션됨 (실제 XMLHttpRequest 사용 시 정확한 progress 가능)

## Testing

1. `/request` 페이지 접속
2. 이미지 선택/드래그앤드롭
3. "Bucket not found" 에러 없이 업로드 성공 확인
4. AI detection 자동 시작 확인
