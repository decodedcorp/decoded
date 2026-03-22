# [SCR-MAG-05] Magazine Interaction Layer
> Route: overlay within `/magazine` and `/magazine/personal` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Flow: FLW-06 (Magazine Rendering Flow — Step 3)

## Purpose

After `MagazineRenderer` completes its entry timeline, the user can interact with item spots embedded in `hero-image` and `item-card` components, trigger parallax scroll effects, swipe between horizontal sections, and reveal the "Generate My Edition" CTA — all scoped to the rendered magazine canvas.

See: SCR-MAG-01 — Page structure (entry point; interaction layer activates after GSAP ready)
See: SCR-MAG-03 — Rendering engine (dispatches `magazineReady` event that activates this layer)
See: SCR-MAG-04 — Theme system (provides `--mag-accent` for all glow effects)
See: SCR-VIEW-02 — Spot/hotspot pattern (reference for item spot interaction design)

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Spot overlay | MagazineSpotOverlay | `packages/web/lib/components/magazine/MagazineSpotOverlay.tsx` | `spots: SpotMarker[]`, `accentColor` from CSS var |
| Spot marker | MagazineSpotMarker | `packages/web/lib/components/magazine/MagazineSpotMarker.tsx` | `x`, `y` (% within component), `postId`, `label` |
| Spot tooltip | MagazineSpotTooltip | `packages/web/lib/components/magazine/MagazineSpotTooltip.tsx` | `brand`, `price`, visible on hover/tap |
| Horizontal sections | MagazineSectionScroller | `packages/web/lib/components/magazine/MagazineSectionScroller.tsx` | `sections[]`, `@use-gesture/react` drag binding |
| Section indicator | MagazineSectionDots | `packages/web/lib/components/magazine/MagazineSectionDots.tsx` | `count`, `activeIndex` |
| Generate CTA | GenerateMyEdition | `packages/web/lib/components/magazine/GenerateMyEdition.tsx` | ScrollTrigger-activated; `isLoggedIn`, `canAfford` |
| Parallax driver | Inline ScrollTrigger | Within MagazineRenderer | Attached to components with `animation_type: 'parallax'` |

> All file paths are proposed. Verify against filesystem before implementation.

## Interaction States

| State | Description | Active UI | Triggered By |
|-------|-------------|-----------|--------------|
| `inactive` | Entry animations running | No spots interactive | Page mount |
| `idle` | Entry complete, no spot focused | Spot markers visible (pulse) | `magazineReady` event |
| `spot-hovered` | Desktop cursor over spot | Tooltip visible, glow active | `mouseover` on marker |
| `spot-tapped` | Mobile tap on spot | Tooltip visible, glow active | `touchend` on marker |
| `spot-dismissed` | Tapped outside spot or marker | Tooltip hidden | `touchend` on canvas |
| `section-swiping` | Drag gesture on horizontal section | Section sliding | `@use-gesture` drag |
| `cta-visible` | Scrolled to 90% of page | GenerateMyEdition revealed | ScrollTrigger |

## Layout

### Mobile (default)

```
+-------------------------------+
| (magazine canvas)             |
|                               |
|  +-------------------------+  |
|  | HERO IMAGE              |  |
|  |  [spot] [spot]          |  |  <- MagazineSpotMarker: pulsing dots
|  |  headline overlay       |  |     accent color ring, 24px tap target
|  +-------------------------+  |
|                               |
|  [ItemCard]   [ItemCard]      |  <- MagazineSpotOverlay on each card
|   [spot]       [spot]         |     tap to show tooltip: brand + price
|                               |
|  <- [Section A] [Section B]-> |  <- MagazineSectionScroller (if layout has
|  [dot][dot][dot]              |     horizontal sections); swipe to advance
|                               |
|  [quote / text components]    |  <- parallax scroll offset via ScrollTrigger
|                               |
|   [Generate My Edition]       |  <- GenerateMyEdition: fade-up at 90% scroll
|                               |
+-------------------------------+
```

### Desktop (>=768px)

| Element | Mobile | Desktop |
|---------|--------|---------|
| Spot activation | Tap (touchend) | Hover (mouseover) |
| Spot tooltip | Below marker, full width | Beside marker, 200px |
| Glow spread | 8px box-shadow | 16px box-shadow |
| Section swipe | Drag gesture | Arrow keys + drag |
| Parallax depth | 50% of desktop | Full configured depth |

## Requirements

### Spot Overlay Activation

- When `magazineReady` event fires on the container, the system shall enable interaction on all `MagazineSpotOverlay` instances.
- When a component type is `hero-image` or `item-card` and its `data` contains a non-empty `spots[]` array, the system shall render `MagazineSpotOverlay` as an absolute-positioned child covering that component's bounds.
- When `spots[]` is empty or absent, the system shall not render any overlay on that component.

### Hover and Tap Glow Effects

