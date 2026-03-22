# [SCR-VTON-02] Drag & Match Interaction Layer
> Route: overlay within `/vton` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Architecture: NEXT-02 (VTON Technical Architecture — Phase 1 MVP)
> Parent: SCR-VTON-01 (Try-on Studio)

## Purpose

User selects a garment item by dragging a card from the sidebar onto their photo (desktop) or via tap-to-select (mobile) to initiate the virtual try-on flow.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Sidebar (desktop) | ItemSidebar | `packages/web/lib/components/vton/ItemSidebar.tsx` | vertical, 300px fixed width |
| Sidebar (mobile) | ItemSidebar | same | horizontal scroll, 96px card height |
| Draggable card | DraggableItemCard | `packages/web/lib/components/vton/DraggableItemCard.tsx` | GSAP Draggable; productImageUrl, name, brand, isSelected |
| Drop zone | PhotoDropZone | `packages/web/lib/components/vton/PhotoDropZone.tsx` | wraps UserPhotoPanel; accepts dragover |
| User photo area | UserPhotoPanel | `packages/web/lib/components/vton/UserPhotoPanel.tsx` | photo, onPhotoChange |

> All file paths are proposed (components not yet created). Verify against filesystem before implementation.

## Layout

### Mobile (default)

```
┌──────────────────────────────┐
│ [< Back]  Try-on Studio  [?] │
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │   [UserPhotoPanel]     │  │  <- PhotoDropZone wraps this
│  │   (tap to upload)      │  │     full photo area is drop target
│  └────────────────────────┘  │
│                              │
│  Select an item to try on:   │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐  ->  │  <- ItemSidebar horizontal scroll
│  │  │ │  │ │  │ │  │       │     DraggableItemCard x N (96px)
│  └──┘ └──┘ └──┘ └──┘       │
│                              │
│  Tap an item, then [Try On]  │  <- instruction text (mobile only)
│                   [Try On]   │  <- CTA, enabled after item selected
│                              │
└──────────────────────────────┘
│ [NavBar]                     │
└──────────────────────────────┘
```

### Desktop (>=768px)

```
┌───────────────────────────────────────────────────────┐
│ [DesktopHeader]                                        │
├────────────────────────────────────────┬──────────────┤
│                                        │  [Item 1]    │
│  ┌──────────────────────────────────┐  │  [Item 2]    │  <- ItemSidebar
│  │     [PhotoDropZone]              │  │  [Item 3]    │     300px vertical
│  │     [UserPhotoPanel]             │  │  [Item 4]    │     fixed right panel
│  │     (drag item here)             │  │  ...         │
│  └──────────────────────────────────┘  │              │
│                                        │              │
└────────────────────────────────────────┴──────────────┘
```

| Element | Mobile | Desktop |
|---------|--------|---------|
| ItemSidebar | horizontal scroll strip, 96px cards | vertical 300px right panel |
| PhotoDropZone | full photo height, full width | photo panel area only |
| DraggableItemCard | tap-to-select only | GSAP Draggable enabled |
| Instruction text | "Tap item, then Try On" | "Drag item onto your photo" |
| Try On CTA button | visible, enabled after tap-select | hidden (drop triggers confirm directly) |

## Requirements

### GSAP Draggable Setup (Desktop)

- When the component mounts on a device with pointer coarse=false, the system shall initialize GSAP Draggable on each `DraggableItemCard` with `type: "x,y"` and `bounds: document.documentElement`.
- When a drag starts, the system shall set `zIndex: 50` on the dragged card and clone it visually so the original card remains in the sidebar.
- When the dragged card element overlaps `PhotoDropZone` (via `Draggable.hitTest(dropZoneEl, "50%")`), the system shall dispatch a `drag-over-zone` event to `PhotoDropZone`.
- When the drag ends outside `PhotoDropZone`, the system shall animate the card back to its origin position via `gsap.to(card, { x: 0, y: 0, duration: 0.3, ease: "power2.out" })`.
- When the drag ends inside `PhotoDropZone`, the system shall call `vtonStore.setSelectedItem(item)` and trigger the credit confirmation step.
- When the component unmounts, the system shall call `draggable.kill()` on all Draggable instances to prevent memory leaks.

