# SCR-CREA-01: Upload Screen

**ID:** SCR-CREA-01
**Route:** `/request/upload` (redirected from `/request`)
**Status:** Implemented
**Flow:** FLW-03 — Creation

> See: [FLW-03](../../flows/FLW-03-creation.md) | [SCR-CREA-02](./SCR-CREA-02-ai-detect.md) | [store-map](../../_shared/store-map.md#requestStore)

---

## Purpose

Single-page creation flow: user selects an image, taps numbered spots onto the preview, optionally adds product solution info per spot, then submits the post — all without leaving this page. `/request/detect` is a separate alternative flow not triggered here.

---

## Component Map

| Component | Path | Role |
|-----------|------|------|
| RequestUploadPage | `packages/web/app/request/upload/page.tsx` | Page orchestrator |
| RequestFlowHeader | `packages/web/lib/components/request/RequestFlowHeader.tsx` | Header + DS StepIndicator + close |
| StepProgress | `packages/web/lib/components/request/StepProgress.tsx` | Steps: Upload / Detect / Details+Submit |
| DropZone | `packages/web/lib/components/request/DropZone.tsx` | Drag-drop + click + clipboard paste |
| MobileUploadOptions | `packages/web/lib/components/request/MobileUploadOptions.tsx` | Camera/Gallery buttons (mobile only) |
| DetectionView | `packages/web/lib/components/request/DetectionView.tsx` | Image + Hotspot markers + tap handler |
| SolutionInputForm | `packages/web/lib/components/request/SolutionInputForm.tsx` | Inline product info form per spot |
| DS Hotspot | `packages/web/lib/design-system/hotspot.tsx` | Numbered spot markers on image |
| DS StepIndicator | `packages/web/lib/design-system/step-indicator.tsx` | Progress dots in header |

---

## Layout — Mobile

**Pre-upload state:**
```
┌─────────────────────────────────┐
│ ← Upload Images  [● ○ ○]  [✕] │  RequestFlowHeader
├─────────────────────────────────┤
│ [1] ──── [2] ──── [3]          │  StepProgress (step 1 active)
├─────────────────────────────────┤
│ [Camera]  [Gallery]  [URL]      │  MobileUploadOptions (md:hidden)
│                                 │
│  ┌─────────────────────────┐   │
│  │  Drag & drop or click   │   │  DropZone
│  │  JPG / PNG / WebP       │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

**Post-upload state:**
```
┌─────────────────────────────────┐
│ ← Upload Images  [● ○ ○]  [✕] │
├─────────────────────────────────┤
│ [1] ──── [2] ──── [3]          │
├─────────────────────────────────┤
│  ┌───────────────────────┐     │  DetectionView
│  │  [image with spots]   │     │  (cursor: crosshair)
│  │    ①    ②            │     │  Hotspot markers
│  └───────────────────────┘     │
│  Spots (2)  • Tap to add info  │
│  ┌───────────────────────────┐ │  Spot card list
│  │ ① Spot 1  [ℹ️] [🗑]      │ │
│  │   [SolutionInputForm]     │ │  (expanded when selected)
│  └───────────────────────────┘ │
│              [Post →]          │  disabled until spots > 0
└─────────────────────────────────┘
```

---

## Layout — Desktop (delta from mobile)

- MobileUploadOptions not rendered (`md:hidden`)
- Post-upload: `md:flex-row` — DetectionView left, spot list `w-80` right (sticky scroll)
- DropZone fills remaining height (`flex-1`)

---

## requestStore State (Step 1)

`RequestStep = 1 | 2 | 3` — numeric union type, NOT string enum.

| Field | Type | Access | Notes |
|-------|------|--------|-------|
| `images` | `UploadedImage[]` | write | addImage / addImages / removeImage |
| `currentStep` | `1\|2\|3` | read | Stays at 1; StepProgress receives hardcoded `1` |
| `detectedSpots` | `DetectedSpot[]` | write | addSpot / removeSpot — tap-created spots |
| `selectedSpotId` | `string\|null` | write | selectSpot — drives inline form open/close |

`UploadStatus = "pending" | "uploading" | "uploaded" | "error"`

`isSubmitting` is a local `useState` in the page component — NOT stored in requestStore.

---

## Configs

**UPLOAD_CONFIG** (`packages/web/lib/utils/validation.ts`):
- `maxFileSize`: 10MB
- `maxImages`: 1
- `supportedFormats`: image/jpeg, image/png, image/webp

**COMPRESSION_CONFIG** (`packages/web/lib/utils/imageCompression.ts`):
- `maxSizeMB`: 2 — files >2MB are compressed
- `maxWidthOrHeight`: 1920 — images >1920px are resized
- `initialQuality`: 0.85
- `useWebWorker`: true

---

## Image Upload Flow

> Note: `autoUpload: false` and `autoAnalyze: false` on this page — upload and AI analysis do NOT run automatically.

1. File selected (DropZone drop/click, MobileUploadOptions Gallery, clipboard paste Ctrl+V)
2. `validateImageFile(file)` — format check (jpeg/png/webp) + size check (≤10MB)
3. `addImages([file])` → store adds UploadedImage with `previewUrl` via `URL.createObjectURL`
4. DetectionView renders with `previewUrl` used as `uploadedUrl` (local preview, no server upload yet)
5. User taps image → `addSpot(x, y)` at normalized coords
6. User taps spot card → `selectSpot(spotId)` → SolutionInputForm appears inline
7. User taps Post → `handleNext()` triggers submit flow (see SCR-CREA-03)

---

## Error Cases

| Trigger | UI Response |
|---------|-------------|
| File >10MB | `toast.error` (Korean message) |
| Unsupported format | `toast.error` "JPG, PNG, WebP만 지원합니다." |
| Max images reached (>1) | `addImage` returns null silently; DropZone disabled |
| Post API failure | `toast.error` with error message; isSubmitting resets |
| Compression failure | Silently falls back to original file (`console.warn`) |

---

## Requirements

| # | Requirement (EARS) | Status |
|---|--------------------|--------|
| R1 | When user drops or selects a file, the system shall validate format (JPG/PNG/WebP) and size (≤10MB) before adding | ✅ |
| R2 | When image is selected, the system shall show DetectionView with crosshair cursor for spot placement | ✅ |
| R3 | When user taps on image, the system shall create a spot at normalized coordinates (0–1) via addSpot | ✅ |
| R4 | When user taps a spot card, the system shall expand SolutionInputForm inline and highlight the spot marker | ✅ |
| R5 | When user saves solution, the system shall call setSpotSolution and deselect the spot | ✅ |
| R6 | When user taps Post, the system shall compress image → build spots payload → createPostWithFile → redirect to /posts/[id] | ✅ |
| R7 | When post succeeds, the system shall call resetRequestFlow (revokes preview URLs + resets state) | ✅ |
| R8 | When user taps close (✕), the system shall call resetRequestFlow and navigate to / | ✅ |

---

## Navigation

| Trigger | Destination |
|---------|-------------|
| Entry | Any CTA button, `/request` redirect, or direct URL |
| Post success | `/posts/[id]` |
| Close (✕) | `/` (home) |

> See: [SCR-CREA-02](./SCR-CREA-02-ai-detect.md) — AI Detect alternative flow (`/request/detect`)
> See: [SCR-CREA-03](./SCR-CREA-03-edit-solution.md) — Spot editing + submit flow details
