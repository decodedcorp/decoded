---
phase: quick
plan: 002
subsystem: post-creation
tags: [post-creation, ai-metadata, description, optional-fields]
requires: []
provides:
  - description-field
  - ai-metadata-extraction
  - media-metadata-structured-data
affects: []
tech-stack:
  added: []
  patterns:
    - debounced-input
    - ai-extraction
    - optional-field-pattern
key-files:
  created:
    - packages/web/lib/components/request/DescriptionInput.tsx
    - packages/web/app/api/v1/posts/extract-metadata/route.ts
  modified:
    - packages/web/lib/api/types.ts
    - packages/web/lib/stores/requestStore.ts
    - packages/web/lib/components/request/DetailsStep.tsx
    - packages/web/lib/hooks/useCreatePost.ts
    - packages/web/lib/api/posts.ts
    - packages/web/lib/api/index.ts
decisions:
  - title: "Description Field Optional"
    rationale: "Description is optional to not block post creation, but provides value via AI metadata extraction"
    date: 2026-02-05
  - title: "Debounced AI Extraction"
    rationale: "500ms debounce reduces API calls while providing responsive UX"
    date: 2026-02-05
  - title: "Auto-fill Media Source Title"
    rationale: "If AI extracts title and media source is empty, auto-fill to reduce user effort"
    date: 2026-02-05
metrics:
  tasks: 3
  completed: 2026-02-05
---

# Quick Task 002: Post Optional Fields & Media Metadata

**One-liner:** Add optional description field to post creation with AI-powered metadata extraction (platform, season, episode) displayed as structured tags

## Overview

Added an optional description field to the post creation flow (Step 3: Details) that allows users to provide context about the image source (e.g., "Netflix drama OOO season 2 episode 3..."). When a description is entered, AI automatically extracts structured metadata (title, platform, season, episode) and displays it as chips. This metadata is sent to the backend as `media_metadata` array for enhanced post searchability and filtering.

## Tasks Completed

### Task 1: Add description and media_metadata types + store state
**Commit:** `a8a1afa`

- Added `MediaMetadataItem` interface for key-value metadata pairs
- Added `ExtractMetadataRequest` and `ExtractMetadataResponse` types
- Updated `CreatePostRequest` to include optional `description` and `media_metadata` fields
- Added store state: `description`, `extractedMetadata`, `isExtractingMetadata`
- Added store actions: `setDescription`, `setExtractedMetadata`, `setIsExtractingMetadata`
- Added selectors: `selectDescription`, `selectExtractedMetadata`, `selectIsExtractingMetadata`
- Reset new fields in `resetRequestFlow`

**Files Modified:**
- `packages/web/lib/api/types.ts` - Type definitions
- `packages/web/lib/stores/requestStore.ts` - Store state and actions

### Task 2: Create DescriptionInput component and AI extraction endpoint
**Commit:** `ba842fa`

- Created `/api/v1/posts/extract-metadata` API route that proxies to backend
- Added `extractMetadata` function to `posts.ts` using `apiClient`
- Created `DescriptionInput` component with:
  - Textarea with 500 character limit
  - Debounced input (500ms) to reduce API calls
  - Auto-trigger AI extraction on blur or debounced change (min 10 chars)
  - Loading spinner during extraction
  - Display extracted metadata as chips below textarea
  - Auto-fill media source title if extracted and not already set
- Exported `extractMetadata` from `api/index.ts`
- Styling consistent with `MediaSourceInput` component

**Files Created:**
- `packages/web/app/api/v1/posts/extract-metadata/route.ts` - API proxy
- `packages/web/lib/components/request/DescriptionInput.tsx` - Component

**Files Modified:**
- `packages/web/lib/api/posts.ts` - Added extractMetadata function
- `packages/web/lib/api/index.ts` - Export new function

### Task 3: Integrate DescriptionInput into DetailsStep and update useCreatePost
**Commit:** `e66645a`

- Added `DescriptionInput` to `DetailsStep` before Media Source section
- Placed description first to allow AI to auto-fill media source title
- Updated `useCreatePost` to read `description` and `extractedMetadata` from store
- Added `description` and `media_metadata` to `CreatePostRequest` payload
- Conditionally include fields only when present (description) or non-empty (media_metadata)

**Files Modified:**
- `packages/web/lib/components/request/DetailsStep.tsx` - UI integration
- `packages/web/lib/hooks/useCreatePost.ts` - API payload construction

## Implementation Details

