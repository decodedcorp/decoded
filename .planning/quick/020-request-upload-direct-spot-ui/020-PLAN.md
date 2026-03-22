---
phase: quick
plan: 020
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/request/upload/page.tsx
  - packages/web/lib/components/request/ImagePreviewGrid.tsx
autonomous: true

must_haves:
  truths:
    - "User can upload an image"
    - "After upload completes, user can directly tap on the image to add spots"
    - "User sees the spot markers on the image"
    - "No navigation to /request/detect page"
  artifacts:
    - path: "packages/web/app/request/upload/page.tsx"
      provides: "Unified upload + spot creation page"
    - path: "packages/web/lib/components/request/ImagePreviewGrid.tsx"
      provides: "Enhanced preview with spot creation capability"
  key_links:
    - from: "ImagePreviewGrid"
      to: "DetectionView/SpotMarker"
      via: "Direct integration when image is uploaded"
---

<objective>
Merge upload and spot creation into a single page flow

Purpose: Simplify request flow by removing separate /detect page - user can add spots directly after upload
Output: Updated upload page with integrated spot creation UI
</objective>

<context>
@.planning/STATE.md
@packages/web/app/request/upload/page.tsx
@packages/web/lib/components/request/DetectionView.tsx
@packages/web/lib/components/request/SpotMarker.tsx
@packages/web/lib/stores/requestStore.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update upload page with integrated spot creation</name>
  <files>packages/web/app/request/upload/page.tsx</files>
  <action>
Modify RequestUploadPage to:

1. Add import for DetectionView, SpotMarker related types
2. Add state selectors for spots:
   - selectDetectedSpots
   - selectSelectedSpotId
3. Add store actions:
   - addSpot
   - selectSpot
   - setSpotSolution

4. Change view logic:
   - BEFORE upload: Show DropZone (existing)
   - AFTER upload: Show DetectionView with spot creation enabled (instead of ImagePreviewGrid)

5. Replace handleNext navigation:
   - Currently: router.push("/request/detect")
   - Change to: router.push next step (e.g., "/request/details" or wherever post-spot flow goes)
   - Or if this is the final step before submit, adjust accordingly

6. Add spot creation UI:
   - When image is uploaded (status === "uploaded"), render DetectionView
   - Pass onImageClick handler to enable spot creation via addSpot(x, y)
   - Pass spots, selectedSpotId, onSpotClick handlers

7. Update "Next" button behavior:
   - canProceed should check if spots exist (detectedSpots.length > 0)
   - Button text can stay "Next" or change to "Continue"
  </action>
  <verify>
- `yarn dev` and navigate to /request/upload
- Upload an image
- After upload completes, the DetectionView should appear with crosshair cursor
- Tapping on the image should create a spot marker
- Spot markers should be visible and clickable
  </verify>
  <done>
- Upload page shows DetectionView with spot creation after image upload
- User can tap to add spots directly without navigating to /request/detect
- Spots are visible on the image
  </done>
</task>

<task type="auto">
  <name>Task 2: Add spot list panel with solution input</name>
  <files>packages/web/app/request/upload/page.tsx</files>
  <action>
Add a spots panel below the image (or side panel on desktop) that shows:

1. List of created spots with index numbers
2. Each spot shows:
   - Spot number/index
   - "Add info" or solution input trigger
   - Delete button (X) to remove spot

3. When a spot is selected:
   - Highlight in the list
   - Show SolutionInputForm (existing component) or inline input

4. Use existing components:
   - Import SolutionInputForm from "@/lib/components/request/SolutionInputForm"
   - Or use DetectedItemCard pattern for spot list display

5. Layout considerations:
   - Mobile: Vertical layout (image on top, spot list below)
   - Desktop: Can be side-by-side if desired

6. Wire up setSpotSolution for saving solution data to spots
  </action>
  <verify>
- Created spots appear in a list below the image
- Clicking a spot in the list selects it (marker highlights)
- Can add solution info to each spot
- Can delete spots from the list
  </verify>
  <done>
- Spot list panel shows all created spots
- Users can select, edit solution, or delete spots
- Solution data is saved to spot via setSpotSolution
  </done>
</task>

<task type="auto">
  <name>Task 3: Clean up detect page reference</name>
  <files>packages/web/app/request/upload/page.tsx</files>
  <action>
Finalize the flow:

1. Update the "Next" button:
   - Only enable when at least one spot exists
   - Navigate to the next logical step (e.g., details/submit)
   - Or if this becomes the final pre-submit step, adjust accordingly

2. Remove any remaining references to /request/detect navigation

3. Update step indicator:
   - If using 3-step flow: 1=Upload+Spot, 2=Details, 3=Submit
   - Adjust currentStep display if needed

4. Test the complete flow:
   - Upload image
   - Add spots
   - Click Next -> should proceed (not go to /detect)
  </action>
  <verify>
- No navigation to /request/detect
- "Next" button works correctly
- Flow proceeds to next step after spots are added
  </verify>
  <done>
- Upload page is the single entry point for both upload and spot creation
- Clean flow to next step without /detect intermediate page
  </done>
</task>

</tasks>

<verification>
1. `yarn dev` - starts without errors
2. Navigate to /request/upload
3. Upload an image - should show DetectionView with crosshair cursor
4. Tap on image - spot marker appears
5. Spot appears in list below
6. Can add multiple spots
7. Can select/delete spots
8. "Next" button enabled when spots exist
9. Clicking "Next" does NOT go to /request/detect
</verification>

<success_criteria>
- Upload and spot creation merged into single page
- User can add spots by tapping on uploaded image
- Spot list shows created spots with edit/delete capability
- No navigation to /request/detect page
- Flow proceeds correctly to next step
</success_criteria>

<output>
After completion, create `.planning/quick/020-request-upload-direct-spot-ui/020-SUMMARY.md`
</output>
