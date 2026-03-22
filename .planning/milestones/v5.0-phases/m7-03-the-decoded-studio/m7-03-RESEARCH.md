# Phase m7-03: The Decoded Studio (Spline Pro) - Research

**Researched:** 2026-03-05
**Domain:** Spline Pro 3D scene, @splinetool/runtime, React integration, camera states, dynamic textures
**Confidence:** HIGH

## Summary

This phase transforms the `/collection` page into a 3D studio room using **Spline Pro** instead of the previously planned React Three Fiber approach. The architecture pivot fundamentally changes the implementation: the 3D scene (room geometry, lighting, materials, camera positions, bloom, animations) is designed **inside the Spline editor**, while React handles data binding, navigation, overlays, and state management.

The `@splinetool/react-spline` package (v4.1.0) provides a `<Spline>` React component that loads `.splinecode` scene files. The `@splinetool/runtime` (v1.12.65) provides the programmatic API: `findObjectByName()`, `emitEvent()`, `setVariable()`, and critically, `SPEObject.transition()` for state-to-state animations with easing and chaining. The runtime is self-contained (~6.8MB uncompressed, ~544KB gzip'd) and does NOT depend on three.js -- it bundles its own WebGL engine. This means the project's existing `three@0.167.1` is unaffected; no version conflicts arise.

Dynamic texture swapping is possible via the runtime's material layer API (`obj.material.layers` -> find TextureLayer -> set `image.data`), though this requires careful handling. Camera transitions should use Spline's built-in state system: design camera states (Default, Magazine_Focus, VTON_Focus) in the Spline editor, then trigger transitions programmatically via `SPEObject.transition({ to: 'StateName' })` or `emitEvent()`.

**Primary recommendation:** Design the full 3D studio scene in Spline Pro (room, lighting, bloom, camera states, magazine template model). Export as `.splinecode` (self-hosted in `/public`). Use `@splinetool/react-spline/next` for Next.js integration with `dynamic import + ssr: false`. Control scene programmatically via runtime API from React. Keep all 2D UI (IssueDetailPanel, StudioHUD, share sheets) as HTML overlays outside the Spline canvas.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@splinetool/react-spline` | ^4.1.0 | React component wrapping Spline runtime | Official React binding; `/next` export for Next.js SSR |
| `@splinetool/runtime` | ^1.12.65 | Programmatic API: findObjectByName, emitEvent, setVariable, transition | Core engine; self-contained WebGL renderer |
| Spline Pro (editor) | Latest | 3D scene design: room, lighting, bloom, camera states, magazine model | No-code 3D design; Pro enables bloom, no watermark, advanced materials |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zustand` | 4.5.7 | `studioStore` for camera state, `magazineStore` for data | State coordination between Spline scene and React UI |
| `gsap` | 3.13.0 | 2D overlay animations (panel slide, HUD transitions) | NOT for 3D — Spline handles all 3D animation internally |
| `motion` | 12.23.12 | IssueDetailPanel enter/exit animations | 2D overlay motion |
| `three` | 0.167.1 | Existing; NOT used by Spline | Spline runtime is independent; no conflict |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Spline Pro | React Three Fiber v8 | R3F gives full code control but requires building every 3D element programmatically; Spline allows visual design with Pro features (bloom, materials) out of the box |
| `@splinetool/react-spline` | `@splinetool/loader` | Loader exports to Three.js objects for R3F; loses Spline's interaction/state/event system |
| Self-hosted `.splinecode` | Spline CDN URL | Self-hosted avoids CORS issues, reduces latency, works offline in dev |

**Installation:**
```bash
cd packages/web && yarn add @splinetool/react-spline @splinetool/runtime
```

**No devDependencies needed** -- `leva` (debug panel) was only needed for R3F; Spline has its own editor-side tuning.

## Architecture Patterns

### Recommended Project Structure
```
lib/components/collection/
├── CollectionClient.tsx           # Orchestrator: WebGL check -> Spline or fallback
├── IssueDetailPanel.tsx           # 2D HTML overlay (focused state)
├── CollectionShareSheet.tsx       # DS BottomSheet share options
├── EmptyStudio.tsx                # Empty room variant (Spline scene with no books)
├── BookshelfView.tsx              # (EXISTING) CSS fallback for no WebGL
├── studio/
│   ├── SplineStudio.tsx           # <Spline> component wrapper + runtime bridge
│   ├── useSplineRuntime.ts        # Hook: stores Application ref, exposes control methods
│   ├── useStudioSync.ts           # Hook: syncs magazineStore -> Spline variables/textures
│   ├── StudioHUD.tsx              # 2D HTML overlay: header, issue count, back button
│   └── StudioLoader.tsx           # Loading state (neon progress bar)
├── stores/
│   └── studioStore.ts             # Camera state machine + quality level
└── index.ts                       # Barrel exports

public/spline/
└── decoded-studio.splinecode      # Self-hosted Spline scene file
```

### Pattern 1: Client-Only Dynamic Import for Spline
**What:** Spline uses WebGL canvas and cannot render on server. Must use `next/dynamic` with `ssr: false` in a client component wrapper.
**When to use:** Always for any component containing `<Spline>`.
**Example:**
```typescript
// CollectionClient.tsx
"use client";
import dynamic from "next/dynamic";
import { StudioLoader } from "./studio/StudioLoader";
import { BookshelfView } from "./BookshelfView";

const SplineStudio = dynamic(
  () => import("./studio/SplineStudio").then((m) => m.SplineStudio),
  { ssr: false, loading: () => <StudioLoader /> }
);

export function CollectionClient() {
  const [supportsWebGL, setSupportsWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setSupportsWebGL(!!canvas.getContext("webgl2"));
    } catch {
      setSupportsWebGL(false);
    }
  }, []);

  if (supportsWebGL === null) return <StudioLoader />;
  if (!supportsWebGL) return <BookshelfView />;
  return <SplineStudio />;
}
```

### Pattern 2: Runtime Bridge Hook (useSplineRuntime)
**What:** Capture the Spline Application instance via `onLoad` callback and expose typed control methods.
**When to use:** Central hook consumed by SplineStudio and useStudioSync.
**Example:**
```typescript
// useSplineRuntime.ts
import { useRef, useCallback } from "react";
import type { Application, SPEObject } from "@splinetool/runtime";

export function useSplineRuntime() {
  const splineRef = useRef<Application | null>(null);

  const onLoad = useCallback((spline: Application) => {
    splineRef.current = spline;
  }, []);

  const findObject = useCallback((name: string): SPEObject | undefined => {
    return splineRef.current?.findObjectByName(name);
  }, []);

  const triggerEvent = useCallback((event: string, name: string) => {
    splineRef.current?.emitEvent(event as any, name);
  }, []);

  const setVar = useCallback((name: string, value: string | number | boolean) => {
    splineRef.current?.setVariable(name, value);
  }, []);

  const transitionCamera = useCallback((stateName: string, durationMs = 600) => {
    const camera = splineRef.current?.findObjectByName("MainCamera");
    camera?.transition({ to: stateName, duration: durationMs, easing: 4 }); // EASE_IN_OUT
  }, []);

  return { onLoad, splineRef, findObject, triggerEvent, setVar, transitionCamera };
}
```

### Pattern 3: Spline States for Camera Transitions
**What:** Design named camera states in Spline editor (Default, Browse, Magazine_Focus). Trigger transitions from React via `SPEObject.transition()`.
**When to use:** Entry animation, focus zoom, exit retreat.
**Example:**
```typescript
// In Spline editor: Camera object "MainCamera" has states:
//   - "Entry"   (position: 0, 1.5, -8)
//   - "Browse"  (position: 0, 3.0, 6)
//   - "Focused" (position: computed per-book)

// From React:
const camera = spline.findObjectByName("MainCamera");

// Entry -> Browse transition
camera?.transition({ from: "Entry", to: "Browse", duration: 2500, easing: 4 });

// Browse -> Focus (chained)
camera?.transition({ to: "Focused", duration: 600, easing: 4 });
```

### Pattern 4: Dynamic Cover Texture Swapping
**What:** Update magazine cover textures at runtime by accessing material layers on Spline objects.
**When to use:** After scene loads, map `issue.cover_image_url` to each book object's texture.
**Example:**
```typescript
// useStudioSync.ts
async function updateBookCovers(
  spline: Application,
  issues: MagazineIssue[]
) {
  for (let i = 0; i < issues.length; i++) {
    const bookObj = spline.findObjectByName(`Magazine_${i}`);
    if (!bookObj?.material?.layers) continue;

    // Find the texture layer (type check by presence of image property)
    const texLayer = bookObj.material.layers.find(
      (layer: any) => layer.image !== undefined
    );
    if (texLayer) {
      // Set image data to the cover URL
      // Note: URL must be same-origin or CORS-enabled
      texLayer.image = { data: issues[i].cover_image_url, name: "cover" };
      spline.requestRender(); // Force re-render after texture change
    }
  }
}
```
**CORS Note:** For external CDN URLs, the `.splinecode` scene and texture URLs must be same-origin or the CDN must send `Access-Control-Allow-Origin` headers. For mock phase, use local images in `/public/mock/`.

### Pattern 5: Spline Variables for Data Binding
**What:** Use Spline Variables (Number, String, Boolean) to pass React state into the scene. Create variables in Spline editor, update via `setVariable()`.
**When to use:** Issue count display, visibility toggles, active states.
**Example:**
```typescript
// Variables defined in Spline editor:
//   issue_count: Number (drives counter display in scene)
//   show_empty_state: Boolean (toggles empty room hologram)
//   active_book_index: Number (-1 = none, 0-N = focused book)

// From React:
spline.setVariable("issue_count", collectionIssues.length);
spline.setVariable("show_empty_state", collectionIssues.length === 0);
spline.setVariable("active_book_index", focusedIndex);
```

### Pattern 6: Spline Events -> React Callbacks
**What:** Listen for Spline events (mouseDown on book objects) to trigger React actions (navigation, store updates).
**When to use:** Book click -> focus, book hover -> cursor change.
**Example:**
```typescript
// SplineStudio.tsx
<Spline
  scene="/spline/decoded-studio.splinecode"
  onLoad={onLoad}
  onSplineMouseDown={(e) => {
    const name = e.target.name;
    if (name.startsWith("Magazine_")) {
      const index = parseInt(name.split("_")[1]);
      const issue = collectionIssues[index];
      if (issue) {
        studioStore.focusIssue(issue.id);
        transitionCamera("Focused", 600);
      }
    }
  }}
  onSplineMouseHover={(e) => {
    document.body.style.cursor = e.target.name.startsWith("Magazine_")
      ? "pointer"
      : "default";
  }}
/>
```

### Anti-Patterns to Avoid
- **Using GSAP for 3D animations:** Spline handles ALL 3D animation internally (transitions, states, timeline). GSAP should only animate 2D HTML overlays.
- **Trying to access Three.js internals:** Spline runtime is NOT Three.js; don't try to access `renderer`, `scene`, or `camera` via Three.js APIs.
- **Multiple Spline embeds per page:** Limit to 1 Spline canvas per page. Multiple canvases multiply GPU cost.
- **Continuous render mode for static scenes:** Keep `renderOnDemand={true}` (default). Only switch to continuous if you have per-frame animations that Spline's event system doesn't cover.
- **Server-rendering the Spline component:** Always use `dynamic(() => ..., { ssr: false })` or the `/next` import path.
- **Designing data-dependent UI in Spline:** Keep IssueDetailPanel, share sheets, navigation as React HTML overlays. Spline is for the immersive 3D backdrop, not data-driven UI.

## Spline Scene Design Checklist

What to design **IN SPLINE** (by the designer/developer in Spline editor):

| Element | Spline Object Name | Notes |
|---------|-------------------|-------|
| Room geometry | `Room` | Dark gallery: floor, walls, ceiling, 8x6x4m |
| Reflective floor | `Floor` | Glossy dark material with environment reflection |
| Neon strip lights | `NeonLight_0..3` | #eafd67 emissive, placed along upper walls |
| Bloom effect | Scene-level post-processing | Bloom enabled in Spline Effects panel |
| Ambient light | `AmbientLight` | Low intensity (0.15), warm white |
| Camera | `MainCamera` | States: Entry, Browse, Focused |
| Magazine template | `Magazine_0..N` | Box-shaped, with texture layer for cover |
| Magazine spine text | Part of Magazine object | #eafd67 emissive text |
| Entry animation | Timeline or Start event | Camera dolly + neon flicker sequence |
| Hover glow | mouseHover event on Magazine | Scale 1.08, emissive intensity up |
| Empty state hologram | `EmptyHologram` | Wireframe book outline, pulsing glow |

What to build **IN REACT** (code):

| Element | Component | Notes |
|---------|-----------|-------|
| Data loading | magazineStore | `loadCollection()`, mock JSON |
| Cover texture binding | useStudioSync | Map `cover_image_url` to Spline objects |
| Issue detail panel | IssueDetailPanel | HTML overlay with actions |
| Share sheet | CollectionShareSheet | DS BottomSheet |
| Navigation | Next.js router | `/magazine/issue/[id]` |
| Camera state management | studioStore | Synced with Spline states |
| WebGL fallback | BookshelfView | CSS bookshelf for no WebGL |
| Loading state | StudioLoader | Neon progress bar |
| HUD overlay | StudioHUD | Header, count, back button |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 3D room geometry | Procedural Three.js boxes/planes | Spline editor room design | Visual design tool; iterate faster, better materials |
| Bloom/glow effects | `@react-three/postprocessing` | Spline's built-in Bloom effect | Configured in editor; no code needed |
| Camera animation paths | GSAP + useThree camera manipulation | Spline States + `transition()` API | States designed visually; transitions are chainable |
| Hover/click interactions | R3F raycaster + onPointerOver | Spline events (mouseHover, mouseDown) | Built into runtime; event names match editor setup |
| Reflective floor | Drei `<Reflector>` | Spline material with reflection | Configured in material properties visually |
| Loading placeholder | Manual Suspense + skeleton | `@splinetool/react-spline/next` | Auto-generates blurred placeholder for SSR |
| Neon light materials | Custom emissive meshStandardMaterial | Spline emissive material layer | Visual material editor; adjust in real-time |

**Key insight:** Spline Pro shifts work from "coding 3D" to "designing 3D + coding bridges." The runtime API is the bridge between the visual scene and React state.

## Common Pitfalls

### Pitfall 1: SSR Crash with Spline Component
**What goes wrong:** Next.js SSR tries to evaluate WebGL code on server, crashes with `window is not defined`.
**Why it happens:** `@splinetool/runtime` accesses browser-only APIs at import time.
**How to avoid:** Use `dynamic(() => import('./SplineStudio'), { ssr: false })`. The `@splinetool/react-spline/next` import adds blurred placeholder for SSR but still needs client-only rendering for the canvas.
**Warning signs:** Build errors mentioning `window`, `document`, `HTMLCanvasElement`.

### Pitfall 2: No Direct Programmatic State Setting on Objects
**What goes wrong:** Trying to set `obj.state = "StateName"` doesn't animate -- it jumps instantly.
**Why it happens:** The `state` property is a getter/setter that changes state without transition animation. For animated transitions, use `obj.transition({ to: "StateName" })`.
**How to avoid:** Always use `transition()` for animated state changes. Use `.state` only for instant snaps.
**Warning signs:** Objects jumping to positions instead of smooth animation.

### Pitfall 3: Texture Swap CORS Issues
**What goes wrong:** Cover images from external CDN fail to load as textures with CORS errors.
**Why it happens:** WebGL requires CORS headers for cross-origin textures.
**How to avoid:** For mock phase, serve images from `/public/mock/`. For production, ensure CDN sends `Access-Control-Allow-Origin: *` or proxy through Next.js API route.
**Warning signs:** Black/missing textures on magazine covers, console CORS errors.

### Pitfall 4: Runtime Bundle Size Impact
**What goes wrong:** Page load time increases significantly.
**Why it happens:** `@splinetool/runtime` is ~6.8MB uncompressed (but ~544KB gzip). Plus the `.splinecode` scene file adds additional download.
**How to avoid:** Dynamic import (code-split). Enable gzip/Brotli on server. Use Spline's geometry compression (Performance mode). Lazy-load with Intersection Observer if scene is below fold.
**Warning signs:** Lighthouse score drops, Time to Interactive increases.

### Pitfall 5: Spline Variables Only Support String/Number/Boolean
**What goes wrong:** Trying to pass complex objects (arrays, image URLs as "image type variables") to Spline.
**Why it happens:** Spline variables are limited to primitive types. There is no "image" variable type.
**How to avoid:** Use variables for simple data (counts, indices, toggles). For textures, use the material layer API directly. For complex data, use `findObjectByName` + direct property manipulation.
**Warning signs:** `setVariable` calls silently failing or no visual effect.

### Pitfall 6: Camera Focus Position Must Be Computed
**What goes wrong:** A single "Focused" camera state can't work for multiple book positions.
**Why it happens:** Each book is at a different position; the focus camera needs to target each one.
**How to avoid:** Instead of a single "Focused" state, compute focus position in React code and set camera `position` directly: `camera.position = { x: book.position.x, y: book.position.y + 0.5, z: book.position.z + 1.2 }`. Alternatively, create per-book states in Spline if book count is fixed.
**Warning signs:** Camera always focuses on the same spot regardless of which book is clicked.

### Pitfall 7: renderOnDemand vs Continuous Animations
**What goes wrong:** Idle floating animations (book bobbing) don't play.
**Why it happens:** `renderOnDemand={true}` (default) only renders when something changes. Continuous animations need continuous rendering.
**How to avoid:** If the scene has always-running animations (floating, pulsing glow), the Spline scene's internal event loop handles this. But if animations stop when tab is inactive, that's expected behavior. For critical continuous animations, ensure they're set up as Spline "Start" events with loop.
**Warning signs:** Animations freeze when user stops interacting.

## Code Examples

### Complete SplineStudio Component
```typescript
// SplineStudio.tsx
"use client";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";
import { useRef, useEffect } from "react";
import { useMagazineStore } from "@/lib/stores/magazineStore";
import { useStudioStore } from "@/lib/stores/studioStore";
import { StudioHUD } from "./StudioHUD";

export function SplineStudio() {
  const splineRef = useRef<Application | null>(null);
  const { collectionIssues } = useMagazineStore();
  const { focusIssue, unfocus, setCameraState } = useStudioStore();

  function onLoad(spline: Application) {
    splineRef.current = spline;

    // Set initial variables
    spline.setVariable("issue_count", collectionIssues.length);
    spline.setVariable("show_empty_state", collectionIssues.length === 0);

    // Update cover textures
    updateBookCovers(spline, collectionIssues);

    // Mark entry complete after camera finishes
    // (entry animation runs via Spline "Start" event)
    setTimeout(() => setCameraState("browse"), 2500);
  }

  function handleMouseDown(e: { target: { name: string; id: string } }) {
    if (e.target.name.startsWith("Magazine_")) {
      const idx = parseInt(e.target.name.split("_")[1]);
      const issue = collectionIssues[idx];
      if (issue && splineRef.current) {
        focusIssue(issue.id);
        // Transition camera to focus position
        const book = splineRef.current.findObjectByName(e.target.name);
        const camera = splineRef.current.findObjectByName("MainCamera");
        if (book && camera) {
          camera.position = {
            x: book.position.x,
            y: book.position.y + 0.5,
            z: book.position.z + 1.5,
          };
          splineRef.current.requestRender();
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-[#050505]">
      <Spline
        scene="/spline/decoded-studio.splinecode"
        onLoad={onLoad}
        onSplineMouseDown={handleMouseDown}
        onSplineMouseHover={(e) => {
          document.body.style.cursor = e.target.name.startsWith("Magazine_")
            ? "pointer"
            : "default";
        }}
      />
      <StudioHUD />
    </div>
  );
}
```

### studioStore with Spline-Aware State Machine
```typescript
// stores/studioStore.ts
import { create } from "zustand";

type CameraState = "entry" | "browse" | "focused" | "exit";

interface StudioState {
  cameraState: CameraState;
  focusedIssueId: string | null;
  entryComplete: boolean;
  setCameraState: (s: CameraState) => void;
  focusIssue: (id: string) => void;
  unfocus: () => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  cameraState: "entry",
  focusedIssueId: null,
  entryComplete: false,
  setCameraState: (cameraState) =>
    set({ cameraState, entryComplete: cameraState !== "entry" }),
  focusIssue: (id) =>
    set({ focusedIssueId: id, cameraState: "focused" }),
  unfocus: () =>
    set({ focusedIssueId: null, cameraState: "browse" }),
}));
```

### Next.js SSR-Safe Dynamic Import
```typescript
// CollectionClient.tsx
"use client";
import dynamic from "next/dynamic";
import { StudioLoader } from "./studio/StudioLoader";

// Option A: Standard dynamic import
const SplineStudio = dynamic(
  () => import("./studio/SplineStudio").then((m) => m.SplineStudio),
  { ssr: false, loading: () => <StudioLoader /> }
);

// Option B: Use the /next import for auto blurred placeholder
// import Spline from '@splinetool/react-spline/next';
// This auto-generates a blurred placeholder during SSR
```

## Spline Runtime API Reference

### Application Class (Key Methods)

| Method | Signature | Purpose |
|--------|-----------|---------|
| `findObjectByName` | `(name: string) => SPEObject \| undefined` | Find scene object by name |
| `findObjectById` | `(uuid: string) => SPEObject \| undefined` | Find by UUID |
| `getAllObjects` | `() => SPEObject[]` | List all scene objects |
| `emitEvent` | `(event: SplineEventName, nameOrUuid: string) => void` | Trigger event on object |
| `emitEventReverse` | `(event: SplineEventName, nameOrUuid: string) => void` | Reverse event |
| `setVariable` | `(name: string, value: string \| number \| boolean) => void` | Set single variable |
| `setVariables` | `(vars: Record<string, ...>) => void` | Set multiple variables |
| `getVariable` | `(name: string) => string \| number \| boolean` | Read variable value |
| `addEventListener` | `(event: SplineEventName, cb: (e) => void) => void` | Listen for events |
| `setBackgroundColor` | `(color: string) => void` | Change bg color |
| `setZoom` | `(value: number) => void` | Set camera zoom |
| `setSize` | `(w: number, h: number) => void` | Resize canvas |
| `requestRender` | `() => void` | Force render frame |
| `play` / `stop` | `() => void` | Start/stop render loop |
| `dispose` | `() => void` | Cleanup (unmount) |
| `swapGeometry` | `(nameOrId: string, url \| buffer) => void` | Replace object geometry |

### SPEObject Properties & Methods

| Property/Method | Type | Purpose |
|----------------|------|---------|
| `name` | `string` | Object name (set in editor) |
| `uuid` | `string` | Unique ID |
| `visible` | `boolean` | Show/hide |
| `position` | `{ x, y, z }` | World position |
| `rotation` | `{ x, y, z }` | Euler rotation |
| `scale` | `{ x, y, z }` | Scale factor |
| `intensity` | `number` | Light intensity |
| `color` | `string` | Object color |
| `material` | `{ layers: Layer[], alpha: number }` | Material with layer stack |
| `state` | `string \| number \| undefined` | Get/set state (instant, no animation) |
| `emitEvent(name)` | Method | Trigger event on this object |
| `transition(params)` | Method | Animated state transition (returns chainable factory) |
| `hide()` / `show()` | Methods | Visibility shortcuts |

### Transition API

```typescript
// Basic transition
obj.transition({ to: "StateName", duration: 600, easing: 4 }); // EASE_IN_OUT

// Chained transitions
obj.transition({ to: "State1", duration: 500 })
   .transition({ to: "State2", duration: 300, delay: 100 });

// Saved transition for play/pause control
const t = obj.transition({ to: "Open", autoPlay: false });
t.play();   // start
t.pause();  // pause
t.reset();  // go back to start
t.seek(250); // seek to 250ms

// Easing values: LINEAR=0, EASE=1, EASE_IN=2, EASE_OUT=3, EASE_IN_OUT=4, CUBIC=5, SPRING=6
```

### SplineEvent Names
`mouseDown` | `mouseUp` | `mouseHover` | `keyDown` | `keyUp` | `start` | `lookAt` | `follow` | `scroll` | `collision` | `rendered`

## Spline Pro Features Relevant to This Phase

| Feature | Free | Pro | Impact on Studio |
|---------|------|-----|-----------------|
| Bloom post-processing | Limited | Full control | Neon #eafd67 glow effect |
| No watermark | Watermark present | No watermark | Clean studio experience |
| Advanced materials | Basic | Full layer stack | Reflective floor, emissive neon |
| Physics | Basic | Advanced | Not needed for this phase |
| Local Storage variables | No | Yes | Could persist camera preferences |
| Geometry compression | Yes | Yes | Reduce .splinecode file size |
| Export as Code | Yes | Yes | React/Next.js export |
| AI Textures | Limited | Full | Could assist material creation |

## Performance & Mobile

### Loading Strategy
1. **Dynamic import** splits Spline runtime (~544KB gzip) from main bundle
2. **`.splinecode` file** loads separately (size depends on scene complexity; target < 2MB)
3. **Lazy load** with `<Suspense>` shows StudioLoader during download
4. **Geometry compression** enabled in Spline export settings ("Performance" mode)

### Mobile Optimization
- Spline's `renderOnDemand={true}` (default) prevents continuous rendering when idle
- Keep scene objects under 50 total (Performance Panel recommendation)
- Limit lights to 3 or fewer
- Minimize post-processing effects on mobile (consider disabling bloom)
- Use Spline's component/instance system for repeated magazine objects (1 geometry + N instances)
- Target canvas to viewport size, not oversized

### Performance Budget
| Metric | Desktop Target | Mobile Target |
|--------|---------------|---------------|
| Scene file size | < 3MB | < 2MB (reduced scene) |
| Initial load (gzip) | < 1.5MB total | < 1MB |
| FPS (idle) | 60fps | 30fps |
| FPS (interaction) | 60fps | 30fps |
| Time to Interactive | < 3s | < 4s |

### Fallback Strategy
- **No WebGL:** Show CSS bookshelf (existing `BookshelfView`)
- **Low FPS:** Consider reducing scene via Spline variables (hide effects objects)
- **Large screen:** Full resolution
- **Small screen:** Spline auto-scales to container

## Spline ↔ React Data Flow

```
                    ┌─────────────────────────┐
                    │     Spline Scene         │
                    │  (decoded-studio.spline) │
                    │                          │
  setVariable() ──>│  Variables:              │
  setVariables()   │    issue_count           │
                   │    show_empty_state      │
                   │    active_book_index     │
                   │                          │
  material.layers  │  Objects:               │
  .image.data ────>│    Magazine_0..N         │<── findObjectByName()
                   │    MainCamera            │
                   │    NeonLight_0..3        │
                   │    EmptyHologram         │
                   │                          │
  transition() ───>│  Camera States:          │
                   │    Entry → Browse        │
                   │    Browse → Focused      │
                   │                          │
                   │  Events OUT:             │──> onSplineMouseDown()
                   │    mouseDown on Magazine │──> onSplineMouseHover()
                   │    mouseHover            │
                   └─────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │     React Layer          │
                    │                          │
                    │  studioStore (Zustand)   │
                    │    cameraState           │
                    │    focusedIssueId        │
                    │                          │
                    │  magazineStore (Zustand) │
                    │    collectionIssues[]    │
                    │    activeIssueId         │
                    │                          │
                    │  HTML Overlays:          │
                    │    StudioHUD             │
                    │    IssueDetailPanel      │
                    │    CollectionShareSheet  │
                    └─────────────────────────┘
```

## State of the Art

| Old Approach (R3F) | New Approach (Spline Pro) | Impact |
|---------------------|--------------------------|--------|
| Code every 3D element (geometry, materials, lights) | Design visually in Spline editor | 5-10x faster iteration on visual design |
| GSAP + useThree for camera animation | Spline States + `transition()` API | Simpler; animation designed in editor |
| Drei helpers (Reflector, Float, Text) | Spline built-in features | No additional dependencies |
| `@react-three/postprocessing` for Bloom | Spline scene-level Effects panel | Configured in editor, zero code |
| Manual material-per-face for book covers | Spline material layers + texture swap | Visual material editing + runtime API |
| R3F v8 (React 18 compatible) | Spline runtime (React-version agnostic) | No React version constraints |

## Open Questions

1. **Dynamic texture swapping reliability**
   - What we know: `material.layers` exists on SPEObject, Image type has `data: string | Uint8Array`. Community reports suggest it works.
   - What's unclear: Exact API for swapping an image layer texture at runtime. The `image.data` property setter may or may not trigger re-render automatically.
   - Recommendation: Test early in implementation. If direct layer manipulation doesn't work, fallback to Spline variables + event-driven texture swap designed in editor. Worst case: pre-bake cover textures into the .splinecode file for fixed mock data.

2. **Camera focus per-book positioning**
   - What we know: `SPEObject.transition({ to: "State" })` transitions between editor-defined states. Direct `position` property setting is instant (no animation).
   - What's unclear: Whether combining `transition()` with dynamically computed positions is supported, or if all target states must be pre-defined in editor.
   - Recommendation: For fixed mock data (5 issues), create 5 focus states in Spline (Focus_0 through Focus_4). For dynamic counts, use direct position setting + `requestRender()` with GSAP handling the interpolation on the React side.

3. **Scene file size for complex studio**
   - What we know: Simple scenes are a few hundred KB. Complex scenes with textures can be several MB.
   - What's unclear: How large the studio scene will be with room geometry, 5+ book objects, bloom, reflections.
   - Recommendation: Use Spline Performance Panel during design. Target < 2MB with geometry compression enabled.

4. **three.js coexistence**
   - What we know: `@splinetool/runtime` does NOT depend on three.js. The project's `three@0.167.1` is independent.
   - What's unclear: Whether having both loaded causes any global state conflicts.
   - Recommendation: Since they don't share dependencies, no conflict expected. three.js is only loaded by other pages; Spline runtime is isolated to `/collection`.

## Sources

### Primary (HIGH confidence)
- [react-spline GitHub README](https://github.com/splinetool/react-spline) -- Component API, props, event handlers, Next.js usage
- [@splinetool/runtime TypeScript definitions (v1.12.65)](https://cdn.jsdelivr.net/npm/@splinetool/runtime@1.12.65/runtime.d.ts) -- Full API: Application class, SPEObject, transition, material layers
- [react-spline package.json](https://github.com/splinetool/react-spline/blob/main/package.json) -- v4.1.0, peer deps (no three.js dependency)
- [Spline Code API for Web docs](https://docs.spline.design/exporting-your-scene/web/code-api-for-web) -- Runtime methods overview
- [Spline Variables docs](https://docs.spline.design/interaction-states-events-and-actions/variables) -- Variable types: Number, String, Boolean, Time, Counter, Random

### Secondary (MEDIUM confidence)
- [Spline Effects/Post-Processing docs](https://docs.spline.design/doc/effects-post-processing/docT36uyyg7Y) -- Bloom, vignette, aberration, noise, etc.
- [Spline Scene Optimization docs](https://docs.spline.design/doc/how-to-optimize-your-scene/doczPMIye7Ko) -- Performance Panel, geometry compression
- [Spline Transition Action docs](https://docs.spline.design/interaction-states-events-and-actions/actions/transition-action) -- State transitions, easing, chaining
- [react-spline Issue #212](https://github.com/splinetool/react-spline/issues/212) -- Programmatic state transitions discussion; `setVariable` workaround
- [Optimizing Spline for Core Web Vitals](https://webdesign.tutsplus.com/how-to-optimize-spline-3d-scenes-for-speed-and-core-web-vitals--cms-108749a) -- Performance strategies
- [Lazy loading Spline - Lighthouse 30 to 90](https://dev.to/tolumen/optimizing-web-performance-how-lazy-loading-spline-assets-took-our-build-from-30-to-90-in-4ne2) -- Bundle strategy

### Tertiary (LOW confidence)
- Dynamic texture swapping via `material.layers[].image.data` -- inferred from TypeScript definitions, not verified with working code example
- Mobile performance for complex Spline scenes -- general guidance, not benchmarked for this specific scene complexity

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- packages verified via npm, TypeScript definitions extracted, peer deps confirmed
- Architecture: HIGH -- Spline <-> React data flow pattern is well-established; multiple examples in docs and community
- Runtime API: HIGH -- Full TypeScript definitions extracted from published package; method signatures confirmed
- Dynamic textures: MEDIUM -- Material layer types exist in TypeScript defs but runtime texture swap lacks official code examples
- Camera transitions: HIGH -- `transition()` API fully typed with chaining, easing, seek; confirmed in TypeScript defs
- Performance: MEDIUM -- General guidance available; specific scene complexity impact unknown until designed
- Mobile: MEDIUM -- Spline optimization docs exist but no specific benchmarks for this scene type

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (30 days -- Spline releases frequently but API is stable)
