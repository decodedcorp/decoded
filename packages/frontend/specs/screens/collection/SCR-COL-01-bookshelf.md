# [SCR-COL-01] The Decoded Studio — 3D Collection Room (Spline Pro)
> Route: `/collection` | Status: redesign | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion) — Phase m7-03
> Flow: FLW-06 (Magazine Rendering Flow — save destination from SCR-MAG-02)

## Purpose

User enters a 3D gallery room ("The Decoded Studio") where their personal magazine issues are displayed in an immersive dark showroom, illuminated by neon #eafd67 lighting. The 3D scene is designed and exported from **Spline Pro**, with React handling data binding, navigation, and overlays via the Spline Runtime API.

## Design Direction

- **3D Studio Room (Spline):** Entire room geometry, lighting, materials, bloom, and camera states designed in Spline Pro editor. Exported as `.splinecode` and embedded via `@splinetool/react-spline`.
- **Neon Lighting (#eafd67):** Point/area lights with Spline Pro Bloom postprocessing. Floor with screen-space reflection for neon glow. All designed in Spline.
- **Dynamic Data Binding:** Spline Variables control magazine cover textures, volume numbering, and issue count. React pushes `magazineStore` data into Spline via Runtime API (`spline.setVariable()`).
- **Camera States:** Entry, Browse, Magazine_Focus states designed in Spline. React triggers state transitions via `spline.emitEvent()` or state API.
- **Mannequin Display (Future):** Reserved space in Spline scene for SCR-VTON-01 try-on results.
- **Theme:** Deep Black (#050505) / Neon Chartreuse (#eafd67).

## Technology Stack

| Library | Version | Purpose |
|---------|---------|---------|
| `@splinetool/react-spline` | ^4.1.0 | React component for Spline scenes |
| `@splinetool/runtime` | ^1.12.65 | Programmatic control: variables, events, transitions |
| `gsap` | 3.13.0 (existing) | Supplementary UI animations (overlays, page transitions) |
| `zustand` | 4.5.7 (existing) | State management (studioStore, magazineStore) |
| Spline Pro (editor) | — | 3D scene design, lighting, materials, bloom, camera states |

> **No three.js dependency** — Spline runtime bundles its own WebGL engine (544KB gzip). Existing `three@0.167.1` in project is unrelated.

## Architecture: Spline vs React Responsibilities

| Concern | Spline (Design) | React (Code) |
|---------|-----------------|--------------|
| Room geometry | Walls, floor, ceiling, reflections | — |
| Lighting | Neon strips, ambient, spots, Bloom | — |
| Materials | Obsidian black, matte, reflective | — |
| Camera positions | Entry, Browse, Focus states | Trigger state transitions |
| Magazine model | Template book with UV-ready faces | Dynamic texture swap via variables |
| Animations | Idle bobbing, hover scale, cover flip | Trigger via events, listen for completion |
| Data binding | Variables: `Cover_Texture_N`, `Vol_Label_N` | Push from magazineStore |
| Navigation | — | Route changes on Open/Back |
| HTML overlays | — | IssueDetailPanel, StudioHUD, loader |
| State management | — | studioStore, magazineStore |

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Page | CollectionPage (server) | `app/collection/page.tsx` | async; auth-gated |
| Client wrapper | CollectionClient | `lib/components/collection/CollectionClient.tsx` | "use client"; orchestrates Spline + HTML overlays |
| Spline embed | SplineStudio | `lib/components/collection/studio/SplineStudio.tsx` | `<Spline>` component, onLoad, event handlers |
| Data bridge | useSplineBridge | `lib/components/collection/studio/useSplineBridge.ts` | Hook: syncs magazineStore → Spline variables |
| Event bridge | useSplineEvents | `lib/components/collection/studio/useSplineEvents.ts` | Hook: Spline click/hover events → React callbacks |
| HUD overlay | StudioHUD | `lib/components/collection/StudioHUD.tsx` | 2D HTML overlay: header, issue count, back button |
| Issue detail | IssueDetailPanel | `lib/components/collection/IssueDetailPanel.tsx` | 2D overlay panel shown on issue focus |
| Empty state | EmptyStudio | `lib/components/collection/EmptyStudio.tsx` | Empty room state with CTA |
| Loading | StudioLoader | `lib/components/collection/StudioLoader.tsx` | Loading screen while Spline loads |
| Fallback | BookshelfViewFallback | `lib/components/collection/BookshelfViewFallback.tsx` | CSS/GSAP bookshelf for no-WebGL |
| Store | studioStore | `lib/stores/studioStore.ts` | Camera state machine, focused issue |

## Spline Scene Design Spec

### Scene File
- **Name:** `decoded-studio.splinecode`
- **Location:** `public/spline/decoded-studio.splinecode` (self-hosted) OR Spline CDN URL

### Room Setup (in Spline Editor)
- **Dimensions:** 8m x 6m x 4m gallery box
- **Walls:** Obsidian black matte material (#050505)
- **Floor:** Dark reflective material with screen-space reflections
- **Ceiling:** Dark with recessed neon strip channels

### Lighting Setup (in Spline Editor)
- **Neon strips:** 4x area lights along upper walls, #eafd67, Bloom enabled
- **Ambient:** Low intensity (0.15) warm white
- **Spot (future):** Reserved for mannequin highlight

### Camera States (in Spline Editor)
| State | Position | LookAt | Notes |
|-------|----------|--------|-------|
| `Entry` | Behind corridor (0, 1.5, -8) | Room center | Start position |
| `Browse` | Elevated isometric (0, 3.0, 6) | Room center (0, 0.5, 0) | Default after entry |
| `Focus_Book_1` to `Focus_Book_N` | 1m in front of each book | Book center | Per-book focus |
| `Exit` | Same as Entry | Room center | Reverse dolly |

### Magazine Template (in Spline Editor)
- **Object name:** `Magazine_1`, `Magazine_2`, ... `Magazine_N` (max 8)
- **Geometry:** Box shape, aspect 2:3, depth ~15mm
- **Front face:** UV-mapped, receives dynamic texture via Variable
- **Spine face:** #eafd67 text, Vol.XX label
- **Variables per book:**
  - `Cover_Texture_N` (Image) — cover art URL
  - `Vol_Label_N` (String) — "Vol.01"
  - `Title_N` (String) — issue title
  - `Visible_N` (Boolean) — show/hide based on collection size

### Spline Events (configured in Spline Editor)
| Event | Object | Spline Action | React Handler |
|-------|--------|---------------|---------------|
| Mouse Down | Magazine_N | Emit `book_click_N` | Navigate camera to Focus state, show detail panel |
| Mouse Hover | Magazine_N | Scale to 1.08x, glow up | Update cursor |
| Mouse Leave | Magazine_N | Scale back, glow down | Reset cursor |

## User Journey

### 1. Entry (진입)
- Page loads → StudioLoader (neon progress bar) while Spline scene downloads
- Once loaded, Spline transitions from `Entry` to `Browse` camera state
- Neon lights animate from 0 to full intensity (designed in Spline)
- Magazine objects float into position (Spline animation, triggered on load)

### 2. Browse (탐색)
- User sees isometric view of studio with magazines arranged in arc
- Mouse movement causes subtle camera shift (Spline's built-in mouse tracking or custom via Runtime API)
- Magazines have gentle idle bobbing (Spline animation loop)
- Neon reflections on floor create ambient mood

### 3. Focus (선택)
- User clicks magazine → React receives `onSplineMouseDown` event
- React identifies which book was clicked → triggers camera state transition to `Focus_Book_N`
- Spline animates camera zoom + book cover flip open
- React shows `IssueDetailPanel` HTML overlay with metadata and actions

### 4. Exit (퇴장)
- Back button → React triggers `Exit` camera state in Spline
- After animation completes → navigate to previous page

## Layout

### Mobile (<768px)
- Spline canvas fills viewport below sticky HUD header
- Touch: tap to focus (no hover effects)
- Simplified Spline scene variant or reduced quality export

### Desktop (>=768px)
- Full viewport Spline canvas with HUD overlay
- Mouse hover + click interactions
- Full Bloom and reflection quality

| Element | Mobile | Desktop |
|---------|--------|---------|
| Interaction | Tap to focus | Hover glow + click to focus |
| Bloom | Reduced | Full |
| Reflections | Minimal | Full |
| Entry animation | Shorter (1.5s) | Full (2.5s) |

## Requirements

### Scene Loading
- When the page mounts, the system shall use `next/dynamic` with `ssr: false` to load `SplineStudio`.
- When Spline scene is loading, the system shall show `StudioLoader` with neon progress animation.
- When `onLoad` fires, the system shall call `useSplineBridge` to push magazine data into Spline variables.
- When data binding is complete, the system shall trigger the Entry→Browse camera transition.

### Data Binding via Runtime API
- When `magazineStore.collectionIssues` changes, the system shall update Spline variables: `Cover_Texture_N`, `Vol_Label_N`, `Title_N`, `Visible_N` for each issue.
- When an issue has no `cover_image_url` or URL fails, the system shall set a solid color fallback texture.
- When collection has fewer issues than magazine slots in Spline, the system shall set `Visible_N = false` for unused slots.

### Event Handling
- When Spline emits `book_click_N` (via `onSplineMouseDown`), the system shall identify the clicked issue, set `studioStore.focusedIssueId`, and show `IssueDetailPanel`.
- When Spline emits hover events, the system shall update cursor style.
- When the user clicks outside any book or presses Escape, the system shall trigger unfocus.

### Performance
- When on mobile, the system shall load a performance-optimized Spline export (fewer lights, lower reflection quality).
- When Spline scene fails to load or WebGL is unavailable, the system shall render `BookshelfViewFallback`.

## State

| Store | Usage |
|-------|-------|
| magazineStore | `collectionIssues: MagazineIssue[]`, `isLoading`, `activeIssueId`, `loadCollection()` |
| authStore | `selectIsLoggedIn` for auth gate |
| studioStore (new) | `cameraState`, `focusedIssueId`, `entryComplete`, `splineLoaded` |

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| "Open Magazine" action | `/magazine/issue/[id]` | issueId, layout_json from cache |
| "Generate First Issue" CTA | `/magazine/personal` (SCR-MAG-02) | - |
| Back button | Previous screen (with Spline exit animation) | - |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Spline scene downloading | StudioLoader: neon progress bar |
| Empty | No saved issues | EmptyStudio: empty room + CTA |
| Error | API failure | Error overlay with retry |
| WebGL unsupported | No WebGL | BookshelfViewFallback + banner |
| Spline load failure | Network/CDN error | Fallback to CSS bookshelf |

---

See: [SCR-COL-02](./SCR-COL-02-3d-interaction.md) -- Spline interaction mechanics
See: [SCR-COL-03](./SCR-COL-03-issue-actions.md) -- Issue actions and detail panel
See: [SCR-MAG-01](../magazine/SCR-MAG-01-daily-editorial.md) -- Daily editorial
See: [SCR-MAG-02](../magazine/SCR-MAG-02-personal-issue.md) -- Personal issue generation
