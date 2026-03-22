# SCR-CREA-TRY-01: Try Upload Screen

**ID:** SCR-CREA-TRY-01
**Route:** `/request/try?parent=:postId`
**Status:** Draft
**Flow:** FLW-08 — My Try

> See: [FLW-08](../../flows/FLW-08-my-try.md) | [SCR-CREA-01](./SCR-CREA-01-upload.md) | [SCR-VIEW-01](../detail/SCR-VIEW-01-detail.md)

---

## Purpose

User uploads a single photo of their own attempt (outfit, purchase, styling) linked to an original post. Intentionally minimal — one image, one comment, one tap to share.

---

## Component Map

| Component | Path | Role |
|-----------|------|------|
| TryUploadPage | `packages/web/app/request/try/page.tsx` | Page orchestrator (new) |
| TryHeader | `packages/web/lib/components/request/TryHeader.tsx` | Back + title + close (new) |
| OriginalPostPreview | `packages/web/lib/components/request/OriginalPostPreview.tsx` | Original post context card (new) |
| DropZone | `packages/web/lib/components/request/DropZone.tsx` | Image upload (reuse) |
| MobileUploadOptions | `packages/web/lib/components/request/MobileUploadOptions.tsx` | Camera/Gallery (reuse) |
| TryCommentInput | `packages/web/lib/components/request/TryCommentInput.tsx` | Single-line comment (new) |
| DS Button | `packages/web/lib/design-system/` | CTA button (reuse) |

---

## Layout — Mobile

**Pre-upload state:**
```
┌─────────────────────────────────┐
│ ←  나도 해봤어                [✕] │  TryHeader
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [thumb]  원본 포스트 제목     │ │  OriginalPostPreview
│ │          @artist · context  │ │  (compact card)
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [Camera]  [Gallery]             │  MobileUploadOptions (md:hidden)
│                                 │
│  ┌─────────────────────────┐   │
│  │  사진을 올려주세요        │   │  DropZone
│  │  착용샷, 구매 인증 등     │   │
│  └─────────────────────────┘   │
│                                 │
│  [ 한줄 코멘트 (선택) _______ ] │  TryCommentInput (100자)
│                                 │
│        [Try 공유하기]           │  disabled until image selected
└─────────────────────────────────┘
```

**Post-upload state:**
```
┌─────────────────────────────────┐
│ ←  나도 해봤어                [✕] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [thumb]  원본 포스트 제목     │ │  OriginalPostPreview
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│  ┌───────────────────────┐     │
│  │                       │     │
│  │   [uploaded image]    │     │  Image preview
│  │                       │     │  (tap to replace)
│  └───────────────────────┘     │
│  [🔄 다시 선택]                 │  Replace button
│                                 │
│  [ 잘 어울리네요! ____________ ] │  TryCommentInput (filled)
│                                 │
│        [Try 공유하기]           │  enabled, primary color
└─────────────────────────────────┘
```

---

## Layout — Desktop (>=768px)

- `max-w-lg mx-auto` centered layout (not full-width)
- MobileUploadOptions hidden
- DropZone supports drag-and-drop
- Same vertical stack, no side panel needed (simple form)

---

## Data Loading

### On Mount

- When the screen mounts, the system shall extract `parent` from URL search params.
- When `parent` is present, the system shall fetch `GET /api/v1/posts/:parent` for OriginalPostPreview.
- When `parent` is missing or invalid, the system shall redirect to `/` with error toast.
- When the user is not authenticated, the system shall redirect to `/login?redirect=/request/try?parent=:postId`.

### OriginalPostPreview Data

| Field | Source | Display |
|-------|--------|---------|
| image_url | `post.image_url` | 48x48 rounded thumbnail |
| media_title | `post.media_title` | Title text |
| artist_name | `post.artist_name` | Subtitle line |
| context | `post.context` | Subtitle badge |

---

## State Management

**Option A — Extend requestStore** (recommended):

| Field | Type | Notes |
|-------|------|-------|
| `parentPostId` | `string \| null` | Original post reference |
| `postType` | `'original' \| 'try'` | Defaults to 'original' |
| `tryComment` | `string` | Max 100 chars |

Reuse existing `images`, `addImage`, `clearImages`, `resetRequestFlow`.

**Option B — New tryStore** (if requestStore becomes too complex):

| Field | Type | Notes |
|-------|------|-------|
| `parentPostId` | `string` | Required |
| `image` | `File \| null` | Single image |
| `previewUrl` | `string \| null` | Object URL |
| `comment` | `string` | Max 100 chars |
| `isSubmitting` | `boolean` | Submit state |

---

## Requirements

| # | Requirement (EARS) | Status |
|---|--------------------|--------|
| R1 | When the screen mounts with valid `parent` param, the system shall fetch and display the original post preview | Draft |
| R2 | When user selects an image, the system shall validate (JPG/PNG/WebP, ≤10MB), compress if needed, and show preview | Draft |
| R3 | When user taps the uploaded image or "다시 선택", the system shall allow replacing the image | Draft |
| R4 | When user types a comment, the system shall enforce 100-character limit with counter | Draft |
| R5 | When user taps "Try 공유하기" with an image, the system shall POST to `/api/v1/posts` with `parent_post_id` and `post_type: 'try'` | Draft |
| R6 | When the POST succeeds, the system shall navigate to `/posts/:parentId`, show success toast, and reset state | Draft |
| R7 | When the POST fails, the system shall show error toast and preserve image + comment state | Draft |
| R8 | When user taps close (✕), the system shall confirm if image is selected, then reset and navigate to `/posts/:parentId` | Draft |
| R9 | When user is not authenticated, the system shall redirect to login with return URL preserved | Draft |

---

## Submit Payload

```typescript
// POST /api/v1/posts (FormData)
const formData = new FormData();
formData.append('file', compressedImage);
formData.append('parent_post_id', parentPostId);
formData.append('post_type', 'try');
formData.append('media_type', 'try');
formData.append('media_title', comment || '');  // 한줄 코멘트
```

---

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| Entry | "나도 해봤어" button from SCR-VIEW-01 | `?parent=postId` |
| Submit success | `/posts/:parentId` | - (refetch tries) |
| Close (✕) | `/posts/:parentId` or back | - |
| Not authenticated | `/login?redirect=...` | return URL |

---

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading parent | Fetching original post | Skeleton card (48px thumb + 2 text lines) |
| Invalid parent | Post not found / param missing | Toast "포스트를 찾을 수 없습니다" + redirect to `/` |
| Upload error | File too large / wrong format | Toast with specific message |
| Submit error | API failure | Toast "업로드에 실패했습니다. 다시 시도해주세요" + retain state |
| Submitting | POST in progress | Button shows spinner, inputs disabled |

---

## Animations

| Trigger | Type | Library |
|---------|------|---------|
| Screen enter | Slide up from bottom | Motion (duration: 0.3s) |
| Image preview appear | Scale in | Motion (duration: 0.2s) |
| Submit success | Confetti / checkmark | Motion (duration: 0.5s) |

---

## Differences from SCR-CREA-01

| Aspect | SCR-CREA-01 (Upload) | SCR-CREA-TRY-01 (Try) |
|--------|---------------------|----------------------|
| Steps | 3 steps (Upload → Detect → Details) | 1 step (Image + Comment) |
| AI Detection | Required (spots mandatory) | None |
| Spots/Solutions | Manual placement + form | None (Phase 2) |
| Metadata | media_type, source, artist, group | comment only |
| Context | Standalone creation | Linked to parent post |
| CTA text | "Post" | "Try 공유하기" |