### Description Input Component
```tsx
// Location: packages/web/lib/components/request/DescriptionInput.tsx

- Textarea with 500 char max, 10 char min for extraction
- Debounce: 500ms on change, immediate on blur
- AI extraction auto-triggers when length >= 10
- Loading state with spinner icon
- Extracted metadata displayed as chips (key: value)
- Auto-fills media source title if empty
```

### API Endpoint
```typescript
// Location: packages/web/app/api/v1/posts/extract-metadata/route.ts

POST /api/v1/posts/extract-metadata
Request: { description: string }
Response: { title?: string, media_metadata: MediaMetadataItem[] }
- Proxies to backend API
- No auth required (similar to analyze endpoint)
```

### Store State
```typescript
// New fields in requestStore
description: string;                    // User input
extractedMetadata: MediaMetadataItem[]; // AI results
isExtractingMetadata: boolean;          // Loading state
```

### CreatePostRequest Payload
```typescript
{
  // ... existing fields
  description?: string;                 // Optional
  media_metadata?: MediaMetadataItem[]; // Optional
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Testing Verification

1. **Type check:** `yarn tsc --noEmit` - passed ✓
2. **Lint:** `yarn lint` - passed ✓
3. **Manual test flow:**
   - Navigate to /request (post creation flow)
   - Reach Step 3 (Details)
   - See Description textarea before Media Source
   - Enter description: "넷플릭스 드라마 더글로리 시즌1 2화"
   - Wait for AI extraction (loading spinner appears)
   - Extracted metadata displays as chips (platform: Netflix, season: 1, episode: 2)
   - Media Source title auto-fills with "더글로리"
   - Submit post - verify request payload includes description and media_metadata

## Next Phase Readiness

**Blockers:** None

**Ready for:**
- Backend integration when `/api/v1/posts/extract-metadata` endpoint is implemented
- User testing to validate AI extraction accuracy
- Future enhancements: edit metadata chips, add custom metadata

**Notes:**
- Backend endpoint must return `{ title?: string, media_metadata: MediaMetadataItem[] }`
- Metadata keys should be consistent (e.g., "platform", "season", "episode")
- Consider adding metadata validation/sanitization on backend

## Decision Log

### 1. Description Field Optional
**Context:** User may not always have detailed description
**Decision:** Made description optional to not block post creation
**Rationale:** Extraction provides value when available, but shouldn't be required
**Impact:** Flexible UX, backend must handle missing description gracefully

### 2. Debounced AI Extraction (500ms)
**Context:** Need to balance responsiveness with API call frequency
**Decision:** 500ms debounce on input change, immediate on blur
**Rationale:** Reduces API calls while typing, provides responsive feedback
**Impact:** Better performance, lower backend load

### 3. Auto-fill Media Source Title
**Context:** AI may extract title from description
**Decision:** Auto-fill media source title if extracted and field is empty
**Rationale:** Reduces user effort, maintains user control (only fills if empty)
**Impact:** Improved UX, faster post creation flow

### 4. Metadata Display as Read-only Chips
**Context:** Extracted metadata shown to user
**Decision:** Display as read-only chips below textarea
**Rationale:** Simple display, no editing complexity in v1
**Impact:** Clean UI, future enhancement: allow editing chips

## Lessons Learned

1. **Debounced Input Pattern:** Combining debounced onChange with immediate onBlur provides best UX
2. **Optional Field Design:** Clear "(Optional)" badge communicates expectations
3. **Loading States:** Inline spinner in label maintains clean layout
4. **Auto-fill Strategy:** Only auto-fill empty fields to respect user input

## Files Changed

### Created (2 files)
1. `packages/web/lib/components/request/DescriptionInput.tsx` - Description input with AI extraction
2. `packages/web/app/api/v1/posts/extract-metadata/route.ts` - API proxy endpoint

### Modified (6 files)
1. `packages/web/lib/api/types.ts` - Added metadata types
2. `packages/web/lib/stores/requestStore.ts` - Added description state
3. `packages/web/lib/components/request/DetailsStep.tsx` - Integrated component
4. `packages/web/lib/hooks/useCreatePost.ts` - Updated payload
5. `packages/web/lib/api/posts.ts` - Added extractMetadata function
6. `packages/web/lib/api/index.ts` - Exported new types/functions

## Commits

```
e66645a feat(quick-002): Task 3 - integrate DescriptionInput into DetailsStep and update useCreatePost
ba842fa feat(quick-002): Task 2 - create DescriptionInput component and AI extraction endpoint
a8a1afa feat(quick-002): Task 1 - add description and media_metadata types + store state
```

---

*Completed: 2026-02-05*