- When the user moves the cursor over a `MagazineSpotMarker` on desktop, the system shall apply `box-shadow: 0 0 16px var(--mag-accent)` and show `MagazineSpotTooltip` within 0.15s.
- When the user moves the cursor away from a marker on desktop, the system shall hide the tooltip and remove the glow after 0.15s delay.
- When the user taps a `MagazineSpotMarker` on mobile, the system shall toggle `MagazineSpotTooltip` visibility and apply the accent glow.
- When the user taps anywhere on the canvas outside a marker, the system shall dismiss any open tooltip.
- When a tooltip is visible, the system shall ensure it remains within viewport bounds by clamping its rendered position.

### Spot Navigation

- When the user taps or clicks a `MagazineSpotMarker`, the system shall navigate to `/posts/[postId]` (SCR-VIEW-01) via `transitionStore.setTransition()`.
- When `postId` is absent from the spot data, the system shall disable the tap target and not render a tooltip.

### Parallax Scroll

- When the user scrolls the page, the system shall apply a `y` offset to all components with `animation_type: 'parallax'` via GSAP `ScrollTrigger` scrub.
- When on mobile, the system shall halve the configured `parallax_depth` value to reduce motion on smaller screens.
- When `prefers-reduced-motion` media query is active, the system shall disable all parallax ScrollTrigger instances and render components at their static `y` position.

### Horizontal Section Swiping

- When `layout_json` contains a group of components marked as a horizontal section sequence, the system shall wrap them in `MagazineSectionScroller`.
- When the user performs a horizontal drag gesture of more than 40px, the system shall advance or retreat one section using `@use-gesture/react` `useDrag`.
- When the user releases the drag below the 40px threshold, the system shall snap back to the current section.
- When the active section changes, the system shall update `MagazineSectionDots` active index.
- When on desktop, the system shall also respond to left/right arrow key presses for section navigation.

### "Generate My Edition" CTA

- When the user scrolls to 90% of the page height, the system shall reveal `GenerateMyEdition` with a GSAP fade-up animation (y 20->0, opacity 0->1, 0.5s).
- When `authStore.selectIsLoggedIn` is false, the system shall render the CTA with label "Sign in to Generate" and navigate to `/login` on tap.
- When `authStore.selectIsLoggedIn` is true and `creditStore.balance < 1`, the system shall render the CTA as disabled with label "No credits remaining".
- When `authStore.selectIsLoggedIn` is true and `creditStore.balance >= 1`, the system shall render the CTA as active and navigate to `/magazine/personal` on tap.
- When the CTA is visible on `/magazine/personal`, the system shall hide it (not applicable within personal issue view).

## State

| Store | Field | Usage |
|-------|-------|-------|
| magazineStore | `gsapTimeline` | Checked as complete before activating spots |
| transitionStore | `setTransition()` | Called on spot/card navigation tap |
| authStore | `selectIsLoggedIn` | Determines CTA label and behaviour |
| creditStore | `balance` | Determines CTA enabled state |

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| Spot marker tap | `/posts/[postId]` (SCR-VIEW-01) | `postId`, `transitionStore` state |
| "Generate My Edition" (logged in, has credit) | `/magazine/personal` (SCR-MAG-02) | — |
| "Sign in to Generate" | `/login` | `returnUrl: /magazine` |

## Error & Empty States

| State | Condition | Behavior |
|-------|-----------|----------|
| No spots | `data.spots[]` empty or absent | No overlay rendered on that component |
| Missing postId | Spot `postId` undefined | Spot marker rendered as non-interactive |
| Reduced motion | `prefers-reduced-motion` active | Parallax disabled; section swipe retains drag |
| No credits | `creditStore.balance < 1` | CTA disabled, label "No credits remaining" |
| Not logged in | `authStore.selectIsLoggedIn` false | CTA shows "Sign in to Generate" |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Spot marker idle | Pulse ring | CSS keyframes | `--mag-accent` opacity 1->0, 1.5s infinite |
| Spot hover/tap glow | Box-shadow | CSS transition | `0 0 16px var(--mag-accent)`, 0.15s ease |
| Tooltip appear | Fade + scale | GSAP | opacity 0->1, scale 0.95->1, 0.15s |
| Tooltip dismiss | Fade | GSAP | opacity 1->0, 0.1s |
| Section swipe | Translate X | GSAP | x snap to section width, 0.35s ease |
| Parallax scroll | Y offset | GSAP ScrollTrigger | Scrub 1, depth per component |
| CTA reveal | Fade up | GSAP ScrollTrigger | y 20->0, opacity 0->1, 0.5s, trigger at 90% |

---

See: [SCR-MAG-01](SCR-MAG-01-daily-editorial.md) -- Page structure (scroll + spot requirements)
See: [SCR-MAG-03](SCR-MAG-03-rendering-engine.md) -- Rendering engine (dispatches activation event)
See: [SCR-MAG-04](SCR-MAG-04-theme-system.md) -- Theme system (--mag-accent for glows)
See: [SCR-VIEW-02](../detail/SCR-VIEW-02-spot-hotspot.md) -- Spot interaction reference pattern
See: [FLW-06](../../flows/FLW-06-magazine-rendering.md) -- Step 3: Interactive Magazine View