### PhotoDropZone Feedback

- When `drag-over-zone` event is received, the system shall apply `box-shadow: 0 0 0 3px #eafd67` (accent glow) and `transform: scale(1.02)` to `PhotoDropZone` via GSAP.
- When the drag exits the zone (hitTest fails on `onDrag`), the system shall revert the glow and scale via `gsap.to(dropZone, { boxShadow: "none", scale: 1, duration: 0.2 })`.
- When `PhotoDropZone` receives a valid drop and the user photo is not yet set, the system shall show an "Upload your photo first" inline message without triggering confirm.

### Mobile Tap-to-Select Alternative

- When the user taps a `DraggableItemCard` on mobile (pointer coarse=true), the system shall set `isSelected: true` on that card and deselect all others.
- When an item is selected via tap, the system shall enable the "Try On" button below the photo panel.
- When the user taps "Try On" with a selected item and a loaded photo, the system shall call `vtonStore.setSelectedItem(item)` and trigger the credit confirmation step.
- When the user taps "Try On" without a loaded photo, the system shall highlight `UserPhotoPanel` with the accent glow and show "Upload your photo first" inline text.

### ItemSidebar Population

- When the user arrives from a post detail, the system shall populate `ItemSidebar` with items derived from `spots[].solutions[]` on that post.
- When the user arrives from a magazine, the system shall populate `ItemSidebar` with items from the magazine's item-card components passed via `transitionStore`.
- When no context items are available, the system shall render an empty sidebar with "Browse posts to find items" message and a link to `/explore`.
- When `ItemSidebar` contains more than 4 items on mobile, the system shall enable horizontal scroll with visible scroll affordance (partial next-card visible).

### DraggableItemCard Behavior

- When rendered, each card shall display: product thumbnail (48x48px on mobile, 56x56px on desktop), brand name, item name.
- When `isSelected` is true on mobile, the card shall display an accent-color border (`border: 1.5px solid #eafd67`).
- When dragging on desktop, the card shall reduce opacity to 0.6 on its origin position while the drag clone is at full opacity.

## State

| Store field | Type | Description |
|-------------|------|-------------|
| `vtonStore.selectedItem` | `SolutionRow \| null` | Currently selected item for try-on |
| `vtonStore.userPhoto` | `File \| null` | Uploaded/compressed user photo |
| `vtonStore.status` | `'idle' \| 'confirming' \| ...` | Triggers confirm overlay on 'confirming' |

## Navigation

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Drop on zone (desktop) | Credit confirm overlay | `vtonStore.status = 'confirming'` |
| Tap "Try On" (mobile) | Credit confirm overlay | Same as above |
| Back button | Previous screen | router.back() |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| No photo | `vtonStore.userPhoto` is null on drop/Try On | Accent glow on photo panel + inline message |
| No items | No context items | Empty sidebar + "Browse posts" link to /explore |
| Draggable init failure | GSAP not loaded | Fall back to tap-to-select (same as mobile) |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Drag start | Lift card | GSAP | `scale(1.05), zIndex: 50, duration: 0.15` |
| Drag over zone | Glow + scale | GSAP | `boxShadow accent, scale: 1.02, duration: 0.2` |
| Drag exit zone | Revert glow | GSAP | `scale: 1, boxShadow: none, duration: 0.2` |
| Drop miss | Snap back | GSAP | `x: 0, y: 0, duration: 0.3, ease: power2.out` |
| Tap select (mobile) | Border accent | CSS | `border: 1.5px solid #eafd67, transition: 0.15s` |

---

See: [SCR-VTON-01](SCR-VTON-01-try-on-studio.md) — parent screen and full state table
See: [SCR-VTON-03](SCR-VTON-03-cinematic-sequence.md) — generation animation (triggered after confirm)
See: [NEXT-02](../../_next/NEXT-02-vton-spec.md) — VTON technical architecture
