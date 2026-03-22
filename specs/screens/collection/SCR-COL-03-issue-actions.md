# [SCR-COL-03] Issue Detail Panel and Action Workflows (Spline Pro)
> Route: overlay within `/collection` | Status: redesign | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion) — Phase m7-03
> Parent: SCR-COL-01 — page structure, Spline scene setup

## Purpose

Defines the 2D HTML overlay panel shown when a magazine book is focused in the Spline 3D studio, and the full workflows for Open, Share, and Remove issue actions. Also covers empty studio state, loading experience, and WebGL fallback.

See: SCR-COL-01 — Spline scene setup, architecture, user journey
See: SCR-COL-02 — Spline interaction mechanics, camera transitions

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Detail panel | IssueDetailPanel | `lib/components/collection/IssueDetailPanel.tsx` | HTML overlay; visible when `studioStore.cameraState === 'focused'` |
| Share sheet | CollectionShareSheet | `lib/components/collection/CollectionShareSheet.tsx` | DS BottomSheet; Copy Link + Web Share |
| Empty studio | EmptyStudio | `lib/components/collection/EmptyStudio.tsx` | Spline empty room + HTML CTA overlay |
| Loading | StudioLoader | `lib/components/collection/StudioLoader.tsx` | Loading screen with neon progress bar |
| HUD | StudioHUD | `lib/components/collection/StudioHUD.tsx` | Header bar with back button, title, issue count |
| Fallback | BookshelfViewFallback | `lib/components/collection/BookshelfViewFallback.tsx` | CSS bookshelf (preserved from previous impl) |

## Layout

### IssueDetailPanel (mobile — bottom sheet style)

```
+--------------------------------------------------+
|                                                    |
|           (Spline scene with focused book          |
|            and open cover visible)                 |
|                                                    |
|  +----------------------------------------------+ |
|  |  Vol.03 — The Denim Issue                      | |
|  |  February 7, 2026                              | |
|  |  #Denim  #Workwear  #Indigo                    | |
|  |  [Open Magazine]  [Share]  [Remove]            | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

### IssueDetailPanel (desktop — right sidebar)

```
+--------------------------------------------------+
|                                            +------+|
|     (Spline scene)                         | Vol. ||
|                                            | 03   ||
|                                            | ---- ||
|                                            | The  ||
|                                            | Denim||
|                                            | Issue||
|                                            | ---- ||
|                                            | tags ||
|                                            | ---- ||
|                                            |[Open]||
|                                            |[Shr] ||
|                                            |[Rmv] ||
|                                            +------+|
+--------------------------------------------------+
```

### StudioHUD

```
+--------------------------------------------------+
| [< Back]      The Decoded Studio             [5]  |
+--------------------------------------------------+
|                                                    |
|           (Spline canvas fills remaining)          |
```

- Sticky header, semi-transparent backdrop blur
- #eafd67 accent on issue count badge
- Overlays Spline canvas (HTML positioned above)

### EmptyStudio

```
+--------------------------------------------------+
| [< Back]      The Decoded Studio             [0]  |
+--------------------------------------------------+
|                                                    |
|           (Spline empty room with neon             |
|            lighting, no magazines)                 |
|                                                    |
|          "Your studio is waiting"                  |
|          [Generate First Issue]                    |  <- HTML overlay
|                                                    |
+--------------------------------------------------+
```

### StudioLoader

```
+--------------------------------------------------+
|                                                    |
|              ████████████░░░░░░░░                  |  <- #eafd67 bar
|              Loading your studio...                |
|                                                    |
+--------------------------------------------------+
```

## Requirements

### IssueDetailPanel

- When `studioStore.cameraState === 'focused'`, the system shall render IssueDetailPanel with: volume label (`Vol.{N}` in #eafd67), title, date (`MMMM D, YYYY`), keywords (up to 4 pills), action buttons.
- When panel mounts, animate slide-up (translateY 100%→0, 0.3s).
- When panel unmounts, animate slide-down (0.2s).
- When on desktop, render as right sidebar instead of bottom sheet.

### Open Action

- When "Open Magazine" clicked, trigger Spline exit animation, then `router.push(`/magazine/issue/${id}`)`.
- When `layout_json` not cached, show loading spinner in button.

### Share Action

- When "Share" clicked, open CollectionShareSheet (DS BottomSheet).
- **Copy Link:** Copy `https://decoded.kr/magazine/issue/[id]` → Sonner toast "Link copied".
- **Web Share:** `navigator.share({ title, url })` if supported; hide if not.
- **Instagram Story:** Deferred to future (requires Spline canvas screenshot API).

### Remove Action

- When "Remove" clicked, show inline confirmation: title + "This will be removed from your collection." + [Cancel] [Remove].
- When confirmed:
  1. Call `DELETE /api/v1/magazine/collection/[id]` (mock for now)
  2. Success: trigger Spline dissolve animation on book (SCR-COL-02), hide panel, remove from store
  3. Failure: Sonner toast "Could not remove."
- When cancelled, return to normal panel.

### StudioHUD

- When Spline scene is loaded, show sticky header with back button (ArrowLeft), "The Decoded Studio" title, issue count badge (#eafd67).
- When back clicked, trigger Spline exit animation → navigate to previous page.

### EmptyStudio

- When collection is empty, Spline scene shows empty room (neon lighting, no books).
- HTML overlay shows "Your studio is waiting" + "Generate First Issue" CTA button.
- CTA routes to `/magazine/personal`.

### StudioLoader

- When Spline scene is downloading/initializing, show full-screen dark loader with #eafd67 progress bar (indeterminate) and "Loading your studio..." text.
- When `onLoad` fires, fade out loader (0.3s).

### WebGL Fallback

- When WebGL unavailable (check `canvas.getContext('webgl')`), render BookshelfViewFallback.
- When Spline fails to load (network/timeout), render BookshelfViewFallback with retry button.
- Show subtle banner: "3D studio requires a modern browser. Showing classic view."

## State

| Store | Field | Usage |
|-------|-------|-------|
| magazineStore | `collectionIssues` | Source data |
| magazineStore | `activeIssueId` | Synced with focused |
| studioStore | `cameraState` | Panel visibility |
| studioStore | `focusedIssueId` | Panel content source |
| studioStore | `splineLoaded` | Loader visibility |

## Navigation

| Trigger | Destination | Data |
|---------|-------------|------|
| "Open Magazine" | `/magazine/issue/[id]` | issueId |
| "Generate First Issue" | `/magazine/personal` | — |
| Back button | Previous (with exit anim) | — |
| Share → Copy Link | Clipboard | URL |
| Share → Web Share | OS share sheet | title, URL |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Spline downloading | StudioLoader |
| Empty | No issues | EmptyStudio + CTA |
| WebGL missing | No context | BookshelfViewFallback |
| Spline error | Load failure | BookshelfViewFallback + retry |
| Remove fail | API error | Toast |
| Share blocked | Clipboard denied | Toast |

## Animations (React-side only — Spline handles 3D)

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Focus | Panel slide up | GSAP/CSS | translateY, 0.3s |
| Deselect | Panel slide down | GSAP/CSS | reverse, 0.2s |
| Loader done | Fade out | CSS | opacity, 0.3s |
| HUD mount | Fade in | CSS | opacity, 0.3s |

---

See: [SCR-COL-01](./SCR-COL-01-bookshelf.md) -- Spline scene setup, architecture
See: [SCR-COL-02](./SCR-COL-02-3d-interaction.md) -- Spline interaction mechanics
