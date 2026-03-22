# SCR-CREA-02: AI Detect Screen

**ID:** SCR-CREA-02
**Route:** `/request/detect`
**Status:** Implemented
**Flow:** FLW-03 — Creation (alternative path — not triggered from SCR-CREA-01 upload page)

> See: [FLW-03](../../flows/FLW-03-creation.md) | [SCR-CREA-01](./SCR-CREA-01-upload.md) | [SCR-CREA-03](./SCR-CREA-03-edit-solution.md) | [store-map](../../_shared/store-map.md#requestStore)

---

## Purpose

Alternative creation path: displays the uploaded image, triggers AI spot detection, reveals detected spots with animation, then allows manual spot add/remove and solution input per spot. Differs from SCR-CREA-01 in that it reads from requestStore for an already-uploaded image (status="uploaded") and calls the analyze API.

---

## Component Map

| Component | Path | Role |
|-----------|------|------|
| RequestDetectPage | `packages/web/app/request/detect/page.tsx` | Page orchestrator |
| RequestFlowHeader | `packages/web/lib/components/request/RequestFlowHeader.tsx` | Header + back + close |
| StepProgress | `packages/web/lib/components/request/StepProgress.tsx` | step 2 active |
| DetectionToolbar | `packages/web/lib/components/request/DetectionToolbar.tsx` | Select/Draw/Zoom pills — ⚠️ UI-ONLY |
| MobileDetectionLayout | `packages/web/lib/components/request/MobileDetectionLayout.tsx` | Fullscreen image + DS BottomSheet |
| DesktopDetectionLayout | `packages/web/lib/components/request/DesktopDetectionLayout.tsx` | Side-by-side image + card panel |
| DetectionView | `packages/web/lib/components/request/DetectionView.tsx` | Image + Hotspot markers + hologram scan overlay |
| DetectedItemCard | `packages/web/lib/components/request/DetectedItemCard.tsx` | Compact card + expandable SolutionInputForm |
| SolutionInputForm | `packages/web/lib/components/request/SolutionInputForm.tsx` | Inline product info form |
| DS BottomSheet | `packages/web/lib/design-system/bottom-sheet.tsx` | Snap points [0.3, 0.6, 0.9] |
| DS Hotspot | `packages/web/lib/design-system/hotspot.tsx` | Numbered markers with glow + reveal animation |
| useSpotCardSync | `packages/web/lib/hooks/useSpotCardSync.ts` | Syncs Hotspot tap ↔ card scroll |

---

## Layout — Mobile

**Detecting state:**
```
┌─────────────────────────────────┐
│ ← Add Spots    [○ ● ○]   [✕]  │  RequestFlowHeader
├─────────────────────────────────┤
│ [1] ──── [2] ──── [3]          │  StepProgress (step 2 active)
│ [Select] [Draw] [Zoom]          │  DetectionToolbar (UI-only)
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐   │   │  Hologram scan overlay:
│  │ │  │ │  │ │  │ │  │   │   │  grid + scanline + corner markers
│  │ └──┘ └──┘ └──┘ └──┘   │   │
│  │  ── ANALYZING... ──     │   │
│  └─────────────────────────┘   │  BottomSheet (collapsed 30%)
│ ┌─────────────────────────────┐│
│ │ [skeleton] [skeleton]       ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Spots-revealed state:**
```
┌─────────────────────────────────┐
│ ← Add Spots    [○ ● ○]   [✕]  │
├─────────────────────────────────┤
│ [1] ──── [2] ──── [3]          │
│ [Select] [Draw] [Zoom]          │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │  Full image
│  │    image preview        │   │  Hotspot markers: ① ②
│  │  ①        ②            │   │  (glow + reveal animation)
│  └─────────────────────────┘   │
│ ┌─────────────────────────────┐│  BottomSheet (60%)
│ │ ① TOP      [→]             ││  DetectedItemCard list
│ │ ② JACKET   [→]             ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

## Layout — Desktop (delta from mobile)

- Left column: sticky DetectionView with Hotspot markers (no BottomSheet)
- Right column: scrollable DesktopDetectionLayout card panel with DetectedItemCard list
- During detection: right panel shows 3 skeleton placeholder cards

---

## AI Analysis API

**Endpoint:** `POST /api/v1/posts/analyze`

**Request:**
```json
{ "image_url": "https://cdn.example.com/image.jpg" }
```

**Response (AnalyzeResponse):**
```json
{
  "detected_items": [
    { "left": 45.5, "top": 30.2, "category": "fashion", "label": "top", "confidence": 0.92 },
    { "left": 62.1, "top": 55.8, "category": "fashion", "label": "jacket", "confidence": 0.87 }
  ],
  "metadata": { "artist_name": "IU", "context": "stage" }
}
```

**Coordinate conversion:** `left` and `top` are percentages (0–100). Converted to 0–1 normalized via `apiToStoreCoord(value) = value / 100` before storing in `DetectedSpot.center.{x,y}`.

**Label transform:** `item.label.toUpperCase()` → stored as `DetectedSpot.label` (e.g., "TOP", "JACKET").

> Types defined in: `packages/web/lib/api/types.ts` — `AnalyzeRequest`, `AnalyzeResponse`, `DetectedItem`, `AnalyzeMetadata`

---

## Detection State Machine

| State | requestStore Fields | UI |
|-------|--------------------|----|
| **idle** | `isDetecting=false`, `detectedSpots=[]` | Guard: redirects to `/request/upload` after 500ms if `images.length === 0` |
| **detecting** | `isDetecting=true` | Hologram scan overlay: grid lines + animated scanline + corner markers + "ANALYZING..." text |
| **revealing** | `isDetecting=false`, `isRevealing=true` | Reveal scanline animation (1.5s `setTimeout`); Hotspot markers appear with `revealDelay` staggered by `y` position |
| **ready** | `isRevealing=false` | Spots interactive: tap Hotspot to select, tap image to add new spot |
| **error** | `detectionError: string` | `toast.error(message)` + `detectionError` set; manual spot placement remains available |

State transitions are driven by `requestStore.startDetection()` which is called from within requestStore itself (not triggered by this detect page in current code — detect page receives spots already in store).

---

## requestStore Fields (Step 2)

`RequestStep = 1 | 2 | 3` — numeric union type, NOT string enum.

| Field | Type | Access | Notes |
|-------|------|--------|-------|
| `detectedSpots` | `DetectedSpot[]` | write | setDetectedSpots / addSpot / removeSpot |
| `isDetecting` | `boolean` | read | Controls hologram scan overlay |
| `isRevealing` | `boolean` | read | Controls 1.5s reveal scan animation |
| `selectedSpotId` | `string\|null` | write | selectSpot — drives card highlight + form |
| `aiMetadata` | `AiMetadata` | write | Set from `response.metadata` (artistName, context) |
| `detectionError` | `string\|null` | read | Error display + manual fallback |
| `currentStep` | `1\|2\|3` | write | Page sets step to 2 on mount via `setStep(2)` |

---

## Requirements

| # | Requirement (EARS) | Status |
|---|--------------------|--------|
| R1 | When detect page loads, the system shall call setStep(2) and check images array | ✅ |
| R2 | When images array is empty, the system shall redirect to /request/upload after 500ms | ✅ |
| R3 | When detection is in progress, the system shall show hologram scan overlay with animated scanline | ✅ |
| R4 | When detection completes, the system shall reveal spots with 1.5s scan animation staggered by y-position | ✅ |
| R5 | When user taps on image, the system shall create a new spot at normalized coordinates via addSpot | ✅ |
| R6 | When user selects a spot, the system shall sync highlight between Hotspot marker and DetectedItemCard via useSpotCardSync | ✅ |
| R7 | When user opens solution form, the system shall show SolutionInputForm with title, URL, and price fields | ✅ |
| R8 | When detection fails, the system shall set detectionError and display toast allowing manual spot placement | ✅ |
| R9 | When user taps close, the system shall call resetRequestFlow and navigate to / | ✅ |
| R10 | DetectionToolbar tool selection (Select/Draw/Zoom) does not affect any behavior | ⚠️ UI-ONLY |

---

## Error & Failure States

| Scenario | Behavior |
|----------|----------|
| AI analysis API failure | `detectionError` set + `toast.error` in Korean; spots=[] but user can add manually |
| No items detected | `detected_items: []` — spots=[] — user adds manually |
| Server timeout / 5xx | Korean error toast; no spots populated |
| No uploaded image on load | Loading spinner shown; redirect to /request/upload after 500ms |
