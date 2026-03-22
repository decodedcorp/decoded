# SCR-CREA-03: Spot Edit + Solution + Submit

**ID:** SCR-CREA-03
**Route:** (embedded within `/request/upload` and `/request/detect` — no separate route)
**Status:** Implemented
**Flow:** FLW-03 — Creation

> See: [FLW-03](../../flows/FLW-03-creation.md) | [SCR-CREA-01](./SCR-CREA-01-upload.md) | [SCR-CREA-02](./SCR-CREA-02-ai-detect.md) | [store-map](../../_shared/store-map.md#requestStore)

---

## Purpose

Documents the spot creation interaction, per-spot solution form, and post submit flow that are embedded within SCR-CREA-01 (upload page). Also documents the NOT-IMPL components that exist on filesystem but are not rendered in the current flow.

---

## Component Map

| Component | Path | Role |
|-----------|------|------|
| SolutionInputForm | `packages/web/lib/components/request/SolutionInputForm.tsx` | title / URL / price input per spot |
| DetectedItemCard | `packages/web/lib/components/request/DetectedItemCard.tsx` | Card wrapper with expand/collapse for form |
| SpotMarker | `packages/web/lib/components/request/SpotMarker.tsx` | Re-exports DS Hotspot (deprecated wrapper) |
| useSpotCardSync | `packages/web/lib/hooks/useSpotCardSync.ts` | Syncs Hotspot marker tap ↔ card scroll |
| DetectionView | `packages/web/lib/components/request/DetectionView.tsx` | Handles image click → normalized coords |

**NOT-IMPL (exist on filesystem, not rendered in current upload page flow):**

| Component | Path | Note |
|-----------|------|------|
| DetailsStep | `packages/web/lib/components/request/DetailsStep.tsx` | ⚠️ NOT rendered |
| SubmitStep | `packages/web/lib/components/request/SubmitStep.tsx` | ⚠️ NOT rendered |
| SubmitPreview | `packages/web/lib/components/request/SubmitPreview.tsx` | ⚠️ NOT rendered |
| ArtistInput | `packages/web/lib/components/request/ArtistInput.tsx` | ⚠️ NOT rendered |
| ContextSelector | `packages/web/lib/components/request/ContextSelector.tsx` | ⚠️ NOT rendered |
| MediaSourceInput | `packages/web/lib/components/request/MediaSourceInput.tsx` | ⚠️ NOT rendered |
| DescriptionInput | `packages/web/lib/components/request/DescriptionInput.tsx` | ⚠️ NOT rendered |
| RequestFlowModal | `packages/web/lib/components/request/RequestFlowModal.tsx` | ⚠️ NOT rendered |
| RequestModal | `packages/web/lib/components/request/RequestModal.tsx` | ⚠️ NOT rendered |

---

## Spot Creation Interaction

User taps on image inside DetectionView:

1. `DetectionView.handleImageClick(e)` fires on `onClick` of image container
2. Coordinates normalized: `x = (e.clientX - rect.left) / rect.width`, `y = (e.clientY - rect.top) / rect.height`, both clamped to 0–1
3. `requestStore.addSpot(x, y)` creates `DetectedSpot`:
   - `id`: `spot_${Date.now()}_${random}` (unique string)
   - `index`: `detectedSpots.length + 1` (auto-increment, 1-based)
   - `center`: `{ x, y }`
   - `categoryCode`: `"fashion"` (default)
   - `title`: `"Spot N"`
4. Store sets `selectedSpotId = newSpot.id` (auto-selects new spot)
5. Numbered Hotspot marker appears on image; spot card appears in list with SolutionInputForm open

**Spot removal:** `requestStore.removeSpot(spotId)` → filters spots array + re-indexes remaining spots (index 1, 2, 3...).

---

## SolutionInputForm Fields

| Field | Type | Required | Validation | UI Placeholder |
|-------|------|----------|------------|----------------|
| `title` | string | Yes | `title.trim()` non-empty | "Nike Air Force 1" |
| `originalUrl` | string (URL) | Yes | `originalUrl.trim()` non-empty | "https://..." |
| `priceAmount` | number | No | `parseInt(value, 10)` | "129000" |
| `priceCurrency` | string | No (default "KRW") | N/A | Read-only badge |

`isValid = title.trim() && originalUrl.trim()` — Save button disabled until both required fields filled.

On save: `onSave(spotId, SpotSolutionData)` → `requestStore.setSpotSolution(spotId, solution)` + `selectSpot(null)` (deselects).
On cancel: `requestStore.selectSpot(null)` (collapses form without saving).

---

## Submit Flow (from `/request/upload` handleNext)

`RequestStep = 1 | 2 | 3` — numeric union. Step 3 merges Details + Submit; `isSubmitting` is local `useState` in the page component (NOT stored in requestStore).

1. **Guard:** `canProceed = detectedSpots.length > 0 && !isSubmitting` — exits if false
2. **Guard:** `categoryCodeMap.size > 0` (categories loaded via `useCategoryCodeMap`) — exits with toast if empty
3. `compressImage(localImage.file)` — `toast.loading("이미지 준비 중...")`
   - File >2MB: compressed to ≤2MB at 1920px max, quality 0.85
   - File ≤2MB: returned as-is (`wasCompressed: false`)
   - Failure: silently returns original file
4. Map spots to API payload:
   ```
   detectedSpots.map(spot => ({
     position_left: `${(spot.center.x * 100).toFixed(1)}%`,
     position_top:  `${(spot.center.y * 100).toFixed(1)}%`,
     category_id:   categoryCodeMap.get(spot.categoryCode) ?? firstCategoryId
   }))
   ```
5. `createPostWithFile({ file, media_source: { type: "youtube", title: "User Upload" }, spots })` — `toast.loading("포스트 생성 중...")`
   - Sends FormData: `"image"` (File blob) + `"data"` (JSON string)
   - ⚠️ `media_source` is hardcoded — DetailsStep artist/context/media_source fields are NOT collected
6. **Success:** `toast.success("포스트가 생성되었습니다!")` → `resetRequestFlow()` → `router.push(/posts/[id])`
7. **Failure:** `toast.error(message)` (Korean) — state preserved for retry; `isSubmitting` resets to false

---

## Reset Behavior

| Trigger | Action |
|---------|--------|
| Close button (✕) | `resetRequestFlow()` + `router.push("/")` |
| Post success | `resetRequestFlow()` + `router.push(/posts/[id])` |

`resetRequestFlow()`: revokes all `previewUrl` via `URL.revokeObjectURL` + resets store to `initialState`.

---

## requestStore Fields (Spot/Solution)

| Field | Type | Access | Notes |
|-------|------|--------|-------|
| `detectedSpots[].solution` | `SpotSolutionData\|undefined` | write | setSpotSolution / clearSpotSolution |
| `selectedSpotId` | `string\|null` | write | selectSpot — null after save or cancel |
| `isSubmitting` | `boolean` | local state | `useState` in upload page, NOT in requestStore |
| `detectedSpots[].categoryCode` | `string` | read | Maps to UUID via useCategoryCodeMap in submit |

---

## Requirements

| # | Requirement (EARS) | Status |
|---|--------------------|--------|
| R1 | When user taps on image, the system shall create a spot at normalized coordinates (0–1) with auto-increment index | ✅ |
| R2 | When spot is created, the system shall auto-select it and show SolutionInputForm inline | ✅ |
| R3 | When user taps a spot card, the system shall highlight the corresponding Hotspot marker | ✅ |
| R4 | When user saves SolutionInputForm, the system shall store SpotSolutionData and deselect the spot | ✅ |
| R5 | When user taps Post, the system shall compress image, build spots payload with category UUIDs, and call createPostWithFile | ✅ |
| R6 | When post creation succeeds, the system shall reset store, revoke preview URLs, and navigate to /posts/[id] | ✅ |
| R7 | When post creation fails, the system shall show Korean error toast and preserve state for retry | ✅ |
| R8 | When user removes a spot, the system shall re-index remaining spots from 1 | ✅ |
| R9 | DetailsStep with artist/context/media_source collection is not used in current upload flow | ⚠️ NOT-IMPL |
| R10 | media_source is hardcoded to {type:"youtube", title:"User Upload"} in createPostWithFile call | ⚠️ NOTE |
