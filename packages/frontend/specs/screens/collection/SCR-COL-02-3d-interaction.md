# [SCR-COL-02] Spline 3D Interaction Layer
> Route: overlay within `/collection` | Status: redesign | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion) — Phase m7-03
> Parent: SCR-COL-01 — page structure, Spline scene setup

## Purpose

Defines the Spline Runtime API interaction mechanics for the Decoded Studio: camera state transitions, magazine object interactions (hover glow, click-to-focus, cover flip), data bridge pattern, and performance considerations.

See: SCR-COL-01 — scene setup, Spline architecture, data loading
See: SCR-COL-03 — issue detail panel and action workflows

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Spline embed | SplineStudio | `lib/components/collection/studio/SplineStudio.tsx` | `<Spline>` component with scene URL |
| Data bridge | useSplineBridge | `lib/components/collection/studio/useSplineBridge.ts` | Pushes magazineStore data → Spline variables |
| Event bridge | useSplineEvents | `lib/components/collection/studio/useSplineEvents.ts` | Maps Spline events → React actions |
| Fallback | BookshelfViewFallback | `lib/components/collection/BookshelfViewFallback.tsx` | CSS/GSAP bookshelf (existing code) |

## Camera State Machine

```
[loading] ---(onLoad)---> [entry] ---(transition done)---> [browse]
                                                              |
                                         (click book)-------->|
                                                              v
                                                          [focused]
                                                              |
                                         (click away/ESC)---->|
                                                              v
                                                          [browse]

[any] ---(back button)---> [exit] ---> navigate away
```

### State Transitions (via Spline Runtime API)

```typescript
// Entry → Browse (on scene load)
const camera = spline.findObjectByName('Camera');
camera.emitEvent('mouseDown'); // triggers Entry→Browse state transition in Spline

// Browse → Focus (on book click)
spline.emitEvent('mouseDown', 'Focus_Trigger_3'); // camera moves to book 3

// Focus → Browse (on deselect)
spline.emitEvent('mouseDown', 'Browse_Trigger'); // camera returns

// Any → Exit (on back)
spline.emitEvent('mouseDown', 'Exit_Trigger'); // camera retreats
```

## Requirements

### Data Bridge (useSplineBridge)

- When Spline `onLoad` fires with the `spline` Application instance, the hook shall iterate over `magazineStore.collectionIssues` and set variables:
  ```typescript
  issues.forEach((issue, i) => {
    spline.setVariable(`Cover_Texture_${i + 1}`, issue.cover_image_url);
    spline.setVariable(`Vol_Label_${i + 1}`, `Vol.${String(issue.issue_number).padStart(2, '0')}`);
    spline.setVariable(`Title_${i + 1}`, issue.title);
    spline.setVariable(`Visible_${i + 1}`, true);
  });
  // Hide unused slots
  for (let i = issues.length; i < MAX_SLOTS; i++) {
    spline.setVariable(`Visible_${i + 1}`, false);
  }
  ```
- When `cover_image_url` fails to load as texture, the system shall set a fallback solid color.
- When `collectionIssues` updates after initial load (e.g., delete), the system shall re-run variable sync.

### Dynamic Texture Swapping (HIGH RISK)

- When setting cover textures, the system shall use `spline.setVariable()` with image URLs.
- **Risk:** Dynamic texture swapping via variables is undocumented. If `setVariable` does not support Image type at runtime:
  - **Fallback A:** Access `SPEObject.material.layers` directly to swap texture data
  - **Fallback B:** Pre-bake N cover slots in Spline with placeholder UVs, swap via `findObjectByName` + material property mutation
  - **Fallback C:** Use static covers baked in Spline; show real covers only in IssueDetailPanel (HTML)
- When testing, the first plan should include a **texture swap spike** to validate the approach.

### Event Bridge (useSplineEvents)

- When `onSplineMouseDown` fires on a magazine object, the hook shall:
  1. Parse the object name to extract issue index (e.g., `Magazine_3` → index 3)
  2. Map index to `collectionIssues[index]` to get issue ID
  3. Set `studioStore.focusedIssueId`
  4. Set `studioStore.cameraState = 'focused'`
  5. Trigger camera focus transition in Spline

