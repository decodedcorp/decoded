# [SCR-MAG-01] Daily Editorial Cover
> Route: `/magazine` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Flow: FLW-06 (Magazine Rendering Flow)

## Purpose

User views an AI-generated daily editorial magazine with dynamic layout, cinematic GSAP animations, and interactive item spots — no fixed template, every issue is unique.

## Design Direction

- **Zero-Template Policy:** No fixed header/footer. All elements positioned by `layout_json` coordinates.
- **Dynamic Theme Injection:** `theme_palette` values injected as CSS custom properties (`--mag-primary`, `--mag-accent`, `--mag-bg`, `--mag-text`).
- **Motion First:** All components enter via GSAP stagger timeline. Background parallax on scroll.
- **Default Theme:** Deep Black (#050505) / Neon Chartreuse (#eafd67) — overridden per issue by `theme_palette`.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Page | MagazinePage (server) | `packages/web/app/magazine/page.tsx` | async; fetches daily issue |
| Client wrapper | MagazineRenderer | `packages/web/lib/components/magazine/MagazineRenderer.tsx` | "use client"; layout_json interpreter + GSAP orchestration |
| Dynamic | MagazineHero | `packages/web/lib/components/magazine/MagazineHero.tsx` | image_url, headline, parallax_depth |
| Dynamic | MagazineText | `packages/web/lib/components/magazine/MagazineText.tsx` | content, variant (h1/h2/body), font_family |
| Dynamic | MagazineItemCard | `packages/web/lib/components/magazine/MagazineItemCard.tsx` | product_id, price, discount_rate, spot overlay |
| Dynamic | MagazineDivider | `packages/web/lib/components/magazine/MagazineDivider.tsx` | style variant |
| Dynamic | MagazineQuote | `packages/web/lib/components/magazine/MagazineQuote.tsx` | text, attribution |
| Dynamic | MagazineGallery | `packages/web/lib/components/magazine/MagazineGallery.tsx` | images[], gap_size, scroll_direction |
| Registry | MagazineComponentRegistry | `packages/web/lib/components/magazine/componentRegistry.ts` | Maps layout type string -> React component |
| Skeleton | MagazineSkeleton | `packages/web/lib/components/magazine/MagazineSkeleton.tsx` | Matte black + accent glow pulse |
| CTA | GenerateMyEdition | `packages/web/lib/components/magazine/GenerateMyEdition.tsx` | Scroll-triggered bottom CTA |
| Bottom nav | NavBar | DS: component-registry | mobile-only; active="magazine" |

> All file paths are proposed (components not yet created). Verify against filesystem before implementation.

## Layout

### Mobile (default)

```
+-------------------------------+
| (no fixed header)             |  <- Zero-template: no header bar
|                               |
|  [layout_json components      |  <- Absolute positioned by x,y,w,h %
|   rendered dynamically]       |
|                               |
|   +-------------------------+ |
|   | HERO IMAGE              | |  <- MagazineHero: full-bleed, parallax
|   | headline overlay        | |     GSAP scale 1.1->1, 1.8s
|   +-------------------------+ |
|                               |
|   EDITORIAL TEXT              |  <- MagazineText: fade-up, y 30->0
|   body copy here...           |
|                               |
|   [ItemCard] [ItemCard]       |  <- MagazineItemCard: slide-left
|    spot overlay on hover      |     accent glow on hover
|                               |
|   [Gallery Grid]              |  <- MagazineGallery: stagger 0.1s
|   [img][img][img]             |
|   [img][img][img]             |
|                               |
|   "QUOTE TEXT"                |  <- MagazineQuote: fade-up + parallax
|   -- attribution              |
|                               |
|   ========================    |  <- MagazineDivider: scale-x 0->1
|                               |
|   [Generate My Edition CTA]   |  <- scroll-triggered reveal
|                               |
+-------------------------------+
| [Home][Search][Mag][Feed][Me] |  <- NavBar (magazine tab active)
+-------------------------------+
```

### Desktop (>=768px)

Content area max-width 1200px centered. Components use same `layout_json` but backend may provide desktop-optimized coordinates (`viewport: "desktop"`). NavBar hidden; DesktopHeader visible with Magazine nav link active.

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | None (zero-template) | DesktopHeader with Magazine nav active |
| Content width | 100vw | max-w-[1200px] centered |
| Bottom nav | NavBar visible | NavBar hidden |
| Parallax depth | Reduced (performance) | Full depth |
| Item hover | Tap to reveal | Mouse hover glow |

## Requirements

### Data Loading

- When the user navigates to `/magazine`, the system shall fetch `GET /api/v1/magazine/daily`.
- While the fetch is in progress, the system shall display `MagazineSkeleton` (matte black background with accent-color pulsing glow animation).
- When the fetch succeeds, the system shall inject `theme_palette` values as CSS custom properties on the page container.
- When the fetch fails with 4xx/5xx, the system shall display an error state with retry button.
- When no daily issue exists (404), the system shall display "Today's issue is being prepared" with an estimated time.

### Layout JSON Rendering

- When `layout_json` is received, the system shall iterate `components[]` and resolve each `type` via `MagazineComponentRegistry`.
- When a component type is unrecognized, the system shall skip it silently (log warning to console, do not break rendering).
- When positioning components, the system shall use percentage-based absolute positioning: `left: ${x}%`, `top: ${y}%`, `width: ${w}%`, `height: ${h}%`.
- When text content risks overflow on mobile viewport, the system shall apply `clamp()` for font sizing to prevent clipping.

### GSAP Motion Sequence

- When component mapping is complete, the system shall create a GSAP context and build a staggered entry timeline.
- When a component has `animation_type`, the system shall apply the corresponding GSAP preset from FLW-06 component registry table.
- When a component has `animation_delay`, the system shall offset its timeline position by that value.
- When the entry animation finishes, the system shall enable interactive states (hover, tap).
- When the user leaves `/magazine`, the system shall call `gsapContext.revert()` to clean up all animations and prevent memory leaks.

### Interactive Item Spotting

- When a component type is `hero-image` or `item-card`, the system shall overlay interactive spot markers based on item metadata in `data`.
- When the user hovers over (desktop) or taps (mobile) a spot, the system shall display an accent-color glow effect with a minimalist price/brand tooltip.
- When the user clicks/taps an item spot, the system shall navigate to `/posts/[postId]` (SCR-VIEW-01 via FLW-02).

### Scroll Interactions

- When the user scrolls, the system shall apply parallax offsets to components with `animation_type: 'parallax'` via GSAP ScrollTrigger.
- When the user scrolls to 90% of the page, the system shall reveal the "Generate My Edition" CTA with a fade-up animation.

### Navigation

- When the user taps "Generate My Edition", the system shall navigate to `/magazine/personal` (SCR-MAG-02).
- When the user taps an item card/spot, the system shall navigate to `/posts/[id]` with `transitionStore.setTransition()`.

## State

| Store | Usage |
|-------|-------|
| magazineStore | `currentIssue`, `isLoading`, `gsapTimeline` |
| creditStore | Read `balance` for "Generate My Edition" CTA affordance |
| transitionStore | `setTransition()` on item card tap for FLIP to detail |
| authStore | `selectIsLoggedIn` check for personal issue CTA |

## Navigation

| Trigger | Destination | Data Passed |
|---------|-------------|-------------|
| Item spot/card tap | `/posts/[id]` (SCR-VIEW-01) | postId, transitionStore state |
| "Generate My Edition" CTA | `/magazine/personal` (SCR-MAG-02) | - |
| NavBar home | `/` (SCR-DISC-01) | - |
| Back gesture | Previous screen | - |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | Initial fetch | MagazineSkeleton (matte black + accent pulse) |
| No issue | 404 from daily API | "Today's issue is being prepared" + estimated time |
| Fetch error | API 4xx/5xx | Error card with retry button |
| Parse error | Malformed layout_json component | Skip component, render rest (graceful degradation) |
| Unrecognized type | Unknown component type in JSON | Skip silently, console.warn |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Page mount (hero) | Scale + fade in | GSAP | scale 1.1->1, opacity 0->1, 1.8s |
| Component entry | Staggered per type | GSAP | See FLW-06 component registry table |
| Scroll | Parallax layers | GSAP ScrollTrigger | Variable depth per component |
| Item hover (desktop) | Accent glow | CSS + GSAP | box-shadow with theme accent color |
| CTA reveal | Fade up | GSAP ScrollTrigger | Trigger at 90% scroll, y 20->0, 0.5s |
| Page exit | Context revert | GSAP | gsapContext.revert() on unmount |

---

See: [SCR-MAG-02](SCR-MAG-02-personal-issue.md) -- Personal issue generation
See: [FLW-06](../../flows/FLW-06-magazine-rendering.md) -- Magazine rendering flow
See: [SCR-VIEW-01](../detail/SCR-VIEW-01-post-detail.md) -- Post detail (item tap destination)
See: [NEXT-03](../../_next/NEXT-03-dynamic-ui.md) -- Dynamic UI direction (Stage 2-3)
