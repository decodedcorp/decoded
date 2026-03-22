# Quick Task 008: Fix Request - Use API Instead of Supabase Storage

## Problem

Request flow에서 이미지 업로드 시 Supabase Storage 직접 사용으로 인한 에러:
```
StorageApiError: Bucket not found
```

현재 `useImageUpload.ts`가 `uploadToSupabaseStorage` 사용 중이나, `request-images` 버킷이 Supabase에 없음.

## Solution

이미 구현된 API (`/api/v1/posts/upload`)를 사용하도록 변경:
- `uploadToSupabaseStorage` → `uploadImage` (from `lib/api/posts.ts`)
- API는 백엔드로 프록시되어 서버에서 이미지 처리

## Tasks

### Task 1: Update useImageUpload.ts to use API

**File:** `packages/web/lib/hooks/useImageUpload.ts`

**Changes:**
1. Import `uploadImage` from `@/lib/api/posts` instead of `uploadToSupabaseStorage`
2. Replace `uploadToSupabaseStorage(compressedFile)` with `uploadImage({ file: compressedFile, onProgress })`
3. Update progress handling to use `onProgress` callback from API

**Before:**
```typescript
import { uploadToSupabaseStorage } from "@/lib/supabase/storage";
// ...
const publicUrl = await uploadToSupabaseStorage(compressedFile);
```

**After:**
```typescript
import { uploadImage } from "@/lib/api/posts";
// ...
const { image_url } = await uploadImage({
  file: compressedFile,
  onProgress: (p) => updateImageStatus(id, "uploading", p)
});
```

### Task 2: Verify API authentication handling

**Check:** `uploadImage` requires authentication (`getAuthToken`).
- If user is not logged in, show appropriate error message
- Error message "로그인이 필요합니다." is already handled in `uploadImage`

### Task 3: Test the flow

**Manual verification:**
1. Go to `/request` page
2. Select/drop an image
3. Verify upload succeeds (no "Bucket not found" error)
4. Verify AI detection is triggered after upload

## Files Changed

| File | Change |
|------|--------|
| `packages/web/lib/hooks/useImageUpload.ts` | Replace Supabase Storage with API |

## Dependencies

- `uploadImage` from `lib/api/posts.ts` (already implemented)
- Backend `/api/v1/posts/upload` endpoint (already exists)
- User authentication required for upload
