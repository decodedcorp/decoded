# [SCR-VTON-01] Try-on Studio
> Route: `/vton` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Architecture: NEXT-02 (VTON Technical Architecture — Phase 1 MVP)
> Flow: FLW-05 (VTON 5-stage cinematic sequence)

## Purpose

User virtually tries on a detected item from a post/magazine by providing their photo. The system sends both images to a VTON API and renders the fitted result — answering "Would this look good on me?" without leaving the app.

## Design Direction

- **Dual Viewport:** Split-screen comparing user's original photo (left/top) with AI-generated try-on result (right/bottom).
- **Drag & Match:** User drags an item card from the sidebar onto their photo to initiate try-on. GSAP Draggable with drop zone detection.
- **Cinematic Generation:** 5-stage sequence from FLW-05 (Pick & Drop -> Chic Blur -> Blueprint -> Magic Flip -> Morphing Loop) as the processing animation.
- **Credit-Heavy Gate:** VTON costs more credits than magazine generation. Clear cost display + confirmation step before API call.
- **Theme:** Deep Black (#050505) / Neon Chartreuse (#eafd67).

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Page | VtonPage (server) | `packages/web/app/vton/page.tsx` | async; auth-gated |
| Client wrapper | VtonStudio | `packages/web/lib/components/vton/VtonStudio.tsx` | "use client"; orchestrates dual viewport + generation |
| User photo | UserPhotoPanel | `packages/web/lib/components/vton/UserPhotoPanel.tsx` | Photo capture/upload, preview, crop |
| Item sidebar | ItemSidebar | `packages/web/lib/components/vton/ItemSidebar.tsx` | Draggable item cards from selected post/magazine |
| Draggable card | DraggableItemCard | `packages/web/lib/components/vton/DraggableItemCard.tsx` | GSAP Draggable; product thumbnail + name |
| Drop zone | PhotoDropZone | `packages/web/lib/components/vton/PhotoDropZone.tsx` | Visual feedback on drag-over (accent glow border) |
| Credit confirm | VtonCreditConfirm | `packages/web/lib/components/vton/VtonCreditConfirm.tsx` | Cost display + balance + confirm/cancel |
| Generation anim | VtonCinematicSequence | `packages/web/lib/components/vton/VtonCinematicSequence.tsx` | 5-stage GSAP animation from FLW-05 |
| Result viewer | VtonResultViewer | `packages/web/lib/components/vton/VtonResultViewer.tsx` | Before/after slider comparison |
| Comparison slider | BeforeAfterSlider | `packages/web/lib/components/vton/BeforeAfterSlider.tsx` | Draggable divider between original and result |
| Bottom nav | NavBar | DS: component-registry | mobile-only |

> All file paths are proposed (components not yet created). Verify against filesystem before implementation.

## Layout

### Mobile (default)

**State: Photo + Item Selection**
```
+-------------------------------+
| [< Back]  Try-on Studio  [?] |
+-------------------------------+
|                               |
| +---------------------------+ |
| |                           | |
| |  [User Photo]             | |  <- UserPhotoPanel
| |  or [Upload/Camera CTA]  | |     tap to select photo
| |                           | |
| +---------------------------+ |
|                               |
| Select an item to try on:    |
| [Item][Item][Item] ->        |  <- ItemSidebar horizontal scroll
|                               |
| Drag item onto your photo    |  <- Instruction text
|  or tap item + [Try On]      |     alternative tap flow for mobile
|                               |
+-------------------------------+
| [NavBar]                      |
+-------------------------------+
```

**State: Credit Confirmation**
```
+-------------------------------+
|                               |
| +---------------------------+ |
| |  Try on this item?        | |  <- VtonCreditConfirm modal overlay
| |                           | |
| |  [item thumbnail] [photo] | |
| |  Jacket — CELINE          | |
| |                           | |
| |  Cost: 2 credits          | |
| |  Balance: 5 credits       | |
| |                           | |
| |  [Cancel]  [=== Try On ==]| |
| +---------------------------+ |
|                               |
+-------------------------------+
```

**State: Generation (5-stage cinematic)**
```
+-------------------------------+
|                               |
|  Stage 1: Pick & Drop        |  <- Item card drops onto photo
|  Stage 2: Chic Blur          |  <- Photo blurs, item dissolves in
|  Stage 3: Blueprint          |  <- Wireframe overlay, body mapping
|  Stage 4: Magic Flip         |  <- Card flips to reveal processing
|  Stage 5: Morphing Loop      |  <- Result morphs into view
|                               |
|  "Creating your look..."     |  <- Variable weight text
|  [===== progress =====]      |  <- ProgressGlow (accent bar)
|                               |
+-------------------------------+
```

**State: Result**
```
+-------------------------------+
| [< Back]          [Share]     |
+-------------------------------+
|                               |
| +-------------+-------------+ |
| |  BEFORE     |<|>  AFTER   | |  <- BeforeAfterSlider
| |  [Original  | | [Try-on   | |     draggable divider
| |   Photo]    | |  Result]  | |
| |             | |           | |
| +-------------+-------------+ |
|                               |
| Jacket — CELINE — W2,850,000 |  <- Item info
|                               |
| [Try Another] [Shop Now] [Save]|
|                               |
+-------------------------------+
| [NavBar]                      |
+-------------------------------+
```

### Desktop (>=768px)

Side-by-side layout: UserPhotoPanel (left 50%) + ItemSidebar (right panel 300px). Result uses horizontal BeforeAfterSlider at full width. DesktopHeader visible; NavBar hidden.

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | Minimal back bar | DesktopHeader |
| Photo + items | Stacked vertical | Side-by-side (50% + 300px sidebar) |
| Item selection | Horizontal scroll + tap | Drag from sidebar onto photo |
| Drop zone | Full photo area | Photo panel with accent glow border |
| Result comparison | Vertical before/after | Horizontal before/after slider |
| Bottom nav | NavBar | Hidden |

## Requirements

### Auth & Entry

- When the page mounts, the system shall check `authStore.selectIsLoggedIn`. If not logged in, redirect to `/login` with return URL.
- When arriving from a post detail (SCR-VIEW-01), the system shall pre-populate `ItemSidebar` with that post's detected items from `spots[].solutions[]`.
- When arriving from a magazine (SCR-MAG-01/02), the system shall pre-populate with items from the magazine's `item-card` components.
- When arriving directly (no context), the system shall show an empty item sidebar with "Browse posts to find items" guidance.

### User Photo

- When the user taps the photo area, the system shall present options: Camera (if available), Gallery, or Recent Photos.
- When a photo is selected, the system shall compress it via `browser-image-compression` (max 1MB, 1024px longest edge) and display a preview.
- When the photo is loaded, the system shall enable the drop zone for drag interaction.
- The system shall NOT persist user photos beyond the session unless explicit opt-in (privacy: ephemeral by default per NEXT-02 Phase 1).

### Item Selection (Drag & Match)

- When on desktop, the system shall make `DraggableItemCard` elements draggable via GSAP Draggable with `type: "x,y"` and bounds to viewport.
- When a draggable card enters the `PhotoDropZone` area, the system shall show accent-color glow border and scale the drop zone slightly (1.02x).
- When the card is dropped on the zone, the system shall trigger the credit confirmation step.
- When on mobile (no drag), the system shall use tap-to-select: tap item card -> tap "Try On" button as alternative flow.

### Credit Gate

- When try-on is triggered, the system shall display `VtonCreditConfirm` overlay showing: item thumbnail, user photo thumbnail, credit cost (2), current balance.
- When `creditStore.balance < 2`, the system shall disable "Try On" and show credit top-up prompt.
- When the user confirms, the system shall call `POST /api/v1/vton/apply` with item image URL + user photo URL.
- When the API responds 202 (queued), the system shall deduct credits locally via `creditStore.deductLocally(2)` and start the cinematic sequence.
- When the API responds 402, the system shall show insufficient credits error without deduction.

### Cinematic Generation Sequence

- When generation starts, the system shall render `VtonCinematicSequence` as full-screen overlay with 5 GSAP-animated stages.
- Stage 1 (Pick & Drop): Item card animates from sidebar position to center of user photo (0.8s, ease "power2.out").
- Stage 2 (Chic Blur): User photo applies gaussian blur filter, item thumbnail dissolves into the blur (1.0s).
- Stage 3 (Blueprint): Wireframe overlay appears on photo area, accent-color body mapping lines animate in (1.2s, stagger).
- Stage 4 (Magic Flip): Central element flips on Y-axis revealing a "processing" state (0.6s, ease "back.inOut").
- Stage 5 (Morphing Loop): Result image morphs into view, blur clears, final result revealed (1.5s).
- While waiting for API result after animation completes, the system shall loop Stage 5 morphing subtly until response arrives.

### Polling & Result

- When generation is queued, the system shall poll `GET /api/v1/vton/result/[taskId]` every 3 seconds.
- When the result is ready, the system shall transition from cinematic sequence to `VtonResultViewer` with crossfade (0.8s).
- When polling exceeds 90 seconds, the system shall show "Taking longer..." with keep/cancel options. Cancel triggers credit refund.
- When the result fails, the system shall refund credits via `creditStore.refund(2)` and show retry option.

### Result Interaction

- When the result is displayed, the system shall render `BeforeAfterSlider` with original photo on left and try-on result on right.
- When the user drags the slider divider, the system shall reveal/hide the before/after with clip-path animation.
- When the user taps "Try Another", the system shall return to the photo + item selection state, keeping the current photo.
- When the user taps "Shop Now", the system shall navigate to the item's affiliate URL in a new tab (same as SCR-VIEW-03 shopping flow).
- When the user taps "Save", the system shall save the result image to their device gallery via download or Web Share API.
- When the user taps "Share", the system shall invoke Web Share API with the before/after composite image.

## State

| Store | Usage |
|-------|-------|
| vtonStore (proposed) | `userPhoto`, `selectedItem`, `taskId`, `resultImageUrl`, `status` ('idle'/'confirming'/'generating'/'ready'/'error') |
| creditStore | `balance`, `deductLocally(2)`, `refund(2)`, `selectCanAfford(2)` |
| authStore | `selectIsLoggedIn` for auth gate |
| transitionStore | Entry context (which post/magazine the user came from) |

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| Back button | Previous screen (post detail or magazine) | - |
| "Shop Now" | External affiliate URL | New tab |
| "Try Another" | Same page, reset to selection state | Keep user photo |
| Login redirect | `/login` | returnUrl: `/vton` |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Credit balance fetching | Skeleton cost display |
| No photo | User hasn't selected photo | Upload/camera CTA prominent |
| No items | No context items available | "Browse posts to find items" + link to Explore |
| Insufficient credits | balance < 2 | Disabled confirm + top-up CTA |
| Generation timeout | Polling > 90s | "Taking longer..." + keep/cancel |
| Generation error | API 5xx | Error card + credit refund + retry |
| Result error | Result image corrupted | "Generation failed" + retry with no additional credit cost |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Drag item | Follow cursor | GSAP Draggable | type: "x,y", bounds: viewport |
| Drop zone hover | Glow border | CSS + GSAP | accent box-shadow, scale 1.02x |
| Stage 1: Pick & Drop | Item to center | GSAP | 0.8s, power2.out |
| Stage 2: Chic Blur | Gaussian blur + dissolve | GSAP + CSS filter | 1.0s |
| Stage 3: Blueprint | Wireframe lines | GSAP | 1.2s stagger, accent color |
| Stage 4: Magic Flip | Y-axis flip | GSAP | 0.6s, back.inOut |
| Stage 5: Morphing | Result reveal | GSAP | 1.5s, loop until API returns |
| Result crossfade | Sequence out, result in | GSAP | 0.8s overlap |
| Before/after slider | Clip-path drag | CSS clip-path + pointer events | Real-time drag |
| Page exit | Context revert | GSAP | gsapContext.revert() on unmount |

---

See: [NEXT-02](../../_next/NEXT-02-vton-spec.md) -- VTON technical architecture (Phase 1-3)
See: [FLW-05](../../flows/FLW-05-vton.md) -- VTON 5-stage cinematic sequence
See: [SCR-VIEW-03](../detail/SCR-VIEW-03-item-solution.md) -- Item/solution (entry point: "Try On" CTA)
See: [SCR-MAG-01](../magazine/SCR-MAG-01-daily-editorial.md) -- Magazine (entry point: item card)