- When `onSplineMouseHover` fires on a magazine object:
  1. Set `document.body.style.cursor = 'pointer'`
  2. (Hover scale/glow animation handled in Spline)

- When `onSplineMouseHover` fires on non-magazine object or empty space:
  1. Reset cursor to default

### Camera Transitions

- When transitioning Entry→Browse, the system shall:
  1. Wait for Spline `onLoad`
  2. Trigger entry animation state in Spline
  3. Listen for animation completion (poll or timeout)
  4. Set `studioStore.entryComplete = true`

- When transitioning Browse→Focus, the system shall:
  1. Determine target book's Spline focus state name
  2. Trigger state transition
  3. After transition (estimated 0.6s), show IssueDetailPanel

- When transitioning Focus→Browse (unfocus), the system shall:
  1. Hide IssueDetailPanel
  2. Trigger browse state transition in Spline
  3. Clear `studioStore.focusedIssueId`

- When user clicks Escape key or clicks empty canvas area:
  1. If focused: trigger unfocus sequence
  2. If browse: no action

### Cover Flip Animation

- When a book is focused, Spline shall animate the front cover rotation (designed in Spline States/Events).
- When unfocused, Spline shall reverse the cover flip.
- React does NOT control the flip — it's a Spline-side animation triggered by the focus state transition.

### Delete Animation

- When delete is confirmed (from SCR-COL-03), the system shall:
  1. Find the book object: `spline.findObjectByName('Magazine_N')`
  2. Use `SPEObject.transition()` to animate: scale 1→0, position.y +0.5, opacity→0 over 0.7s
  3. After animation: set `Visible_N = false`, re-sync data bridge

### Performance

- When Spline scene file exceeds 5MB, consider splitting into base room (static) + magazine layer (dynamic).
- When on mobile, load a mobile-optimized Spline export (fewer lights, simpler materials).
- When WebGL is unavailable, render `BookshelfViewFallback` (existing CSS/GSAP bookshelf preserved).

## State

| Store | Field | Usage |
|-------|-------|-------|
| studioStore (new) | `cameraState: 'loading' \| 'entry' \| 'browse' \| 'focused' \| 'exit'` | Camera state machine |
| studioStore (new) | `focusedIssueId: string \| null` | Which book is focused |
| studioStore (new) | `entryComplete: boolean` | Blocks interaction until entry done |
| studioStore (new) | `splineLoaded: boolean` | Spline Application instance ready |
| studioStore (new) | `splineApp: Application \| null` | Reference to Spline runtime instance |
| magazineStore | `collectionIssues` | Source data for Spline variables |
| magazineStore | `activeIssueId` | Synced with `focusedIssueId` |

## Interaction States

| State | Camera (Spline) | Books (Spline) | UI Overlay (React) |
|-------|----------------|----------------|-------------------|
| Loading | — | — | StudioLoader |
| Entry | Dolly animation | Float in with stagger | StudioHUD fading in |
| Browse | Isometric + mouse tracking | Idle bobbing | StudioHUD |
| Hover | No change | Scale 1.08, glow up | Cursor: pointer |
| Focused | Zoomed to book | Selected: cover open | IssueDetailPanel |
| Exit | Retreat to corridor | Fade out | HUD fades |

## Error States

| State | Condition | Handling |
|-------|-----------|---------|
| WebGL unsupported | No WebGL context | BookshelfViewFallback |
| Spline load failure | Network error / CDN down | BookshelfViewFallback + retry button |
| Texture swap failure | Variable type mismatch | Fallback to static covers |
| Object not found | `findObjectByName` returns null | Log warning, skip interaction |
| Event not received | Spline event system failure | Timeout → show fallback |

---

See: [SCR-COL-01](./SCR-COL-01-bookshelf.md) -- Spline scene setup, room design, data loading
See: [SCR-COL-03](./SCR-COL-03-issue-actions.md) -- Issue detail panel and action workflows
