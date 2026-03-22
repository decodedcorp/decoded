# [SCR-MAG-03] Magazine Rendering Engine
> Route: internal layer within `/magazine` and `/magazine/personal` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Flow: FLW-06 (Magazine Rendering Flow — Steps 2, 5)

## Purpose

`MagazineRenderer` interprets a `layout_json` payload into a live React component tree, applies percentage-based absolute positioning, and orchestrates a GSAP stagger timeline — producing a unique magazine layout on every render without fixed templates.

See: SCR-MAG-01 — Daily editorial (consumer of this engine)
See: SCR-MAG-02 — Personal issue (also consumes MagazineRenderer)
See: FLW-06 — Full data contract and component registry table

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Engine root | MagazineRenderer | `packages/web/lib/components/magazine/MagazineRenderer.tsx` | "use client"; `issue: MagazineIssue` |
| Component registry | componentRegistry | `packages/web/lib/components/magazine/componentRegistry.ts` | Maps `type` string -> React component |
| Hero | MagazineHero | `packages/web/lib/components/magazine/MagazineHero.tsx` | `image_url`, `headline`, `parallax_depth` |
| Text | MagazineText | `packages/web/lib/components/magazine/MagazineText.tsx` | `content`, `variant` (h1/h2/body), `font_family` |
| Item card | MagazineItemCard | `packages/web/lib/components/magazine/MagazineItemCard.tsx` | `product_id`, `price`, `discount_rate` |
| Divider | MagazineDivider | `packages/web/lib/components/magazine/MagazineDivider.tsx` | `style` variant |
| Quote | MagazineQuote | `packages/web/lib/components/magazine/MagazineQuote.tsx` | `text`, `attribution` |
| Gallery | MagazineGallery | `packages/web/lib/components/magazine/MagazineGallery.tsx` | `images[]`, `gap_size`, `scroll_direction` |
| Skeleton | MagazineSkeleton | `packages/web/lib/components/magazine/MagazineSkeleton.tsx` | Theme-aware pulse animation |

> All file paths are proposed. Verify against filesystem before implementation.

## Layout JSON Contract

```typescript
interface LayoutComponent {
  id: string;
  type: 'hero-image' | 'text-block' | 'item-card' | 'divider' | 'quote' | 'grid-gallery';
  x: number;             // percentage (0-100) from container left
  y: number;             // percentage (0-100) from container top
  w: number;             // percentage width of container
  h: number;             // percentage height (0 = auto)
  animation_type: 'fade-up' | 'scale-in' | 'slide-left' | 'parallax' | 'none';
  animation_delay?: number; // seconds; used for manual stagger override
  data: Record<string, unknown>; // component-specific payload
}

interface LayoutJSON {
  version: 1;
  viewport: 'mobile' | 'desktop';
  components: LayoutComponent[];
}
```

## Component Registry Mapping

| `type` | React Component | GSAP Preset | Duration |
|--------|----------------|-------------|----------|
| `hero-image` | MagazineHero | scale 1.1->1, opacity 0->1 | 1.8s |
| `text-block` | MagazineText | y 30->0, opacity 0->1 | 0.6s |
| `item-card` | MagazineItemCard | x 40->0, opacity 0->1 | 0.5s |
| `divider` | MagazineDivider | scaleX 0->1 | 0.4s |
| `quote` | MagazineQuote | y 30->0, opacity 0->1 + ScrollTrigger parallax | 0.6s |
| `grid-gallery` | MagazineGallery | stagger children, opacity 0->1 | 0.1s per child |

## Layout

### Rendering Model

```
MagazineRenderer
  |
  +-- position: relative container (full viewport width, auto height)
       |
       +-- [component 0]  position: absolute; left:${x}%; top:${y}%; width:${w}%
       +-- [component 1]  position: absolute; left:${x}%; top:${y}%; width:${w}%
       +-- [component N]  ...
```

### Mobile vs Desktop

| Behavior | Mobile | Desktop |
|----------|--------|---------|
| Viewport filter | `layout_json.viewport: 'mobile'` | `layout_json.viewport: 'desktop'` |
| Container width | 100vw | max-w-[1200px] centered |
| Font clamp | Applied (`clamp()`) | Not applied (fixed px) |
| Parallax depth | 50% of desktop value | Full depth |

## Requirements

### JSON Parsing

