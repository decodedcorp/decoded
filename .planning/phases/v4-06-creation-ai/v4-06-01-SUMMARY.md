---
phase: v4-06-creation-ai
plan: 01
subsystem: ui
tags: [request-flow, image-upload, ai-detect, spots, requestStore, compression, nextjs]

# Dependency graph
requires:
  - phase: v4-03-flow-documents
    provides: FLW-03-creation.md flow diagram + requestStore step transition context
  - phase: v4-02-shared-foundation
    provides: store-map.md requestStore field definitions
provides:
  - "SCR-CREA-01: Upload screen spec (/request/upload) — DropZone, spot tap, submit flow"
  - "SCR-CREA-02: AI Detect screen spec (/request/detect) — detection states, AnalyzeResponse"
  - "SCR-CREA-03: Spot edit + solution + submit — SolutionInputForm, createPostWithFile, NOT-IMPL inventory"
affects:
  - v4-07-user-system
  - v4-08-next-version-draft
  - v4-09-cleanup

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Creation flow is a single combined page (upload + spot + submit) — /request/detect is alternative unused"
    - "RequestStep = 1|2|3 numeric union (not string enum); isSubmitting is local useState not in store"
    - "Coordinates: API returns 0-100 percentages; store uses 0-1 normalized; API payload uses XX.X% strings"
    - "Compression: >2MB files compressed, ≤2MB skipped silently; fallback to original on compress failure"

key-files:
  created:
    - specs/screens/creation/SCR-CREA-01-upload.md
    - specs/screens/creation/SCR-CREA-02-ai-detect.md
    - specs/screens/creation/SCR-CREA-03-edit-solution.md
  modified: []

key-decisions:
  - "v4-06-01: /request/upload is a COMBINED page (upload + spot tap + submit) — does NOT navigate to /request/detect"
  - "v4-06-01: /request/detect is a separate alternative path, not triggered from upload page in current code"
  - "v4-06-01: autoUpload=false and autoAnalyze=false on upload page — user manually taps spots on local preview"
  - "v4-06-01: media_source hardcoded to {type:'youtube',title:'User Upload'} — DetailsStep fields not collected"
  - "v4-06-01: isSubmitting is local useState in upload page component, NOT part of requestStore"
  - "v4-06-01: DetectionToolbar (Select/Draw/Zoom) is UI-ONLY — tool state not connected to any behavior"
  - "v4-06-01: COMPRESSION_CONFIG confirmed: maxSizeMB=2, maxWidthOrHeight=1920, initialQuality=0.85"
  - "v4-06-01: DetailsStep, SubmitStep, ArtistInput, ContextSelector, MediaSourceInput, RequestFlowModal all exist on filesystem but NOT rendered in current upload flow"

patterns-established:
  - "Detection state machine: idle → detecting → revealing → ready → error (from requestStore.startDetection)"
  - "Coordinate pipeline: tap → x=(clientX-rect.left)/rect.width → addSpot(0-1) → API payload XX.X% string"

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase v4-06 Plan 01: Creation-AI Screen Specs Summary

**Three Creation-AI screen specs covering upload/spot-tap/submit single-page flow, AI detect alternative route with AnalyzeResponse shape, and NOT-IMPL component inventory for the full request flow.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T14:22:02Z
- **Completed:** 2026-02-19T14:25:49Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- SCR-CREA-01 documents the upload page as a combined single-page flow (upload + spot tap + solution + submit) with UPLOAD_CONFIG and COMPRESSION_CONFIG values, requestStore Step 1 state, and EARS requirements
- SCR-CREA-02 documents the /request/detect alternative route with detection state machine (idle/detecting/revealing/ready/error), inline AnalyzeResponse JSON, and hologram scan overlay behavior
- SCR-CREA-03 documents spot creation interaction, SolutionInputForm fields (title/URL required; price optional), createPostWithFile submit flow, and full NOT-IMPL component inventory

## Task Commits

1. **Task 1: SCR-CREA-01 Upload Screen** — `a2598dd` (docs)
2. **Task 2: SCR-CREA-02 + SCR-CREA-03** — `b9428a3` (docs)

**Plan metadata:** (docs commit — see below)

## Files Created

- `specs/screens/creation/SCR-CREA-01-upload.md` (164 lines) — Upload page: DropZone, MobileUploadOptions, UPLOAD_CONFIG, COMPRESSION_CONFIG, requestStore Step 1, image + spot flow
- `specs/screens/creation/SCR-CREA-02-ai-detect.md` (170 lines) — AI Detect: detection states, AnalyzeResponse JSON, MobileDetectionLayout + DesktopDetectionLayout
- `specs/screens/creation/SCR-CREA-03-edit-solution.md` (140 lines) — SolutionInputForm fields, submit flow, NOT-IMPL component table

## Decisions Made

- `/request/upload` is a combined single-page flow — upload, spot placement, solution input, and post submission all happen without route navigation. `/request/detect` is a separate alternative path not currently triggered from the upload page.
- `autoUpload=false` and `autoAnalyze=false` on the upload page — image is added to store as local preview only; no server upload occurs until Post is tapped.
- `isSubmitting` is a local `useState` in the upload page component, not stored in requestStore. The plan notes in requestStore mention `isSubmitting` as Step 4 but the upload page uses local state.
- `media_source` is hardcoded to `{type: "youtube", title: "User Upload"}` in `createPostWithFile` — the DetailsStep/ArtistInput/ContextSelector/MediaSourceInput components exist on filesystem but are not rendered.
- DetectionToolbar (Select/Draw/Zoom pills) is UI-ONLY — tool selection is not connected to any behavior in the current implementation.

## Deviations from Plan

None — plan executed exactly as written. All pre-verified facts matched actual source code.

## Issues Encountered

None. All 29 `packages/web/` file paths verified against filesystem — zero mismatches.

## User Setup Required

None — documentation-only plan, no external service configuration required.

## Next Phase Readiness

- All three SCR-CREA-* specs complete with verified file paths
- requestStore state documented for steps 1, 2, and spot/solution
- NOT-IMPL component inventory ready for v4-08 next version drafting
- v4-07 (User System screens) can proceed: authStore verification still pending (noted in STATE.md)

---
*Phase: v4-06-creation-ai*
*Completed: 2026-02-19*
