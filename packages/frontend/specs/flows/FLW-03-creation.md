# FLW-03: Content Creation Flow

> Journey: Upload → AI Detect → Spot Edit → Solution Input → Submit | Updated: 2026-02-19
> Cross-ref: [FLW-02 Detail](FLW-02-detail.md) (entry context), [FLW-04 User](FLW-04-user.md) (auth gate)

## Journey

Authenticated user uploads an image, triggers AI analysis to detect fashion items, reviews and adjusts hotspots, adds product solution links, then submits the completed post. Auth required for upload and submission — guests are redirected to FLW-04 login.

## Flow Diagram

```mermaid
flowchart TD
    A[Upload `/request/upload`] -->|Image selected| B{Auth check}
    B -->|Guest| G[Login `/login` → FLW-04]
    B -->|Authenticated| C[POST /api/v1/posts/upload]
    C -->|Upload complete| D[AI Detect `/request/detect`]
    D -->|Auto-trigger| E[POST /api/v1/posts/analyze]
    E -->|Spots revealed| F[Spot Edit — within `/request/detect`]
    F -->|Spots confirmed| H[Solution Input — within `/request/detect`]
    H -->|Submit| I{Submit path}
    I -->|With solutions| J[POST /api/v1/posts/with-solution]
    I -->|Spots only| K[POST /api/v1/posts/[postId]/spots]
    J -->|Success| L[Home `/` or post detail]
    K -->|Success| L
```

## Transition Table

| From | Trigger | To | Store Changes | Data / API |
|------|---------|----|---------------|------------|
| Any screen | Upload CTA tap | Upload `/request/upload` | `requestStore` init (step 1) | — |
| Upload `/request/upload` | Image drop / select | Upload (processing) | `requestStore.addImage(file)` + `updateImageStatus('uploading')` | `POST /api/v1/posts/upload` |
| Upload `/request/upload` | Upload complete | AI Detect `/request/detect` | `requestStore.setImageUploadedUrl(url)` + step → 2 | — |
| AI Detect `/request/detect` | Page mount | AI Detect (detecting) | `requestStore.isDetecting = true` | `POST /api/v1/posts/analyze` with image_url |
| AI Detect | Analysis complete | AI Detect (spots revealed) | `requestStore.setDetectedSpots(spots)` + `isDetecting = false` + `isRevealing = true` (1.5s) | — |
| Spot Edit (within detect) | Add spot | Spot Edit | `requestStore.addSpot(position)` | — |
| Spot Edit | Remove spot | Spot Edit | `requestStore.removeSpot(spotId)` | — |
| Spot Edit | Select spot | Solution Input panel | `requestStore.selectedSpotId = spotId` | — |
| Solution Input (within detect) | Enter product URL | Solution Input | `requestStore.setSpotSolution(spotId, solution)` | `POST /api/v1/solutions/extract-metadata` (optional auto-fill) |
| Solution Input | Submit (with solutions) | Success → Home `/` | `requestStore.isSubmitting = true` → reset on success | `POST /api/v1/posts/with-solution` |
| Solution Input | Submit (spots only) | Success → Home `/` | `requestStore.isSubmitting = true` → reset on success | `POST /api/v1/posts/[postId]/spots` per spot |
| Any step | Cancel | Home `/` | `requestStore` reset | — |

## requestStore Step Flow

```
Step 1 — Upload
  images[].status: idle → uploading → uploaded
  canProceedToNextStep: images.some(img => img.status === 'uploaded')

Step 2 — AI Detection
  isDetecting: false → true → false
  isRevealing: false → true (1.5s) → false
  detectedSpots: [] → DetectedSpot[]
  canProceedToNextStep: detectedSpots.length > 0

Step 3 — Details
  artistName, groupName, context, description fields set
  mediaSource: { type, title } required
  canProceedToNextStep: mediaSource?.type && mediaSource?.title

Step 4 — Submit
  isSubmitting: false → true → false + resetRequestFlow()
```

See `specs/_shared/store-map.md` for full `requestStore` field definitions.

## API References

All endpoints documented in `specs/_shared/api-contracts.md`:

| Endpoint | When Called | Auth |
|----------|-------------|------|
| `POST /api/v1/posts/upload` | Step 1: image file upload | Required |
| `POST /api/v1/posts/analyze` | Step 2: AI item detection | Public |
| `POST /api/v1/solutions/extract-metadata` | Solution panel: auto-fill product info | Required |
| `POST /api/v1/posts/[postId]/spots` | Submit: create spots individually | Required |
| `POST /api/v1/spots/[spotId]/solutions` | Submit: attach solutions to spots | Required |
| `POST /api/v1/posts/with-solution` | Submit: combined post + spots + solutions | Required |

## Error Recovery

| Error Point | Recovery |
|-------------|----------|
| Upload failure (502/503/504) | Auto-retry with exponential backoff (max 2 retries) |
| AI analysis failure | Show manual spot placement option |
| Submit failure | Preserve draft state, show retry |