- When `MagazineRenderer` receives `issue.layout_json`, the system shall JSON-parse `components[]` before first render.
- When `layout_json` is null or missing `components`, the system shall render null and emit `console.error('MagazineRenderer: missing layout_json')`.
- When `components[]` is an empty array, the system shall render an empty container without error.

### Component Resolution

- When iterating `components[]`, the system shall look up each `type` in `componentRegistry`.
- When a `type` is not found in `componentRegistry`, the system shall skip that component and emit `console.warn('MagazineRenderer: unknown type', type)`.
- When a component is resolved, the system shall pass `component.data` as props to the resolved React component.

### Absolute Positioning

- When rendering a resolved component, the system shall apply `position: absolute`, `left: ${x}%`, `top: ${y}%`, `width: ${w}%` as inline styles.
- When `h > 0`, the system shall also apply `height: ${h}%`; when `h === 0`, the system shall omit height to allow natural flow.
- When text content overflows at mobile viewport, the system shall apply `font-size: clamp()` to prevent clipping.

### GSAP Timeline Construction

- When all components are mounted, the system shall create a GSAP context (`gsap.context()`) scoped to the renderer container ref.
- When building the timeline, the system shall iterate `components[]` in order, adding each component's animation preset as a timeline label at position `animation_delay ?? index * 0.08`.
- When a component has `animation_type: 'none'`, the system shall skip adding it to the timeline.
- When a component has `animation_type: 'parallax'`, the system shall attach a `ScrollTrigger` scrub animation instead of a one-shot timeline tween.
- When the timeline completes all entry animations, the system shall dispatch a `magazineReady` custom DOM event on the container.
- When `MagazineRenderer` unmounts, the system shall call `gsapContext.revert()` to clean up all tweens and ScrollTrigger instances.

### GSAP Error Containment

- When a GSAP tween throws, the system shall catch the error in a `try/catch` around the timeline block and log `console.error('MagazineRenderer: GSAP error', err)`.
- When GSAP fails, the system shall render the static layout without animation rather than crashing the page.

### Stagger Timing

- When `animation_delay` is provided on a component, the system shall use it as the absolute timeline position (`tl.add(tween, animation_delay)`).
- When `animation_delay` is absent, the system shall derive position as `componentIndex * 0.08` seconds (default stagger).
- When `grid-gallery` is encountered, the system shall apply a child stagger of 0.1s using `gsap.utils.toArray()` on the gallery's image elements.

## State

| Store | Field | Usage |
|-------|-------|-------|
| magazineStore | `gsapTimeline` | Stores active GSAP context for cleanup |
| magazineStore | `currentIssue` / `personalIssue` | Source of `layout_json` passed to renderer |

## Error & Empty States

| State | Condition | Behavior |
|-------|-----------|----------|
| Missing JSON | `layout_json` null | Render null, log error |
| Empty components | `components.length === 0` | Empty container, no error |
| Unknown type | `componentRegistry[type]` undefined | Skip component, log warning |
| Malformed data | Component `data` fails prop type | Component renders with fallback UI |
| GSAP failure | Timeline construction throws | Static render, no animation |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| `hero-image` entry | Scale + fade | GSAP | scale 1.1->1, opacity 0->1, 1.8s, ease power2.out |
| `text-block` entry | Fade up | GSAP | y 30->0, opacity 0->1, 0.6s, ease power2.out |
| `item-card` entry | Slide left | GSAP | x 40->0, opacity 0->1, 0.5s, ease power3.out |
| `divider` entry | Scale X | GSAP | scaleX 0->1, transformOrigin left, 0.4s |
| `quote` entry + scroll | Fade up + parallax | GSAP + ScrollTrigger | Entry fade-up + scrub y offset |
| `grid-gallery` children | Stagger fade | GSAP | opacity 0->1, 0.1s interval per child |
| Page exit | Context revert | GSAP | gsapContext.revert() on unmount |

---

See: [SCR-MAG-01](SCR-MAG-01-daily-editorial.md) -- Daily editorial (primary consumer)
See: [SCR-MAG-02](SCR-MAG-02-personal-issue.md) -- Personal issue (secondary consumer)
See: [SCR-MAG-04](SCR-MAG-04-theme-system.md) -- Theme injection (runs before timeline)
See: [FLW-06](../../flows/FLW-06-magazine-rendering.md) -- Rendering flow and data contract
